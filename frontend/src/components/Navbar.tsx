import React from 'react';
import { ShieldAlert, Database, RefreshCw, Zap, CheckCircle2 } from 'lucide-react';

interface NavbarProps {
  falkordbConnected: boolean;
  onResetSeed: () => void;
  onSelectScenario: (scenarioId: string) => void;
  openTasksCount: number;
  onOpenTasksModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  falkordbConnected,
  onResetSeed,
  onSelectScenario,
  openTasksCount,
  onOpenTasksModal
}) => {
  return (
    <header style={{
      borderBottom: '1px solid var(--border-subtle)',
      background: 'rgba(15, 23, 42, 0.85)',
      backdropFilter: 'blur(16px)',
      position: 'sticky',
      top: 0,
      zIndex: 40,
      padding: '12px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '16px',
      flexWrap: 'wrap'
    }}>
      {/* Brand & Tagline */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #0284C7, #06B6D4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 15px rgba(6, 182, 212, 0.35)'
        }}>
          <ShieldAlert size={22} color="#FFFFFF" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em', color: '#F8FAFC' }}>
              Chain<span style={{ color: 'var(--accent-cyan)' }}>Sentry</span>
            </h1>
            <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>
              Agents That Act on Connected Data
            </span>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Don't just find vulnerabilities. Find the chain that makes them dangerous.
          </p>
        </div>
      </div>

      {/* Center / Action Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        {/* FalkorDB Connection Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          borderRadius: '20px',
          background: 'rgba(30, 41, 59, 0.6)',
          border: '1px solid var(--border-card)',
          fontSize: '0.75rem'
        }}>
          <Database size={14} color={falkordbConnected ? 'var(--accent-emerald)' : 'var(--accent-cyan)'} />
          <span style={{ color: 'var(--text-muted)' }}>FalkorDB:</span>
          <span style={{
            color: falkordbConnected ? 'var(--accent-emerald)' : 'var(--accent-cyan)',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <span style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: falkordbConnected ? 'var(--accent-emerald)' : 'var(--accent-cyan)',
              boxShadow: falkordbConnected ? '0 0 8px #10B981' : '0 0 8px #06B6D4'
            }}></span>
            {falkordbConnected ? 'Live Container' : 'Graph Engine Active'}
          </span>
        </div>

        {/* Demo Scenario Shortcuts */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={() => onSelectScenario('FIND-2026-001')}
            className="btn btn-secondary btn-sm"
            title="Demonstrate multi-hop blast radius where CVSS 7.5 escalates to 94.5"
            style={{ fontSize: '0.75rem' }}
          >
            <Zap size={13} color="var(--accent-amber)" />
            Demo: Multi-Hop Risk
          </button>
          <button
            onClick={() => onSelectScenario('FIND-2026-002')}
            className="btn btn-secondary btn-sm"
            title="Demonstrate CVSS 9.8 in isolated staging which de-escalates to 58.4"
            style={{ fontSize: '0.75rem' }}
          >
            <CheckCircle2 size={13} color="var(--accent-cyan)" />
            Demo: Isolated CVSS
          </button>
        </div>

        {/* Remediation Tasks Shortcut */}
        <button
          onClick={onOpenTasksModal}
          className="btn btn-secondary btn-sm"
          style={{ position: 'relative' }}
        >
          <span>Remediation Tasks</span>
          {openTasksCount > 0 && (
            <span style={{
              background: 'var(--accent-crimson)',
              color: '#FFF',
              borderRadius: '10px',
              padding: '1px 6px',
              fontSize: '0.65rem',
              fontWeight: 700
            }}>
              {openTasksCount}
            </span>
          )}
        </button>

        {/* Seed Reset */}
        <button
          onClick={onResetSeed}
          className="btn btn-secondary btn-sm"
          title="Restore synthetic demonstration dataset"
        >
          <RefreshCw size={13} />
          Reset Graph
        </button>
      </div>
    </header>
  );
};
