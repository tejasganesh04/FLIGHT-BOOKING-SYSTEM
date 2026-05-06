const { FlightService } = require('../services');
const {StatusCodes} = require('http-status-codes');
const {SuccessResponse, ErrorResponse} = require('../utils/common');


/**
 * POST /flights — reads flight fields from req.body and delegates to FlightService.createFlight.
 * Returns 201 on success; forwards AppError statusCode on failure.
 */
async function createFlight(req,res){
    try {
        const flight = await FlightService.createFlight({
           flightNumber: req.body.flightNumber,
           airplaneId: req.body.airplaneId,
           departureAirportId: req.body.departureAirportId,
            arrivalAirportId: req.body.arrivalAirportId,
            arrivalTime: req.body.arrivalTime,
            departureTime:req.body.departureTime,
            price:req.body.price,
            boardingGate:req.body.boardingGate,
            totalSeats:req.body.totalSeats
        });
        SuccessResponse.data = flight;
        return res.status(
            StatusCodes.CREATED
        ).json(SuccessResponse);
    } catch (error) {
        ErrorResponse.error = error;
        return res.status(error.statusCode).json(ErrorResponse);
    }
}

/**
 * GET /flights — passes req.query filters (trips, price, travellers, tripDate, sort) to FlightService.getAllFlights.
 * Returns 200 with matching flights; forwards AppError statusCode on failure.
 */
async function getAllFlights(req,res){
    try {
        const flights = await FlightService.getAllFlights(req.query);
        SuccessResponse.data = flights;
        res.status(StatusCodes.OK).json(SuccessResponse);
    } catch (error) {
        ErrorResponse.error = error;
        res.status(error.statusCode).json(ErrorResponse);
    }
}


async function getFlight(req,res){
    try {
        const id = req.params.id;
        const flight = await FlightService.getFlight(id);
        SuccessResponse.data = flight;
        res.status(StatusCodes.OK).json(SuccessResponse);
    } catch (error) {
         ErrorResponse.error = error;
        res.status(error.statusCode).json(ErrorResponse);
    }
}

async function updateSeats(req,res){
    try {
        const response = await FlightService.updateSeats({
            flightId: req.params.id,//mandatory
            seats: req.body.seats,//mandatory
            dec:req.body.dec
        });
        SuccessResponse.data= response;
        return res.status(StatusCodes.OK).json(SuccessResponse)
    } catch (error) {
        ErrorResponse.error = error;
        return res.status(error.statusCode).json(ErrorResponse);
    }

}

module.exports = {
    createFlight,
    getAllFlights,
    getFlight,
    updateSeats
}
