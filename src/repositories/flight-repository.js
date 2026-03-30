const CrudRepository = require('./crud-repository.js');

const {Flight} = require('../models/index.js');


class FlightRepository extends CrudRepository{
    constructor(){
        super(Flight);
    }
}

module.exports = FlightRepository;
