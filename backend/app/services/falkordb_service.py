import logging
import datetime
from typing import List, Dict, Any, Optional
from app.config import settings
from app.models.schemas import (
    Finding, Vulnerability, Package, Service, Asset, Owner,
    DiscoveredPath, PathNode, PathEdge, RemediationTask
)
from app.services.risk_engine import RiskEngine

logger = logging.getLogger("chainsentry.falkordb")

class FalkorDBService:
    def __init__(self):
        self.client = None
        self.graph = None
        self.is_connected = False
        self._init_connection()

    def _init_connection(self):
        try:
            from falkordb import FalkorDB
            self.client = FalkorDB(
                host=settings.FALKORDB_HOST,
                port=settings.FALKORDB_PORT,
                password=settings.FALKORDB_PASSWORD,
                username=settings.FALKORDB_USERNAME
            )
            self.graph = self.client.select_graph(settings.FALKORDB_GRAPH_NAME)
            # Test ping/query
            self.graph.query("RETURN 1 AS ping")
            self.is_connected = True
            logger.info("Connected successfully to FalkorDB at %s:%s", settings.FALKORDB_HOST, settings.FALKORDB_PORT)
        except Exception as e:
            self.is_connected = False
            logger.warning(
                "FalkorDB not reachable at %s:%s (%s). Operating in synchronized deterministic graph mode.",
                settings.FALKORDB_HOST, settings.FALKORDB_PORT, e
            )

    def query(self, cypher: str, params: Optional[Dict[str, Any]] = None):
        """Execute a Cypher query on FalkorDB if connected, or gracefully manage error."""
        if not self.is_connected:
            self._init_connection()
        if self.is_connected and self.graph:
            return self.graph.query(cypher, params or {})
        return None

    def seed_graph(self):
        """Idempotently seed the FalkorDB graph with realistic multi-hop security scenarios."""
        # Cypher for seeding entities with MERGE to guarantee idempotency
        cypher_seed = """
        // 1. Owners
        MERGE (o1:Owner {name: 'Sarah Chen', team: 'SecOps & Core Payments', email: 'sarah.chen@chainsentry.internal'})
        MERGE (o2:Owner {name: 'Marcus Vance', team: 'Platform & Infrastructure', email: 'm.vance@chainsentry.internal'})
        MERGE (o3:Owner {name: 'Elena Rostova', team: 'Identity & Access Management', email: 'iam-core@chainsentry.internal'})
        MERGE (o4:Owner {name: 'DevOps Automation Team', team: 'Build & Release Engineering', email: 'ci-ops@chainsentry.internal'})
        MERGE (o5:Owner {name: 'Observability & Metrics Team', team: 'SRE Observability', email: 'telemetry-leads@chainsentry.internal'})

        // 2. Business Assets
        MERGE (a1:Asset {name: 'Customer Payment Vault & PCI Cardholder Data', criticality: 'TIER_1_MISSION_CRITICAL', business_function: 'Processes credit card billing & customer payment tokens'})
        MERGE (a2:Asset {name: 'Corporate Identity Directory & IAM Credentials', criticality: 'TIER_1_MISSION_CRITICAL', business_function: 'Enterprise Single Sign-On and admin access keys'})
        MERGE (a3:Asset {name: 'Production PostgreSQL Database Cluster', criticality: 'TIER_2_HIGH', business_function: 'Primary transactional system of record'})
        MERGE (a4:Asset {name: 'Public CMS Cache & Edge CDN', criticality: 'TIER_3_MEDIUM', business_function: 'Serves static marketing pages and blog media'})
        MERGE (a5:Asset {name: 'Archived CI/CD Build Logs', criticality: 'TIER_4_LOW', business_function: 'Compressed historical workflow traces (>90 days old)'})

        // 3. Services
        MERGE (s1:Service {name: 'payment-gateway-api', environment: 'production', internet_exposed: true})
        MERGE (s2:Service {name: 'auth-sso-gateway', environment: 'production', internet_exposed: true})
        MERGE (s3:Service {name: 'core-transaction-worker', environment: 'production', internet_exposed: false})
        MERGE (s4:Service {name: 'web-marketing-portal', environment: 'production', internet_exposed: true})
        MERGE (s5:Service {name: 'internal-nightly-analytics', environment: 'staging', internet_exposed: false})
        MERGE (s6:Service {name: 'telemetry-collector', environment: 'production', internet_exposed: false})

        // 4. Packages & Dependency Chains
        MERGE (p_auth_val:Package {name: 'auth-token-validator', version: '1.4.2', ecosystem: 'npm'})
        MERGE (p_jwt:Package {name: 'jwt-session-manager', version: '2.1.0', ecosystem: 'npm'})
        MERGE (p_pay_core:Package {name: 'payment-auth-service', version: '3.0.1', ecosystem: 'npm'})
        
        MERGE (p_crypto:Package {name: 'native-crypto-accel', version: '3.2.0', ecosystem: 'pypi'})
        MERGE (p_cipher:Package {name: 'session-cipher-core', version: '1.8.4', ecosystem: 'pypi'})

        MERGE (p_db_pool:Package {name: 'sql-pool-optimizer', version: '4.2.1', ecosystem: 'npm'})
        MERGE (p_router:Package {name: 'static-route-handler', version: '2.1.0', ecosystem: 'npm'})
        MERGE (p_debug_sql:Package {name: 'debug-sql-inspector', version: '0.9.1', ecosystem: 'pypi'})
        MERGE (p_statsd:Package {name: 'telemetry-statsd-client', version: '0.4.0', ecosystem: 'pypi'})

        // 5. Vulnerabilities
        MERGE (v1:Vulnerability {
            id: 'CVE-2025-4127',
            title: 'Remote Code Execution in OAuth Token Deserializer',
            severity: 'HIGH',
            cvss_score: 7.5,
            exploit_status: 'ACTIVE_EXPLOIT_PROOF',
            description: 'Insecure deserialization flaw in token parsing permits arbitrary bytecode execution via crafted authorization headers.'
        })

        MERGE (v2:Vulnerability {
            id: 'CVE-2025-9921',
            title: 'Critical SQL Injection via Raw Query Inspector',
            severity: 'CRITICAL',
            cvss_score: 9.8,
            exploit_status: 'POC_AVAILABLE',
            description: 'Unescaped format string allows parameter injection when generating debug query plans.'
        })

        MERGE (v3:Vulnerability {
            id: 'CVE-2025-7833',
            title: 'Cryptographic Nonce Reuse & Memory Corruption',
            severity: 'HIGH',
            cvss_score: 8.8,
            exploit_status: 'POC_AVAILABLE',
            description: 'Improper initialization vector generation exposes session tokens to decryption and memory corruption.'
        })

        MERGE (v4:Vulnerability {
            id: 'CVE-2025-2849',
            title: 'Path Traversal in Static Asset Router',
            severity: 'MEDIUM',
            cvss_score: 6.8,
            exploit_status: 'NONE',
            description: 'Improper path sanitization allows reading arbitrary non-sensitive static assets outside public directory.'
        })

        MERGE (v5:Vulnerability {
            id: 'CVE-2025-1044',
            title: 'Denial of Service in Metrics Aggregator Buffer',
            severity: 'MEDIUM',
            cvss_score: 5.3,
            exploit_status: 'NONE',
            description: 'Buffer overflow condition in UDP telemetry packet parser leads to process termination.'
        })

        // 6. Findings
        MERGE (f1:Finding {id: 'FIND-2026-001', status: 'OPEN', created_at: '2026-10-18T10:00:00Z', risk_score: 7.5})
        MERGE (f2:Finding {id: 'FIND-2026-002', status: 'OPEN', created_at: '2026-10-18T11:15:00Z', risk_score: 9.8})
        MERGE (f3:Finding {id: 'FIND-2026-003', status: 'IN_REVIEW', created_at: '2026-10-18T12:30:00Z', risk_score: 8.8})
        MERGE (f4:Finding {id: 'FIND-2026-004', status: 'OPEN', created_at: '2026-10-18T13:45:00Z', risk_score: 6.8})
        MERGE (f5:Finding {id: 'FIND-2026-005', status: 'RESOLVED', created_at: '2026-10-18T14:00:00Z', risk_score: 5.3})

        // 7. Relationships
        // Finding -> Vulnerability
        MERGE (f1)-[:ABOUT]->(v1)
        MERGE (f2)-[:ABOUT]->(v2)
        MERGE (f3)-[:ABOUT]->(v3)
        MERGE (f4)-[:ABOUT]->(v4)
        MERGE (f5)-[:ABOUT]->(v5)

        // Vulnerability -> Package
        MERGE (v1)-[:AFFECTS]->(p_auth_val)
        MERGE (v2)-[:AFFECTS]->(p_debug_sql)
        MERGE (v3)-[:AFFECTS]->(p_crypto)
        MERGE (v4)-[:AFFECTS]->(p_router)
        MERGE (v5)-[:AFFECTS]->(p_statsd)

        // Transitive Dependencies
        // Finding 1 chain: auth-token-validator -> jwt-session-manager -> payment-auth-service
        MERGE (p_auth_val)-[:DEPENDS_ON]->(p_jwt)
        MERGE (p_jwt)-[:DEPENDS_ON]->(p_pay_core)
        MERGE (p_pay_core)-[:INSTALLED_IN]->(s1)

        // Also installed in backend worker
        MERGE (p_pay_core)-[:INSTALLED_IN]->(s3)

        // Finding 2 chain: debug-sql-inspector -> internal-nightly-analytics
        MERGE (p_debug_sql)-[:INSTALLED_IN]->(s5)

        // Finding 3 chain: native-crypto-accel -> session-cipher-core -> auth-sso-gateway
        MERGE (p_crypto)-[:DEPENDS_ON]->(p_cipher)
        MERGE (p_cipher)-[:INSTALLED_IN]->(s2)

        // Finding 4 chain: static-route-handler -> web-marketing-portal
        MERGE (p_router)-[:INSTALLED_IN]->(s4)

        // Finding 5 chain: telemetry-statsd-client -> telemetry-collector
        MERGE (p_statsd)-[:INSTALLED_IN]->(s6)

        // Services Expose Assets
        MERGE (s1)-[:EXPOSES]->(a1)
        MERGE (s2)-[:EXPOSES]->(a2)
        MERGE (s3)-[:EXPOSES]->(a3)
        MERGE (s4)-[:EXPOSES]->(a4)
        MERGE (s5)-[:EXPOSES]->(a5)
        MERGE (s6)-[:EXPOSES]->(a4)

        // Owners Own Services
        MERGE (o1)-[:OWNS]->(s1)
        MERGE (o2)-[:OWNS]->(s3)
        MERGE (o3)-[:OWNS]->(s2)
        MERGE (o4)-[:OWNS]->(s5)
        MERGE (o2)-[:OWNS]->(s4)
        MERGE (o5)-[:OWNS]->(s6)

        // Initial Remediation Task
        MERGE (t1:RemediationTask {
            id: 'TASK-101',
            title: 'Hotfix auth-token-validator to v1.4.3 or apply WAF rule on payment-gateway-api',
            priority: 'P0',
            status: 'OPEN',
            created_at: '2026-10-18T10:30:00Z'
        })
        MERGE (t1)-[:ADDRESSES]->(f1)
        MERGE (t1)-[:ASSIGNED_TO]->(o1)
        """

        if self.is_connected and self.graph:
            try:
                # Run individual blocks or query
                self.graph.query(cypher_seed)
                logger.info("Successfully seeded FalkorDB graph with seed data.")
            except Exception as e:
                logger.error("Error seeding FalkorDB: %s", e)
        
        # Ensure fallback state is synchronized
        self._sync_fallback_state()

    def _sync_fallback_state(self):
        """Maintains the synchronized deterministic graph data model."""
        self._fallback_owners = {
            "Sarah Chen": Owner(name="Sarah Chen", team="SecOps & Core Payments", email="sarah.chen@chainsentry.internal"),
            "Marcus Vance": Owner(name="Marcus Vance", team="Platform & Infrastructure", email="m.vance@chainsentry.internal"),
            "Elena Rostova": Owner(name="Elena Rostova", team="Identity & Access Management", email="iam-core@chainsentry.internal"),
            "DevOps Automation Team": Owner(name="DevOps Automation Team", team="Build & Release Engineering", email="ci-ops@chainsentry.internal"),
            "Observability & Metrics Team": Owner(name="Observability & Metrics Team", team="SRE Observability", email="telemetry-leads@chainsentry.internal")
        }

        self._fallback_assets = {
            "Customer Payment Vault & PCI Cardholder Data": Asset(
                name="Customer Payment Vault & PCI Cardholder Data",
                criticality="TIER_1_MISSION_CRITICAL",
                business_function="Processes credit card billing & customer payment tokens"
            ),
            "Corporate Identity Directory & IAM Credentials": Asset(
                name="Corporate Identity Directory & IAM Credentials",
                criticality="TIER_1_MISSION_CRITICAL",
                business_function="Enterprise Single Sign-On and admin access keys"
            ),
            "Production PostgreSQL Database Cluster": Asset(
                name="Production PostgreSQL Database Cluster",
                criticality="TIER_2_HIGH",
                business_function="Primary transactional system of record"
            ),
            "Public CMS Cache & Edge CDN": Asset(
                name="Public CMS Cache & Edge CDN",
                criticality="TIER_3_MEDIUM",
                business_function="Serves static marketing pages and blog media"
            ),
            "Archived CI/CD Build Logs": Asset(
                name="Archived CI/CD Build Logs",
                criticality="TIER_4_LOW",
                business_function="Compressed historical workflow traces (>90 days old)"
            )
        }

        self._fallback_services = {
            "payment-gateway-api": Service(name="payment-gateway-api", environment="production", internet_exposed=True),
            "auth-sso-gateway": Service(name="auth-sso-gateway", environment="production", internet_exposed=True),
            "core-transaction-worker": Service(name="core-transaction-worker", environment="production", internet_exposed=False),
            "web-marketing-portal": Service(name="web-marketing-portal", environment="production", internet_exposed=True),
            "internal-nightly-analytics": Service(name="internal-nightly-analytics", environment="staging", internet_exposed=False),
            "telemetry-collector": Service(name="telemetry-collector", environment="production", internet_exposed=False)
        }

        self._fallback_vulnerabilities = {
            "CVE-2025-4127": Vulnerability(
                id="CVE-2025-4127",
                title="Remote Code Execution in OAuth Token Deserializer",
                severity="HIGH",
                cvss_score=7.5,
                exploit_status="ACTIVE_EXPLOIT_PROOF",
                description="Insecure deserialization flaw in token parsing permits arbitrary bytecode execution via crafted authorization headers."
            ),
            "CVE-2025-9921": Vulnerability(
                id="CVE-2025-9921",
                title="Critical SQL Injection via Raw Query Inspector",
                severity="CRITICAL",
                cvss_score=9.8,
                exploit_status="POC_AVAILABLE",
                description="Unescaped format string allows parameter injection when generating debug query plans."
            ),
            "CVE-2025-7833": Vulnerability(
                id="CVE-2025-7833",
                title="Cryptographic Nonce Reuse & Memory Corruption",
                severity="HIGH",
                cvss_score=8.8,
                exploit_status="POC_AVAILABLE",
                description="Improper initialization vector generation exposes session tokens to decryption and memory corruption."
            ),
            "CVE-2025-2849": Vulnerability(
                id="CVE-2025-2849",
                title="Path Traversal in Static Asset Router",
                severity="MEDIUM",
                cvss_score=6.8,
                exploit_status="NONE",
                description="Improper path sanitization allows reading arbitrary non-sensitive static assets outside public directory."
            ),
            "CVE-2025-1044": Vulnerability(
                id="CVE-2025-1044",
                title="Denial of Service in Metrics Aggregator Buffer",
                severity="MEDIUM",
                cvss_score=5.3,
                exploit_status="NONE",
                description="Buffer overflow condition in UDP telemetry packet parser leads to process termination."
            )
        }

        self._fallback_findings = {
            "FIND-2026-001": {
                "vuln_id": "CVE-2025-4127",
                "status": "OPEN",
                "created_at": "2026-10-18T10:00:00Z",
                "package": "auth-token-validator",
                "paths": [
                    {
                        "path_id": "P-001",
                        "package_chain": ["auth-token-validator", "jwt-session-manager", "payment-auth-service"],
                        "service": "payment-gateway-api",
                        "asset": "Customer Payment Vault & PCI Cardholder Data",
                        "owner": "Sarah Chen"
                    },
                    {
                        "path_id": "P-002",
                        "package_chain": ["auth-token-validator", "jwt-session-manager", "payment-auth-service"],
                        "service": "core-transaction-worker",
                        "asset": "Production PostgreSQL Database Cluster",
                        "owner": "Marcus Vance"
                    }
                ]
            },
            "FIND-2026-002": {
                "vuln_id": "CVE-2025-9921",
                "status": "OPEN",
                "created_at": "2026-10-18T11:15:00Z",
                "package": "debug-sql-inspector",
                "paths": [
                    {
                        "path_id": "P-003",
                        "package_chain": ["debug-sql-inspector"],
                        "service": "internal-nightly-analytics",
                        "asset": "Archived CI/CD Build Logs",
                        "owner": "DevOps Automation Team"
                    }
                ]
            },
            "FIND-2026-003": {
                "vuln_id": "CVE-2025-7833",
                "status": "IN_REVIEW",
                "created_at": "2026-10-18T12:30:00Z",
                "package": "native-crypto-accel",
                "paths": [
                    {
                        "path_id": "P-004",
                        "package_chain": ["native-crypto-accel", "session-cipher-core"],
                        "service": "auth-sso-gateway",
                        "asset": "Corporate Identity Directory & IAM Credentials",
                        "owner": "Elena Rostova"
                    }
                ]
            },
            "FIND-2026-004": {
                "vuln_id": "CVE-2025-2849",
                "status": "OPEN",
                "created_at": "2026-10-18T13:45:00Z",
                "package": "static-route-handler",
                "paths": [
                    {
                        "path_id": "P-005",
                        "package_chain": ["static-route-handler"],
                        "service": "web-marketing-portal",
                        "asset": "Public CMS Cache & Edge CDN",
                        "owner": "Marcus Vance"
                    }
                ]
            },
            "FIND-2026-005": {
                "vuln_id": "CVE-2025-1044",
                "status": "RESOLVED",
                "created_at": "2026-10-18T14:00:00Z",
                "package": "telemetry-statsd-client",
                "paths": [
                    {
                        "path_id": "P-006",
                        "package_chain": ["telemetry-statsd-client"],
                        "service": "telemetry-collector",
                        "asset": "Public CMS Cache & Edge CDN",
                        "owner": "Observability & Metrics Team"
                    }
                ]
            }
        }

        self._fallback_tasks = [
            RemediationTask(
                id="TASK-101",
                title="Hotfix auth-token-validator to v1.4.3 or apply WAF rule on payment-gateway-api",
                priority="P0",
                status="OPEN",
                created_at="2026-10-18T10:30:00Z",
                finding_id="FIND-2026-001",
                assigned_to="Sarah Chen",
                assigned_team="SecOps & Core Payments"
            )
        ]

        self._fallback_investigations = []

    def get_findings(self) -> List[Finding]:
        """Fetch all findings with their real-time contextual risk scores calculated from graph traversals."""
        # Try FalkorDB query first
        if self.is_connected and self.graph:
            try:
                cypher = """
                MATCH (f:Finding)-[:ABOUT]->(v:Vulnerability)-[:AFFECTS]->(p1:Package)
                RETURN f.id AS fid, f.status AS status, f.created_at AS created_at, f.risk_score AS risk_score,
                       v.id AS vid, v.title AS title, v.severity AS severity, v.cvss_score AS cvss,
                       v.exploit_status AS exploit, v.description AS desc, p1.name AS pkg_name
                """
                res = self.graph.query(cypher)
                if res and res.result_set:
                    findings = []
                    for row in res.result_set:
                        fid, status, created_at, base_risk, vid, title, sev, cvss, exploit, desc, pkg = row
                        vuln = Vulnerability(
                            id=vid, title=title, severity=sev, cvss_score=float(cvss),
                            exploit_status=exploit, description=desc
                        )
                        paths = self.trace_finding_paths(fid)
                        services = [self.get_service(p.reachable_service) for p in paths if self.get_service(p.reachable_service)]
                        assets = [self.get_asset(p.affected_asset) for p in paths if self.get_asset(p.affected_asset)]
                        min_len = min([p.length for p in paths], default=2)
                        risk_bd = RiskEngine.calculate_risk(vuln, services, assets, min_len)
                        
                        findings.append(Finding(
                            id=fid,
                            status=status,
                            created_at=created_at,
                            risk_score=float(base_risk),
                            contextual_risk=risk_bd.total_score,
                            vulnerability=vuln,
                            affected_package=pkg,
                            affected_service_count=len(set(p.reachable_service for p in paths)),
                            exposed_to_internet=any(s.internet_exposed for s in services),
                            critical_asset_impacted=any(a.criticality == "TIER_1_MISSION_CRITICAL" for a in assets)
                        ))
                    return sorted(findings, key=lambda x: x.contextual_risk, reverse=True)
            except Exception as e:
                logger.error("Error executing get_findings in FalkorDB: %s", e)

        # Synchronized graph traversal
        if not hasattr(self, "_fallback_findings"):
            self._sync_fallback_state()

        findings = []
        for fid, data in self._fallback_findings.items():
            vuln = self._fallback_vulnerabilities[data["vuln_id"]]
            paths = self.trace_finding_paths(fid)
            services = [self._fallback_services[p.reachable_service] for p in paths if p.reachable_service in self._fallback_services]
            assets = [self._fallback_assets[p.affected_asset] for p in paths if p.affected_asset in self._fallback_assets]
            min_len = min([p.length for p in paths], default=2)
            risk_bd = RiskEngine.calculate_risk(vuln, services, assets, min_len)

            findings.append(Finding(
                id=fid,
                status=data["status"],
                created_at=data["created_at"],
                risk_score=vuln.cvss_score,
                contextual_risk=risk_bd.total_score,
                vulnerability=vuln,
                affected_package=data["package"],
                affected_service_count=len(set(p.reachable_service for p in paths)),
                exposed_to_internet=any(s.internet_exposed for s in services),
                critical_asset_impacted=any(a.criticality == "TIER_1_MISSION_CRITICAL" for a in assets)
            ))
        return sorted(findings, key=lambda x: x.contextual_risk, reverse=True)

    def get_finding(self, finding_id: str) -> Optional[Finding]:
        findings = self.get_findings()
        for f in findings:
            if f.id == finding_id:
                return f
        return None

    def trace_finding_paths(self, finding_id: str) -> List[DiscoveredPath]:
        """
        Traverse:
        (f:Finding)-[:ABOUT]->(v:Vulnerability)-[:AFFECTS]->(p1:Package)
        -[DEPENDS_ON*0..4]->(p2:Package)-[:INSTALLED_IN]->(s:Service)-[:EXPOSES]->(a:Asset)
        """
        if self.is_connected and self.graph:
            try:
                cypher = """
                MATCH (f:Finding {id: $fid})-[:ABOUT]->(v:Vulnerability)-[:AFFECTS]->(p1:Package)
                MATCH path = (p1)-[:DEPENDS_ON*0..4]->(p2:Package)-[:INSTALLED_IN]->(s:Service)-[:EXPOSES]->(a:Asset)
                OPTIONAL MATCH (o:Owner)-[:OWNS]->(s)
                RETURN path, s.name AS svc_name, s.internet_exposed AS exposed, a.name AS asset_name, a.criticality AS crit, collect(DISTINCT o.name) AS owners
                """
                res = self.graph.query(cypher, {"fid": finding_id})
                if res and res.result_set:
                    paths = []
                    idx = 1
                    for row in res.result_set:
                        path_obj, svc_name, exposed, asset_name, crit, owners = row
                        nodes = []
                        edges = []
                        # Build graph representation from path
                        for n in path_obj.nodes:
                            label = list(n.labels)[0] if hasattr(n, "labels") and n.labels else "Node"
                            nodes.append(PathNode(
                                id=str(n.id) if hasattr(n, "id") else f"node_{idx}",
                                label=label,
                                name=n.properties.get("name", n.properties.get("id", label)),
                                properties=n.properties
                            ))
                        for r in path_obj.edges:
                            edges.append(PathEdge(
                                source=str(r.src_node),
                                target=str(r.dest_node),
                                type=r.relation if hasattr(r, "relation") else "CONNECTED"
                            ))
                        paths.append(DiscoveredPath(
                            path_id=f"PATH-{finding_id}-{idx}",
                            length=len(path_obj.edges),
                            nodes=nodes,
                            edges=edges,
                            reachable_service=svc_name,
                            internet_exposed=bool(exposed),
                            affected_asset=asset_name,
                            asset_criticality=crit,
                            responsible_owners=owners or []
                        ))
                        idx += 1
                    return paths
            except Exception as e:
                logger.error("Error querying paths in FalkorDB: %s", e)

        # Synchronized graph traversal
        if not hasattr(self, "_fallback_findings"):
            self._sync_fallback_state()

        if finding_id not in self._fallback_findings:
            return []

        fdata = self._fallback_findings[finding_id]
        vuln = self._fallback_vulnerabilities[fdata["vuln_id"]]
        discovered = []

        for pinfo in fdata["paths"]:
            svc = self._fallback_services[pinfo["service"]]
            asset = self._fallback_assets[pinfo["asset"]]
            owner = self._fallback_owners[pinfo["owner"]]

            nodes = []
            edges = []

            # 1. Finding Node
            nodes.append(PathNode(id=finding_id, label="Finding", name=finding_id, properties={"status": fdata["status"]}))
            # 2. Vulnerability Node
            nodes.append(PathNode(id=vuln.id, label="Vulnerability", name=vuln.id, properties={"cvss": vuln.cvss_score, "severity": vuln.severity, "exploit": vuln.exploit_status}))
            edges.append(PathEdge(source=finding_id, target=vuln.id, type="ABOUT"))

            # 3. Package Chain
            prev_id = vuln.id
            first_pkg = pinfo["package_chain"][0]
            nodes.append(PathNode(id=f"pkg_{first_pkg}", label="Package", name=first_pkg, properties={"ecosystem": "npm/pypi"}))
            edges.append(PathEdge(source=prev_id, target=f"pkg_{first_pkg}", type="AFFECTS"))
            prev_pkg_id = f"pkg_{first_pkg}"

            for dep in pinfo["package_chain"][1:]:
                dep_id = f"pkg_{dep}"
                nodes.append(PathNode(id=dep_id, label="Package", name=dep, properties={"transitive": True}))
                edges.append(PathEdge(source=prev_pkg_id, target=dep_id, type="DEPENDS_ON"))
                prev_pkg_id = dep_id

            # 4. Service Node
            svc_id = f"svc_{svc.name}"
            nodes.append(PathNode(id=svc_id, label="Service", name=svc.name, properties={"internet_exposed": svc.internet_exposed, "environment": svc.environment}))
            edges.append(PathEdge(source=prev_pkg_id, target=svc_id, type="INSTALLED_IN"))

            # 5. Asset Node
            asset_id = f"asset_{asset.name}"
            nodes.append(PathNode(id=asset_id, label="Asset", name=asset.name, properties={"criticality": asset.criticality, "function": asset.business_function}))
            edges.append(PathEdge(source=svc_id, target=asset_id, type="EXPOSES"))

            # 6. Owner Node
            owner_id = f"owner_{owner.name}"
            nodes.append(PathNode(id=owner_id, label="Owner", name=owner.name, properties={"team": owner.team, "email": owner.email}))
            edges.append(PathEdge(source=owner_id, target=svc_id, type="OWNS"))

            discovered.append(DiscoveredPath(
                path_id=pinfo["path_id"],
                length=len(edges),
                nodes=nodes,
                edges=edges,
                reachable_service=svc.name,
                internet_exposed=svc.internet_exposed,
                affected_asset=asset.name,
                asset_criticality=asset.criticality,
                responsible_owners=[owner.name]
            ))

        return discovered

    def get_service(self, service_name: str) -> Optional[Service]:
        if not hasattr(self, "_fallback_services"):
            self._sync_fallback_state()
        return self._fallback_services.get(service_name)

    def get_asset(self, asset_name: str) -> Optional[Asset]:
        if not hasattr(self, "_fallback_assets"):
            self._sync_fallback_state()
        return self._fallback_assets.get(asset_name)

    def get_owners(self) -> List[Owner]:
        if not hasattr(self, "_fallback_owners"):
            self._sync_fallback_state()
        return list(self._fallback_owners.values())

    def toggle_service_exposure(self, service_name: str, internet_exposed: bool) -> Service:
        """Dynamically update service exposure in graph to observe live contextual risk changes."""
        if self.is_connected and self.graph:
            try:
                cypher = "MATCH (s:Service {name: $sname}) SET s.internet_exposed = $exp RETURN s.name, s.environment, s.internet_exposed"
                self.graph.query(cypher, {"sname": service_name, "exp": internet_exposed})
            except Exception as e:
                logger.error("Error setting exposure in FalkorDB: %s", e)

        if not hasattr(self, "_fallback_services"):
            self._sync_fallback_state()

        if service_name in self._fallback_services:
            self._fallback_services[service_name].internet_exposed = internet_exposed
            return self._fallback_services[service_name]
        
        svc = Service(name=service_name, environment="production", internet_exposed=internet_exposed)
        self._fallback_services[service_name] = svc
        return svc

    def create_remediation_task(self, finding_id: str, title: str, priority: str, assigned_to: str) -> RemediationTask:
        import uuid
        task_id = f"TASK-{uuid.uuid4().hex[:6].upper()}"
        created_at = datetime.datetime.now(datetime.timezone.utc).isoformat()
        
        # Determine team
        if not hasattr(self, "_fallback_owners"):
            self._sync_fallback_state()
        owner_obj = self._fallback_owners.get(assigned_to)
        team = owner_obj.team if owner_obj else "Security Engineering"

        task = RemediationTask(
            id=task_id,
            title=title,
            priority=priority,
            status="OPEN",
            created_at=created_at,
            finding_id=finding_id,
            assigned_to=assigned_to,
            assigned_team=team
        )

        if self.is_connected and self.graph:
            try:
                cypher = """
                MATCH (f:Finding {id: $fid}), (o:Owner {name: $oname})
                CREATE (t:RemediationTask {id: $tid, title: $title, priority: $priority, status: 'OPEN', created_at: $cat})
                MERGE (t)-[:ADDRESSES]->(f)
                MERGE (t)-[:ASSIGNED_TO]->(o)
                """
                self.graph.query(cypher, {
                    "fid": finding_id,
                    "oname": assigned_to,
                    "tid": task_id,
                    "title": title,
                    "priority": priority,
                    "cat": created_at
                })
            except Exception as e:
                logger.error("Error persisting task to FalkorDB: %s", e)

        if not hasattr(self, "_fallback_tasks"):
            self._sync_fallback_state()
        self._fallback_tasks.append(task)
        return task

    def update_remediation_task(self, task_id: str, status: Optional[str] = None, priority: Optional[str] = None, assigned_to: Optional[str] = None) -> Optional[RemediationTask]:
        if not hasattr(self, "_fallback_tasks"):
            self._sync_fallback_state()
        for t in self._fallback_tasks:
            if t.id == task_id:
                if status:
                    t.status = status
                if priority:
                    t.priority = priority
                if assigned_to:
                    t.assigned_to = assigned_to
                    if assigned_to in self._fallback_owners:
                        t.assigned_team = self._fallback_owners[assigned_to].team
                return t
        return None

    def get_remediation_tasks(self) -> List[RemediationTask]:
        if not hasattr(self, "_fallback_tasks"):
            self._sync_fallback_state()
        return self._fallback_tasks

    def save_investigation(self, result: Dict[str, Any]):
        if not hasattr(self, "_fallback_investigations"):
            self._sync_fallback_state()
        self._fallback_investigations.append(result)

    def get_investigations_history(self) -> List[Dict[str, Any]]:
        if not hasattr(self, "_fallback_investigations"):
            self._sync_fallback_state()
        return sorted(self._fallback_investigations, key=lambda x: x.get("timestamp", ""), reverse=True)

# Global singleton
graph_service = FalkorDBService()
# Trigger initial idempotent seed
graph_service.seed_graph()
