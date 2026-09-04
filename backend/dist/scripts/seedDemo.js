"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedDemo = seedDemo;
const db_1 = require("../config/db");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
async function seedDemo() {
    console.log('[Seed Demo] Initializing reproducible Cognivive NER 20-Elder & 5-Caregiver demo dataset...');
    const client = await db_1.pool.connect();
    try {
        await client.query('BEGIN');
        // Standard demo hash for 'password123'
        const passwordHash = await bcryptjs_1.default.hash('password123', 10);
        // 1. Caregivers (5 Fictional Caregivers)
        console.log('  -> Seeding 5 fictional caregivers...');
        const caregivers = [
            { id: '22222222-2222-2222-2222-222222222222', name: 'Ananya Sharma', email: 'caregiver@cognivive.com', phone: '+91 9876543211', lang: 'en', region: 'Assam' },
            { id: '22222222-2222-2222-2222-000000000002', name: 'Subhash Das', email: 'caregiver2@cognivive.com', phone: '+91 9876543222', lang: 'as', region: 'Assam' },
            { id: '22222222-2222-2222-2222-000000000003', name: 'Lalitha Hmar', email: 'caregiver3@cognivive.com', phone: '+91 9876543233', lang: 'en', region: 'Meghalaya' },
            { id: '22222222-2222-2222-2222-000000000004', name: 'Tenzing Lepcha', email: 'caregiver4@cognivive.com', phone: '+91 9876543244', lang: 'en', region: 'Sikkim' },
            { id: '22222222-2222-2222-2222-000000000005', name: 'Imtitemjen Ao', email: 'caregiver5@cognivive.com', phone: '+91 9876543255', lang: 'en', region: 'Nagaland' }
        ];
        for (const cg of caregivers) {
            await client.query(`
        INSERT INTO users (id, full_name, email, password_hash, role, phone_number, preferred_language, ner_region)
        VALUES ($1, $2, $3, $4, 'CAREGIVER', $5, $6, $7)
        ON CONFLICT (id) DO UPDATE
        SET full_name = EXCLUDED.full_name, email = EXCLUDED.email, password_hash = EXCLUDED.password_hash;
      `, [cg.id, cg.name, cg.email, passwordHash, cg.phone, cg.lang, cg.region]);
        }
        // Clinician (Preserved baseline)
        await client.query(`
      INSERT INTO users (id, full_name, email, password_hash, role, phone_number, preferred_language, ner_region)
      VALUES ('33333333-3333-3333-3333-333333333333', 'Dr. Arvind Verma', 'clinician@cognivive.com', $1, 'CLINICIAN', '+91 9876543212', 'en', 'Assam')
      ON CONFLICT (id) DO UPDATE
      SET full_name = EXCLUDED.full_name, email = EXCLUDED.email, password_hash = EXCLUDED.password_hash;
    `, [passwordHash]);
        // 2. 20 Fictional Elders distributed across 8 NER regions
        console.log('  -> Seeding 20 fictional elder profiles across NER...');
        const elders = [
            // Caregiver 1 (Ananya Sharma) -> 4 Elders
            { id: '11111111-1111-1111-1111-111111111111', name: 'Ramchandra Sharma', email: 'elder@cognivive.com', phone: '+91 9876543210', lang: 'en', region: 'Assam', age: 74, gender: 'Male', cgId: caregivers[0].id, rel: 'Daughter', baseScore: 68.4 },
            { id: '11111111-1111-1111-1111-000000000002', name: 'Hemanta Barua', email: 'elder2@cognivive.com', phone: '+91 9876543102', lang: 'as', region: 'Assam', age: 71, gender: 'Male', cgId: caregivers[0].id, rel: 'Care Attendant', baseScore: 72.0 },
            { id: '11111111-1111-1111-1111-000000000003', name: 'Biren Saikia', email: 'elder3@cognivive.com', phone: '+91 9876543103', lang: 'as', region: 'Assam', age: 78, gender: 'Male', cgId: caregivers[0].id, rel: 'Niece', baseScore: 65.5 },
            { id: '11111111-1111-1111-1111-000000000004', name: 'Purnima Devi', email: 'elder4@cognivive.com', phone: '+91 9876543104', lang: 'as', region: 'Assam', age: 69, gender: 'Female', cgId: caregivers[0].id, rel: 'Daughter-in-law', baseScore: 80.2 },
            // Caregiver 2 (Subhash Das) -> 4 Elders
            { id: '11111111-1111-1111-1111-000000000005', name: 'Tashi Wangchu', email: 'elder5@cognivive.com', phone: '+91 9876543105', lang: 'en', region: 'Arunachal Pradesh', age: 75, gender: 'Male', cgId: caregivers[1].id, rel: 'Son', baseScore: 62.0 },
            { id: '11111111-1111-1111-1111-000000000006', name: 'Dorjee Khandu', email: 'elder6@cognivive.com', phone: '+91 9876543106', lang: 'en', region: 'Arunachal Pradesh', age: 73, gender: 'Male', cgId: caregivers[1].id, rel: 'Caregiver', baseScore: 70.5 },
            { id: '11111111-1111-1111-1111-000000000007', name: 'Ningombam Meitei', email: 'elder7@cognivive.com', phone: '+91 9876543107', lang: 'mni', region: 'Manipur', age: 76, gender: 'Male', cgId: caregivers[1].id, rel: 'Son', baseScore: 59.0 },
            { id: '11111111-1111-1111-1111-000000000008', name: 'Thoibi Chanu', email: 'elder8@cognivive.com', phone: '+91 9876543108', lang: 'mni', region: 'Manipur', age: 70, gender: 'Female', cgId: caregivers[1].id, rel: 'Daughter', baseScore: 77.5 },
            // Caregiver 3 (Lalitha Hmar) -> 4 Elders
            { id: '11111111-1111-1111-1111-000000000009', name: 'Bahphrang Lyngdoh', email: 'elder9@cognivive.com', phone: '+91 9876543109', lang: 'kha', region: 'Meghalaya', age: 72, gender: 'Male', cgId: caregivers[2].id, rel: 'Son', baseScore: 74.0 },
            { id: '11111111-1111-1111-1111-000000000010', name: 'Marbiang Nongrum', email: 'elder10@cognivive.com', phone: '+91 9876543110', lang: 'kha', region: 'Meghalaya', age: 68, gender: 'Female', cgId: caregivers[2].id, rel: 'Daughter', baseScore: 82.0 },
            { id: '11111111-1111-1111-1111-000000000011', name: 'Zonunmawia Ralte', email: 'elder11@cognivive.com', phone: '+91 9876543111', lang: 'lus', region: 'Mizoram', age: 77, gender: 'Male', cgId: caregivers[2].id, rel: 'Nephew', baseScore: 66.8 },
            { id: '11111111-1111-1111-1111-000000000012', name: 'Lalthanpuii Sailo', email: 'elder12@cognivive.com', phone: '+91 9876543112', lang: 'lus', region: 'Mizoram', age: 74, gender: 'Female', cgId: caregivers[2].id, rel: 'Granddaughter', baseScore: 75.2 },
            // Caregiver 4 (Tenzing Lepcha) -> 4 Elders
            { id: '11111111-1111-1111-1111-000000000013', name: 'Moatoshi Jamir', email: 'elder13@cognivive.com', phone: '+91 9876543113', lang: 'en', region: 'Nagaland', age: 79, gender: 'Male', cgId: caregivers[3].id, rel: 'Son', baseScore: 63.4 },
            { id: '11111111-1111-1111-1111-000000000014', name: 'Vezoto Thisa', email: 'elder14@cognivive.com', phone: '+91 9876543114', lang: 'en', region: 'Nagaland', age: 70, gender: 'Male', cgId: caregivers[3].id, rel: 'Daughter', baseScore: 71.0 },
            { id: '11111111-1111-1111-1111-000000000015', name: 'Karma Bhutia', email: 'elder15@cognivive.com', phone: '+91 9876543115', lang: 'ne', region: 'Sikkim', age: 75, gender: 'Male', cgId: caregivers[3].id, rel: 'Son', baseScore: 78.0 },
            { id: '11111111-1111-1111-1111-000000000016', name: 'Pempa Sherpa', email: 'elder16@cognivive.com', phone: '+91 9876543116', lang: 'ne', region: 'Sikkim', age: 72, gender: 'Female', cgId: caregivers[3].id, rel: 'Caregiver', baseScore: 69.5 },
            // Caregiver 5 (Imtitemjen Ao) -> 4 Elders
            { id: '11111111-1111-1111-1111-000000000017', name: 'Debbarma Manik', email: 'elder17@cognivive.com', phone: '+91 9876543117', lang: 'trp', region: 'Tripura', age: 73, gender: 'Male', cgId: caregivers[4].id, rel: 'Son', baseScore: 67.2 },
            { id: '11111111-1111-1111-1111-000000000018', name: 'Ratna Reang', email: 'elder18@cognivive.com', phone: '+91 9876543118', lang: 'trp', region: 'Tripura', age: 68, gender: 'Female', cgId: caregivers[4].id, rel: 'Daughter', baseScore: 76.8 },
            { id: '11111111-1111-1111-1111-000000000019', name: 'Sunil Boro', email: 'elder19@cognivive.com', phone: '+91 9876543119', lang: 'brx', region: 'Assam', age: 74, gender: 'Male', cgId: caregivers[4].id, rel: 'Son', baseScore: 64.0 },
            { id: '11111111-1111-1111-1111-000000000020', name: 'Arati Chakma', email: 'elder20@cognivive.com', phone: '+91 9876543120', lang: 'bn', region: 'Tripura', age: 71, gender: 'Female', cgId: caregivers[4].id, rel: 'Sister', baseScore: 73.5 }
        ];
        for (const e of elders) {
            // User account
            await client.query(`
        INSERT INTO users (id, full_name, email, password_hash, role, phone_number, preferred_language, ner_region, age, gender)
        VALUES ($1, $2, $3, $4, 'ELDER', $5, $6, $7, $8, $9)
        ON CONFLICT (id) DO UPDATE
        SET full_name = EXCLUDED.full_name, email = EXCLUDED.email, password_hash = EXCLUDED.password_hash,
            ner_region = EXCLUDED.ner_region, age = EXCLUDED.age, gender = EXCLUDED.gender;
      `, [e.id, e.name, e.email, passwordHash, e.phone, e.lang, e.region, e.age, e.gender]);
            // Patient profile
            await client.query(`
        INSERT INTO patient_profiles (user_id, emergency_contact_phone, emergency_contact_name, status, baseline_activity_index, audio_prompts_enabled, high_contrast_mode, font_scale_multiplier, ner_region, age, gender)
        VALUES ($1, $2, $3, 'STABLE', $4, TRUE, FALSE, 1.25, $5, $6, $7)
        ON CONFLICT (user_id) DO UPDATE
        SET emergency_contact_name = EXCLUDED.emergency_contact_name, ner_region = EXCLUDED.ner_region, age = EXCLUDED.age, gender = EXCLUDED.gender;
      `, [e.id, e.phone, `${e.name} (${e.rel})`, e.baseScore, e.region, e.age, e.gender]);
            // Caregiver Link
            await client.query(`
        INSERT INTO caregiver_patient_links (caregiver_id, patient_id, relationship, can_edit_reminders)
        VALUES ($1, $2, $3, TRUE)
        ON CONFLICT (caregiver_id, patient_id) DO UPDATE
        SET relationship = EXCLUDED.relationship;
      `, [e.cgId, e.id, e.rel]);
            // Cognitive Profile (5 Domains)
            await client.query(`
        INSERT INTO cognitive_profiles (patient_id, overall_performance_score, working_memory_score, processing_speed_score, attention_score, executive_flexibility_score, reminiscence_score, consistency_index, engagement_minutes_total, performance_change_flag, performance_change_notes, last_evaluated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 82.0, 140, FALSE, 'Activity performance is steady with positive engagement.', NOW())
        ON CONFLICT (patient_id) DO UPDATE
        SET overall_performance_score = EXCLUDED.overall_performance_score;
      `, [
                e.id,
                e.baseScore,
                Math.min(95, e.baseScore + 5),
                Math.max(40, e.baseScore - 8),
                e.baseScore + 2,
                e.baseScore - 3,
                Math.min(98, e.baseScore + 10)
            ]);
            // Seed all 7 game difficulty states for this elder
            const allSevenGames = [
                'memory_blossom', 'quick_harvest', 'golden_memories',
                'pattern_path', 'match_pairs', 'sort_remember', 'sequence_stories'
            ];
            for (const gid of allSevenGames) {
                await client.query(`
          INSERT INTO player_game_difficulty_states (patient_id, game_id, current_difficulty, consecutive_successes, consecutive_struggles, ai_adjustment_notes, updated_at)
          VALUES ($1, $2, 1, 1, 0, 'Personalized baseline active.', NOW())
          ON CONFLICT (patient_id, game_id) DO NOTHING;
        `, [e.id, gid]);
            }
            // Seed a sample medicine reminder and a routine reminder
            const medRemId = e.id.replace('11111111', 'eeee1111');
            const routRemId = e.id.replace('11111111', 'eeee2222');
            await client.query(`
        INSERT INTO reminders (id, patient_id, title, type, scheduled_time, days_of_week, dosage_or_notes, voice_prompt_text, is_active, medicine_name, dosage_text, frequency_text)
        VALUES 
        ($1, $2, 'Morning Blood Pressure Care', 'MEDICATION', '08:30:00', '{1,2,3,4,5,6,7}', '1 tablet with warm water after breakfast', 'Good morning, please take your morning medicine.', TRUE, 'Amlodipine 5mg', '1 tablet', 'Once Daily Morning'),
        ($3, $2, 'Morning Garden Walk & Movement', 'ROUTINE', '09:30:00', '{1,2,3,4,5,6,7}', 'Gentle 15-minute garden walk and fresh air', 'Time for a gentle morning stroll.', TRUE, NULL, NULL, 'Daily Morning')
        ON CONFLICT (id) DO NOTHING;
      `, [medRemId, e.id, routRemId]);
            // Seed today's reminder log
            await client.query(`
        INSERT INTO reminder_logs (reminder_id, patient_id, scheduled_date, status, acknowledged_at, voice_confirmed, notes)
        VALUES 
        ($1, $2, CURRENT_DATE, 'TAKEN', NOW() - INTERVAL '3 hours', TRUE, 'Completed on schedule'),
        ($3, $2, CURRENT_DATE, 'PENDING', NULL, FALSE, 'Scheduled for today')
        ON CONFLICT (reminder_id, scheduled_date) DO NOTHING;
      `, [medRemId, e.id, routRemId]);
            // Seed sample wellness activity
            await client.query(`
        INSERT INTO wellness_activities (patient_id, activity_type, duration_minutes, completed, notes, completed_at)
        VALUES ($1, 'Walking', 15, TRUE, 'Morning stroll in the veranda', NOW() - INTERVAL '2 hours')
        ON CONFLICT DO NOTHING;
      `, [e.id]);
            // Seed family memory item
            await client.query(`
        INSERT INTO family_memory_items (patient_id, member_name, relationship, important_place, important_event, memory_text)
        VALUES ($1, 'Anita', 'Daughter', '${e.region} Home', 'Family Festival Gathering', 'Anita loves preparing traditional holiday sweets and visiting every autumn.')
        ON CONFLICT DO NOTHING;
      `, [e.id]);
            // Seed caregiver note
            await client.query(`
        INSERT INTO caregiver_notes (caregiver_id, patient_id, note_text)
        VALUES ($1, $2, 'Prefers morning gentle cognitive games after tea. In high spirits.')
        ON CONFLICT DO NOTHING;
      `, [e.cgId, e.id]);
        }
        // 3. Cognitive Games Catalog (Ensuring all 7 games present)
        console.log('  -> Verifying 7 cognitive games catalog...');
        await client.query(`
      INSERT INTO games (id, title, primary_domain, min_difficulty, max_difficulty, description, instructions_key)
      VALUES
      ('memory_blossom', 'Memory Blossom', 'WORKING_MEMORY', 1, 8, 'A calming garden sequence game. Watch the flowers bloom and repeat the pattern to stimulate working memory.', 'instructions.memory_blossom'),
      ('quick_harvest', 'Quick Harvest', 'PROCESSING_SPEED', 1, 8, 'Tap seasonal fruits quickly as they appear to reinforce visual attention and processing speed.', 'instructions.quick_harvest'),
      ('golden_memories', 'Golden Memories', 'REMINISCENCE', 1, 8, 'Reflect on nostalgic cultural sights, classic melodies, and historic trivia to foster semantic recall.', 'instructions.golden_memories'),
      ('pattern_path', 'Pattern Path', 'ATTENTION', 1, 8, 'Follow and reproduce illuminated path sequences to stimulate attentional focus and working sequence memory.', 'instructions.pattern_path'),
      ('match_pairs', 'Match the Pairs', 'WORKING_MEMORY', 1, 8, 'Flip cards and discover matching cultural and nature pairs to strengthen visual recognition and working memory.', 'instructions.match_pairs'),
      ('sort_remember', 'Sort & Remember', 'EXECUTIVE_FLEXIBILITY', 1, 8, 'Categorize everyday household and market items into matching baskets, followed by quick recall practice.', 'instructions.sort_remember'),
      ('sequence_stories', 'Sequence Stories', 'REMINISCENCE', 1, 8, 'Reorder familiar cultural and everyday story cards in chronological order to support sequencing and reminiscence recall.', 'instructions.sequence_stories')
      ON CONFLICT (id) DO UPDATE
      SET title = EXCLUDED.title, description = EXCLUDED.description;
    `);
        await client.query('COMMIT');
        console.log('✅ Demo dataset seeded successfully: 20 Elders, 5 Caregivers, 8 NER States!');
        console.log('\nDemo Accounts:');
        console.log('  * Primary Elder:     elder@cognivive.com     / password123 (Ramchandra Sharma, Assam)');
        console.log('  * Primary Caregiver: caregiver@cognivive.com / password123 (Ananya Sharma, Assam - 4 Elders)');
        console.log('  * Caregiver 2:       caregiver2@cognivive.com/ password123 (Subhash Das - 4 Elders)');
        console.log('  * Caregiver 3:       caregiver3@cognivive.com/ password123 (Lalitha Hmar - 4 Elders)');
        console.log('  * Caregiver 4:       caregiver4@cognivive.com/ password123 (Tenzing Lepcha - 4 Elders)');
        console.log('  * Caregiver 5:       caregiver5@cognivive.com/ password123 (Imtitemjen Ao - 4 Elders)');
        console.log('  * Clinician:         clinician@cognivive.com / password123 (Dr. Arvind Verma)');
    }
    catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Failed to seed demo dataset:', err);
        throw err;
    }
    finally {
        client.release();
        await db_1.pool.end();
    }
}
seedDemo();
