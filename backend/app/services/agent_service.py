import uuid
import datetime
from typing import List, Dict, Any, Optional
from app.models.schemas import (
    InvestigationResult, RiskFactorBreakdown, Service, Asset, Owner, DiscoveredPath
)
from app.services.falkordb_service import graph_service
from app.services.risk_engine import RiskEngine

class InvestigationAgent:
    """
    Graph-Native AI Security Investigation Agent.
    Strictly constrained to a fixed catalogue of typed, validated backend tools.
    Never invents graph facts or executes arbitrary Cypher.
    """

    # --- Tool Catalogue ---
    @staticmethod
    def tool_list_findings() -> List[Dict[str, Any]]:
        findings = graph_service.get_findings()
        return [f.model_dump() for f in findings]

    @staticmethod
    def tool_get_vulnerability_context(finding_id: str) -> Optional[Dict[str, Any]]:
        finding = graph_service.get_finding(finding_id)
        if not finding:
            return None
        return {
            "finding_id": finding.id,
            "vulnerability": finding.vulnerability.model_dump(),
            "status": finding.status,
            "affected_package": finding.affected_package
        }

    @staticmethod
    def tool_trace_dependency_paths(finding_id: str) -> List[Dict[str, Any]]:
        paths = graph_service.trace_finding_paths(finding_id)
        return [p.model_dump() for p in paths]

    @staticmethod
    def tool_find_affected_assets(finding_id: str) -> List[Dict[str, Any]]:
        paths = graph_service.trace_finding_paths(finding_id)
        asset_names = list(set(p.affected_asset for p in paths))
        assets = []
        for aname in asset_names:
            a = graph_service.get_asset(aname)
            if a:
                assets.append(a.model_dump())
        return assets

    @staticmethod
    def tool_find_responsible_owners(finding_id: str) -> List[Dict[str, Any]]:
        paths = graph_service.trace_finding_paths(finding_id)
        owner_names = set()
        for p in paths:
            owner_names.update(p.responsible_owners)
        all_owners = graph_service.get_owners()
        return [o.model_dump() for o in all_owners if o.name in owner_names]

    @staticmethod
    def tool_calculate_contextual_risk(finding_id: str) -> Optional[RiskFactorBreakdown]:
        finding = graph_service.get_finding(finding_id)
        if not finding:
            return None
        paths = graph_service.trace_finding_paths(finding_id)
        services = [graph_service.get_service(p.reachable_service) for p in paths if graph_service.get_service(p.reachable_service)]
        assets = [graph_service.get_asset(p.affected_asset) for p in paths if graph_service.get_asset(p.affected_asset)]
        min_len = min([p.length for p in paths], default=2)
        return RiskEngine.calculate_risk(finding.vulnerability, services, assets, min_len)

    @staticmethod
    def tool_create_remediation_task(finding_id: str, title: str, priority: str, assigned_to: str) -> Dict[str, Any]:
        task = graph_service.create_remediation_task(finding_id, title, priority, assigned_to)
        return task.model_dump()

    @staticmethod
    def tool_get_investigation_history() -> List[Dict[str, Any]]:
        return graph_service.get_investigations_history()

    # --- Agent Execution Pipeline ---
    def investigate(self, finding_id: str) -> InvestigationResult:
        # Step 1: Resolve Finding
        finding = graph_service.get_finding(finding_id)
        if not finding:
            raise ValueError(f"Finding ID '{finding_id}' not found in FalkorDB graph.")

        # Step 2: Traverse Graph Paths & Gather Evidence
        paths = graph_service.trace_finding_paths(finding_id)
        
        # Step 3: Discover downstream services, assets, and owners
        service_names = set(p.reachable_service for p in paths)
        affected_services = [graph_service.get_service(s) for s in service_names if graph_service.get_service(s)]

        asset_names = set(p.affected_asset for p in paths)
        affected_assets = [graph_service.get_asset(a) for a in asset_names if graph_service.get_asset(a)]
        # Sort assets by criticality
        crit_rank = {"TIER_1_MISSION_CRITICAL": 0, "TIER_2_HIGH": 1, "TIER_3_MEDIUM": 2, "TIER_4_LOW": 3}
        affected_assets.sort(key=lambda a: crit_rank.get(a.criticality, 99))

        owner_names = set()
        for p in paths:
            owner_names.update(p.responsible_owners)
        all_owners = graph_service.get_owners()
        responsible_owners = [o for o in all_owners if o.name in owner_names]

        # Step 4: Compute Contextual Risk Breakdown
        min_len = min([p.length for p in paths], default=2)
        risk_breakdown = RiskEngine.calculate_risk(finding.vulnerability, affected_services, affected_assets, min_len)

        # Step 5: Synthesize Actions & Recommendations
        recommended_actions = []
        target_owner_name = responsible_owners[0].name if responsible_owners else "Security Operations Lead"
        
        if risk_breakdown.total_score >= 80:
            recommended_actions.append(
                f"P0 Immediate Mitigation: Create high-priority remediation task assigned to {target_owner_name}."
            )
            has_exposed = any(s.internet_exposed for s in affected_services)
            if has_exposed:
                recommended_actions.append(
                    "Network Perimeter Action: Apply immediate WAF rate-limiting and verify token serialization filters on public ingress."
                )
            recommended_actions.append(
                f"Dependency Upgrade: Update '{finding.affected_package}' across deployment manifests and trigger staging integration pipeline."
            )
        elif risk_breakdown.total_score >= 60:
            recommended_actions.append(
                f"P1 Action: Schedule package upgrade with {target_owner_name} in next maintenance cycle."
            )
            recommended_actions.append(
                "Internal Isolation: Restrict service boundary network peering to minimize blast radius."
            )
        else:
            recommended_actions.append(
                f"P2 Action: Monitor upstream patch release and review package usage with {target_owner_name}."
            )

        # Step 6: Limitations & Graph Assumptions
        limitations = [
            "Graph traversal reflects declared package dependency manifests and operational service architecture.",
            "Exploit status represents supplied vulnerability intelligence; active runtime execution must be verified via EDR/SIEM telemetry.",
            "Risk score is an explainable prioritization heuristic designed to rank workload attention, not a calibrated exploit probability."
        ]

        # Step 7: Structured Narrative
        exposed_summary = "INTERNET-EXPOSED" if any(s.internet_exposed for s in affected_services) else "INTERNAL-ONLY"
        top_asset_name = affected_assets[0].name if affected_assets else "Unknown Asset"
        top_asset_crit = affected_assets[0].criticality if affected_assets else "UNKNOWN"

        summary = (
            f"ChainSentry investigated {finding_id} ({finding.vulnerability.id}). "
            f"Although base CVSS is {finding.vulnerability.cvss_score} ({finding.vulnerability.severity}), "
            f"FalkorDB graph traversal uncovered a {min_len}-hop dependency path leading into {len(affected_services)} service(s) "
            f"({exposed_summary}), directly impacting {top_asset_name} ({top_asset_crit}). "
            f"Contextual risk escalated to {risk_breakdown.total_score}/100 based on verified asset criticality and perimeter exposure."
        )

        investigation_id = f"INV-{uuid.uuid4().hex[:8].upper()}"
        timestamp = datetime.datetime.now(datetime.timezone.utc).isoformat()

        result = InvestigationResult(
            investigation_id=investigation_id,
            finding_id=finding_id,
            title=f"Investigation of {finding_id}: {finding.vulnerability.title}",
            contextual_risk=risk_breakdown.total_score,
            risk_breakdown=risk_breakdown,
            paths=paths,
            affected_services=affected_services,
            affected_assets=affected_assets,
            responsible_owners=responsible_owners,
            recommended_actions=recommended_actions,
            limitations=limitations,
            timestamp=timestamp,
            investigation_mode="deterministic_graph_reasoning"
        )

        # Step 8: Persist Investigation in Graph History
        graph_service.save_investigation(result.model_dump())

        return result

agent = InvestigationAgent()
