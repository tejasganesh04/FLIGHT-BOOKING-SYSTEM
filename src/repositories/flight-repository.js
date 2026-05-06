const { Sequelize } = require('sequelize')
const CrudRepository = require('./crud-repository.js');
const {Flight, Airplane,Airport,City} = require('../models/index.js');
const db = require('../models')
const { addRowLockOnFlights } = require('./queries');
class FlightRepository extends CrudRepository{
    constructor(){
        super(Flight);
    }

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



    async updateRemainingSeats(flightId,seats,dec = true ){//will be part of bigger transaction
        
        await db.sequelize.query(addRowLockOnFlights(flightId)) // this query is gonna put a row lock for any kindof update
        
        const flight = await Flight.findByPk(flightId);


        if(parseInt(dec) ){
             await flight.decrement('totalSeats',{by:seats})
            
            
        }else{
            await flight.increment('totalSeats',{by:seats});
            
        }
        await flight.reload();
        return flight;

    }



}

module.exports = FlightRepository;
