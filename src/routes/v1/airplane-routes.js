const express = require('express');
const router = express.Router();
const {AirplaneMiddlewares} = require('../../middlewares');
const {AirplaneController} = require('../../controllers');

router.post('/',AirplaneMiddlewares.validateCreateRequest,AirplaneController.createAirplane);

router.get('/',AirplaneController.getAirplanes);
router.get('/:id',AirplaneController.getAirplane);

router.delete('/:id',AirplaneController.destroyAirplane);


module.exports = router;


