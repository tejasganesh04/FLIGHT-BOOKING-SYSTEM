//all raw queries in this file, to avoid raw strings floating here and there

function addRowLockOnFlights(flightId){
    return `SELECT * from Flights WHERE Flights.id = ${flightId} FOR UPDATE;`
}

module.exports = {
    addRowLockOnFlights
}
