const express = require('express');
const router = express.Router();
const {AirplaneController} = require('../../controllers');

router.post('/airplanes',AirplaneController.createAirplane);
module.exports = router;

