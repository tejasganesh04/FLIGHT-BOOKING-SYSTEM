const express = require('express');
const airplaneRoutes = require('./airplane-routes')
const router = express.Router();

router.use('/',airplaneRoutes);



module.exports = router;