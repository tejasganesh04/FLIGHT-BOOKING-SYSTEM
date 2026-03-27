const { AirplaneService } = require('../services');
const {StatusCodes} = require('http-status-codes');
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
        return res.status(
            StatusCodes.CREATED
        ).json({
            success:true,
            message:"Successfully created airplane",
            data : response ,
            error:{}

        });
    } catch (error) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success:true,
            message:"Successfully created airplane",
            data : {} ,
            error:error
        })
    }

}

module.exports = {
    createAirplane
}