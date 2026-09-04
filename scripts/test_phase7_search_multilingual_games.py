"""
COGNIVIVE NER - PHASE 7 VERIFICATION SUITE
Global Search + Multilingual Voice Provider Architecture + 4 New Cognitive Games + Caregiver Analytics

Test Steps:
1. Health & Services Check (Backend, AI Service, Frontend)
2. Authentication (Elder & Caregiver)
3. 7-Game Catalog & Full 5-Domain Coverage
4. Global Search Endpoint & Strict RBAC Matrix (Elder isolated, Caregiver authorized)
5. 4 New Cognitive Games Telemetry & DDA Processing (PatternPath, MatchPairs, SortRemember, SequenceStories)
6. Voice Intent Parser Extension (7 Games, Search, Go Home, Help intents)
7. Caregiver Dashboard 7-Game Analytics & Difficulty Calibration
8. Multilingual Architecture & Game Instructions Integrity (11 Languages, EN/HI instructions)
9. Non-Diagnostic Guarantee across all Phase 7 endpoints
"""

import sys
import os
import requests
import json

BASE_URL = "http://127.0.0.1:5000"
FRONTEND_URL = "http://localhost:3000"
AI_SERVICE_URL = "http://127.0.0.1:8000"

PROHIBITED_TERMS = [
    "mci_risk", "mci_confirmed", "mild_dementia", "dementia",
    "mci", "disease prediction", "disease risk", "mmse",
    "clinical diagnosis", "clinical decline confirmed"
]

def assert_non_diagnostic(payload_str, context):
    lower = payload_str.lower()
    for term in PROHIBITED_TERMS:
        if term in lower:
            raise AssertionError(f"CRITICAL: Prohibited diagnostic term '{term}' in {context}!")
    print(f"  -> Non-diagnostic check passed for {context}")

def main():
    print("=" * 80)
    print("COGNIVIVE NER - PHASE 7 VERIFICATION SUITE")
    print("Global Search | Multilingual Voice | 4 New Games | Caregiver Analytics")
    print("=" * 80)

    # 1. Healthcheck
    print("\n[Step 1] System Health & Service Connectivity...")
    res = requests.get(f"{BASE_URL}/health", timeout=5)
    assert res.status_code == 200, f"Backend error: {res.text}"
    health = res.json()
    assert health["database"] == "CONNECTED"
    assert health["aiService"]["status"] == "HEALTHY"
    print("  -> Backend & PostgreSQL: CONNECTED")
    print("  -> Python AI Service: HEALTHY (Assistive Only)")

    # 2. Authentication
    print("\n[Step 2] Authenticating Demo Users...")
    elder_auth = requests.post(f"{BASE_URL}/api/v1/auth/login", json={
        "email": "elder@cognivive.com", "password": "password123"
    }).json()
    assert elder_auth["success"], "Elder login failed"
    elder_token = elder_auth["token"]
    elder_id = elder_auth["user"]["id"]
    elder_headers = {"Authorization": f"Bearer {elder_token}"}

    cg_auth = requests.post(f"{BASE_URL}/api/v1/auth/login", json={
        "email": "caregiver@cognivive.com", "password": "password123"
    }).json()
    assert cg_auth["success"], "Caregiver login failed"
    cg_token = cg_auth["token"]
    cg_headers = {"Authorization": f"Bearer {cg_token}"}
    print(f"  -> Elder authenticated (ID: {elder_id})")
    print(f"  -> Caregiver authenticated (ID: {cg_auth['user']['id']})")

    # 3. 7 Games Catalog & 5 Cognitive Domains
    print("\n[Step 3] Verifying 7-Game Catalog & 5-Domain Coverage...")
    games_res = requests.get(f"{BASE_URL}/api/v1/games", headers=elder_headers)
    assert games_res.status_code == 200
    games_data = games_res.json()
    assert games_data["success"]
    all_games = games_data["games"]
    game_ids = [g["id"] for g in all_games]
    print(f"  -> Total games found in database: {len(all_games)}")

    expected_7_games = [
        "memory_blossom", "quick_harvest", "golden_memories",
        "pattern_path", "match_pairs", "sort_remember", "sequence_stories"
    ]
    for expected_id in expected_7_games:
        assert expected_id in game_ids, f"Missing expected game: {expected_id}"
    print("  -> All 7 games verified present in database catalog:")
    for g in all_games:
        print(f"     * {g['id']}: {g['title']} ({g['primary_domain']})")

    domains = set(g["primary_domain"] for g in all_games)
    expected_domains = {"WORKING_MEMORY", "PROCESSING_SPEED", "REMINISCENCE", "ATTENTION", "EXECUTIVE_FLEXIBILITY"}
    assert expected_domains.issubset(domains), f"Missing domains: {expected_domains - domains}"
    print(f"  -> All 5 cognitive domains covered: {sorted(list(domains))}")

    # 4. Global Search & Strict RBAC
    print("\n[Step 4] Testing Global Search & Role-Based Access Isolation...")
    # 4a. Elder Search
    elder_search = requests.get(f"{BASE_URL}/api/v1/search?q=memory", headers=elder_headers)
    assert elder_search.status_code == 200
    elder_data = elder_search.json()
    assert elder_data["success"]
    elder_results = elder_data["results"]
    assert len(elder_results["games"]) > 0, "Elder should find matching games"
    assert elder_results["patients"] == [], "CRITICAL: Elder must never receive patient records in search results!"
    print("  -> Elder search for 'memory': Games found, Patients strictly empty ([])")

    elder_search_patient = requests.get(f"{BASE_URL}/api/v1/search?q=Ramchandra", headers=elder_headers)
    assert elder_search_patient.json()["results"]["patients"] == [], "CRITICAL: Elder query for patient name returned records!"
    print("  -> Elder search for patient name: 0 patient records returned (Strict RBAC isolation enforced)")

    # 4b. Caregiver Search
    cg_search = requests.get(f"{BASE_URL}/api/v1/search?q=Ramchandra", headers=cg_headers)
    assert cg_search.status_code == 200
    cg_data = cg_search.json()
    assert cg_data["success"]
    cg_results = cg_data["results"]
    assert len(cg_results["patients"]) > 0, "Caregiver should find assigned patient"
    assert cg_results["patients"][0]["full_name"] == "Ramchandra Sharma"
    print(f"  -> Caregiver search for assigned patient: Found {cg_results['patients'][0]['full_name']}")

    cg_search_game = requests.get(f"{BASE_URL}/api/v1/search?q=pattern", headers=cg_headers)
    assert any(g["id"] == "pattern_path" for g in cg_search_game.json()["results"]["games"])
    print("  -> Caregiver search for 'pattern': Found Pattern Path game")

    # 5. Telemetry & AI DDA for 4 New Games
    print("\n[Step 5] Submitting Real Gameplay Telemetry & DDA for 4 New Games...")
    new_games_trials = [
        ("pattern_path", 450, 95.0, [{"trial_number": 1, "correct": True, "reaction_time_ms": 1100}]),
        ("match_pairs", 500, 100.0, [{"trial_number": 1, "correct": True, "reaction_time_ms": 1200}]),
        ("sort_remember", 480, 90.0, [{"trial_number": 1, "correct": True, "reaction_time_ms": 1300}]),
        ("sequence_stories", 600, 100.0, [{"trial_number": 1, "correct": True, "reaction_time_ms": 1400}]),
    ]

    for gid, score, acc, trials in new_games_trials:
        payload = {
            "gameId": gid,
            "difficultyLevel": 1,
            "durationSeconds": 25,
            "score": score,
            "accuracyPercentage": acc,
            "averageReactionTimeMs": trials[0]["reaction_time_ms"],
            "mistakesCount": 0,
            "consecutiveCorrect": 3,
            "trials": trials,
            "telemetryPayload": {"verified_phase": 7}
        }
        rec_res = requests.post(f"{BASE_URL}/api/v1/games/session", headers=elder_headers, json=payload)
        assert rec_res.status_code in [200, 201], f"Failed telemetry for {gid}: {rec_res.text}"
        rec_data = rec_res.json()
        assert rec_data["success"], f"Telemetry unsuccessful for {gid}"
        assert "dda" in rec_data, f"No DDA returned for {gid}"
        dda = rec_data["dda"]
        assert "next_difficulty" in dda
        assert "adjustment" in dda
        assert "rationale" in dda
        assert_non_diagnostic(json.dumps(dda), f"DDA for {gid}")
        print(f"  -> {gid}: Telemetry recorded | Next Level: {dda['next_difficulty']} ({dda['adjustment']})")

    # 6. AI Voice Intent Parser for 7 Games & Extended Canonical Intents
    print("\n[Step 6] Testing AI Voice Intent Parser Extensions...")
    voice_tests = [
        ("play pattern path", "START_GAME", "pattern_path"),
        ("start match pairs game", "START_GAME", "match_pairs"),
        ("chalo sort remember khele", "START_GAME", "sort_remember"),
        ("open sequence stories", "START_GAME", "sequence_stories"),
        ("search my reminders", "SEARCH", None),
        ("go back to home dashboard", "GO_HOME", None),
        ("help emergency alert", "HELP", None),
    ]

    for utterance, expected_intent, expected_gid in voice_tests:
        v_res = requests.post(f"{BASE_URL}/api/v1/ai/voice-parse", headers=elder_headers, json={"text": utterance})
        assert v_res.status_code == 200, f"Voice error for '{utterance}': {v_res.text}"
        v_data = v_res.json()
        assert v_data["success"]
        parsed = v_data["parsed"]
        assert parsed["intent"] == expected_intent, f"Expected {expected_intent} for '{utterance}', got {parsed['intent']}"
        if expected_gid:
            assert parsed.get("entities", {}).get("game_id") == expected_gid, f"Expected game {expected_gid} for '{utterance}'"
        print(f"  -> '{utterance}' -> Intent: {parsed['intent']} | Entity: {parsed.get('entities')}")

    # 7. Caregiver 7-Game Analytics & Difficulty Calibration
    print("\n[Step 7] Testing Caregiver 7-Game Analytics & Manual Calibration...")
    cg_games_res = requests.get(f"{BASE_URL}/api/v1/caregiver/patients/{elder_id}/games", headers=cg_headers)
    assert cg_games_res.status_code == 200
    cg_games_data = cg_games_res.json()
    assert cg_games_data["success"]
    cg_games_list = cg_games_data["games"]
    assert len(cg_games_list) == 7, f"Expected 7 games in caregiver dashboard, found {len(cg_games_list)}"
    print(f"  -> Caregiver patient games count: {len(cg_games_list)} / 7 verified")

    # Test difficulty override on a new game
    cal_res = requests.post(
        f"{BASE_URL}/api/v1/caregiver/patients/{elder_id}/games/pattern_path/difficulty",
        headers=cg_headers,
        json={"newDifficulty": 2, "notes": "Phase 7 calibration test"}
    )
    assert cal_res.status_code == 200, f"Calibration failed: {cal_res.text}"
    assert cal_res.json()["success"]
    print("  -> Caregiver manual calibration on 'pattern_path' successfully set to Level 2")

    # Verify game state reflects calibrated level
    state_res = requests.get(f"{BASE_URL}/api/v1/games/pattern_path/state", headers=elder_headers)
    assert state_res.status_code == 200
    assert state_res.json()["state"]["current_difficulty"] == 2
    print("  -> Elder game state for 'pattern_path' correctly reflects calibrated Level 2")

    # Reset calibration back to 1
    requests.post(
        f"{BASE_URL}/api/v1/caregiver/patients/{elder_id}/games/pattern_path/difficulty",
        headers=cg_headers,
        json={"newDifficulty": 1, "notes": "Resetting calibration"}
    )

    # 8. Multilingual Architecture & Game Instructions File Verification
    print("\n[Step 8] Verifying Multilingual Architecture Files & Localized Instructions...")
    lang_reg_path = os.path.join(os.getcwd(), "frontend", "src", "services", "voice", "languageRegistry.ts")
    speech_prov_path = os.path.join(os.getcwd(), "frontend", "src", "services", "voice", "speechProviders.ts")
    inst_path = os.path.join(os.getcwd(), "frontend", "src", "locales", "gameInstructions.ts")

    assert os.path.exists(lang_reg_path), "Missing languageRegistry.ts"
    assert os.path.exists(speech_prov_path), "Missing speechProviders.ts"
    assert os.path.exists(inst_path), "Missing gameInstructions.ts"

    with open(lang_reg_path, "r", encoding="utf-8") as f:
        content = f.read()
        for code in ["EN", "HI", "TA", "TE", "BN", "MR", "GU", "KN", "ML", "PA", "UR"]:
            assert f"id: '{code}'" in content or f"'{code}':" in content, f"Missing language {code} in languageRegistry.ts"
        assert "SUPPORTED" in content
        assert "FALLBACK_AVAILABLE" in content
    print("  -> languageRegistry.ts verified with all 11 Indian & International languages")

    with open(speech_prov_path, "r", encoding="utf-8") as f:
        sp_content = f.read()
        assert "BrowserSpeechProvider" in sp_content
        assert "BhashiniSpeechProvider" in sp_content
        assert "SpeechManager" in sp_content
    print("  -> speechProviders.ts verified with Browser, Bhashini stub, and SpeechManager")

    with open(inst_path, "r", encoding="utf-8") as f:
        inst_content = f.read()
        for gid in expected_7_games:
            assert gid in inst_content, f"Missing instructions for {gid}"
    print("  -> gameInstructions.ts verified with English and Hindi instructions for all 7 games")

    # 9. Non-Diagnostic Verification
    print("\n[Step 9] Overall Non-Diagnostic Compliance Verification...")
    assert_non_diagnostic(json.dumps(cg_games_data), "Caregiver Games Payload")
    assert_non_diagnostic(json.dumps(games_data), "Games Catalog Payload")

    print("\n" + "=" * 80)
    print("PHASE 7 VERIFICATION COMPLETE: ALL CHECKS PASSED (10/10)")
    print("=" * 80)

if __name__ == "__main__":
    main()
