import sys
import os
import requests
import json

BACKEND_URL = "http://localhost:5000/api/v1"
FRONTEND_URL = "http://localhost:3000"

def run_phase2_tests():
    print("=" * 75)
    print("COGNIVIVE NER - PHASE 2 FRONTEND & AUTHENTICATION VERIFICATION SUITE")
    print("=" * 75)

    # 1. Test Frontend Server Availability
    print("\n[Step 1] Verifying Frontend Server on Port 3000...")
    try:
        f_res = requests.get(FRONTEND_URL, timeout=5)
        assert f_res.status_code == 200, f"Frontend returned HTTP {f_res.status_code}"
        assert "Cognivive NER" in f_res.text or "<div id=\"root\">" in f_res.text, "Index HTML not rendered properly"
        print(f"  -> Frontend Server is LIVE at {FRONTEND_URL} (HTTP 200)")
    except Exception as e:
        print(f"  FAILED to reach frontend server: {e}")
        return False

    # 2. Test Real Authentication via API
    print("\n[Step 2] Testing Real Authentication API for Elder, Caregiver & Clinician...")
    elder_token = None
    caregiver_token = None
    try:
        # Elder Login
        res_e = requests.post(f"{BACKEND_URL}/auth/login", json={
            "email": "elder@cognivive.com",
            "password": "password123"
        })
        assert res_e.status_code == 200, f"Elder login failed: {res_e.text}"
        data_e = res_e.json()
        elder_token = data_e['token']
        print(f"  -> Elder authenticated successfully: {data_e['user']['full_name']} | Role: [{data_e['user']['role']}]")
        print(f"  -> Linked profile: Baseline Index = {data_e.get('profile', {}).get('baseline_activity_index')}")

        # Caregiver Login
        res_c = requests.post(f"{BACKEND_URL}/auth/login", json={
            "email": "caregiver@cognivive.com",
            "password": "password123"
        })
        assert res_c.status_code == 200, f"Caregiver login failed: {res_c.text}"
        data_c = res_c.json()
        caregiver_token = data_c['token']
        print(f"  -> Caregiver authenticated successfully: {data_c['user']['full_name']} | Role: [{data_c['user']['role']}]")
    except Exception as e:
        print(f"  FAILED Authentication test: {e}")
        return False

    # 3. Test Protected Route Guard: Unauthenticated Access Rejection
    print("\n[Step 3] Testing Protected Route Guard (Rejection of unauthenticated requests)...")
    try:
        unauth_res = requests.get(f"{BACKEND_URL}/reminders/today")
        assert unauth_res.status_code == 401, f"Expected 401 Unauthorized, got {unauth_res.status_code}"
        print(f"  -> Correctly rejected unauthenticated request: HTTP {unauth_res.status_code} ({unauth_res.json().get('message')})")
    except Exception as e:
        print(f"  FAILED Unauthenticated guard test: {e}")
        return False

    # 4. Test Role-Based Access Control: Elder Rejection from Caregiver Endpoints
    print("\n[Step 4] Testing RBAC (Elder access to Caregiver portal blocked)...")
    try:
        rbac_res = requests.get(
            f"{BACKEND_URL}/caregiver/patients",
            headers={"Authorization": f"Bearer {elder_token}"}
        )
        assert rbac_res.status_code == 403, f"Expected 403 Forbidden for Elder on Caregiver route, got {rbac_res.status_code}"
        print(f"  -> Correctly denied Elder access to Caregiver route: HTTP {rbac_res.status_code} ({rbac_res.json().get('message')})")

        # Caregiver access succeeds
        rbac_c_res = requests.get(
            f"{BACKEND_URL}/caregiver/patients",
            headers={"Authorization": f"Bearer {caregiver_token}"}
        )
        assert rbac_c_res.status_code == 200, f"Caregiver route failed for Caregiver token: {rbac_c_res.status_code}"
        print(f"  -> Caregiver authorized successfully on Caregiver route: HTTP {rbac_c_res.status_code}")
    except Exception as e:
        print(f"  FAILED RBAC test: {e}")
        return False

    # 5. Test Elder Home Data Retrieval: Reminders from PostgreSQL
    print("\n[Step 5] Verifying Elder Home Today's Reminders from PostgreSQL...")
    try:
        rem_res = requests.get(
            f"{BACKEND_URL}/reminders/today",
            headers={"Authorization": f"Bearer {elder_token}"}
        )
        assert rem_res.status_code == 200
        rems = rem_res.json().get('reminders', [])
        assert len(rems) > 0, "No reminders retrieved"
        print(f"  -> Retrieved {len(rems)} reminders for Elder Home:")
        for r in rems:
            print(f"     * [{r['today_status']}] {r['title']} ({r['type']}) at {r['scheduled_time']}")
    except Exception as e:
        print(f"  FAILED Reminders retrieval: {e}")
        return False

    # 6. Test Elder Home Data Retrieval: Games Catalog
    print("\n[Step 6] Verifying Elder Home Games Catalog from PostgreSQL...")
    try:
        g_res = requests.get(
            f"{BACKEND_URL}/games",
            headers={"Authorization": f"Bearer {elder_token}"}
        )
        assert g_res.status_code == 200
        games = g_res.json().get('games', [])
        assert len(games) == 3, f"Expected 3 games, got {len(games)}"
        print(f"  -> Retrieved 3 prioritized cognitive games for Elder Home:")
        for g in games:
            print(f"     * [{g['id']}] {g['title']} - Domain: {g['primary_domain']}")
    except Exception as e:
        print(f"  FAILED Games catalog retrieval: {e}")
        return False

    # 7. Test Elder Home AI Recommendations
    print("\n[Step 7] Verifying AI Personalized Activity Recommendation for Elder Home...")
    try:
        rec_res = requests.get(
            f"{BACKEND_URL}/profile/recommendations",
            headers={"Authorization": f"Bearer {elder_token}"}
        )
        assert rec_res.status_code == 200
        recs = rec_res.json().get('recommendations', {})
        primary = recs.get('primary_recommendation', {})
        assert primary.get('game_id') is not None, "Missing primary recommended game"
        print(f"  -> AI Recommended Game: {primary.get('title')} (Level {primary.get('suggested_difficulty')})")
        print(f"  -> Rationale: \"{primary.get('rationale')}\"")
        print(f"  -> Daily Schedule Suggestions: {len(recs.get('daily_schedule_suggestions', []))} items")
    except Exception as e:
        print(f"  FAILED Recommendations retrieval: {e}")
        return False

    # 8. Test Non-Diagnostic Framing Compliance
    print("\n[Step 8] Verifying Strict Non-Diagnostic Framing...")
    try:
        prof_res = requests.get(
            f"{BACKEND_URL}/profile/cognitive",
            headers={"Authorization": f"Bearer {elder_token}"}
        )
        assert prof_res.status_code == 200
        p = prof_res.json()
        profile_data = p.get('profile', {})
        patient_info = p.get('patientInfo', {})

        # Verify no diagnostic terms in response keys or values
        json_str = json.dumps(p).lower()
        assert "mci_risk" not in json_str, "Found prohibited clinical term MCI_RISK"
        assert "dementia" not in json_str, "Found prohibited clinical term DEMENTIA"
        assert "mmse" not in json_str, "Found prohibited clinical term MMSE"

        print(f"  -> Patient Status: [{patient_info.get('status')}] (Non-diagnostic)")
        print(f"  -> Baseline Activity Index: {patient_info.get('baseline_activity_index')}")
        print(f"  -> Overall Cognitive Activity Score: {profile_data.get('overall_performance_score')}")
        print(f"  -> Consistency Index: {profile_data.get('consistency_index')}%")
        print(f"  -> Non-diagnostic validation: STRICTLY COMPLIANT")
    except Exception as e:
        print(f"  FAILED Non-diagnostic compliance check: {e}")
        return False

    print("\n" + "=" * 75)
    print("ALL 8 PHASE 2 VERIFICATION TESTS PASSED SUCCESSFULLY!")
    print("React Frontend + JWT Authentication + Elder-Friendly UI + PostgreSQL APIs")
    print("=" * 75)
    return True

if __name__ == "__main__":
    success = run_phase2_tests()
    sys.exit(0 if success else 1)
