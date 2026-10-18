from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class Vulnerability(BaseModel):
    id: str
    title: str
    severity: str  # CRITICAL, HIGH, MEDIUM, LOW
    cvss_score: float
    exploit_status: str  # ACTIVE_EXPLOIT_PROOF, POC_AVAILABLE, NONE
    description: str

class Package(BaseModel):
    name: str
    version: str
    ecosystem: str

class Service(BaseModel):
    name: str
    environment: str
    internet_exposed: bool

class Asset(BaseModel):
    name: str
    criticality: str  # TIER_1_MISSION_CRITICAL, TIER_2_HIGH, TIER_3_MEDIUM, TIER_4_LOW
    business_function: str

class Owner(BaseModel):
    name: str
    team: str
    email: str

class Finding(BaseModel):
    id: str
    status: str  # OPEN, IN_REVIEW, REMEDIATING, RESOLVED
    created_at: str
    risk_score: float  # Base CVSS or preliminary score
    contextual_risk: float = 0.0  # Graph-traversed contextual score
    vulnerability: Vulnerability
    affected_package: str
    affected_service_count: int = 0
    exposed_to_internet: bool = False
    critical_asset_impacted: bool = False

class PathNode(BaseModel):
    id: str
    label: str  # Finding, Vulnerability, Package, Service, Asset, Owner
    name: str
    properties: Dict[str, Any] = Field(default_factory=dict)

class PathEdge(BaseModel):
    source: str
    target: str
    type: str  # ABOUT, AFFECTS, DEPENDS_ON, INSTALLED_IN, EXPOSES, OWNS, ADDRESSES, ASSIGNED_TO

class DiscoveredPath(BaseModel):
    path_id: str
    length: int
    nodes: List[PathNode]
    edges: List[PathEdge]
    reachable_service: str
    internet_exposed: bool
    affected_asset: str
    asset_criticality: str
    responsible_owners: List[str]

class RiskFactorBreakdown(BaseModel):
    cvss_contribution: float
    exploit_contribution: float
    internet_exposure_contribution: float
    asset_criticality_contribution: float
    reachability_contribution: float
    total_score: float
    formula_explanation: str
    heuristic_warning: str

class InvestigationResult(BaseModel):
    investigation_id: str
    finding_id: str
    title: str
    contextual_risk: float
    risk_breakdown: RiskFactorBreakdown
    paths: List[DiscoveredPath]
    affected_services: List[Service]
    affected_assets: List[Asset]
    responsible_owners: List[Owner]
    recommended_actions: List[str]
    limitations: List[str]
    timestamp: str
    investigation_mode: str  # "deterministic_graph_reasoning" or "llm_grounded_synthesis"

class RemediationTask(BaseModel):
    id: str
    title: str
    priority: str  # P0, P1, P2, P3
    status: str  # OPEN, IN_PROGRESS, RESOLVED, VERIFIED
    created_at: str
    finding_id: str
    assigned_to: Optional[str] = None
    assigned_team: Optional[str] = None

class RemediationTaskCreate(BaseModel):
    finding_id: str
    title: str
    priority: str = "P1"
    assigned_to: str

class RemediationTaskUpdate(BaseModel):
    status: Optional[str] = None
    priority: Optional[str] = None
    assigned_to: Optional[str] = None

class DashboardMetrics(BaseModel):
    total_findings: int
    critical_findings: int
    high_findings: int
    medium_findings: int
    low_findings: int
    affected_services_count: int
    critical_assets_count: int
    open_remediation_tasks: int
    total_remediations: int
    recent_investigations_count: int

class ServiceExposureToggle(BaseModel):
    service_name: str
    internet_exposed: bool
