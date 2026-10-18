import React, { useState } from 'react';
import { RemediationTask, Owner } from '../types';
import { X, Plus, User } from 'lucide-react';

interface RemediationManagerProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: RemediationTask[];
  owners: Owner[];
  defaultFindingId: string | null;
  defaultOwnerName: string | null;
  onCreateTask: (task: { finding_id: string; title: string; priority: string; assigned_to: string }) => Promise<void>;
  onUpdateStatus: (taskId: string, newStatus: string) => Promise<void>;
}

export const RemediationManager: React.FC<RemediationManagerProps> = ({
  isOpen,
  onClose,
  tasks,
  owners,
  defaultFindingId,
  defaultOwnerName,
  onCreateTask,
  onUpdateStatus
}) => {
  const [findingId, setFindingId] = useState(defaultFindingId || 'FIND-2026-001');
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('P1');
  const [assignedTo, setAssignedTo] = useState(defaultOwnerName || (owners[0]?.name || 'Sarah Chen'));
  const [submitting, setSubmitting] = useState(false);

  // Sync state if default changes
  React.useEffect(() => {
    if (defaultFindingId) setFindingId(defaultFindingId);
    if (defaultOwnerName) setAssignedTo(defaultOwnerName);
  }, [defaultFindingId, defaultOwnerName]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      await onCreateTask({
        finding_id: findingId,
        title: title.trim(),
        priority,
        assigned_to: assignedTo
      });
      setTitle('');
    } finally {
      setSubmitting(false);
    }
  };

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'P0': return <span className="badge badge-critical">P0 Blocker</span>;
      case 'P1': return <span className="badge badge-high">P1 High</span>;
      case 'P2': return <span className="badge badge-medium">P2 Medium</span>;
      default: return <span className="badge badge-low">P3 Low</span>;
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      zIndex: 50,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '750px',
        maxHeight: '90vh',
        overflowY: 'auto',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-card)',
        padding: '24px',
        borderRadius: 'var(--radius-lg)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#FFF' }}>
              Remediation Task Management
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Create and assign remediation workflows to verified graph owners.
            </p>
          </div>
          <button onClick={onClose} className="btn btn-secondary btn-sm" style={{ padding: '6px' }}>
            <X size={16} />
          </button>
        </div>

        {/* Task Creation Form */}
        <form onSubmit={handleSubmit} style={{
          background: 'rgba(15, 23, 42, 0.6)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-sm)',
          padding: '16px',
          marginBottom: '24px'
        }}>
          <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-cyan)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={14} /> New Remediation Action
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={{ fontSize: '0.725rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Finding ID</label>
              <input
                type="text"
                value={findingId}
                onChange={(e) => setFindingId(e.target.value)}
                required
                style={{ width: '100%', padding: '8px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-card)', borderRadius: '4px', color: '#FFF', fontSize: '0.8rem' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.725rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                style={{ width: '100%', padding: '8px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-card)', borderRadius: '4px', color: '#FFF', fontSize: '0.8rem' }}
              >
                <option value="P0">P0 - Immediate Critical Hotfix</option>
                <option value="P1">P1 - High Priority Cycle</option>
                <option value="P2">P2 - Standard Maintenance</option>
                <option value="P3">P3 - Low / Informational</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.725rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Graph-Linked Assignee</label>
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                style={{ width: '100%', padding: '8px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-card)', borderRadius: '4px', color: '#FFF', fontSize: '0.8rem' }}
              >
                {owners.map(o => (
                  <option key={o.name} value={o.name}>
                    {o.name} ({o.team})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '0.725rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Remediation Action Title</label>
            <input
              type="text"
              placeholder="e.g. Patch auth-token-validator to v1.4.3 or enforce ingress WAF policy..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              style={{ width: '100%', padding: '8px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-card)', borderRadius: '4px', color: '#FFF', fontSize: '0.8rem' }}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary"
            style={{ width: '100%', fontSize: '0.825rem' }}
          >
            {submitting ? 'Persisting to FalkorDB...' : 'Create & Assign Task'}
          </button>
        </form>

        {/* Existing Tasks List */}
        <div>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#FFF', marginBottom: '12px' }}>
            Active Tasks ({tasks.length})
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {tasks.map(t => (
              <div
                key={t.id}
                style={{
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-card)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  flexWrap: 'wrap'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)' }}>{t.id}</span>
                    {getPriorityBadge(t.priority)}
                    <span className="mono" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Ref: {t.finding_id}</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 500, color: '#F1F5F9' }}>
                    {t.title}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    <User size={12} color="var(--accent-emerald)" />
                    <span>Assigned: <strong style={{ color: '#FFF' }}>{t.assigned_to}</strong> ({t.assigned_team})</span>
                  </div>
                </div>

                {/* Status Toggles */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {['OPEN', 'IN_PROGRESS', 'RESOLVED'].map(st => (
                    <button
                      key={st}
                      onClick={() => onUpdateStatus(t.id, st)}
                      className="btn btn-sm"
                      style={{
                        background: t.status === st ? (st === 'RESOLVED' ? 'rgba(16, 185, 129, 0.25)' : 'var(--bg-secondary)') : 'transparent',
                        color: t.status === st ? (st === 'RESOLVED' ? '#34D399' : '#FFF') : 'var(--text-muted)',
                        border: t.status === st ? '1px solid var(--border-card)' : '1px solid transparent',
                        fontSize: '0.7rem',
                        padding: '3px 8px'
                      }}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
