import React, { useState } from 'react';
import { DiscoveredPath, PathNode } from '../types';
import { Network } from 'lucide-react';

interface GraphExplorerProps {
  paths: DiscoveredPath[];
  loading: boolean;
}

export const GraphExplorer: React.FC<GraphExplorerProps> = ({ paths, loading }) => {
  const [selectedPathIndex, setSelectedPathIndex] = useState(0);
  const [selectedNode, setSelectedNode] = useState<PathNode | null>(null);

  if (loading) {
    return (
      <div className="glass-panel" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <p>Traversing FalkorDB graph relationships...</p>
      </div>
    );
  }

  if (!paths || paths.length === 0) {
    return (
      <div className="glass-panel" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
        No graph traversal paths discovered for this entity.
      </div>
    );
  }

  const currentPath = paths[selectedPathIndex] || paths[0];

  // Node color helper
  const getNodeColor = (label: string) => {
    switch (label) {
      case 'Finding': return '#06B6D4'; // Cyan
      case 'Vulnerability': return '#EF4444'; // Crimson
      case 'Package': return '#A855F7'; // Purple
      case 'Service': return '#3B82F6'; // Blue
      case 'Asset': return '#10B981'; // Emerald
      case 'Owner': return '#F59E0B'; // Amber
      default: return '#94A3B8';
    }
  };

  // Node position calculation for horizontal graph layout
  const nodeCount = currentPath.nodes.length;
  const startX = 60;
  const endX = 740;
  const stepX = nodeCount > 1 ? (endX - startX) / (nodeCount - 1) : 0;
  const centerY = 130;

  return (
    <div className="glass-panel" style={{ padding: '20px', marginBottom: '24px' }}>
      {/* Header and Path Switcher */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'rgba(6, 182, 212, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid var(--border-accent)'
          }}>
            <Network size={18} color="var(--accent-cyan)" />
          </div>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#FFF' }}>
              FalkorDB Attack-Path Explorer
            </h3>
            <p style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
              Interactive Cypher traversal visualization: {currentPath.length} hops from finding to business asset.
            </p>
          </div>
        </div>

        {/* Path Selector Tabs */}
        {paths.length > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Discovered Paths:</span>
            {paths.map((p, idx) => (
              <button
                key={p.path_id}
                onClick={() => {
                  setSelectedPathIndex(idx);
                  setSelectedNode(null);
                }}
                className={`btn btn-sm ${selectedPathIndex === idx ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.7rem', padding: '3px 8px' }}
              >
                Path {idx + 1}: {p.reachable_service}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* SVG Canvas Container */}
      <div style={{
        background: 'rgba(10, 15, 26, 0.95)',
        border: '1px solid var(--border-card)',
        borderRadius: 'var(--radius-sm)',
        padding: '16px',
        overflowX: 'auto',
        position: 'relative'
      }}>
        <svg
          viewBox="0 0 820 260"
          style={{ width: '100%', minWidth: '700px', height: '260px', display: 'block' }}
        >
          <defs>
            <marker
              id="arrow"
              viewBox="0 0 10 10"
              refX="18"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748B" />
            </marker>
            <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#06B6D4" floodOpacity="0.4" />
            </filter>
            <filter id="glow-red" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#EF4444" floodOpacity="0.4" />
            </filter>
            <filter id="glow-green" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#10B981" floodOpacity="0.4" />
            </filter>
          </defs>

          {/* Render Edges */}
          {currentPath.edges.map((edge, idx) => {
            const x1 = startX + idx * stepX;
            const x2 = startX + (idx + 1) * stepX;
            const midX = (x1 + x2) / 2;

            return (
              <g key={`edge-${idx}`}>
                <line
                  x1={x1}
                  y1={centerY}
                  x2={x2}
                  y2={centerY}
                  stroke="#334155"
                  strokeWidth="2"
                  strokeDasharray="4 2"
                  markerEnd="url(#arrow)"
                />
                {/* Edge Label Badge */}
                <rect
                  x={midX - 35}
                  y={centerY - 22}
                  width="70"
                  height="16"
                  rx="3"
                  fill="#0F172A"
                  stroke="#334155"
                  strokeWidth="1"
                />
                <text
                  x={midX}
                  y={centerY - 10}
                  fill="#94A3B8"
                  fontSize="8"
                  fontFamily="JetBrains Mono"
                  textAnchor="middle"
                  fontWeight="600"
                >
                  :{edge.type}
                </text>
              </g>
            );
          })}

          {/* Render Nodes */}
          {currentPath.nodes.map((node, idx) => {
            const cx = startX + idx * stepX;
            const cy = centerY;
            const isSelected = selectedNode?.id === node.id;
            const color = getNodeColor(node.label);

            return (
              <g
                key={`node-${node.id}`}
                onClick={() => setSelectedNode(node)}
                style={{ cursor: 'pointer' }}
              >
                {/* Outer halo if selected */}
                {isSelected && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r="28"
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                    strokeDasharray="3 3"
                    className="animate-spin"
                  />
                )}

                {/* Node Circle */}
                <circle
                  cx={cx}
                  cy={cy}
                  r="22"
                  fill="#0F172A"
                  stroke={color}
                  strokeWidth={isSelected ? '3' : '2'}
                  filter={node.label === 'Vulnerability' ? 'url(#glow-red)' : node.label === 'Asset' ? 'url(#glow-green)' : undefined}
                />

                {/* Node Label (Inside Circle) */}
                <text
                  x={cx}
                  y={cy + 4}
                  fill={color}
                  fontSize="9"
                  fontFamily="Inter"
                  fontWeight="700"
                  textAnchor="middle"
                >
                  {node.label.substring(0, 4).toUpperCase()}
                </text>

                {/* Node Name (Below Circle) */}
                <text
                  x={cx}
                  y={cy + 42}
                  fill="#F8FAFC"
                  fontSize="9.5"
                  fontWeight="600"
                  textAnchor="middle"
                >
                  {node.name.length > 15 ? `${node.name.substring(0, 13)}...` : node.name}
                </text>

                {/* Node Category (Above Circle) */}
                <text
                  x={cx}
                  y={cy - 30}
                  fill="var(--text-muted)"
                  fontSize="8.5"
                  textAnchor="middle"
                  fontWeight="500"
                >
                  {node.label}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Legend */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '14px',
          marginTop: '12px',
          flexWrap: 'wrap',
          fontSize: '0.725rem',
          color: 'var(--text-muted)'
        }}>
          {[
            { label: 'Finding', color: '#06B6D4' },
            { label: 'Vulnerability', color: '#EF4444' },
            { label: 'Package', color: '#A855F7' },
            { label: 'Service', color: '#3B82F6' },
            { label: 'Asset', color: '#10B981' },
            { label: 'Owner', color: '#F59E0B' }
          ].map(l => (
            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: l.color }}></span>
              <span>{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Node Property Inspector Drawer */}
      {selectedNode && (
        <div style={{
          marginTop: '16px',
          padding: '14px 18px',
          background: 'rgba(15, 23, 42, 0.9)',
          border: '1px solid var(--border-accent)',
          borderRadius: 'var(--radius-sm)',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '16px',
          animation: 'fadeIn 0.2s ease'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span className="badge" style={{ background: `${getNodeColor(selectedNode.label)}22`, color: getNodeColor(selectedNode.label), border: `1px solid ${getNodeColor(selectedNode.label)}44` }}>
                {selectedNode.label}
              </span>
              <span style={{ fontWeight: 600, color: '#FFF', fontSize: '0.85rem' }}>
                {selectedNode.name}
              </span>
              <span className="mono" style={{ fontSize: '0.7rem', color: 'var(--text-faint)' }}>
                ID: {selectedNode.id}
              </span>
            </div>
            {/* Properties Grid */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '0.75rem', marginTop: '8px' }}>
              {Object.entries(selectedNode.properties).map(([k, v]) => (
                <div key={k} style={{ background: 'var(--bg-tertiary)', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{k}: </span>
                  <span className="mono" style={{ color: '#FFF', fontWeight: 500 }}>{String(v)}</span>
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={() => setSelectedNode(null)}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.7rem', padding: '2px 8px' }}
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
};
