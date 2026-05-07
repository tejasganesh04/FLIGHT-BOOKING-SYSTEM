const { Sequelize } = require('sequelize')
const CrudRepository = require('./crud-repository.js');
const {Flight, Airplane,Airport,City} = require('../models/index.js');
const db = require('../models')
const { addRowLockOnFlights } = require('./queries');
class FlightRepository extends CrudRepository{
    constructor(){
        super(Flight);
    }

    /**
     * Fetches all flights matching the given filter and sort criteria.
     * Eagerly loads associated Airplane, departure Airport (with its City),
     * and arrival Airport (with its City) so the response is self-contained.
     *
     * @param {Object}   filter - Sequelize WHERE conditions (e.g., price range, seat count, date range).
     * @param {Array}    sort   - Sequelize ORDER clause (e.g., [['price','ASC'],['departureTime','DESC']]).
     * @returns {Promise<Flight[]>} Array of Flight instances with nested associations.
     */
    async getAllFlights(filter, sort){
        const response = await Flight.findAll({
            where: filter,
            order:sort,
            include:[{
                model :Airplane,
                required:true,
                as:'airplaneDetails'
            },
        {
            model:Airport,
            required:true,
            as:'departureAirport',
            include:{
                model:City,
                required:true
            }
        },
        {
            model:Airport,
            required:true,
            as:'arrivalAirport',
            include:{
                model:City,
                required:true
            }
         }
    ]
               
            
        });
        return response;
    }



    /**
     * Atomically increments or decrements the totalSeats count for a flight.
     * Uses a database transaction with a row-level lock (SELECT ... FOR UPDATE) to
     * prevent race conditions when multiple booking requests arrive simultaneously.
     *
     * Steps:
     *  1. Opens a transaction and acquires a row lock on the target flight row.
     *  2. Fetches the flight within the same transaction (to read the locked version).
     *  3. Decrements totalSeats if dec is truthy (booking), increments if falsy (cancellation).
     *  4. Commits the transaction, then reloads the instance to return fresh DB values.
     *  5. Rolls back and rethrows on any error.
     *
     * @param {number}  flightId - Primary key of the flight to update.
     * @param {number}  seats    - Number of seats to add or subtract.
     * @param {boolean} dec      - true → decrement (booking), false → increment (cancellation). Defaults to true.
     * @returns {Promise<Flight>} The updated Flight instance reflecting the new seat count.
     */
    async updateRemainingSeats(flightId,seats,dec = true ){//will be part of bigger transaction
        const transaction = await db.sequelize.transaction();
        try {
            await db.sequelize.query(addRowLockOnFlights(flightId), {transaction}); // this query is gonna put a row lock for any kindof update

            const flight = await Flight.findByPk(flightId, {transaction});

            if(+dec){//bug fixed as parseInt was going to NAN incase of "true"
                await flight.decrement('totalSeats', {by: seats, transaction});
            } else {
                await flight.increment('totalSeats', {by: seats, transaction});
            }

            await transaction.commit();
            await flight.reload();
            return flight;
        } catch(error) {
            await transaction.rollback();
            throw error;
        }
    }



}

module.exports = FlightRepository;
