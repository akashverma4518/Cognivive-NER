import express from 'express';
import cors from 'cors';
import { ENV } from './config/env';
import { pool } from './config/db';
import { errorHandler } from './middleware/errorHandler';
import { AiServiceClient } from './services/aiServiceClient';

import authRoutes from './routes/authRoutes';
import gameRoutes from './routes/gameRoutes';
import profileRoutes from './routes/profileRoutes';
import reminderRoutes from './routes/reminderRoutes';
import caregiverRoutes from './routes/caregiverRoutes';
import syncRoutes from './routes/syncRoutes';
import aiProxyRoutes from './routes/aiProxyRoutes';

const app = express();

app.use(cors({ origin: ENV.CORS_ORIGIN, credentials: true }));
app.use(express.json());

// Healthcheck
app.get('/health', async (req, res) => {
  let dbStatus = 'DISCONNECTED';
  try {
    const dbTest = await pool.query('SELECT 1');
    if (dbTest.rowCount === 1) dbStatus = 'CONNECTED';
  } catch (err: any) {
    dbStatus = `ERROR: ${err.message}`;
  }

  const aiStatus = await AiServiceClient.checkHealth();

  return res.json({
    status: 'HEALTHY',
    service: 'Cognivive NER Backend API',
    database: dbStatus,
    aiService: aiStatus,
    timestamp: new Date().toISOString()
  });
});

// API v1 Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/games', gameRoutes);
app.use('/api/v1/profile', profileRoutes);
app.use('/api/v1/reminders', reminderRoutes);
app.use('/api/v1/caregiver', caregiverRoutes);
app.use('/api/v1/sync', syncRoutes);
app.use('/api/v1/ai', aiProxyRoutes);

app.use(errorHandler);

const server = app.listen(ENV.PORT, async () => {
  console.log(`[Cognivive Backend] Server listening on port ${ENV.PORT}`);
  console.log(`[Cognivive Backend] Node Environment: ${ENV.NODE_ENV}`);
  
  // Test initial database connection
  try {
    const res = await pool.query('SELECT NOW()');
    console.log(`[Cognivive Backend] PostgreSQL connected successfully at ${res.rows[0].now}`);
  } catch (err: any) {
    console.error('[Cognivive Backend] Failed to connect to PostgreSQL:', err.message);
  }

  // Test initial AI service connection
  const aiHealth = await AiServiceClient.checkHealth();
  console.log(`[Cognivive Backend] Python AI Service Status: ${JSON.stringify(aiHealth)}`);
});

export default app;
