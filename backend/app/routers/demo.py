from fastapi import APIRouter
from app.models.schemas import ServiceExposureToggle, Service
from app.services.falkordb_service import graph_service

router = APIRouter(prefix="/api/demo", tags=["Demo Controls"])

@router.post("/seed")
def seed_demo_data():
    """Idempotently seed or restore the synthetic demonstration dataset."""
    graph_service.seed_graph()
    return {"status": "success", "message": "FalkorDB synthetic dataset seeded successfully."}

@router.post("/toggle-exposure", response_model=Service)
def toggle_service_exposure(payload: ServiceExposureToggle):
    """
    Core demonstration mutation:
    Changes service internet exposure in FalkorDB graph to show real-time contextual risk recalculation.
    """
    updated_service = graph_service.toggle_service_exposure(
        payload.service_name,
        payload.internet_exposed
    )
    return updated_service

@router.get("/scenarios")
def get_demo_scenarios():
    return [
        {
            "id": "scenario-1",
            "name": "Hidden Multi-Hop Blast Radius (The Core Thesis)",
            "finding_id": "FIND-2026-001",
            "cve": "CVE-2025-4127",
            "headline": "Moderate CVSS (7.5) escalates to Critical Contextual Risk (94.5/100)",
            "reason": (
                "Vulnerable package 'auth-token-validator' is 2 hops deep in transitive dependencies "
                "installed inside 'payment-gateway-api' which is internet-exposed and directly exposes "
                "the Tier-1 'Customer Payment Vault & PCI Cardholder Data'."
            ),
            "demo_action": "Toggle internet exposure on 'payment-gateway-api' to watch risk drop from 94.5 to 74.5 live!"
        },
        {
            "id": "scenario-2",
            "name": "High CVSS in Isolated Perimeter (Noise Filtering)",
            "finding_id": "FIND-2026-002",
            "cve": "CVE-2025-9921",
            "headline": "Critical CVSS (9.8) de-escalates to Low-Moderate Contextual Risk (58.4/100)",
            "reason": (
                "Despite critical CVSS 9.8 SQL injection, package 'debug-sql-inspector' is only installed in "
                "an internal staging analytics batch job exposing Tier-4 archived CI logs with zero internet exposure."
            ),
            "demo_action": "Shows how graph reasoning avoids wasting P0 engineering cycles on isolated low-impact vulnerabilities."
        }
    ]
