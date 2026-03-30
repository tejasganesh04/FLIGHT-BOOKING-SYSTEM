const { AirportService } = require('../services');
const {StatusCodes} = require('http-status-codes');
const {SuccessResponse, ErrorResponse} = require('../utils/common');


/**
 * POST :/airports
 * req-body{name: 'IGI', code: 'DEL', address: 'New Delhi', cityId: 1}
 * @param {*} req
 * @param {*} res
 */
async function createAirport(req,res){
    try {
        const airport = await AirportService.createAirport({
            name: req.body.name,
            code: req.body.code,
            address: req.body.address,
            cityId: req.body.cityId
        });
        SuccessResponse.data = airport;
        return res.status(
            StatusCodes.CREATED
        ).json(SuccessResponse);
    } catch (error) {
        ErrorResponse.error = error;
        return res.status(error.statusCode).json(ErrorResponse);
    }
}

async function getAirports(req,res){
    try {
        const airports = await AirportService.getAirports();
        SuccessResponse.data = airports;
        res.status(StatusCodes.OK).json(SuccessResponse);
    } catch (error) {
        ErrorResponse.error = error;
        res.status(error.statusCode).json(ErrorResponse);
    }
}

/**
 * GET /airports/:id
 * @param {*} req
 * @param {*} res
 */
async function getAirport(req,res){
    try {
        const id = req.params.id;
        const airport = await AirportService.getAirport(id);
        SuccessResponse.data = airport;
        res.status(StatusCodes.OK).json(SuccessResponse);
    } catch (error) {
        ErrorResponse.error = error;
        res.status(error.statusCode).json(ErrorResponse);
    }
}

/**
 * DELETE /airports/:id
 */
async function destroyAirport(req,res){
    try {
        const id = req.params.id;
        const response = await AirportService.destroyAirport(id);
        SuccessResponse.data = response;
        res.status(StatusCodes.OK).json(SuccessResponse);
    } catch (error) {
        ErrorResponse.error = error;
        res.status(error.statusCode).json(ErrorResponse);
    }
}

async function updateAirport(req,res){
    try {
        const id = req.params.id;
        const data = req.body;
        const response = await AirportService.updateAirport(data,id);
        SuccessResponse.data = response;
        res.status(StatusCodes.OK).json(SuccessResponse);
    } catch (error) {
        ErrorResponse.error = error;
        res.status(error.statusCode).json(ErrorResponse);
    }
}

module.exports = {
    createAirport,
    getAirports,
    getAirport,
    destroyAirport,
    updateAirport
}
