'use strict';

/*
 * Flight Generator Seeder
 *
 * Generates ~36,000 realistic domestic Indian flights for benchmarking and demo purposes.
 *
 * Justification for volume:
 *   5 major hub airports × 4 destinations each = 20 bidirectional routes
 *   10 daily frequencies per route (conservative — BOM-DEL alone has 20+ in reality, per DGCA data)
 *   180-day booking window (industry standard — airlines open bookings 6 months ahead)
 *   = 20 × 10 × 180 = 36,000 flights
 *
 * This represents a single mid-size airline's full domestic India inventory.
 *
 * Identification:
 *   All seeded flights use boardingGate: 'SEED' as a marker.
 *   The down migration deletes only rows with this marker — original flights are untouched.
 */

// 20 routes — all permutations of 5 airports (5 × 4 = 20)
// Durations in minutes based on approximate real-world flight times
const ROUTES = [
    { from: 'BOM', to: 'DEL', durationMins: 130 },
    { from: 'BOM', to: 'BLR', durationMins: 105 },
    { from: 'BOM', to: 'MAA', durationMins: 135 },
    { from: 'BOM', to: 'HYD', durationMins: 90  },
    { from: 'DEL', to: 'BOM', durationMins: 130 },
    { from: 'DEL', to: 'BLR', durationMins: 165 },
    { from: 'DEL', to: 'MAA', durationMins: 180 },
    { from: 'DEL', to: 'HYD', durationMins: 140 },
    { from: 'BLR', to: 'BOM', durationMins: 105 },
    { from: 'BLR', to: 'DEL', durationMins: 165 },
    { from: 'BLR', to: 'MAA', durationMins: 60  },
    { from: 'BLR', to: 'HYD', durationMins: 75  },
    { from: 'MAA', to: 'BOM', durationMins: 135 },
    { from: 'MAA', to: 'DEL', durationMins: 180 },
    { from: 'MAA', to: 'BLR', durationMins: 60  },
    { from: 'MAA', to: 'HYD', durationMins: 80  },
    { from: 'HYD', to: 'BOM', durationMins: 90  },
    { from: 'HYD', to: 'DEL', durationMins: 140 },
    { from: 'HYD', to: 'BLR', durationMins: 75  },
    { from: 'HYD', to: 'MAA', durationMins: 80  },
];

// 10 departure slots spread across the day
const DEPARTURE_TIMES = [
    { hours: 6,  mins: 0  },
    { hours: 7,  mins: 30 },
    { hours: 9,  mins: 0  },
    { hours: 10, mins: 30 },
    { hours: 12, mins: 0  },
    { hours: 13, mins: 30 },
    { hours: 15, mins: 0  },
    { hours: 16, mins: 30 },
    { hours: 18, mins: 0  },
    { hours: 19, mins: 30 },
];

// Rotate through all 4 airplane types
const AIRPLANES = [
    { id: 1, seats: 180 }, // AIRBUS320
    { id: 2, seats: 396 }, // BOEING777
    { id: 3, seats: 555 }, // AIRBUS380
    { id: 4, seats: 160 }, // BOEING737
];

// Indian airline codes for realistic flight numbers
const CARRIERS = ['6E', 'AI', 'SG', 'UK'];

function randomPrice() {
    // Realistic Indian domestic prices: ₹2000 - ₹15000
    return Math.floor(Math.random() * 13000) + 2000;
}

function generateFlightNumber(routeIndex, timeIndex, dayIndex) {
    const carrier = CARRIERS[(routeIndex + timeIndex) % CARRIERS.length];
    // 4-digit number derived from indices — ensures variety without pure randomness
    const num = String(((routeIndex * 10 + timeIndex) * 13 + dayIndex) % 9000 + 1000);
    return `${carrier}${num}`;
}

module.exports = {
    async up(queryInterface, Sequelize) {

        // Add Hyderabad — needed for the 5th hub airport (HYD)
        await queryInterface.bulkInsert('Cities', [
            { name: 'Hyderabad', createdAt: new Date(), updatedAt: new Date() }
        ]);

        const [hydCity] = await queryInterface.sequelize.query(
            "SELECT id FROM Cities WHERE name = 'Hyderabad' LIMIT 1",
            { type: queryInterface.sequelize.QueryTypes.SELECT }
        );

        await queryInterface.bulkInsert('Airports', [{
            name: 'Rajiv Gandhi International Airport',
            code: 'HYD',
            address: 'Hyderabad',
            cityId: hydCity.id,
            createdAt: new Date(),
            updatedAt: new Date()
        }]);

        // Generate flights
        const flights = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let day = 0; day < 180; day++) {
            const date = new Date(today);
            date.setDate(date.getDate() + day);

            for (let routeIdx = 0; routeIdx < ROUTES.length; routeIdx++) {
                const route = ROUTES[routeIdx];

                for (let timeIdx = 0; timeIdx < DEPARTURE_TIMES.length; timeIdx++) {
                    const slot = DEPARTURE_TIMES[timeIdx];
                    const airplane = AIRPLANES[(routeIdx + timeIdx) % AIRPLANES.length];

                    const departureTime = new Date(date);
                    departureTime.setHours(slot.hours, slot.mins, 0, 0);

                    const arrivalTime = new Date(departureTime);
                    arrivalTime.setMinutes(arrivalTime.getMinutes() + route.durationMins);

                    flights.push({
                        flightNumber: generateFlightNumber(routeIdx, timeIdx, day),
                        airplaneId: airplane.id,
                        departureAirportId: route.from,
                        arrivalAirportId: route.to,
                        departureTime,
                        arrivalTime,
                        price: randomPrice(),
                        totalSeats: airplane.seats,
                        boardingGate: 'SEED', // marker — used by down() to delete only seeded flights
                        createdAt: new Date(),
                        updatedAt: new Date()
                    });
                }
            }
        }

        // Batch insert in chunks of 1000 — inserting 36k rows at once would exhaust memory
        const BATCH_SIZE = 1000;
        for (let i = 0; i < flights.length; i += BATCH_SIZE) {
            await queryInterface.bulkInsert('Flights', flights.slice(i, i + BATCH_SIZE));
        }

        console.log(`Seeded ${flights.length} flights across ${ROUTES.length} routes over 180 days`);
    },

    async down(queryInterface, Sequelize) {
        // Delete only seeded flights — identified by boardingGate marker
        await queryInterface.bulkDelete('Flights', { boardingGate: 'SEED' }, {});
        await queryInterface.bulkDelete('Airports', { code: 'HYD' }, {});
        await queryInterface.bulkDelete('Cities', { name: 'Hyderabad' }, {});
    }
};
