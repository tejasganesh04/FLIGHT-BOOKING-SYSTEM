import http from 'k6/http';
import { check, sleep } from 'k6';

/*
 * Flight Search Benchmark
 *
 * Simulates concurrent users searching for flights with realistic filters.
 * Run BEFORE and AFTER each optimisation phase to measure improvement.
 *
 * Phase 2 result (DB indexes, no cache):  avg 10.07ms, p(95) 16.85ms
 * Phase 4 target (Redis cache, via Gateway): TBD
 *
 * Usage:
 *   k6 run benchmark.js
 *
 * What it tests:
 *   - Route filter (departureAirportId + arrivalAirportId) — hits composite index
 *   - Date filter (departureTime BETWEEN) — hits departureTime index
 *   - Price filter (price BETWEEN) — hits price index
 *   - Sort by price ASC — benefits from index ordering
 *   - Redis cache hit rate: 12 routes x 10 dates = 120 unique keys,
 *     ~3000 total requests → ~96% cache hit rate after warm-up
 *
 * Load profile:
 *   - 50 virtual users (VUs) hammering the endpoint simultaneously
 *   - 30 second duration
 *   = realistic burst load, enough to surface cache impact
 */

export const options = {
    vus: 50,          // 50 concurrent virtual users
    duration: '30s',  // run for 30 seconds
    thresholds: {
        http_req_duration: ['p(95)<2000'], // 95% of requests must finish within 2s
    },
};

// Rotate through realistic route combinations
const ROUTES = [
    'BOM-DEL', 'DEL-BOM',
    'BOM-BLR', 'BLR-BOM',
    'BOM-MAA', 'MAA-BOM',
    'BOM-HYD', 'HYD-BOM',
    'DEL-BLR', 'BLR-DEL',
    'DEL-HYD', 'HYD-DEL',
];

// Rotate through dates in the next 6 months to spread queries across the full dataset
const DATES = [
    '2026-05-10', '2026-05-20', '2026-06-01',
    '2026-06-15', '2026-07-01', '2026-07-20',
    '2026-08-01', '2026-08-15', '2026-09-01',
    '2026-10-01',
];

export default function () {
    // Pick a random route and date each iteration — prevents query cache from skewing results
    const route = ROUTES[Math.floor(Math.random() * ROUTES.length)];
    const date  = DATES[Math.floor(Math.random() * DATES.length)];

    // Hitting Flights Service directly (port 3000) to isolate cache performance.
    // Cache lives in the Flights Service — Gateway proxy overhead is not what we're measuring.
    const url = `http://localhost:3000/api/v1/flights?trips=${route}&tripDate=${date}&price=2000-15000&sort=price_ASC`;

    const res = http.get(url);

    check(res, {
        'status is 200': (r) => r.status === 200,
    });

    sleep(0.5); // 500ms think time between requests — simulates real user behaviour
}
