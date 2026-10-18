import React from 'react';
import { InvestigationResult } from '../types';
import { ShieldAlert, CheckCircle2, AlertOctagon, UserCheck, Cpu, ArrowRight, Activity } from 'lucide-react';

interface InvestigationWorkspaceProps {
  result: InvestigationResult | null;
  loading: boolean;
  onOpenCreateTask: () => void;
}

export const InvestigationWorkspace: React.FC<InvestigationWorkspaceProps> = ({
  result,
  loading,
  onOpenCreateTask
}) => {
  if (loading) {
    return (
      <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', marginBottom: '24px' }}>
        <div className="animate-spin" style={{ fontSize: '1.5rem', marginBottom: '12px' }}>⚙️</div>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#FFF' }}>
          Traversing FalkorDB Knowledge Graph & Scoring Contextual Risk...
        </h3>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
          Querying downstream services, package manifests, perimeter exposure, and owner mappings.
        </p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="glass-panel" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', marginBottom: '24px' }}>
        Select a finding from the table above to launch a graph-native AI investigation.
      </div>
    );
  }

  const breakdown = result.risk_breakdown;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'var(--accent-crimson)';
    if (score >= 60) return 'var(--accent-amber)';
    if (score >= 40) return 'var(--accent-cyan)';
    return 'var(--text-muted)';
  };

  return (
    <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
      {/* Title & Metadata Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>
              Investigation Report
            </span>
            <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)' }}>
              {result.investigation_id}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-faint)' }}>
              • {new Date(result.timestamp).toLocaleTimeString()}
            </span>
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#FFF' }}>
            {result.title}
          </h2>
        </div>

        <button
          onClick={onOpenCreateTask}
          className="btn btn-primary"
          style={{ fontSize: '0.85rem' }}
        >
          <CheckCircle2 size={16} />
          Create Remediation Task
        </button>
      </div>

      {/* Agent Summary Banner */}
      <div style={{
        padding: '16px',
        background: 'rgba(6, 182, 212, 0.08)',
        border: '1px solid rgba(6, 182, 212, 0.25)',
        borderRadius: 'var(--radius-sm)',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', color: 'var(--accent-cyan)', fontSize: '0.8rem', fontWeight: 600 }}>
          <Activity size={16} />
          AI Graph Investigation Summary
        </div>
        <p style={{ fontSize: '0.85rem', color: '#E2E8F0', lineHeight: 1.5 }}>
          {result.summary}
        </p>
      </div>

      {/* Contextual Risk Score and Breakdown Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {/* Main Risk Gauge Card */}
        <div className="glass-panel" style={{ padding: '20px', background: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
            TOTAL CONTEXTUAL RISK SCORE
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
            <span style={{ fontSize: '3rem', fontWeight: 800, color: getScoreColor(result.contextual_risk), lineHeight: 1 }}>
              {result.contextual_risk.toFixed(1)}
            </span>
            <span style={{ fontSize: '1.1rem', color: 'var(--text-faint)', fontWeight: 500 }}>
              / 100
            </span>
          </div>

          {/* Progress Bar */}
          <div style={{ width: '100%', height: '8px', background: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'hidden', marginTop: '12px', marginBottom: '12px' }}>
            <div style={{
              width: `${result.contextual_risk}%`,
              height: '100%',
              background: getScoreColor(result.contextual_risk),
              boxShadow: `0 0 10px ${getScoreColor(result.contextual_risk)}`
            }}></div>
          </div>

          <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
            {breakdown.formula_explanation}
          </div>
        </div>

        {/* 5-Factor Contributions Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
          <div className="glass-panel" style={{ padding: '12px', background: 'var(--bg-secondary)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>CVSS Factor (30%)</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#FFF', marginTop: '4px' }}>
              {breakdown.cvss_contribution} <span style={{ fontSize: '0.7rem', color: 'var(--text-faint)' }}>/30</span>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '12px', background: 'var(--bg-secondary)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Exploit Proof (20%)</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#FFF', marginTop: '4px' }}>
              {breakdown.exploit_contribution} <span style={{ fontSize: '0.7rem', color: 'var(--text-faint)' }}>/20</span>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '12px', background: 'var(--bg-secondary)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Exposure (25%)</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#FFF', marginTop: '4px' }}>
              {breakdown.internet_exposure_contribution} <span style={{ fontSize: '0.7rem', color: 'var(--text-faint)' }}>/25</span>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '12px', background: 'var(--bg-secondary)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Asset Criticality (15%)</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#FFF', marginTop: '4px' }}>
              {breakdown.asset_criticality_contribution} <span style={{ fontSize: '0.7rem', color: 'var(--text-faint)' }}>/15</span>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '12px', background: 'var(--bg-secondary)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Graph Reachability (10%)</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#FFF', marginTop: '4px' }}>
              {breakdown.reachability_contribution} <span style={{ fontSize: '0.7rem', color: 'var(--text-faint)' }}>/10</span>
            </div>
          </div>
        </div>
      </div>

      {/* Downstream Blast Radius: Services, Assets, Owners */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {/* Reachable Services */}
        <div className="glass-panel" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#FFF', fontWeight: 600, fontSize: '0.875rem' }}>
            <Cpu size={16} color="var(--accent-cyan)" />
            Reachable Services ({result.affected_services.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {result.affected_services.map(s => (
              <div key={s.name} style={{ background: 'var(--bg-secondary)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="mono" style={{ fontSize: '0.8rem', fontWeight: 500, color: '#F1F5F9' }}>{s.name}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="badge badge-low" style={{ fontSize: '0.65rem' }}>{s.environment}</span>
                  {s.internet_exposed ? (
                    <span className="badge badge-critical" style={{ fontSize: '0.65rem' }}>Public Internet</span>
                  ) : (
                    <span className="badge badge-low" style={{ fontSize: '0.65rem' }}>Internal Only</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Affected Business Assets */}
        <div className="glass-panel" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#FFF', fontWeight: 600, fontSize: '0.875rem' }}>
            <ShieldAlert size={16} color="var(--accent-purple)" />
            Impacted Business Assets ({result.affected_assets.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {result.affected_assets.map(a => (
              <div key={a.name} style={{ background: 'var(--bg-secondary)', padding: '8px 12px', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#FFF' }}>{a.name}</span>
                  <span className={`badge ${a.criticality === 'TIER_1_MISSION_CRITICAL' ? 'badge-critical' : 'badge-high'}`} style={{ fontSize: '0.65rem' }}>
                    {a.criticality.replace('_', ' ')}
                  </span>
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  {a.business_function}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Responsible Owners */}
        <div className="glass-panel" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#FFF', fontWeight: 600, fontSize: '0.875rem' }}>
            <UserCheck size={16} color="var(--accent-emerald)" />
            Graph-Linked Responsible Owners ({result.responsible_owners.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {result.responsible_owners.map(o => (
              <div key={o.name} style={{ background: 'var(--bg-secondary)', padding: '8px 12px', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontWeight: 600, color: '#FFF', fontSize: '0.8rem' }}>{o.name}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)' }}>{o.team}</div>
                <div className="mono" style={{ fontSize: '0.675rem', color: 'var(--text-faint)', marginTop: '2px' }}>
                  {o.email}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recommended Actions */}
      <div style={{ marginBottom: '20px' }}>
        <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#FFF', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ArrowRight size={14} color="var(--accent-cyan)" />
          Recommended Next Steps
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {result.recommended_actions.map((act, idx) => (
            <div key={idx} style={{
              background: 'var(--bg-secondary)',
              borderLeft: '3px solid var(--accent-cyan)',
              padding: '10px 14px',
              borderRadius: '0 6px 6px 0',
              fontSize: '0.8rem',
              color: '#F1F5F9'
            }}>
              {act}
            </div>
          ))}
        </div>
      </div>

      {/* Evidence & Limitations Disclaimer */}
      <div style={{
        padding: '12px 16px',
        background: 'rgba(30, 41, 59, 0.4)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-sm)',
        fontSize: '0.725rem',
        color: 'var(--text-muted)'
      }}>
        <div style={{ fontWeight: 600, color: 'var(--accent-amber)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <AlertOctagon size={13} />
          Investigation Evidence & Limitations Notice
        </div>
        <ul style={{ paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {result.limitations.map((lim, idx) => (
            <li key={idx}>{lim}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};
