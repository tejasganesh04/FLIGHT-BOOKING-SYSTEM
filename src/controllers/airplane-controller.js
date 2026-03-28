const { AirplaneService } = require('../services');
const {StatusCodes} = require('http-status-codes');
const {SuccessResponse, ErrorResponse} = require('../utils/common')

/**
 * POST :/airplanes
 * req-body{modelNumber: 'airbus320', capacity: 200}
 * @param {*} req 
 * @param {*} res 
 */
async function createAirplane(req,res){
    try {
        const airplane = await AirplaneService.createAirplane({
            modelNumber:req.body.modelNumber,
            capacity: req.body.capacity
        });
        SuccessResponse.data = airplane;
        return res.status(
            StatusCodes.CREATED
        ).json(SuccessResponse);
    } catch (error) {
        ErrorResponse.error = error;
        
        return res.status(error.statusCode).json(ErrorResponse);
    }

}

module.exports = {
    createAirplane
}