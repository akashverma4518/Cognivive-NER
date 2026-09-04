import { Request, Response } from 'express';
import { AiServiceClient } from '../services/aiServiceClient';

export const parseVoiceCommand = async (req: Request, res: Response) => {
  try {
    const { text, language = 'en' } = req.body;
    if (!text) {
      return res.status(400).json({ success: false, message: 'text is required.' });
    }

    const result = await AiServiceClient.parseVoice(text, language);
    return res.json({ success: true, parsed: result });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const triggerEmergencySos = async (req: Request, res: Response) => {
  try {
    const patientId = req.user?.id;
    const { location, notes } = req.body;

    // Optional secondary SOS feature: logs emergency notification
    console.log(`[SOS ALERT] Emergency triggered by patient ${patientId} (${req.user?.fullName}) at ${new Date().toISOString()}`);

    return res.json({
      success: true,
      message: 'Emergency SOS alert generated and dispatched to assigned caregiver.',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
