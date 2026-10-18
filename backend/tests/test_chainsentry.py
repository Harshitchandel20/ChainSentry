import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.falkordb_service import graph_service
from app.services.agent_service import agent

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_graph():
    graph_service.seed_graph()

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "ChainSentry"

def test_dashboard_metrics():
    response = client.get("/api/dashboard")
    assert response.status_code == 200
    data = response.json()
    assert data["total_findings"] >= 5
    assert data["critical_assets_count"] >= 1
    assert data["open_remediation_tasks"] >= 1

def test_list_and_sort_findings():
    response = client.get("/api/findings?sort_by=contextual_risk&order=desc")
    assert response.status_code == 200
    findings = response.json()
    assert len(findings) >= 5
    # The top finding by contextual risk should be FIND-2026-001 due to internet exposure + Tier-1 asset!
    assert findings[0]["id"] == "FIND-2026-001"
    assert findings[0]["contextual_risk"] > 80.0

def test_graph_path_traversal():
    response = client.get("/api/investigations/paths/FIND-2026-001")
    assert response.status_code == 200
    paths = response.json()
    assert len(paths) >= 1
    
    # Verify reachable service and asset
    path_0 = paths[0]
    assert path_0["reachable_service"] == "payment-gateway-api"
    assert path_0["internet_exposed"] is True
    assert "Customer Payment Vault" in path_0["affected_asset"]
    assert "Sarah Chen" in path_0["responsible_owners"]
    
    # Check node and edge structures
    labels = [n["label"] for n in path_0["nodes"]]
    assert "Finding" in labels
    assert "Vulnerability" in labels
    assert "Package" in labels
    assert "Service" in labels
    assert "Asset" in labels

def test_core_differentiator_contrast():
    """
    Core Promise Test:
    FIND-2026-001 has base CVSS 7.5 (High).
    FIND-2026-002 has base CVSS 9.8 (Critical).
    However, because FIND-2026-001 is on an internet-exposed path to a Tier-1 Asset,
    its Contextual Risk MUST be significantly higher than FIND-2026-002 (which is isolated in staging).
    """
    f1 = client.get("/api/findings/FIND-2026-001").json()
    f2 = client.get("/api/findings/FIND-2026-002").json()

    assert f1["vulnerability"]["cvss_score"] == 7.5
    assert f2["vulnerability"]["cvss_score"] == 9.8

    # Contextual risk inversion proof!
    assert f1["contextual_risk"] > f2["contextual_risk"]
    assert f1["contextual_risk"] >= 85.0
    assert f2["contextual_risk"] <= 65.0

def test_investigation_agent_execution():
    response = client.post("/api/investigations", json={"finding_id": "FIND-2026-001"})
    assert response.status_code == 200
    data = response.json()
    
    assert data["finding_id"] == "FIND-2026-001"
    assert data["contextual_risk"] >= 85.0
    assert len(data["paths"]) >= 1
    assert len(data["affected_services"]) >= 1
    assert len(data["affected_assets"]) >= 1
    assert len(data["responsible_owners"]) >= 1
    assert len(data["recommended_actions"]) >= 1
    assert len(data["limitations"]) >= 1
    assert data["investigation_mode"] == "deterministic_graph_reasoning"

    # Check that investigation was persisted to history
    history_resp = client.get("/api/investigations/history")
    assert history_resp.status_code == 200
    history = history_resp.json()
    assert len(history) >= 1
    assert history[0]["finding_id"] == "FIND-2026-001"

def test_remediation_task_lifecycle():
    # 1. Create a task assigned to graph-discovered owner
    create_payload = {
        "finding_id": "FIND-2026-001",
        "title": "Upgrade auth-token-validator to v1.4.3 and rotate service keys",
        "priority": "P0",
        "assigned_to": "Sarah Chen"
    }
    create_resp = client.post("/api/remediation-tasks", json=create_payload)
    assert create_resp.status_code == 201
    task = create_resp.json()
    task_id = task["id"]
    assert task["assigned_to"] == "Sarah Chen"
    assert task["status"] == "OPEN"

    # 2. Update task status to IN_PROGRESS
    patch_resp = client.patch(f"/api/remediation-tasks/{task_id}", json={"status": "IN_PROGRESS"})
    assert patch_resp.status_code == 200
    assert patch_resp.json()["status"] == "IN_PROGRESS"

def test_live_graph_mutation_exposure_toggle():
    """
    Mutation Test:
    Toggling internet_exposed from True to False on 'payment-gateway-api'
    must dynamically lower the contextual risk of FIND-2026-001.
    """
    f_before = client.get("/api/findings/FIND-2026-001").json()
    score_before = f_before["contextual_risk"]

    # Toggle exposure to False
    toggle_resp = client.post("/api/demo/toggle-exposure", json={
        "service_name": "payment-gateway-api",
        "internet_exposed": False
    })
    assert toggle_resp.status_code == 200
    assert toggle_resp.json()["internet_exposed"] is False

    # Check recalculated risk
    f_after = client.get("/api/findings/FIND-2026-001").json()
    score_after = f_after["contextual_risk"]

    # Risk must drop by 20 points (exposure weight: 25 vs 5)
    assert score_after < score_before
    assert round(score_before - score_after, 1) == 20.0

    # Restore exposure to True
    client.post("/api/demo/toggle-exposure", json={
        "service_name": "payment-gateway-api",
        "internet_exposed": True
    })
    f_restored = client.get("/api/findings/FIND-2026-001").json()
    assert f_restored["contextual_risk"] == score_before
