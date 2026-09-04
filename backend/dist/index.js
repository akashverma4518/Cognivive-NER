"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const env_1 = require("./config/env");
const db_1 = require("./config/db");
const errorHandler_1 = require("./middleware/errorHandler");
const aiServiceClient_1 = require("./services/aiServiceClient");
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const gameRoutes_1 = __importDefault(require("./routes/gameRoutes"));
const profileRoutes_1 = __importDefault(require("./routes/profileRoutes"));
const reminderRoutes_1 = __importDefault(require("./routes/reminderRoutes"));
const caregiverRoutes_1 = __importDefault(require("./routes/caregiverRoutes"));
const syncRoutes_1 = __importDefault(require("./routes/syncRoutes"));
const aiProxyRoutes_1 = __importDefault(require("./routes/aiProxyRoutes"));
const searchRoutes_1 = __importDefault(require("./routes/searchRoutes"));
const careCompanionRoutes_1 = __importDefault(require("./routes/careCompanionRoutes"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)({ origin: env_1.ENV.CORS_ORIGIN, credentials: true }));
app.use(express_1.default.json());
// Healthcheck
app.get('/health', async (req, res) => {
    let dbStatus = 'DISCONNECTED';
    try {
        const dbTest = await db_1.pool.query('SELECT 1');
        if (dbTest.rowCount === 1)
            dbStatus = 'CONNECTED';
    }
    catch (err) {
        dbStatus = `ERROR: ${err.message}`;
    }
    const aiStatus = await aiServiceClient_1.AiServiceClient.checkHealth();
    return res.json({
        status: 'HEALTHY',
        service: 'Cognivive NER Backend API',
        database: dbStatus,
        aiService: aiStatus,
        timestamp: new Date().toISOString()
    });
});
// API v1 Routes
app.use('/api/v1/auth', authRoutes_1.default);
app.use('/api/v1/games', gameRoutes_1.default);
app.use('/api/v1/profile', profileRoutes_1.default);
app.use('/api/v1/reminders', reminderRoutes_1.default);
app.use('/api/v1/caregiver', caregiverRoutes_1.default);
app.use('/api/v1/sync', syncRoutes_1.default);
app.use('/api/v1/ai', aiProxyRoutes_1.default);
app.use('/api/v1/search', searchRoutes_1.default);
app.use('/api/search', searchRoutes_1.default);
app.use('/api/v1/care', careCompanionRoutes_1.default);
app.use('/api/care', careCompanionRoutes_1.default);
app.use(errorHandler_1.errorHandler);
const server = app.listen(env_1.ENV.PORT, async () => {
    console.log(`[Cognivive Backend] Server listening on port ${env_1.ENV.PORT}`);
    console.log(`[Cognivive Backend] Node Environment: ${env_1.ENV.NODE_ENV}`);
    // Test initial database connection
    try {
        const res = await db_1.pool.query('SELECT NOW()');
        console.log(`[Cognivive Backend] PostgreSQL connected successfully at ${res.rows[0].now}`);
    }
    catch (err) {
        console.error('[Cognivive Backend] Failed to connect to PostgreSQL:', err.message);
    }
    // Test initial AI service connection
    const aiHealth = await aiServiceClient_1.AiServiceClient.checkHealth();
    console.log(`[Cognivive Backend] Python AI Service Status: ${JSON.stringify(aiHealth)}`);
});
exports.default = app;
