from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from app.models.schemas import Finding
from app.services.falkordb_service import graph_service

router = APIRouter(prefix="/api/findings", tags=["Findings"])

@router.get("", response_model=List[Finding])
def list_findings(
    status: Optional[str] = Query(None, description="Filter by status (OPEN, IN_REVIEW, RESOLVED)"),
    severity: Optional[str] = Query(None, description="Filter by vulnerability severity (CRITICAL, HIGH, MEDIUM, LOW)"),
    search: Optional[str] = Query(None, description="Search by ID, CVE, title, or package"),
    sort_by: Optional[str] = Query("contextual_risk", description="Sort by contextual_risk or cvss_score"),
    order: Optional[str] = Query("desc", description="Sort order asc or desc")
):
    findings = graph_service.get_findings()

    # Filtering
    if status:
        findings = [f for f in findings if f.status.upper() == status.upper()]
    if severity:
        findings = [f for f in findings if f.vulnerability.severity.upper() == severity.upper()]
    if search:
        s = search.lower()
        findings = [
            f for f in findings
            if s in f.id.lower()
            or s in f.vulnerability.id.lower()
            or s in f.vulnerability.title.lower()
            or s in f.affected_package.lower()
        ]

    # Sorting
    reverse = (order.lower() == "desc")
    if sort_by == "cvss_score":
        findings.sort(key=lambda x: x.vulnerability.cvss_score, reverse=reverse)
    else:
        findings.sort(key=lambda x: x.contextual_risk, reverse=reverse)

    return findings

@router.get("/{finding_id}", response_model=Finding)
def get_finding(finding_id: str):
    finding = graph_service.get_finding(finding_id)
    if not finding:
        raise HTTPException(status_code=404, detail=f"Finding '{finding_id}' not found.")
    return finding
