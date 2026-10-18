from typing import List
from app.models.schemas import RiskFactorBreakdown, Vulnerability, Service, Asset

class RiskEngine:
    """
    Transparent, deterministic graph-native risk scoring model (0-100 scale).
    Combines:
    - CVSS / Severity (30%)
    - Known Exploitation Evidence (20%)
    - Internet Exposure of Reachable Services (25%)
    - Business Criticality of Reachable Assets (15%)
    - Graph Path Reachability & Transitive Depth (10%)
    """
    
    @staticmethod
    def calculate_risk(
        vulnerability: Vulnerability,
        reachable_services: List[Service],
        affected_assets: List[Asset],
        min_path_length: int
    ) -> RiskFactorBreakdown:
        # 1. Base CVSS Factor (max 30 pts)
        cvss_score = max(0.0, min(10.0, vulnerability.cvss_score))
        cvss_contribution = round((cvss_score / 10.0) * 30.0, 1)

        # 2. Exploit Evidence Factor (max 20 pts)
        exploit_map = {
            "ACTIVE_EXPLOIT_PROOF": 20.0,
            "POC_AVAILABLE": 12.0,
            "NONE": 0.0
        }
        exploit_contribution = exploit_map.get(vulnerability.exploit_status, 0.0)

        # 3. Internet Exposure Factor (max 25 pts)
        has_internet_service = any(s.internet_exposed for s in reachable_services)
        if has_internet_service:
            internet_exposure_contribution = 25.0
        elif reachable_services:
            internet_exposure_contribution = 5.0
        else:
            internet_exposure_contribution = 0.0

        # 4. Business Asset Criticality Factor (max 15 pts)
        crit_order = {
            "TIER_1_MISSION_CRITICAL": 15.0,
            "TIER_2_HIGH": 10.0,
            "TIER_3_MEDIUM": 5.0,
            "TIER_4_LOW": 2.0
        }
        max_crit = 0.0
        for asset in affected_assets:
            score = crit_order.get(asset.criticality, 0.0)
            if score > max_crit:
                max_crit = score
        asset_criticality_contribution = max_crit

        # 5. Graph Reachability & Breadth (max 10 pts)
        if not reachable_services:
            reachability_contribution = 0.0
        elif min_path_length <= 2:
            reachability_contribution = 10.0
        elif min_path_length <= 4:
            reachability_contribution = 7.0
        else:
            reachability_contribution = 4.0

        total_score = min(
            100.0,
            round(
                cvss_contribution
                + exploit_contribution
                + internet_exposure_contribution
                + asset_criticality_contribution
                + reachability_contribution,
                1
            )
        )

        formula_explanation = (
            f"Contextual Risk Score = CVSS ({cvss_contribution}/30) + "
            f"Exploit Evidence ({exploit_contribution}/20) + "
            f"Internet Exposure ({internet_exposure_contribution}/25) + "
            f"Asset Criticality ({asset_criticality_contribution}/15) + "
            f"Graph Reachability ({reachability_contribution}/10) = {total_score}/100"
        )

        heuristic_warning = (
            "NOTICE: This contextual score is an explainable prioritization heuristic derived "
            "from verified FalkorDB graph reachability, asset business value, and network perimeter exposure. "
            "A structural path indicates potential reachability, not guaranteed runtime exploitability."
        )

        return RiskFactorBreakdown(
            cvss_contribution=cvss_contribution,
            exploit_contribution=exploit_contribution,
            internet_exposure_contribution=internet_exposure_contribution,
            asset_criticality_contribution=asset_criticality_contribution,
            reachability_contribution=reachability_contribution,
            total_score=total_score,
            formula_explanation=formula_explanation,
            heuristic_warning=heuristic_warning
        )
