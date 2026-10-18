import React from 'react';
import { DashboardMetrics } from '../types';
import { AlertTriangle, Server, ShieldCheck, CheckSquare, Search, Flame } from 'lucide-react';

interface DashboardOverviewProps {
  metrics: DashboardMetrics | null;
  loading: boolean;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({ metrics, loading }) => {
  if (loading || !metrics) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="glass-panel" style={{ height: '90px', padding: '16px', opacity: 0.5 }} />
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: 'Total Findings',
      value: metrics.total_findings,
      subtext: `${metrics.critical_findings} Critical Contextual Risk`,
      icon: <AlertTriangle size={20} color="var(--accent-amber)" />,
      borderColor: 'rgba(245, 158, 11, 0.3)'
    },
    {
      title: 'Escalated Critical Risk',
      value: metrics.critical_findings,
      subtext: 'Score ≥ 80 based on path exposure',
      icon: <Flame size={20} color="var(--accent-crimson)" />,
      borderColor: 'rgba(239, 68, 68, 0.35)',
      highlight: true
    },
    {
      title: 'Affected Services',
      value: metrics.affected_services_count,
      subtext: 'Traversed downstream nodes',
      icon: <Server size={20} color="var(--accent-cyan)" />,
      borderColor: 'rgba(6, 182, 212, 0.3)'
    },
    {
      title: 'Tier-1 Critical Assets',
      value: metrics.critical_assets_count,
      subtext: 'PCI data & IAM credentials',
      icon: <ShieldCheck size={20} color="var(--accent-purple)" />,
      borderColor: 'rgba(168, 85, 247, 0.3)'
    },
    {
      title: 'Open Remediation Tasks',
      value: metrics.open_remediation_tasks,
      subtext: `${metrics.total_remediations} total tasks assigned`,
      icon: <CheckSquare size={20} color="var(--accent-emerald)" />,
      borderColor: 'rgba(16, 185, 129, 0.3)'
    },
    {
      title: 'Graph Investigations',
      value: metrics.recent_investigations_count,
      subtext: 'Persistent audit records',
      icon: <Search size={20} color="var(--text-muted)" />,
      borderColor: 'rgba(148, 163, 184, 0.3)'
    }
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
      gap: '14px',
      marginBottom: '24px'
    }}>
      {cards.map((c, idx) => (
        <div
          key={idx}
          className="glass-panel"
          style={{
            padding: '16px',
            borderLeft: `3px solid ${c.borderColor}`,
            background: c.highlight ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.08), rgba(17, 24, 39, 0.75))' : undefined
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)' }}>
              {c.title}
            </span>
            {c.icon}
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#FFF', lineHeight: 1.1 }}>
            {c.value}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-faint)', marginTop: '6px' }}>
            {c.subtext}
          </div>
        </div>
      ))}
    </div>
  );
};
