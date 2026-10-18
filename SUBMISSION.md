# ChainSentry — WeMakeDevs × FalkorDB Graph Hacks Submission

## Submission Details
- **Project Name:** ChainSentry
- **Primary Track:** Agents That Act on Connected Data
- **Tagline:** Don't just find vulnerabilities. Find the chain that makes them dangerous.
- **Repository:** https://github.com/Harshitchandel20/ChainSentry
- **Demo Video Link:** `[Insert YouTube / Loom Video Link]`

---

## 2-Minute Demo Script for the Presenter

### 0:00 – 0:20 | The Problem
> *"Security teams don't suffer from a lack of vulnerability alerts. They suffer from a lack of context. When a security scanner flags 200 CVEs, how do you know which one actually threatens your business? Severity and CVSS scores alone are context-blind."*

### 0:20 – 0:50 | The Graph Investigation
> *"ChainSentry changes the game by using FalkorDB. Instead of looking at flat CVE tables, ChainSentry builds an interconnected graph of vulnerabilities, packages, transitive dependencies, services, business assets, and owners.*
> 
> *Take a look at finding FIND-2026-001 (CVE-2025-4127). Its base CVSS is 7.5—merely 'High'. But when we click 'Investigate', our graph agent executes a Cypher traversal in FalkorDB.*
> 
> *It traces a 3-hop transitive dependency from auth-token-validator into the payment-gateway-api, which is directly exposed to the public internet and guards our Tier-1 Customer Payment Vault. ChainSentry calculates a Contextual Risk of 86.5 out of 100!"*

### 0:50 – 1:20 | The Contrast & Live Graph Mutation
> *"Now look at FIND-2026-002 (CVE-2025-9921). It has a 9.8 Critical CVSS—a security team's worst nightmare on paper. But FalkorDB reveals that it is only installed in an internal staging analytics batch job exposing archived CI logs. Its contextual risk drops to 58.4.*
> 
> *Now watch our live graph mutation in action: Suppose we isolate our payment gateway. With one click on 'Mutate Graph', we update the relationship property in FalkorDB. Watch the score: the contextual risk drops by 20 points in real time!"*

### 1:20 – 1:45 | Action & Remediation
> *"Finally, ChainSentry doesn't leave you hanging. Our agent discovered from FalkorDB that Sarah Chen from SecOps owns this service. We click 'Create Remediation Task', assign it directly to Sarah with priority P0, and persist the task to FalkorDB with a complete audit trail.*
> 
> *ChainSentry moves security operations from reactive alert fatigue to explainable, graph-native remediation."*

---

## Technical Highlights
1. **Graph-Native Cypher Traversals:** Bounded arbitrary-depth traversals (`-[:DEPENDS_ON*0..4]->`) connecting vulnerabilities to business assets.
2. **Contextual Risk Heuristic:** 5 transparent, normalized factors (CVSS 30%, Exploit Evidence 20%, Exposure 25%, Asset Criticality 15%, Graph Reachability 10%).
3. **Controlled Investigation Agent:** Fixed tool catalogue preventing LLM hallucinations and ensuring 100% deterministic operation without API keys.
4. **End-to-End Verification:** 8 automated pytest tests covering graph traversal, scoring contrast, task persistence, and live exposure mutations.

---

## Manual Steps Before Final Submission
1. **Push Changes to GitHub:**
   ```bash
   git add .
   git commit -m "feat: complete ChainSentry graph investigation platform for FalkorDB Graph Hacks"
   git push origin main
   ```
2. **Record Demo Video (1-2 minutes):**
   - Follow the demo script above.
   - Screen record the frontend dashboard (`http://localhost:5173`).
   - Demonstrate FIND-2026-001 investigation, the graph explorer, and the live exposure toggle.
   - Upload to YouTube / Loom.
3. **Submit on Official Portal:**
   - Link: https://www.wemakedevs.org/hackathons/falkordb
   - Select Track: **Agents That Act on Connected Data**
   - Paste GitHub URL and Demo Video URL.
