import sys
import os
import requests
import json

BACKEND_URL = "http://localhost:5000/api/v1"
AI_URL = "http://localhost:8000"
FRONTEND_URL = "http://localhost:3000"

def run_phase3_tests():
    print("=" * 80)
    print("COGNIVIVE NER - PHASE 3 GAMES TELEMETRY & ADAPTIVE DIFFICULTY TEST SUITE")
    print("=" * 80)

    # 1. Verify All 4 Services are Active
    print("\n[Step 1] Verifying System Services (Postgres, Node Backend, Python AI, Vite Frontend)...")
    try:
        f_res = requests.get(FRONTEND_URL, timeout=4)
        assert f_res.status_code == 200, "Frontend is not reachable"
        b_res = requests.get("http://localhost:5000/health", timeout=4)
        assert b_res.status_code == 200, "Backend is not reachable"
        b_data = b_res.json()
        assert b_data.get('database') == 'CONNECTED', "PostgreSQL not connected"
        assert b_data.get('aiService', {}).get('status') == 'HEALTHY', "AI Service not connected"
        print("  -> PostgreSQL: CONNECTED")
        print("  -> Python AI Service: HEALTHY")
        print("  -> Node.js Backend API: HEALTHY")
        print("  -> Vite React Frontend: LIVE (Port 3000)")
    except Exception as e:
        print(f"  FAILED System Services check: {e}")
        return False

    # 2. Elder Authentication
    print("\n[Step 2] Authenticating as Elder User...")
    elder_token = None
    elder_id = None
    try:
        res = requests.post(f"{BACKEND_URL}/auth/login", json={
            "email": "elder@cognivive.com",
            "password": "password123"
        })
        assert res.status_code == 200, f"Elder login failed: {res.text}"
        data = res.json()
        elder_token = data['token']
        elder_id = data['user']['id']
        print(f"  -> Authenticated: {data['user']['full_name']} (ID: {elder_id})")
    except Exception as e:
        print(f"  FAILED Elder Login: {e}")
        return False

    headers = {"Authorization": f"Bearer {elder_token}"}

    # 3. Verify Initial Game Difficulty States
    print("\n[Step 3] Fetching Initial Adaptive Difficulty States for 3 Games...")
    try:
        for gid in ['memory_blossom', 'quick_harvest', 'golden_memories']:
            res = requests.get(f"{BACKEND_URL}/games/{gid}/state", headers=headers)
            assert res.status_code == 200, f"Failed state for {gid}"
            state = res.json().get('state', {})
            print(f"  -> [{gid}] Current Level: {state.get('current_difficulty')} | Note: \"{state.get('ai_adjustment_notes')}\"")
    except Exception as e:
        print(f"  FAILED Game State check: {e}")
        return False

    # 4. GAME 1: Play Memory Blossom with High Performance
    print("\n[Step 4] Playing Game 1: Memory Blossom (Working Memory Sequence Recall)...")
    mb_telemetry = {
        "gameId": "memory_blossom",
        "difficultyLevel": 2,
        "durationSeconds": 115,
        "score": 320,
        "accuracyPercentage": 100.0,
        "averageReactionTimeMs": 1020,
        "mistakesCount": 0,
        "consecutiveCorrect": 3,
        "trials": [
            {"trial_index": 1, "correct": True, "reaction_time_ms": 1010, "sequence_length": 4},
            {"trial_index": 2, "correct": True, "reaction_time_ms": 1030, "sequence_length": 4},
            {"trial_index": 3, "correct": True, "reaction_time_ms": 1020, "sequence_length": 4}
        ],
        "telemetryPayload": {"sequenceLength": 4, "totalTrials": 3, "flowersCount": 4}
    }
    try:
        res = requests.post(f"{BACKEND_URL}/games/session", headers=headers, json=mb_telemetry)
        assert res.status_code == 201, f"Memory Blossom submission failed: {res.text}"
        data = res.json()
        assert data.get('session', {}).get('id') is not None, "Missing session ID in PostgreSQL"
        print(f"  -> Persisted Session in PostgreSQL: {data['session']['id']}")
        print(f"  -> Consistency Index: {data.get('consistencyIndex')}%")
        print(f"  -> AI DDA Output: {data.get('dda', {}).get('adjustment')} -> Next Level: {data.get('dda', {}).get('next_difficulty')}")
        print(f"  -> AI Rationale: \"{data.get('dda', {}).get('rationale')}\"")
        print(f"  -> Working Memory Domain Score: {data.get('updatedDomains', {}).get('working_memory_score')}/100")
    except Exception as e:
        print(f"  FAILED Memory Blossom test: {e}")
        return False

    # 5. GAME 2: Play Quick Harvest with Rapid Processing Speed
    print("\n[Step 5] Playing Game 2: Quick Harvest (Processing Speed + Visual Search)...")
    qh_telemetry = {
        "gameId": "quick_harvest",
        "difficultyLevel": 1,
        "durationSeconds": 90,
        "score": 450,
        "accuracyPercentage": 100.0,
        "averageReactionTimeMs": 840,
        "mistakesCount": 0,
        "consecutiveCorrect": 4,
        "trials": [
            {"trial_index": 1, "correct": True, "reaction_time_ms": 820, "target_id": "apple", "selected_id": "apple"},
            {"trial_index": 2, "correct": True, "reaction_time_ms": 860, "target_id": "mango", "selected_id": "mango"},
            {"trial_index": 3, "correct": True, "reaction_time_ms": 830, "target_id": "banana", "selected_id": "banana"},
            {"trial_index": 4, "correct": True, "reaction_time_ms": 850, "target_id": "orange", "selected_id": "orange"}
        ],
        "telemetryPayload": {"totalItems": 4, "timeoutMs": 5500}
    }
    try:
        res = requests.post(f"{BACKEND_URL}/games/session", headers=headers, json=qh_telemetry)
        assert res.status_code == 201, f"Quick Harvest submission failed: {res.text}"
        data = res.json()
        print(f"  -> Persisted Session in PostgreSQL: {data['session']['id']}")
        print(f"  -> AI Consistency Index: {data.get('consistencyIndex')}%")
        print(f"  -> AI DDA Adjustment: {data.get('dda', {}).get('adjustment')} -> Next Level: {data.get('dda', {}).get('next_difficulty')}")
        print(f"  -> AI Rationale: \"{data.get('dda', {}).get('rationale')}\"")
        print(f"  -> Processing Speed Score: {data.get('updatedDomains', {}).get('processing_speed_score')}/100")
    except Exception as e:
        print(f"  FAILED Quick Harvest test: {e}")
        return False

    # 6. GAME 3: Play Golden Memories with Semantic Reminiscence
    print("\n[Step 6] Playing Game 3: Golden Memories (Semantic Memory & Reminiscence)...")
    gm_telemetry = {
        "gameId": "golden_memories",
        "difficultyLevel": 2,
        "durationSeconds": 140,
        "score": 300,
        "accuracyPercentage": 100.0,
        "averageReactionTimeMs": 1350,
        "mistakesCount": 0,
        "consecutiveCorrect": 3,
        "trials": [
            {"trial_index": 1, "correct": True, "reaction_time_ms": 1320, "question_id": "sitar"},
            {"trial_index": 2, "correct": True, "reaction_time_ms": 1380, "question_id": "steam_engine"},
            {"trial_index": 3, "correct": True, "reaction_time_ms": 1350, "question_id": "tabla"}
        ],
        "telemetryPayload": {"numChoices": 3, "totalTrials": 3}
    }
    try:
        res = requests.post(f"{BACKEND_URL}/games/session", headers=headers, json=gm_telemetry)
        assert res.status_code == 201, f"Golden Memories submission failed: {res.text}"
        data = res.json()
        print(f"  -> Persisted Session in PostgreSQL: {data['session']['id']}")
        print(f"  -> AI Consistency Index: {data.get('consistencyIndex')}%")
        print(f"  -> Reminiscence Domain Score: {data.get('updatedDomains', {}).get('reminiscence_score')}/100")
        print(f"  -> Overall Cognitive Activity Score: {data.get('updatedDomains', {}).get('overall_performance_score')}/100")
    except Exception as e:
        print(f"  FAILED Golden Memories test: {e}")
        return False

    # 7. Test DDA Easing: Low Performance Session
    print("\n[Step 7] Testing Adaptive Difficulty Easing (Low Performance Scenario)...")
    struggling_telemetry = {
        "gameId": "quick_harvest",
        "difficultyLevel": 2,
        "durationSeconds": 75,
        "score": 80,
        "accuracyPercentage": 25.0,  # low accuracy
        "averageReactionTimeMs": 2800,  # delayed RT
        "mistakesCount": 4,  # multiple errors
        "consecutiveCorrect": 0,
        "trials": [
            {"trial_index": 1, "correct": False, "reaction_time_ms": 2900},
            {"trial_index": 2, "correct": False, "reaction_time_ms": 3100},
            {"trial_index": 3, "correct": True, "reaction_time_ms": 2400},
            {"trial_index": 4, "correct": False, "reaction_time_ms": 2800}
        ]
    }
    try:
        res = requests.post(f"{BACKEND_URL}/games/session", headers=headers, json=struggling_telemetry)
        assert res.status_code == 201
        data = res.json()
        dda = data.get('dda', {})
        print(f"  -> Performance Score: {dda.get('calculated_performance')}%")
        print(f"  -> AI DDA Output: {dda.get('adjustment')} | Next Level: {dda.get('next_difficulty')}")
        print(f"  -> AI Rationale: \"{dda.get('rationale')}\"")
        assert dda.get('adjustment') == 'EASED' or dda.get('next_difficulty') < 2, "Expected DDA to ease difficulty on low performance"
    except Exception as e:
        print(f"  FAILED DDA Easing test: {e}")
        return False

    # 8. Test Difficulty Range Clamping (Bounds: 1 to 8)
    print("\n[Step 8] Testing Difficulty Range Clamping (Level Boundaries: 1 to 8)...")
    try:
        # At minimum level 1, easing must NOT go below 1
        res_min = requests.post(f"{BACKEND_URL}/games/session", headers=headers, json={
            "gameId": "quick_harvest",
            "difficultyLevel": 1,
            "durationSeconds": 60,
            "score": 50,
            "accuracyPercentage": 20.0,
            "averageReactionTimeMs": 3500,
            "mistakesCount": 5,
            "trials": [{"trial_index": 1, "correct": False, "reaction_time_ms": 3500}]
        })
        assert res_min.status_code == 201
        min_diff = res_min.json().get('dda', {}).get('next_difficulty')
        assert min_diff >= 1, f"Difficulty dropped below 1: {min_diff}"
        print(f"  -> Lower bound verified: Minimum difficulty clamped at Level {min_diff}")
    except Exception as e:
        print(f"  FAILED Clamping test: {e}")
        return False

    # 9. Verify Sessions Available to Caregiver
    print("\n[Step 9] Verifying Caregiver Can Access All Completed Game Sessions...")
    try:
        res_c = requests.post(f"{BACKEND_URL}/auth/login", json={
            "email": "caregiver@cognivive.com",
            "password": "password123"
        })
        c_token = res_c.json()['token']
        c_headers = {"Authorization": f"Bearer {c_token}"}

        pt_res = requests.get(f"{BACKEND_URL}/caregiver/patients/{elder_id}", headers=c_headers)
        assert pt_res.status_code == 200
        patient_data = pt_res.json()
        recent_sessions = patient_data.get('recentSessions', [])
        assert len(recent_sessions) >= 3, f"Expected at least 3 sessions, found {len(recent_sessions)}"
        print(f"  -> Caregiver verified {len(recent_sessions)} recorded gameplay sessions in PostgreSQL:")
        for s in recent_sessions[:4]:
            print(f"     * [{s['game_id']}] Level {s['difficulty_level']} | Score: {s['score']} | Accuracy: {s['accuracy_percentage']}% | RT: {s['average_reaction_time_ms']}ms")
    except Exception as e:
        print(f"  FAILED Caregiver sessions verification: {e}")
        return False

    # 10. Verify Strict Non-Diagnostic Terminology
    print("\n[Step 10] Verifying Zero Prohibited Clinical Terminology in Telemetry Responses...")
    try:
        prof_res = requests.get(f"{BACKEND_URL}/profile/cognitive", headers=headers)
        raw_text = prof_res.text.lower()
        prohibited = ["mci_risk", "mci_confirmed", "mild_dementia", "dementia", "mmse", "disease"]
        for p in prohibited:
            assert p not in raw_text, f"Found prohibited medical term '{p}' in profile API response"
        print("  -> Non-diagnostic compliance: 100% verified (no clinical terms found)")
    except Exception as e:
        print(f"  FAILED Non-diagnostic terminology test: {e}")
        return False

    # 11. Test Error Handling on Invalid Telemetry
    print("\n[Step 11] Testing Validation / Error Handling on Missing Parameters...")
    try:
        err_res = requests.post(f"{BACKEND_URL}/games/session", headers=headers, json={
            "score": 100
            # missing gameId and difficultyLevel
        })
        assert err_res.status_code == 400, f"Expected 400 Bad Request, got {err_res.status_code}"
        print(f"  -> Correctly rejected invalid session payload: HTTP {err_res.status_code} ({err_res.json().get('message')})")
    except Exception as e:
        print(f"  FAILED Error handling test: {e}")
        return False

    print("\n" + "=" * 80)
    print("ALL 11 PHASE 3 E2E TESTS PASSED SUCCESSFULLY!")
    print("3 Real Games -> Real Telemetry -> PostgreSQL -> Python AI DDA -> Result Modal")
    print("=" * 80)
    return True

if __name__ == "__main__":
    success = run_phase3_tests()
    sys.exit(0 if success else 1)
