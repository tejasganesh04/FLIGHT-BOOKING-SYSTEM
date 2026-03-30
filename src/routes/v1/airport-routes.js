const express = require('express');
const router = express.Router();
const {AirportMiddlewares} = require('../../middlewares');
const {AirportController} = require('../../controllers');

router.post('/',AirportMiddlewares.validateCreateRequest,AirportController.createAirport);

router.get('/',AirportController.getAirports);
router.get('/:id',AirportController.getAirport);

router.delete('/:id',AirportController.destroyAirport);
router.patch('/:id',AirportController.updateAirport);


module.exports = router;


