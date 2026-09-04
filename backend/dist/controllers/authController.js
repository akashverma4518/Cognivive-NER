"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = require("../config/db");
const env_1 = require("../config/env");
const register = async (req, res) => {
    try {
        const { fullName, email, password, confirmPassword, role = 'ELDER', phoneNumber, age, gender, nerRegion = 'Assam', emergencyContactName, emergencyContactPhone, preferredLanguage = 'en' } = req.body;
        // 1. Validation
        if (!fullName || !email || !password) {
            return res.status(400).json({ success: false, message: 'Full name, email, and password are required.' });
        }
        if (confirmPassword && password !== confirmPassword) {
            return res.status(400).json({ success: false, message: 'Passwords do not match.' });
        }
        if (typeof password !== 'string' || password.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
        }
        // Role security: public registration only allows ELDER or CAREGIVER
        const targetRole = role === 'CAREGIVER' ? 'CAREGIVER' : 'ELDER';
        const parsedAge = age ? parseInt(String(age), 10) : null;
        if (parsedAge !== null && (isNaN(parsedAge) || parsedAge < 18 || parsedAge > 125)) {
            return res.status(400).json({ success: false, message: 'Please provide a valid age between 18 and 125.' });
        }
        // 2. Check existing duplicate email
        const existing = await (0, db_1.query)('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
        if (existing.rows.length > 0) {
            return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
        }
        const salt = await bcryptjs_1.default.genSalt(10);
        const passwordHash = await bcryptjs_1.default.hash(password, salt);
        const userRes = await (0, db_1.query)(`INSERT INTO users (full_name, email, password_hash, role, phone_number, preferred_language, ner_region, age, gender)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, full_name, email, role, phone_number, preferred_language, ner_region, age, gender`, [
            fullName.trim(),
            email.toLowerCase().trim(),
            passwordHash,
            targetRole,
            phoneNumber ? phoneNumber.trim() : null,
            preferredLanguage,
            nerRegion ? nerRegion.trim() : 'Assam',
            parsedAge,
            gender ? gender.trim() : null
        ]);
        const user = userRes.rows[0];
        // If ELDER, initialize patient_profile, cognitive_profile, and difficulty states for all 7 games
        if (targetRole === 'ELDER') {
            await (0, db_1.query)(`INSERT INTO patient_profiles (user_id, emergency_contact_name, emergency_contact_phone, ner_region, age, gender)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (user_id) DO NOTHING`, [
                user.id,
                emergencyContactName ? emergencyContactName.trim() : 'Family Contact',
                emergencyContactPhone ? emergencyContactPhone.trim() : '+91 0000000000',
                nerRegion ? nerRegion.trim() : 'Assam',
                parsedAge,
                gender ? gender.trim() : null
            ]);
            await (0, db_1.query)(`INSERT INTO cognitive_profiles (patient_id, overall_performance_score, working_memory_score, processing_speed_score, attention_score, executive_flexibility_score, reminiscence_score)
         VALUES ($1, 50.0, 50.0, 50.0, 50.0, 50.0, 50.0)
         ON CONFLICT DO NOTHING`, [user.id]);
            // Seed initial difficulty states for all 7 games
            const allSevenGames = [
                'memory_blossom',
                'quick_harvest',
                'golden_memories',
                'pattern_path',
                'match_pairs',
                'sort_remember',
                'sequence_stories'
            ];
            for (const gid of allSevenGames) {
                await (0, db_1.query)(`INSERT INTO player_game_difficulty_states (patient_id, game_id, current_difficulty)
           VALUES ($1, $2, 1) ON CONFLICT (patient_id, game_id) DO NOTHING`, [user.id, gid]);
            }
        }
        const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role, fullName: user.full_name }, env_1.ENV.JWT_SECRET, { expiresIn: (env_1.ENV.JWT_EXPIRES_IN || '7d') });
        return res.status(201).json({
            success: true,
            message: 'Account registered successfully.',
            token,
            user
        });
    }
    catch (error) {
        console.error('[Auth register error]:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required.' });
        }
        const userRes = await (0, db_1.query)(`SELECT id, full_name, email, password_hash, role, phone_number, preferred_language 
       FROM users WHERE email = $1`, [email.toLowerCase().trim()]);
        if (userRes.rows.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }
        const user = userRes.rows[0];
        const isMatch = await bcryptjs_1.default.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }
        // Fetch linked profile info if applicable
        let profile = null;
        if (user.role === 'ELDER') {
            const pRes = await (0, db_1.query)('SELECT * FROM patient_profiles WHERE user_id = $1', [user.id]);
            profile = pRes.rows[0] || null;
        }
        const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role, fullName: user.full_name }, env_1.ENV.JWT_SECRET, { expiresIn: (env_1.ENV.JWT_EXPIRES_IN || '7d') });
        delete user.password_hash;
        return res.json({
            success: true,
            token,
            user,
            profile
        });
    }
    catch (error) {
        console.error('[Auth login error]:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.login = login;
const getMe = async (req, res) => {
    try {
        const userId = req.user?.id;
        const userRes = await (0, db_1.query)(`SELECT id, full_name, email, role, phone_number, preferred_language, created_at 
       FROM users WHERE id = $1`, [userId]);
        if (userRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }
        const user = userRes.rows[0];
        let profile = null;
        if (user.role === 'ELDER') {
            const pRes = await (0, db_1.query)('SELECT * FROM patient_profiles WHERE user_id = $1', [user.id]);
            profile = pRes.rows[0] || null;
        }
        return res.json({ success: true, user, profile });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getMe = getMe;
