export interface Vulnerability {
  id: string;
  title: string;
  severity: string;
  cvss_score: number;
  exploit_status: string;
  description: string;
}

export interface Service {
  name: string;
  environment: string;
  internet_exposed: boolean;
}

export interface Asset {
  name: string;
  criticality: string;
  business_function: string;
}

export interface Owner {
  name: string;
  team: string;
  email: string;
}

export interface Finding {
  id: string;
  status: string;
  created_at: string;
  risk_score: number;
  contextual_risk: number;
  vulnerability: Vulnerability;
  affected_package: string;
  affected_service_count: number;
  exposed_to_internet: boolean;
  critical_asset_impacted: boolean;
}

export interface PathNode {
  id: string;
  label: string;
  name: string;
  properties: Record<string, any>;
}

export interface PathEdge {
  source: string;
  target: string;
  type: string;
}

export interface DiscoveredPath {
  path_id: string;
  length: number;
  nodes: PathNode[];
  edges: PathEdge[];
  reachable_service: string;
  internet_exposed: boolean;
  affected_asset: string;
  asset_criticality: string;
  responsible_owners: string[];
}

export interface RiskFactorBreakdown {
  cvss_contribution: number;
  exploit_contribution: number;
  internet_exposure_contribution: number;
  asset_criticality_contribution: number;
  reachability_contribution: number;
  total_score: number;
  formula_explanation: string;
  heuristic_warning: string;
}

export interface InvestigationResult {
  investigation_id: string;
  finding_id: string;
  title: string;
  summary: string;
  contextual_risk: number;
  risk_breakdown: RiskFactorBreakdown;
  paths: DiscoveredPath[];
  affected_services: Service[];
  affected_assets: Asset[];
  responsible_owners: Owner[];
  recommended_actions: string[];
  limitations: string[];
  timestamp: string;
  investigation_mode: string;
}

export interface RemediationTask {
  id: string;
  title: string;
  priority: string;
  status: string;
  created_at: string;
  finding_id: string;
  assigned_to?: string;
  assigned_team?: string;
}

export interface DashboardMetrics {
  total_findings: number;
  critical_findings: number;
  high_findings: number;
  medium_findings: number;
  low_findings: number;
  affected_services_count: number;
  critical_assets_count: number;
  open_remediation_tasks: number;
  total_remediations: number;
  recent_investigations_count: number;
}
