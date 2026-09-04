import sys
import time
import requests
import json

BACKEND_URL = "http://localhost:5000"
AI_URL = "http://localhost:8000"

def run_tests():
    print("=" * 70)
    print("COGNIVIVE NER - PHASE 1 END-TO-END VERIFICATION SUITE")
    print("=" * 70)

    # 1. Test Python AI Service Health
    print("\n[Step 1] Testing Python FastAPI AI Service directly...")
    try:
        res = requests.get(f"{AI_URL}/health", timeout=5)
        assert res.status_code == 200, f"AI service status {res.status_code}"
        ai_health = res.json()
        print(f"  -> AI Service Status: {ai_health.get('status')} | Diagnostic Mode: {ai_health.get('diagnostic_mode')}")
    except Exception as e:
        print(f"  FAILED to reach AI service: {e}")
        return False

    # 2. Test Node.js Backend Health & Cross-Service Connectivity
    print("\n[Step 2] Testing Node.js Backend Health (PostgreSQL & AI Connectivity)...")
    try:
        res = requests.get(f"{BACKEND_URL}/health", timeout=5)
        assert res.status_code == 200, f"Backend status {res.status_code}"
        b_health = res.json()
        print(f"  -> Backend Status: {b_health.get('status')}")
        print(f"  -> Database Connection: {b_health.get('database')}")
        print(f"  -> AI Service Integration: {b_health.get('aiService', {}).get('status')}")
        assert b_health.get('database') == 'CONNECTED', "PostgreSQL is not connected to Backend"
    except Exception as e:
        print(f"  FAILED to reach Backend: {e}")
        return False

    # 3. Test Elder Login
    print("\n[Step 3] Testing Elder Authentication (Real DB query)...")
    elder_token = None
    elder_id = None
    try:
        res = requests.post(f"{BACKEND_URL}/api/v1/auth/login", json={
            "email": "elder@cognivive.com",
            "password": "password123"
        })
        assert res.status_code == 200, f"Login failed: {res.text}"
        data = res.json()
        elder_token = data.get('token')
        elder_id = data.get('user', {}).get('id')
        print(f"  -> Logged in as Elder: {data.get('user', {}).get('full_name')} (ID: {elder_id})")
        print(f"  -> JWT Token received: {elder_token[:20]}...")
    except Exception as e:
        print(f"  FAILED Elder Login: {e}")
        return False

    headers_elder = {"Authorization": f"Bearer {elder_token}"}

    # 4. Test Caregiver Login
    print("\n[Step 4] Testing Caregiver Authentication...")
    caregiver_token = None
    try:
        res = requests.post(f"{BACKEND_URL}/api/v1/auth/login", json={
            "email": "caregiver@cognivive.com",
            "password": "password123"
        })
        assert res.status_code == 200, f"Caregiver login failed: {res.text}"
        data = res.json()
        caregiver_token = data.get('token')
        print(f"  -> Logged in as Caregiver: {data.get('user', {}).get('full_name')}")
    except Exception as e:
        print(f"  FAILED Caregiver Login: {e}")
        return False

    headers_caregiver = {"Authorization": f"Bearer {caregiver_token}"}

    # 5. Test Games Catalog
    print("\n[Step 5] Fetching Cognitive Games Catalog from PostgreSQL...")
    try:
        res = requests.get(f"{BACKEND_URL}/api/v1/games", headers=headers_elder)
        assert res.status_code == 200
        games = res.json().get('games', [])
        print(f"  -> Found {len(games)} games in catalog:")
        for g in games:
            print(f"     * [{g['id']}] {g['title']} (Domain: {g['primary_domain']}, Max Level: {g['max_difficulty']})")
    except Exception as e:
        print(f"  FAILED Games catalog: {e}")
        return False

    # 6. Test Real Game Session Telemetry -> DDA -> Cognitive Profile Update
    print("\n[Step 6] Submitting Real Gameplay Telemetry to Backend -> PostgreSQL -> Python AI Service...")
    sample_telemetry = {
        "gameId": "memory_blossom",
        "difficultyLevel": 2,
        "durationSeconds": 130,
        "score": 310,
        "accuracyPercentage": 95.0,
        "averageReactionTimeMs": 1050,
        "mistakesCount": 0,
        "consecutiveCorrect": 5,
        "trials": [
            {"trial_index": 1, "correct": True, "reaction_time_ms": 1020},
            {"trial_index": 2, "correct": True, "reaction_time_ms": 1060},
            {"trial_index": 3, "correct": True, "reaction_time_ms": 1040},
            {"trial_index": 4, "correct": True, "reaction_time_ms": 1080},
        ],
        "telemetryPayload": {"tap_sequence": [1, 3, 2, 4]}
    }
    try:
        res = requests.post(f"{BACKEND_URL}/api/v1/games/session", headers=headers_elder, json=sample_telemetry)
        assert res.status_code == 201, f"Record session failed: {res.text}"
        data = res.json()
        print(f"  -> Telemetry Persisted with Session ID: {data.get('session', {}).get('id')}")
        print(f"  -> Real AI Consistency Index: {data.get('consistencyIndex')}%")
        print(f"  -> AI DDA Adjustment: {data.get('dda', {}).get('adjustment')} | Next Level: {data.get('dda', {}).get('next_difficulty')}")
        print(f"  -> AI Rationale: \"{data.get('dda', {}).get('rationale')}\"")
        print(f"  -> Updated Working Memory Score: {data.get('updatedDomains', {}).get('working_memory_score')}/100")
        print(f"  -> Overall Cognitive Activity Score: {data.get('updatedDomains', {}).get('overall_performance_score')}/100")
    except Exception as e:
        print(f"  FAILED Game Session Telemetry pipeline: {e}")
        return False

    # 7. Test Cognitive Profile Retrieval
    print("\n[Step 7] Retrieving 5-Domain Cognitive Activity Profile...")
    try:
        res = requests.get(f"{BACKEND_URL}/api/v1/profile/cognitive", headers=headers_elder)
        assert res.status_code == 200
        p = res.json().get('profile', {})
        print(f"  -> Overall Score: {p.get('overall_performance_score')}")
        print(f"  -> Working Memory: {p.get('working_memory_score')}")
        print(f"  -> Processing Speed: {p.get('processing_speed_score')}")
        print(f"  -> Attention: {p.get('attention_score')}")
        print(f"  -> Reminiscence: {p.get('reminiscence_score')}")
        print(f"  -> Consistency Index: {p.get('consistency_index')}")
        print(f"  -> Performance Change Flag: {p.get('performance_change_flag')}")
    except Exception as e:
        print(f"  FAILED Profile retrieval: {e}")
        return False

    # 8. Test AI Daily Recommendations
    print("\n[Step 8] Generating AI Daily Personalized Activity Recommendations...")
    try:
        res = requests.get(f"{BACKEND_URL}/api/v1/profile/recommendations", headers=headers_elder)
        assert res.status_code == 200
        recs = res.json().get('recommendations', {})
        primary = recs.get('primary_recommendation', {})
        print(f"  -> Primary Recommended Game: {primary.get('title')} (Level {primary.get('suggested_difficulty')})")
        print(f"  -> Rationale: \"{primary.get('rationale')}\"")
    except Exception as e:
        print(f"  FAILED Recommendations: {e}")
        return False

    # 9. Test Reminders & Voice Confirmation
    print("\n[Step 9] Testing Reminders & Voice Interaction Flow...")
    try:
        res = requests.get(f"{BACKEND_URL}/api/v1/reminders/today", headers=headers_elder)
        assert res.status_code == 200
        reminders = res.json().get('reminders', [])
        print(f"  -> Today's Reminders ({len(reminders)} total):")
        target_reminder = None
        for r in reminders:
            print(f"     * [{r['today_status']}] {r['title']} at {r['scheduled_time']}")
            if r['today_status'] == 'PENDING' and target_reminder is None:
                target_reminder = r

        if target_reminder:
            print(f"  -> Acknowledging '{target_reminder['title']}' via Voice Command...")
            ack_res = requests.post(
                f"{BACKEND_URL}/api/v1/reminders/{target_reminder['id']}/acknowledge",
                headers=headers_elder,
                json={"voiceConfirmed": True, "notes": "Voice response: 'Maine pani pee liya'"}
            )
            assert ack_res.status_code == 200
            print(f"  -> Voice Acknowledgement Confirmed! Status: {ack_res.json().get('log', {}).get('status')}")
    except Exception as e:
        print(f"  FAILED Reminders & Voice test: {e}")
        return False

    # 10. Test Caregiver Dashboard & Patient Monitoring
    print("\n[Step 10] Testing Caregiver Dashboard & Longitudinal Patient Overview...")
    try:
        res = requests.get(f"{BACKEND_URL}/api/v1/caregiver/patients", headers=headers_caregiver)
        assert res.status_code == 200
        patients = res.json().get('patients', [])
        print(f"  -> Caregiver has {len(patients)} linked elderly patient(s):")
        for pt in patients:
            print(f"     * {pt['full_name']} | Activity Status: [{pt['activity_status']}] | Overall Score: {pt['overall_performance_score']}")
            print(f"       Relationship: {pt['relationship']} | Baseline Index: {pt['baseline_activity_index']}")

        # Fetch detail for first patient
        if patients:
            pid = patients[0]['patient_id']
            det_res = requests.get(f"{BACKEND_URL}/api/v1/caregiver/patients/{pid}", headers=headers_caregiver)
            assert det_res.status_code == 200
            det = det_res.json()
            print(f"  -> Successfully loaded Patient Detail: {len(det.get('recentSessions', []))} recorded game sessions for longitudinal trend analysis")
    except Exception as e:
        print(f"  FAILED Caregiver Dashboard: {e}")
        return False

    # 11. Test Caregiver Alert System
    print("\n[Step 11] Checking Caregiver Urgent Alerts...")
    try:
        res = requests.get(f"{BACKEND_URL}/api/v1/caregiver/alerts", headers=headers_caregiver)
        assert res.status_code == 200
        alerts = res.json()
        print(f"  -> Overdue Med Alerts: {len(alerts.get('overdueMedicationAlerts', []))}")
        print(f"  -> Performance Change Alerts: {len(alerts.get('performanceChangeAlerts', []))}")
    except Exception as e:
        print(f"  FAILED Caregiver Alerts: {e}")
        return False

    # 12. Test Voice Intent Parsing Proxy
    print("\n[Step 12] Testing Voice Parsing via Backend AI Proxy...")
    try:
        v_res = requests.post(f"{BACKEND_URL}/api/v1/ai/voice-parse", headers=headers_elder, json={
            "text": "Start Memory Blossom game please"
        })
        assert v_res.status_code == 200
        intent_data = v_res.json().get('parsed', {})
        print(f"  -> Parsed Voice Query: '{intent_data.get('raw_query')}' -> Intent: {intent_data.get('intent')} (Confidence: {intent_data.get('confidence')})")
    except Exception as e:
        print(f"  FAILED Voice Proxy: {e}")
        return False

    print("\n" + "=" * 70)
    print("ALL 12 END-TO-END INTEGRATION TESTS PASSED SUCCESSFULLY!")
    print("PostgreSQL <--> Node.js Express <--> Python FastAPI AI Service")
    print("=" * 70)
    return True

if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
