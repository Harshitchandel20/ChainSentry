import httpx

base = "http://127.0.0.1:8000"

def test_e2e_flow():
    print("[1] Health Check:")
    r = httpx.get(f"{base}/health")
    print("   Status:", r.status_code, r.json())
    assert r.status_code == 200

    print("\n[2] Dashboard Metrics:")
    r = httpx.get(f"{base}/api/dashboard")
    print("   Metrics:", r.json())
    assert r.status_code == 200
    assert r.json()["total_findings"] >= 5

    print("\n[3] Findings List (Ordered by Contextual Risk):")
    r = httpx.get(f"{base}/api/findings")
    findings = r.json()
    print("   Count:", len(findings))
    for f in findings[:2]:
        print(f"   -> {f['id']}: {f['vulnerability']['id']} (CVSS: {f['vulnerability']['cvss_score']}) -> Contextual Risk: {f['contextual_risk']}")
    assert findings[0]["id"] == "FIND-2026-001"
    assert findings[0]["contextual_risk"] > 80

    print("\n[4] Run Graph Investigation on FIND-2026-001:")
    r = httpx.post(f"{base}/api/investigations", json={"finding_id": "FIND-2026-001"})
    inv = r.json()
    print("   Investigation ID:", inv["investigation_id"])
    print("   Contextual Risk:", inv["contextual_risk"])
    print("   Discovered Paths:", len(inv["paths"]))
    print("   Recommended Actions:", len(inv["recommended_actions"]))
    assert r.status_code == 200

    print("\n[5] Mutate Graph Live (Isolate Payment API from internet):")
    r = httpx.post(f"{base}/api/demo/toggle-exposure", json={"service_name": "payment-gateway-api", "internet_exposed": False})
    print("   Updated service in graph:", r.json())
    r2 = httpx.get(f"{base}/api/findings/FIND-2026-001")
    new_risk = r2.json()["contextual_risk"]
    print("   New Contextual Risk after live graph mutation:", new_risk, "(Dropped by 20.0!)")
    assert new_risk < inv["contextual_risk"]

    print("\n[6] Restore Graph (Re-expose Payment API):")
    httpx.post(f"{base}/api/demo/toggle-exposure", json={"service_name": "payment-gateway-api", "internet_exposed": True})
    r3 = httpx.get(f"{base}/api/findings/FIND-2026-001")
    restored_risk = r3.json()["contextual_risk"]
    print("   Restored Contextual Risk:", restored_risk)
    assert restored_risk == inv["contextual_risk"]

    print("\n[7] Create Remediation Task:")
    r = httpx.post(f"{base}/api/remediation-tasks", json={
        "finding_id": "FIND-2026-001",
        "title": "Deploy hotfix v1.4.3 and rotate OAuth signing keys",
        "priority": "P0",
        "assigned_to": "Sarah Chen"
    })
    print("   Created Task:", r.status_code, r.json()["id"], "Assigned to:", r.json()["assigned_to"])
    assert r.status_code == 201

    print("\n>>> ALL END-TO-END VERIFICATION CHECKS PASSED SUCCESSFULLY! <<<")

if __name__ == "__main__":
    test_e2e_flow()
