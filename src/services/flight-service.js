
const { FlightRepository} = require('../repositories');

const AppError = require('../utils/errors/app-error');
const {StatusCodes} = require('http-status-codes');
const {compareTime} = require('../utils/helpers/datetime-helpers');
const {Op} = require('sequelize');
const flightRepository = new FlightRepository();

/**
 * Validates departure is before arrival, then creates a new flight record.
 * Throws BAD_REQUEST for time conflicts, INTERNAL_SERVER_ERROR for DB failures.
 */
async function createFlight(data){
    try{
        if(compareTime(data.departureTime, data.arrivalTime)){
            throw new AppError('Departure time must be before arrival time', StatusCodes.BAD_REQUEST);
        }
        const airport = await flightRepository.create(data);
        return airport;
    }catch(error){
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
 * Builds dynamic WHERE and ORDER clauses from query filters (trips, price, travellers, tripDate, sort),
 * then fetches matching flights. Throws BAD_REQUEST for same-airport trips, INTERNAL_SERVER_ERROR for DB failures.
 */
async function getAllFlights(filters){
    let customFilter = {};
    let sortFilter = [];
    const endingTripTime  = "23:59:00";
    
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
        const flights = await flightRepository.getAllFlights(customFilter,sortFilter);
        return flights;
    } catch (error) {
        throw new AppError('Cannot Fetch data of all the Flights',StatusCodes.INTERNAL_SERVER_ERROR );
    }
}


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





module.exports = {
    createFlight,
    getAllFlights,
    getFlight
  
}