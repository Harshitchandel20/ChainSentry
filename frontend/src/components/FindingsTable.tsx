import React, { useState } from 'react';
import { Finding } from '../types';
import { Search, ArrowUpDown, ChevronRight, Globe, Lock, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface FindingsTableProps {
  findings: Finding[];
  selectedFindingId: string | null;
  onSelectFinding: (findingId: string) => void;
  loading: boolean;
  error: string | null;
}

export const FindingsTable: React.FC<FindingsTableProps> = ({
  findings,
  selectedFindingId,
  onSelectFinding,
  loading,
  error
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');

  // Filtering
  const filtered = findings.filter(f => {
    if (statusFilter !== 'ALL' && f.status.toUpperCase() !== statusFilter) return false;
    if (severityFilter !== 'ALL' && f.vulnerability.severity.toUpperCase() !== severityFilter) return false;
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      const match =
        f.id.toLowerCase().includes(s) ||
        f.vulnerability.id.toLowerCase().includes(s) ||
        f.vulnerability.title.toLowerCase().includes(s) ||
        f.affected_package.toLowerCase().includes(s);
      if (!match) return false;
    }
    return true;
  });

  const getSeverityBadge = (sev: string) => {
    switch (sev.toUpperCase()) {
      case 'CRITICAL': return <span className="badge badge-critical">Critical</span>;
      case 'HIGH': return <span className="badge badge-high">High</span>;
      case 'MEDIUM': return <span className="badge badge-medium">Medium</span>;
      default: return <span className="badge badge-low">Low</span>;
    }
  };

  const getExploitBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE_EXPLOIT_PROOF':
        return <span className="badge badge-critical" style={{ fontSize: '0.65rem' }}>Active Exploit Proof</span>;
      case 'POC_AVAILABLE':
        return <span className="badge badge-high" style={{ fontSize: '0.65rem' }}>PoC Available</span>;
      default:
        return <span className="badge badge-low" style={{ fontSize: '0.65rem' }}>No Public Exploit</span>;
    }
  };

  const getRiskScoreColor = (score: number) => {
    if (score >= 80) return 'var(--accent-crimson)';
    if (score >= 60) return 'var(--accent-amber)';
    if (score >= 40) return 'var(--accent-cyan)';
    return 'var(--text-muted)';
  };

  return (
    <div className="glass-panel" style={{ padding: '20px', marginBottom: '24px' }}>
      {/* Header & Filter Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', marginBottom: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#FFF' }}>
            Vulnerability Findings & Graph Triage
          </h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Ranked by FalkorDB contextual attack-path reachability and business asset criticality.
          </p>
        </div>

        {/* Search input */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-card)',
          borderRadius: 'var(--radius-sm)',
          padding: '6px 12px',
          width: '260px'
        }}>
          <Search size={14} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search CVE, package, or finding..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#FFF',
              fontSize: '0.8rem',
              width: '100%'
            }}
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: '16px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
        {/* Severity Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginRight: '4px' }}>Severity:</span>
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'].map(sev => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className="btn btn-sm"
              style={{
                background: severityFilter === sev ? 'var(--bg-tertiary)' : 'transparent',
                color: severityFilter === sev ? '#FFF' : 'var(--text-muted)',
                border: severityFilter === sev ? '1px solid var(--border-card)' : '1px solid transparent',
                borderRadius: '4px',
                padding: '3px 8px',
                fontSize: '0.7rem'
              }}
            >
              {sev}
            </button>
          ))}
        </div>

        {/* Status Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginRight: '4px' }}>Status:</span>
          {['ALL', 'OPEN', 'IN_REVIEW', 'RESOLVED'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className="btn btn-sm"
              style={{
                background: statusFilter === st ? 'var(--bg-tertiary)' : 'transparent',
                color: statusFilter === st ? '#FFF' : 'var(--text-muted)',
                border: statusFilter === st ? '1px solid var(--border-card)' : '1px solid transparent',
                borderRadius: '4px',
                padding: '3px 8px',
                fontSize: '0.7rem'
              }}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Table Content */}
      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <div className="animate-spin" style={{ display: 'inline-block', marginBottom: '10px' }}>⚡</div>
          <p style={{ fontSize: '0.85rem' }}>Querying FalkorDB graph findings...</p>
        </div>
      ) : error ? (
        <div style={{ padding: '24px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--accent-crimson)', borderRadius: '8px', color: '#FCA5A5' }}>
          {error}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
          No findings match the selected filters.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.825rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '10px 12px' }}>Finding / CVE</th>
                <th style={{ padding: '10px 12px' }}>Vulnerability Title</th>
                <th style={{ padding: '10px 12px' }}>Affected Package</th>
                <th style={{ padding: '10px 12px' }}>Downstream Path</th>
                <th style={{ padding: '10px 12px' }}>Base CVSS</th>
                <th style={{ padding: '10px 12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>Contextual Risk</span>
                    <ArrowUpDown size={12} />
                  </div>
                </th>
                <th style={{ padding: '10px 12px' }}>Status</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(f => {
                const isSelected = f.id === selectedFindingId;
                // Calculate delta between Base CVSS normalized (out of 100) vs Contextual Risk
                const baseNormalized = f.vulnerability.cvss_score * 10;
                const delta = Math.round((f.contextual_risk - baseNormalized) * 10) / 10;

                return (
                  <tr
                    key={f.id}
                    onClick={() => onSelectFinding(f.id)}
                    style={{
                      borderBottom: '1px solid rgba(51, 65, 85, 0.4)',
                      background: isSelected ? 'rgba(6, 182, 212, 0.1)' : 'transparent',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.background = 'rgba(30, 41, 59, 0.5)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    {/* Finding / CVE */}
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: 600, color: '#FFF' }}>{f.id}</div>
                      <div className="mono" style={{ fontSize: '0.725rem', color: 'var(--accent-cyan)' }}>
                        {f.vulnerability.id}
                      </div>
                    </td>

                    {/* Title & Exploit Badge */}
                    <td style={{ padding: '12px', maxWidth: '240px' }}>
                      <div style={{ fontWeight: 500, color: '#F1F5F9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {f.vulnerability.title}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                        {getSeverityBadge(f.vulnerability.severity)}
                        {getExploitBadge(f.vulnerability.exploit_status)}
                      </div>
                    </td>

                    {/* Package */}
                    <td style={{ padding: '12px' }}>
                      <span className="mono" style={{ background: 'rgba(30, 41, 59, 0.7)', padding: '3px 8px', borderRadius: '4px', border: '1px solid var(--border-card)', fontSize: '0.75rem' }}>
                        {f.affected_package}
                      </span>
                    </td>

                    {/* Downstream Path */}
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {f.affected_service_count} service(s)
                        </span>
                        {f.exposed_to_internet ? (
                          <span className="badge badge-critical" style={{ fontSize: '0.65rem' }}>
                            <Globe size={10} /> Public
                          </span>
                        ) : (
                          <span className="badge badge-low" style={{ fontSize: '0.65rem' }}>
                            <Lock size={10} /> Internal
                          </span>
                        )}
                        {f.critical_asset_impacted && (
                          <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>
                            Tier-1 Asset
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Base CVSS */}
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: 600, color: '#E2E8F0' }}>
                        {f.vulnerability.cvss_score.toFixed(1)}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-faint)' }}>
                        / 10.0
                      </div>
                    </td>

                    {/* Contextual Risk & Delta */}
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          fontSize: '1.05rem',
                          fontWeight: 700,
                          color: getRiskScoreColor(f.contextual_risk)
                        }}>
                          {f.contextual_risk.toFixed(1)}
                        </span>
                        {/* Delta Pill */}
                        {delta > 0 ? (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '2px',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: 'rgba(239, 68, 68, 0.15)',
                            color: '#F87171',
                            fontSize: '0.65rem',
                            fontWeight: 600
                          }}>
                            <ArrowUpRight size={10} /> +{delta}
                          </span>
                        ) : (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '2px',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: 'rgba(16, 185, 129, 0.15)',
                            color: '#34D399',
                            fontSize: '0.65rem',
                            fontWeight: 600
                          }}>
                            <ArrowDownRight size={10} /> {delta}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-faint)' }}>
                        graph-weighted / 100
                      </div>
                    </td>

                    {/* Status */}
                    <td style={{ padding: '12px' }}>
                      <span className={`badge ${f.status === 'RESOLVED' ? 'badge-success' : f.status === 'IN_REVIEW' ? 'badge-cyan' : 'badge-high'}`}>
                        {f.status}
                      </span>
                    </td>

                    {/* Action */}
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectFinding(f.id);
                        }}
                        className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ fontSize: '0.75rem' }}
                      >
                        Investigate <ChevronRight size={12} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
