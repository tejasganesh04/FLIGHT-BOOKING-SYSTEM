const express = require('express');
const airplaneRoutes = require('./airplane-routes')
const cityRoutes = require('./city-routes.js')
const router = express.Router();

router.use('/airplanes',airplaneRoutes);
router.use('/cities',cityRoutes);



module.exports = router;