const CrudRepository = require('./crud-repository.js');
const {Flight, Airplane,Airport,City} = require('../models/index.js');


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







}

module.exports = FlightRepository;
