
const { FlightRepository} = require('../repositories');

const AppError = require('../utils/errors/app-error');
const {StatusCodes} = require('http-status-codes');
const {compareTime} = require('../utils/helpers/datetime-helpers');
const {Op} = require('sequelize');
const { Redis } = require('../config');
const flightRepository = new FlightRepository();

// Search results cached for 30 minutes.
// Long TTL is justified by high search:book ratio — seat counts change slowly
// relative to search volume, and booking validates live seat data anyway.
const CACHE_TTL = 30 * 60;

/**
 * Validates the departure/arrival times and creates a new flight record in the database.
 *
 * Steps:
 *  1. Compares departureTime and arrivalTime — throws 400 BAD_REQUEST if departure is after arrival.
 *  2. Persists the flight via the repository.
 *  3. On SequelizeValidationError, collects all field-level messages and throws 400 BAD_REQUEST.
 *  4. Re-throws any AppError as-is (so intentional 400s are not masked as 500s).
 *  5. Throws 500 INTERNAL_SERVER_ERROR for unexpected failures.
 *
 * @param {Object} data - Flight fields: flightNumber, airplaneId, departureAirportId,
 *                        arrivalAirportId, departureTime, arrivalTime, price, boardingGate, totalSeats.
 * @returns {Promise<Flight>} The newly created Flight instance.
 */
async function createFlight(data){
    try{
        if(compareTime(data.departureTime, data.arrivalTime)){
            throw new AppError('Departure time must be before arrival time', StatusCodes.BAD_REQUEST);
        }
        const flight = await flightRepository.create(data);
        return flight;
    }catch(error){
        if(error instanceof AppError) throw error; // re-throw known errors without masking them
        if(error.name == 'SequelizeValidationError'){
            let explanation = [];
            error.errors.forEach((err)=>{
                explanation.push(err.message);
            });
            throw new AppError(explanation, StatusCodes.BAD_REQUEST);
        }
        throw new AppError('Cannot Create a new Flight Object',StatusCodes.INTERNAL_SERVER_ERROR );
    }
}


/**
 * Builds dynamic WHERE and ORDER clauses from URL query parameters, then fetches matching flights.
 *
 * Supported query params:
 *  - trips       : "BOM-DEL"           → filters by departureAirportId and arrivalAirportId.
 *  - price       : "500-2000"          → BETWEEN filter; omit min ("−2000") or max ("500") for open ranges.
 *  - travellers  : "3"                 → only flights with totalSeats >= this value.
 *  - tripDate    : "2026-04-15"        → flights departing on this calendar day (00:00 to 23:59).
 *  - sort        : "price_ASC,departureTime_DESC" → comma-separated column_DIRECTION pairs.
 *
 * Throws BAD_REQUEST if departure and arrival airport are identical.
 * Throws INTERNAL_SERVER_ERROR if the database query fails.
 *
 * @param {Object} filters - Parsed req.query object from Express.
 * @returns {Promise<Flight[]>} Array of matching Flight instances with nested associations.
 */
async function getAllFlights(filters){
    let customFilter = {};
    let sortFilter = [];
    const endingTripTime  = "23:59:59";
    
    // Query: ?trips=BOM-DEL
    // trips is a hyphen-separated string; we split it into departureAirportId and arrivalAirportId
    // and add both as exact-match WHERE conditions.
    if(filters.trips){
        const [departureAirportId, arrivalAirportId] = filters.trips.split("-");
        if(departureAirportId == arrivalAirportId){
            throw new AppError('Departure and arrival airport cannot be the same', StatusCodes.BAD_REQUEST);
        }
        customFilter.departureAirportId = departureAirportId;
        customFilter.arrivalAirportId = arrivalAirportId;
    }

    // Query: ?price=500-2000  or  ?price=-2000  (no lower bound)  or  ?price=500  (no upper bound)
    // We split on "-" to get minPrice and maxPrice, defaulting min to 0 and max to 1000000 if absent,
    // then apply a BETWEEN clause on the price column.
    if(filters.price){
        const[minPrice,maxPrice] = filters.price.split("-");
        customFilter.price = {
            [Op.between]:[((minPrice==''?0:minPrice)),((maxPrice==undefined)?1000000:maxPrice)]
        }
    }

    // Query: ?travellers=3
    // We need flights that have at least this many seats available,
    // so we apply a >= (Op.gte) condition on totalSeats.
    if(filters.travellers){
        customFilter.totalSeats = {
            [Op.gte]: filters.travellers
        }
    }

    // Query: ?tripDate=2026-04-15
    // We want all flights departing on that calendar day, so we build a BETWEEN range
    // from midnight (00:00:00 implied by new Date(date)) to 23:59:00 of that day.
    if(filters.tripDate){
        customFilter.departureTime={
            [Op.between]:[new Date(filters.tripDate), new Date(filters.tripDate + ' ' + endingTripTime)]
        }
    }

    // Query: ?sort=price_ASC,departureTime_DESC
    // sort is a comma-separated list of "column_DIRECTION" pairs.
    // We split by "," to get each pair, then split each pair by "_" to get [column, direction],
    // producing a nested array that Sequelize accepts directly as the ORDER clause.
    if(filters.sort){
        const params = filters.sort.split(",")
        const sortFilters = params.map((param)=> param.split("_"));
        sortFilter = sortFilters;
        


    }


    try {
        // Cache key: stable JSON representation of the filters object.
        // Keys are sorted alphabetically so that ?trips=X&tripDate=Y and
        // ?tripDate=Y&trips=X produce the same key — no duplicate cache entries
        // for the same logical query in a different param order.
        const cacheKey = `flights:search:${JSON.stringify(filters, Object.keys(filters).sort())}`;

        // Cache hit — return immediately without touching the DB.
        // Inner try-catch: if Redis is down, fall through to the DB instead of
        // failing the request. Fails open intentionally — availability > consistency here.
        try {
            const cached = await Redis.get(cacheKey);
            if (cached) return JSON.parse(cached);
        } catch {
            // Redis down — fall through to DB
        }

        const flights = await flightRepository.getAllFlights(customFilter, sortFilter);

        // Cache miss — store result for subsequent requests.
        // TTL = 30 minutes. Staleness is acceptable because:
        //  1. Users search far more than they book (high read:write ratio).
        //  2. Seat count changes are validated at booking time against live DB data,
        //     so a stale search result never causes an invalid booking.
        // Inner try-catch: if Redis is down, we still return the result to the user.
        try {
            await Redis.set(cacheKey, JSON.stringify(flights), 'EX', CACHE_TTL);
        } catch {
            // Redis down — return result anyway
        }

        return flights;
    } catch (error) {
        throw new AppError('Cannot Fetch data of all the Flights',StatusCodes.INTERNAL_SERVER_ERROR );
    }
}


/**
 * Fetches a single flight by its primary key.
 * Throws NOT_FOUND (proxied from repository) if the flight does not exist.
 * Throws INTERNAL_SERVER_ERROR for unexpected database failures.
 *
 * @param {number} id - Primary key of the flight to fetch.
 * @returns {Promise<Flight>} The matching Flight instance.
 */
async function getFlight(id){
    try {
        const flight = await flightRepository.get(id);

        return flight;
    } catch (error) {
        if(error.statusCode == StatusCodes.NOT_FOUND){
            throw new AppError('The flight you requested is not present', error.statusCode);
        }
        throw new AppError('Cannot Fetch data of the flight',StatusCodes.INTERNAL_SERVER_ERROR );
    }
}

/**
 * Delegates seat count update to the repository, which handles row locking and transactions.
 * Called by the Booking Service after a successful payment to decrement seats,
 * or on booking cancellation to increment them back.
 *
 * @param {Object}  data          - Update payload.
 * @param {number}  data.flightId - Primary key of the flight to update.
 * @param {number}  data.seats    - Number of seats to adjust.
 * @param {boolean} [data.dec]    - true → decrement (default), false → increment.
 * @returns {Promise<Flight>} The updated Flight instance with refreshed seat count.
 */
async function updateSeats(data){
    try {
        const response = await flightRepository.updateRemainingSeats(data.flightId,data.seats,data.dec);
        return response;
    } catch (error) {
        throw new AppError('Cannot update data of the flight',StatusCodes.INTERNAL_SERVER_ERROR);
    }
}



module.exports = {
    createFlight,
    getAllFlights,
    getFlight,
    updateSeats
  
}