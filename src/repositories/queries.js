// All raw SQL queries are centralised here to avoid raw strings scattered across repositories.
// When a query needs to change, there is exactly one place to update it.

/**
 * Generates a SELECT ... FOR UPDATE SQL statement targeting a single flight row.
 *
 * The FOR UPDATE clause acquires an exclusive row-level lock inside the caller's transaction.
 * This prevents any other concurrent transaction from reading (with FOR UPDATE) or writing
 * that row until the lock is released, which eliminates double-booking race conditions.
 *
 * Must be executed within an active Sequelize transaction — pass {transaction} to the query call.
 *
 * @param {number} flightId - Primary key of the flight row to lock.
 * @returns {string} Raw SQL string ready to be passed to db.sequelize.query().
 */
function addRowLockOnFlights(flightId){
    return `SELECT * from Flights WHERE Flights.id = ${flightId} FOR UPDATE;`
}

module.exports = {
    addRowLockOnFlights
}
