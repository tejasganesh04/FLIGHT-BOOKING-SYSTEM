
const { FlightRepository} = require('../repositories');

const AppError = require('../utils/errors/app-error');
const {StatusCodes} = require('http-status-codes');

const flightRepository = new FlightRepository();

async function createFlight(data){
    try{
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





module.exports = {
    createFlight,
  
}