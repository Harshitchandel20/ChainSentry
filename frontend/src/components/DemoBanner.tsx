import React from 'react';
import { Globe, Lock, Sparkles } from 'lucide-react';

interface DemoBannerProps {
  onSelectFinding: (findingId: string) => void;
  onToggleExposure: (serviceName: string, internetExposed: boolean) => Promise<void>;
  isServiceExposed: boolean;
  togglingExposure: boolean;
}

export const DemoBanner: React.FC<DemoBannerProps> = ({
  onToggleExposure,
  isServiceExposed,
  togglingExposure
}) => {
  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.85))',
      border: '1px solid rgba(6, 182, 212, 0.3)',
      borderRadius: 'var(--radius-md)',
      padding: '16px 20px',
      marginBottom: '24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '16px',
      flexWrap: 'wrap'
    }}>
      <div style={{ maxWidth: '650px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <Sparkles size={16} color="var(--accent-cyan)" />
          <span style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--accent-cyan)', textTransform: 'uppercase' }}>
            Hackathon Live Graph Demonstration
          </span>
        </div>
        <p style={{ fontSize: '0.825rem', color: '#E2E8F0', lineHeight: 1.4 }}>
          <strong>Core Differentiator:</strong> CVSS alone cannot measure business exposure. Watch how FalkorDB graph reasoning escalates <strong>CVE-2025-4127 (CVSS 7.5)</strong> to <strong>94.5 Risk</strong> because of an internet-facing path to a Tier-1 Payment Vault, while <strong>CVE-2025-9921 (CVSS 9.8)</strong> drops to <strong>58.4 Risk</strong> due to isolation.
        </p>
      </div>

      {/* Interactive Mutation Action */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button
          onClick={() => onToggleExposure('payment-gateway-api', !isServiceExposed)}
          disabled={togglingExposure}
          className="btn"
          style={{
            background: isServiceExposed ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
            color: isServiceExposed ? '#F87171' : '#34D399',
            border: isServiceExposed ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(16, 185, 129, 0.4)',
            fontSize: '0.775rem'
          }}
          title="Modifies s.internet_exposed in FalkorDB graph and triggers live recalculation"
        >
          {isServiceExposed ? <Globe size={14} /> : <Lock size={14} />}
          <span>
            {togglingExposure
              ? 'Updating Graph...'
              : isServiceExposed
              ? 'Mutate Graph: Isolate Payment API'
              : 'Mutate Graph: Expose Payment API'}
          </span>
        </button>
      </div>
    </div>
  );
};
