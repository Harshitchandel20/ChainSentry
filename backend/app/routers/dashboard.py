from fastapi import APIRouter
from app.models.schemas import DashboardMetrics
from app.services.falkordb_service import graph_service

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("", response_model=DashboardMetrics)
def get_dashboard_metrics():
    findings = graph_service.get_findings()
    tasks = graph_service.get_remediation_tasks()
    history = graph_service.get_investigations_history()

    crit_cnt = sum(1 for f in findings if f.contextual_risk >= 80 or f.vulnerability.severity == "CRITICAL")
    high_cnt = sum(1 for f in findings if (60 <= f.contextual_risk < 80) or f.vulnerability.severity == "HIGH")
    med_cnt = sum(1 for f in findings if (40 <= f.contextual_risk < 60) or f.vulnerability.severity == "MEDIUM")
    low_cnt = sum(1 for f in findings if f.contextual_risk < 40 or f.vulnerability.severity == "LOW")

    services_seen = set()
    critical_assets_count = 0
    assets_seen = set()

    for f in findings:
        paths = graph_service.trace_finding_paths(f.id)
        for p in paths:
            services_seen.add(p.reachable_service)
            if p.affected_asset not in assets_seen:
                assets_seen.add(p.affected_asset)
                asset_obj = graph_service.get_asset(p.affected_asset)
                if asset_obj and asset_obj.criticality == "TIER_1_MISSION_CRITICAL":
                    critical_assets_count += 1

    open_tasks = sum(1 for t in tasks if t.status in ("OPEN", "IN_PROGRESS"))

    return DashboardMetrics(
        total_findings=len(findings),
        critical_findings=crit_cnt,
        high_findings=high_cnt,
        medium_findings=med_cnt,
        low_findings=low_cnt,
        affected_services_count=len(services_seen),
        critical_assets_count=critical_assets_count,
        open_remediation_tasks=open_tasks,
        total_remediations=len(tasks),
        recent_investigations_count=len(history)
    )
