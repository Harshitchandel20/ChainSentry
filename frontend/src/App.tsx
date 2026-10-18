import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { DashboardOverview } from './components/DashboardOverview';
import { FindingsTable } from './components/FindingsTable';
import { GraphExplorer } from './components/GraphExplorer';
import { InvestigationWorkspace } from './components/InvestigationWorkspace';
import { RemediationManager } from './components/RemediationManager';
import { DemoBanner } from './components/DemoBanner';
import {
  Finding,
  InvestigationResult,
  DiscoveredPath,
  DashboardMetrics,
  RemediationTask,
  Owner
} from './types';

export const App: React.FC = () => {
  // State
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [selectedFindingId, setSelectedFindingId] = useState<string | null>('FIND-2026-001');
  const [investigationResult, setInvestigationResult] = useState<InvestigationResult | null>(null);
  const [paths, setPaths] = useState<DiscoveredPath[]>([]);
  const [remediationTasks, setRemediationTasks] = useState<RemediationTask[]>([]);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [falkordbConnected, setFalkordbConnected] = useState(false);

  // Loaders
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [loadingFindings, setLoadingFindings] = useState(true);
  const [loadingInvestigation, setLoadingInvestigation] = useState(false);
  const [togglingExposure, setTogglingExposure] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [isTasksModalOpen, setIsTasksModalOpen] = useState(false);

  // Check health and FalkorDB connectivity
  const fetchHealth = async () => {
    try {
      const res = await fetch('/health');
      if (res.ok) {
        const data = await res.json();
        setFalkordbConnected(data.falkordb_connected);
      }
    } catch {
      setFalkordbConnected(false);
    }
  };

  // Fetch Dashboard Metrics
  const fetchMetrics = async () => {
    try {
      const res = await fetch('/api/dashboard');
      if (res.ok) {
        const data = await res.json();
        setMetrics(data);
      }
    } catch (e: any) {
      console.error('Failed to load metrics:', e);
    } finally {
      setLoadingMetrics(false);
    }
  };

  // Fetch Findings List
  const fetchFindings = async () => {
    try {
      setLoadingFindings(true);
      const res = await fetch('/api/findings?sort_by=contextual_risk&order=desc');
      if (res.ok) {
        const data = await res.json();
        setFindings(data);
      } else {
        setError('Failed to fetch graph findings from backend.');
      }
    } catch (e: any) {
      setError(e.message || 'Error communicating with ChainSentry API');
    } finally {
      setLoadingFindings(false);
    }
  };

  // Fetch Remediation Tasks
  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/remediation-tasks');
      if (res.ok) {
        const data = await res.json();
        setRemediationTasks(data);
      }
    } catch (e: any) {
      console.error('Failed to load tasks:', e);
    }
  };

  // Run Investigation for a Finding
  const runInvestigation = async (findingId: string) => {
    setSelectedFindingId(findingId);
    setLoadingInvestigation(true);
    try {
      const [invRes, pathRes] = await Promise.all([
        fetch('/api/investigations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ finding_id: findingId })
        }),
        fetch(`/api/investigations/paths/${findingId}`)
      ]);

      if (invRes.ok) {
        const invData = await invRes.json();
        setInvestigationResult(invData);
        if (invData.responsible_owners) {
          setOwners(invData.responsible_owners);
        }
      }

      if (pathRes.ok) {
        const pathData = await pathRes.json();
        setPaths(pathData);
      }
    } catch (e: any) {
      console.error('Investigation error:', e);
    } finally {
      setLoadingInvestigation(false);
      fetchMetrics();
    }
  };

  // Handle Initial Mount
  useEffect(() => {
    fetchHealth();
    fetchMetrics();
    fetchFindings();
    fetchTasks();
    runInvestigation('FIND-2026-001');
  }, []);

  // Demonstration: Seed Reset
  const handleResetSeed = async () => {
    try {
      await fetch('/api/demo/seed', { method: 'POST' });
      await fetchFindings();
      await fetchMetrics();
      await fetchTasks();
      if (selectedFindingId) {
        await runInvestigation(selectedFindingId);
      }
    } catch (e: any) {
      console.error('Reset seed failed:', e);
    }
  };

  // Demonstration: Live Graph Exposure Mutation
  const handleToggleExposure = async (serviceName: string, internetExposed: boolean) => {
    setTogglingExposure(true);
    try {
      const res = await fetch('/api/demo/toggle-exposure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_name: serviceName,
          internet_exposed: internetExposed
        })
      });

      if (res.ok) {
        // Refresh findings and active investigation to show instant recalculation!
        await fetchFindings();
        if (selectedFindingId) {
          await runInvestigation(selectedFindingId);
        }
        await fetchMetrics();
      }
    } catch (e: any) {
      console.error('Toggle exposure error:', e);
    } finally {
      setTogglingExposure(false);
    }
  };

  // Remediation: Create Task
  const handleCreateTask = async (task: { finding_id: string; title: string; priority: string; assigned_to: string }) => {
    const res = await fetch('/api/remediation-tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task)
    });
    if (res.ok) {
      await fetchTasks();
      await fetchMetrics();
      setIsTasksModalOpen(false);
    }
  };

  // Remediation: Update Task Status
  const handleUpdateTaskStatus = async (taskId: string, newStatus: string) => {
    const res = await fetch(`/api/remediation-tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    if (res.ok) {
      await fetchTasks();
      await fetchMetrics();
    }
  };

  // Find if current selected finding's service is exposed
  const isPaymentApiExposed = findings.find(f => f.id === 'FIND-2026-001')?.exposed_to_internet ?? true;

  const openTasksCount = remediationTasks.filter(t => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navbar */}
      <Navbar
        falkordbConnected={falkordbConnected}
        onResetSeed={handleResetSeed}
        onSelectScenario={(fid) => runInvestigation(fid)}
        openTasksCount={openTasksCount}
        onOpenTasksModal={() => setIsTasksModalOpen(true)}
      />

      {/* Main Container */}
      <main style={{ flex: 1, padding: '24px', maxWidth: '1440px', margin: '0 auto', width: '100%' }}>
        {/* Demonstration Banner & Live Graph Mutation */}
        <DemoBanner
          onSelectFinding={(fid) => runInvestigation(fid)}
          onToggleExposure={handleToggleExposure}
          isServiceExposed={isPaymentApiExposed}
          togglingExposure={togglingExposure}
        />

        {/* Section A: Dashboard Overview */}
        <DashboardOverview
          metrics={metrics}
          loading={loadingMetrics}
        />

        {/* Section B: Findings Table */}
        <FindingsTable
          findings={findings}
          selectedFindingId={selectedFindingId}
          onSelectFinding={(fid) => runInvestigation(fid)}
          loading={loadingFindings}
          error={error}
        />

        {/* Section D: Interactive Attack-Path Explorer */}
        <GraphExplorer
          paths={paths}
          loading={loadingInvestigation}
        />

        {/* Section C: Investigation Workspace & Report */}
        <InvestigationWorkspace
          result={investigationResult}
          loading={loadingInvestigation}
          onOpenCreateTask={() => setIsTasksModalOpen(true)}
        />
      </main>

      {/* Section E: Remediation Modal */}
      <RemediationManager
        isOpen={isTasksModalOpen}
        onClose={() => setIsTasksModalOpen(false)}
        tasks={remediationTasks}
        owners={owners.length > 0 ? owners : [
          { name: 'Sarah Chen', team: 'SecOps & Core Payments', email: 'sarah.chen@chainsentry.internal' },
          { name: 'Marcus Vance', team: 'Platform & Infrastructure', email: 'm.vance@chainsentry.internal' },
          { name: 'Elena Rostova', team: 'Identity & Access Management', email: 'iam-core@chainsentry.internal' }
        ]}
        defaultFindingId={selectedFindingId}
        defaultOwnerName={investigationResult?.responsible_owners[0]?.name || 'Sarah Chen'}
        onCreateTask={handleCreateTask}
        onUpdateStatus={handleUpdateTaskStatus}
      />

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border-subtle)',
        padding: '16px 24px',
        textAlign: 'center',
        fontSize: '0.75rem',
        color: 'var(--text-faint)',
        background: 'var(--bg-secondary)'
      }}>
        ChainSentry • WeMakeDevs × FalkorDB Graph Hacks Hackathon Submission • Track: Agents That Act on Connected Data
      </footer>
    </div>
  );
};

export default App;
