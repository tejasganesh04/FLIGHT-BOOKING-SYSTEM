
const { AirportRepository} = require('../repositories');

const AppError = require('../utils/errors/app-error');
const {StatusCodes} = require('http-status-codes');

const airportRepository = new AirportRepository();

async function createAirport(data){
    try{
        const airport = await airportRepository.create(data);
        return airport;
    }catch(error){
        if(error.name == 'SequelizeValidationError'){
            let explanation = [];
            
            error.errors.forEach((err)=>{
                explanation.push(err.message);
            });
            throw new AppError(explanation, StatusCodes.BAD_REQUEST);
        }
        throw new AppError('Cannot Create a new Airport Object',StatusCodes.INTERNAL_SERVER_ERROR );
    }
}

async function getAirports(){
    try {
        const airport = await airportRepository.getAll();

        return airport;
    } catch (error) {

        throw new AppError('Cannot Fetch data of all the Airports',StatusCodes.INTERNAL_SERVER_ERROR );
    }
}

async function getAirport(id){
    try {
        const airport = await airportRepository.get(id);

        return airport;
    } catch (error) {
        if(error.statusCode == StatusCodes.NOT_FOUND){
            throw new AppError('The airport you requested is not present', error.statusCode);
        }
        throw new AppError('Cannot Fetch data of the Airport',StatusCodes.INTERNAL_SERVER_ERROR );
    }
}

async function destroyAirport(id){
      try {
        const response = await airportRepository.destroy(id);
        return response;
    } catch (error) {
        if(error.statusCode == StatusCodes.NOT_FOUND){
            throw new AppError('The airport you requested to delete is not present', error.statusCode);
        }
        throw new AppError('Unable to delete the airport',StatusCodes.INTERNAL_SERVER_ERROR );
    }
}

async function updateAirport(data,id){
    try {
        const response = await airportRepository.update(data,id);
        return response;
    } catch (error) {
        if(error.statusCode == StatusCodes.NOT_FOUND){
            throw new AppError('Airport to be updated was not found',error.statusCode);
        }
        throw new AppError('Unable to update the airport',StatusCodes.INTERNAL_SERVER_ERROR);

    }
}







module.exports = {
    createAirport,
    getAirport,
    getAirports,
    destroyAirport,
    updateAirport
}