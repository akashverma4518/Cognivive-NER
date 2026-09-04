"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.query = exports.pool = void 0;
const pg_1 = require("pg");
const env_1 = require("./env");
exports.pool = new pg_1.Pool({
    connectionString: env_1.ENV.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
});
exports.pool.on('error', (err) => {
    console.error('[PostgreSQL] Unexpected error on idle client:', err);
});
const query = async (text, params) => {
    const start = Date.now();
    const res = await exports.pool.query(text, params);
    const duration = Date.now() - start;
    if (env_1.ENV.NODE_ENV === 'development') {
        // console.log(`[SQL] ${text.substring(0, 80)}... (${duration}ms, ${res.rowCount} rows)`);
    }
    return res;
};
exports.query = query;
