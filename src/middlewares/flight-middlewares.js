const {StatusCodes} = require('http-status-codes');
const {ErrorResponse} = require('../utils/common');
const AppError = require('../utils/errors/app-error');
/**
 * Middleware: validateCreateRequest (Flights)
 * Guards the POST /flights route by checking that all required fields are present in req.body.
 * Required fields: flightNumber, airplaneId, departureAirportId, arrivalAirportId,
 *                  arrivalTime, departureTime, price, totalSeats.
 * Responds 400 BAD_REQUEST immediately with a descriptive message if any field is missing.
 * Calls next() only when all fields pass, allowing the request to reach the controller.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function validateCreateRequest(req,res,next){
    if(!req.body.flightNumber){
        ErrorResponse.message = 'Something went wrong while creating flight';
        ErrorResponse.error = new AppError('Flight number not found in the oncoming request',StatusCodes.BAD_REQUEST)
        return res.status(StatusCodes.BAD_REQUEST).json(ErrorResponse);
    }
    if(!req.body.airplaneId){
        ErrorResponse.message = 'Something went wrong while creating flight';
        ErrorResponse.error = new AppError('Airplane ID not found in the oncoming request',StatusCodes.BAD_REQUEST)
        return res.status(StatusCodes.BAD_REQUEST).json(ErrorResponse);
    }
    if(!req.body.departureAirportId){
        ErrorResponse.message = 'Something went wrong while creating flight';
        ErrorResponse.error = new AppError('Departure airport ID not found in the oncoming request',StatusCodes.BAD_REQUEST)
        return res.status(StatusCodes.BAD_REQUEST).json(ErrorResponse);
    }
    if(!req.body.arrivalAirportId){
        ErrorResponse.message = 'Something went wrong while creating flight';
        ErrorResponse.error = new AppError('Arrival airport ID not found in the oncoming request',StatusCodes.BAD_REQUEST)
        return res.status(StatusCodes.BAD_REQUEST).json(ErrorResponse);
    }
    if(!req.body.arrivalTime){
        ErrorResponse.message = 'Something went wrong while creating flight';
        ErrorResponse.error = new AppError('Arrival time not found in the oncoming request',StatusCodes.BAD_REQUEST)
        return res.status(StatusCodes.BAD_REQUEST).json(ErrorResponse);
    }
    if(!req.body.departureTime){
        ErrorResponse.message = 'Something went wrong while creating flight';
        ErrorResponse.error = new AppError('Departure time not found in the oncoming request',StatusCodes.BAD_REQUEST)
        return res.status(StatusCodes.BAD_REQUEST).json(ErrorResponse);
    }
    if(!req.body.price){
        ErrorResponse.message = 'Something went wrong while creating flight';
        ErrorResponse.error = new AppError('Price not found in the oncoming request',StatusCodes.BAD_REQUEST)
        return res.status(StatusCodes.BAD_REQUEST).json(ErrorResponse);
    }
    if(!req.body.totalSeats){
        ErrorResponse.message = 'Something went wrong while creating flight';
        ErrorResponse.error = new AppError('Total seats not found in the oncoming request',StatusCodes.BAD_REQUEST)
        return res.status(StatusCodes.BAD_REQUEST).json(ErrorResponse);
    }
    next();
}


/**
 * Middleware: validateUpdateSeatsRequest (Flights)
 * Guards the PATCH /flights/:id/seats route by ensuring `seats` is present in req.body.
 * Responds 400 BAD_REQUEST if the field is missing; calls next() otherwise.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function validateUpdateSeatsRequest(req,res,next){
  
    if(!req.body.seats){
        ErrorResponse.message = 'Something went wrong while updating flight';
        ErrorResponse.error = new AppError('seats not found in the oncoming request',StatusCodes.BAD_REQUEST)
        return res.status(StatusCodes.BAD_REQUEST).json(ErrorResponse);
    }

    next();
}



module.exports = {validateCreateRequest,validateUpdateSeatsRequest};