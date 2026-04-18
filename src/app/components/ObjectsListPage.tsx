import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Search,
  RefreshCw,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  ArrowUpDown,
  X,
  Clock,
  Layers,
  ArrowRight,
  Eye,
  ThumbsUp,
  Info,
  Activity,
  Terminal,
  MapPin,
} from 'lucide-react';
import { mockObjects, NetworkObject, Status, ObjectType } from '../data/mockData';

// ── Type config ───────────────────────────────────────────────────────────────
const TYPE_CONFIG: Record<ObjectType, { label: string; bg: string; text: string }> = {
  server:        { label: 'Server',        bg: 'bg-info-bg border-info/25',     text: 'text-info-text'    },
  switch:        { label: 'Switch',        bg: 'bg-ok-bg border-ok/25',         text: 'text-ok-text'      },
  router:        { label: 'Router',        bg: 'bg-warn-bg border-warn/25',     text: 'text-warn-text'    },
  load_balancer: { label: 'Load Balancer', bg: 'bg-[#EEF2FF] border-[#A5B4FC]/30', text: 'text-[#4338CA]' },
  storage:       { label: 'Storage',       bg: 'bg-[#F0FFFE] border-[#67E8F9]/30', text: 'text-[#0E7490]' },
};

// ── Status config — icon + color + text for full accessibility ─────────────────
const STATUS_CONFIG: Record<Status, {
  icon: React.FC<{ className?: string }>;
  label: string;
  badge: string;
  rowBg: string;
  rowBgHover: string;
  leftBorder: string;
}> = {
  critical: {
    icon: AlertCircle,
    label: 'Critical',
    badge: 'bg-danger text-white border-danger',
    rowBg: 'bg-[rgba(225,29,72,0.04)]',
    rowBgHover: 'hover:bg-[rgba(225,29,72,0.08)]',
    leftBorder: 'border-l-danger',
  },
  warning: {
    icon: AlertTriangle,
    label: 'Warning',
    badge: 'bg-warn-bg text-warn-text border-warn/30',
    rowBg: 'bg-[rgba(217,119,6,0.03)]',
    rowBgHover: 'hover:bg-[rgba(217,119,6,0.07)]',
    leftBorder: 'border-l-warn',
  },
  healthy: {
    icon: CheckCircle2,
    label: 'Healthy',
    badge: 'bg-ok-bg text-ok-text border-ok/30',
    rowBg: '',
    rowBgHover: 'hover:bg-subtle',
    leftBorder: 'border-l-transparent',
  },
};

const STATUS_WEIGHT: Record<Status, number> = { critical: 0, warning: 1, healthy: 2 };
type SortKey = 'status' | 'name' | 'rack' | 'lastSeen';

// ── Simulate incident age from "lastSeen" strings ──────────────────────────────
function getIncidentAge(lastSeen: string): string {
  if (lastSeen.includes('min')) return lastSeen;
  if (lastSeen.includes('h')) return lastSeen;
  return '< 1 min';
}

// ── System Status Band ─────────────────────────────────────────────────────────
// HCD: Empathy + Solve Core Issues — show operators exactly what needs action,
// why it matters, and give them clear next steps. Not just "X criticals active"
// but a triage view with impact + urgency + action.
function SystemStatusBand({
  criticals, warnings, total, onFilter,
}: {
  criticals: NetworkObject[];
  warnings: NetworkObject[];
  total: number;
  onFilter: (s: Status | 'all') => void;
}) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(true);
  const [acknowledged, setAcknowledged] = useState<Set<string>>(new Set());

  // ── Critical incidents active ──
  if (criticals.length > 0) {
    const unackCount = criticals.filter(c => !acknowledged.has(c.id)).length;
    return (
      <div
        className="border-b border-danger/20 bg-danger-bg"
        role="alert"
        aria-live="assertive"
        aria-label={`${criticals.length} critical incidents require immediate action`}
      >
        {/* Incident header — always visible, communicates urgency clearly */}
        <button
          className="w-full flex items-center gap-3 px-6 py-3.5 text-left hover:bg-danger/5 transition-colors"
          onClick={() => setExpanded(e => !e)}
          aria-expanded={expanded}
        >
          {/* Pulsing indicator — grabs attention without being aggressive */}
          <span className="relative flex h-2.5 w-2.5 shrink-0" aria-hidden="true">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-danger opacity-50" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-danger" />
          </span>

          <div className="flex items-baseline gap-2 flex-1 min-w-0">
            <span className="text-sm font-bold text-danger-text">
              {unackCount > 0
                ? `${unackCount} incident${unackCount > 1 ? 's' : ''} need${unackCount === 1 ? 's' : ''} your attention`
                : `${criticals.length} incident${criticals.length > 1 ? 's' : ''} acknowledged`}
            </span>
            <span className="text-xs text-danger-text/70 truncate hidden sm:block">
              — {criticals.map(o => o.name).join(', ')}
            </span>
            {warnings.length > 0 && (
              <span className="text-xs text-warn-text/80 hidden md:inline">
                · {warnings.length} warning{warnings.length > 1 ? 's' : ''} pending review
              </span>
            )}
          </div>

          {/* Contextual time hint — HCD: urgency without alarm */}
          <span className="flex items-center gap-1 text-xs text-danger-text/60 shrink-0 hidden sm:flex">
            <Clock className="w-3 h-3" aria-hidden="true" />
            {getIncidentAge(criticals[0].lastSeen)}
          </span>

          <ChevronDown
            className={`w-4 h-4 text-danger-text/50 shrink-0 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
        </button>

        {/* Expanded incident cards */}
        <div
          className={`overflow-hidden transition-all duration-300 ${expanded ? 'max-h-[800px]' : 'max-h-0'}`}
          aria-hidden={!expanded}
        >
          <div className="px-6 pb-4 space-y-2">
            {/* ── Each critical item — card-style for scannability ── */}
            {criticals.map((obj) => {
              const isAck = acknowledged.has(obj.id);
              const impactCount = obj.connections.length;
              return (
                <div
                  key={obj.id}
                  className={`flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4 p-4 rounded-xl border transition-all duration-200 ${
                    isAck
                      ? 'bg-surface border-line opacity-60'
                      : 'bg-surface border-danger/25 shadow-sm'
                  }`}
                  role="article"
                  aria-label={`Critical incident: ${obj.name}${isAck ? ', acknowledged' : ''}`}
                >
                  {/* Top row on mobile: icon + name */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="shrink-0 w-8 h-8 rounded-lg bg-danger flex items-center justify-center mt-0.5">
                      <AlertCircle className="w-4 h-4 text-white" aria-hidden="true" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-mono font-bold text-sm text-hi">{obj.name}</span>
                        <span className={`inline-flex items-center text-[10px] px-1.5 py-0.5 rounded border font-semibold ${TYPE_CONFIG[obj.type].bg} ${TYPE_CONFIG[obj.type].text}`}>
                          {TYPE_CONFIG[obj.type].label}
                        </span>
                        {isAck && (
                          <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-ok-bg border border-ok/20 text-ok-text">
                            <CheckCircle2 className="w-2.5 h-2.5" aria-hidden="true" />
                            Acknowledged
                          </span>
                        )}
                      </div>
                      {obj.issues && obj.issues.length > 0 && (
                        <p className="text-sm text-danger-text font-medium mb-1">{obj.issues[0]}</p>
                      )}
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="flex items-center gap-1 text-xs text-lo">
                          <MapPin className="w-3 h-3" aria-hidden="true" />
                          {obj.rack} · U{obj.rackUnit} · {obj.ip}
                        </span>
                        {obj.connections.length > 0 && (
                          <span className="flex items-center gap-1 text-xs text-warn-text font-medium">
                            <Layers className="w-3 h-3" aria-hidden="true" />
                            {obj.connections.length} connected device{obj.connections.length !== 1 ? 's' : ''} at risk
                          </span>
                        )}
                        {obj.impact && obj.impact.length > 0 && (
                          <span className="text-xs text-mid truncate max-w-[280px]">→ {obj.impact[0]}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action buttons — full width on mobile, inline on sm+ */}
                  <div className="flex items-center gap-2 sm:shrink-0">
                    {!isAck && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setAcknowledged(prev => new Set([...prev, obj.id])); }}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 text-xs text-mid border border-line bg-subtle hover:bg-line/40 hover:text-hi px-3 py-1.5 rounded-lg transition-colors"
                        aria-label={`Acknowledge incident on ${obj.name}`}
                      >
                        <ThumbsUp className="w-3 h-3" aria-hidden="true" />
                        Acknowledge
                      </button>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/server/${obj.id}`); }}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 text-xs font-semibold bg-danger text-white px-3 py-1.5 rounded-lg hover:bg-danger/90 transition-colors"
                      aria-label={`View details for ${obj.name}`}
                    >
                      <Eye className="w-3 h-3" aria-hidden="true" />
                      View
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Warning summary bar — HCD: holistic view of system health */}
            {warnings.length > 0 && (
              <div className="flex items-center gap-3 py-2 px-4 bg-warn-bg rounded-lg border border-warn/20">
                <AlertTriangle className="w-3.5 h-3.5 text-warn shrink-0" aria-hidden="true" />
                <span className="text-xs text-warn-text font-semibold">
                  {warnings.length} warning{warnings.length > 1 ? 's' : ''} also active:
                </span>
                <span className="text-xs text-warn-text/80 truncate">{warnings.map(o => o.name).join(', ')}</span>
                <button
                  onClick={() => onFilter('warning')}
                  className="ml-auto text-xs text-warn-text font-semibold hover:underline whitespace-nowrap flex items-center gap-1"
                  aria-label="Filter table to show warnings only"
                >
                  Review <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Warnings only ──
  if (warnings.length > 0) {
    return (
      <div className="bg-warn-bg border-b border-warn/20 px-6 py-3" role="status">
        <div className="max-w-7xl mx-auto flex items-center gap-3 flex-wrap">
          <AlertTriangle className="w-3.5 h-3.5 text-warn shrink-0" aria-hidden="true" />
          <span className="text-sm font-semibold text-warn-text">
            {warnings.length} system{warnings.length > 1 ? 's' : ''} need review
          </span>
          <span className="text-xs text-warn-text/70 truncate hidden sm:block">
            {warnings.map(o => o.name).join(' · ')}
          </span>
          <button
            onClick={() => onFilter('warning')}
            className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-warn-text hover:underline"
            aria-label="Filter to show warnings only"
          >
            Review warnings <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  }

  // ── All clear — HCD: positive reinforcement and confidence ──
  return (
    <div className="bg-ok-bg border-b border-ok/20 px-6 py-2.5" role="status" aria-label="All systems operational">
      <div className="max-w-7xl mx-auto flex items-center gap-2">
        <CheckCircle2 className="w-4 h-4 text-ok" aria-hidden="true" />
        <span className="text-sm font-semibold text-ok-text">All {total} systems operational</span>
        <span className="text-xs text-ok-text/60 ml-1">— no incidents or warnings detected</span>
      </div>
    </div>
  );
}

// ── Status Badge — icon + color + text (3-layer redundancy for accessibility) ──
// HCD Inclusivity: color-blind users can rely on icon + text, not just color.
function StatusBadge({ status }: { status: Status }) {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${cfg.badge}`}
      role="status"
      aria-label={`Status: ${cfg.label}`}
    >
      <Icon className="w-3 h-3" aria-hidden="true" />
      {cfg.label}
    </span>
  );
}

// ── Object Row ─────────────────────────────────────────────────────────────────
// HCD: Holistic context — every row shows WHAT it is, WHERE it is, HOW it's
// connected, WHEN it was last seen, and WHAT needs to be done right now.
function ObjectRow({ obj, onNavigate }: { obj: NetworkObject; onNavigate: (id: string) => void }) {
  const cfg = STATUS_CONFIG[obj.status];
  const typeCfg = TYPE_CONFIG[obj.type];
  const impactCount = obj.connections.length;
  const isCrit = obj.status === 'critical';
  const isWarn = obj.status === 'warning';

  return (
    <tr
      className={`group border-b border-line border-l-4 ${cfg.leftBorder} ${cfg.rowBg} ${cfg.rowBgHover} cursor-pointer transition-colors duration-100 focus-within:ring-2 focus-within:ring-info/30`}
      onClick={() => onNavigate(obj.id)}
      role="row"
    >
      {/* ── Device name + issue ── */}
      <td className="pl-4 py-3 pr-3">
        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
          {/* Type badge */}
          <span
            className={`inline-flex items-center text-[10px] px-1.5 py-0.5 rounded border font-semibold ${typeCfg.bg} ${typeCfg.text}`}
            aria-label={`Type: ${typeCfg.label}`}
          >
            {typeCfg.label}
          </span>
          {/* Name */}
          <span className="font-mono font-bold text-sm text-hi group-hover:text-info transition-colors">
            {obj.name}
          </span>
        </div>

        {/* Issue or healthy message — HCD: show the "why" right in context */}
        {obj.issues && obj.issues.length > 0 ? (
          <p className={`text-xs font-medium truncate max-w-[260px] flex items-center gap-1 ${isCrit ? 'text-danger-text' : 'text-warn-text'}`}>
            <span aria-hidden="true">{isCrit ? '!' : '▲'}</span>
            {obj.issues[0]}
          </p>
        ) : (
          <p className="text-xs text-lo">No active issues</p>
        )}
      </td>

      {/* ── Status badge ── */}
      <td className="py-3 pr-4">
        <StatusBadge status={obj.status} />
      </td>

      {/* ── Impact / connections — HCD holistic: show blast radius ── */}
      <td className="py-3 pr-4 hidden md:table-cell">
        {obj.impact && obj.impact.length > 0 ? (
          <p className={`text-xs truncate max-w-[180px] ${isCrit ? 'text-danger-text font-medium' : 'text-mid'}`}>
            {obj.impact[0]}
          </p>
        ) : (
          <span className="text-xs text-lo">—</span>
        )}
        {impactCount > 0 && (
          <p className="text-[11px] text-lo mt-0.5 flex items-center gap-1">
            <Layers className="w-2.5 h-2.5" aria-hidden="true" />
            {impactCount} connection{impactCount !== 1 ? 's' : ''}
          </p>
        )}
      </td>

      {/* ── IP address ── */}
      <td className="py-3 pr-4 hidden lg:table-cell">
        <span className="font-mono text-xs text-mid bg-subtle border border-line px-2 py-0.5 rounded-md">
          {obj.ip}
        </span>
      </td>

      {/* ── Physical location — HCD holistic: physical + logical context ── */}
      <td className="py-3 pr-4 hidden sm:table-cell">
        <span className="text-xs font-semibold text-mid">{obj.rack}</span>
        <span className="text-xs text-lo ml-1">U{obj.rackUnit}</span>
      </td>

      {/* ── Last activity ── */}
      <td className="py-3 pr-3 hidden xl:table-cell">
        <span className="flex items-center gap-1 text-xs text-lo">
          <Clock className="w-3 h-3 shrink-0" aria-hidden="true" />
          {obj.lastSeen}
        </span>
      </td>

      {/* ── Contextual action — HCD solve core issues: right action for status ── */}
      <td className="py-3 pr-4 text-right">
        {isCrit && (
          <button
            className="inline-flex items-center gap-1.5 text-xs font-bold bg-danger text-white px-3 py-1.5 rounded-lg hover:bg-danger/90 transition-colors focus:outline-none focus:ring-2 focus:ring-danger/40"
            onClick={(e) => { e.stopPropagation(); onNavigate(obj.id); }}
            aria-label={`View critical incident details for ${obj.name}`}
          >
            <Terminal className="w-3 h-3" aria-hidden="true" />
            Investigate
          </button>
        )}
        {isWarn && (
          <button
            className="inline-flex items-center gap-1.5 text-xs font-medium border border-warn/30 text-warn-text bg-warn-bg hover:border-warn/60 px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-150 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-warn/30"
            onClick={(e) => { e.stopPropagation(); onNavigate(obj.id); }}
            aria-label={`Review warning for ${obj.name}`}
          >
            <Eye className="w-3 h-3" aria-hidden="true" />
            Review
          </button>
        )}
        {!isCrit && !isWarn && (
          <button
            className="inline-flex items-center gap-1.5 text-xs text-info bg-info-bg hover:bg-info/10 px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-150 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-info/30"
            onClick={(e) => { e.stopPropagation(); onNavigate(obj.id); }}
            aria-label={`View details for ${obj.name}`}
          >
            <Activity className="w-3 h-3" aria-hidden="true" />
            Details
          </button>
        )}
      </td>
    </tr>
  );
}

// ── Object Card — mobile-only list item ───────────────────────────────────────
function ObjectCard({ obj, onNavigate }: { obj: NetworkObject; onNavigate: (id: string) => void }) {
  const cfg     = STATUS_CONFIG[obj.status];
  const typeCfg = TYPE_CONFIG[obj.type];
  const isCrit  = obj.status === 'critical';
  const isWarn  = obj.status === 'warning';

  return (
    <div
      className={`flex items-stretch border-b border-line border-l-4 ${cfg.leftBorder} ${cfg.rowBg} ${cfg.rowBgHover} cursor-pointer transition-colors active:brightness-95`}
      onClick={() => onNavigate(obj.id)}
      role="row"
    >
      {/* Main content */}
      <div className="flex-1 min-w-0 px-4 py-3">
        {/* Line 1: type badge + name + status */}
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <span className={`inline-flex items-center text-[10px] px-1.5 py-0.5 rounded border font-semibold ${typeCfg.bg} ${typeCfg.text}`}>
            {typeCfg.label}
          </span>
          <span className="font-mono font-bold text-sm text-hi">{obj.name}</span>
          <StatusBadge status={obj.status} />
        </div>

        {/* Line 2: issue description */}
        {obj.issues && obj.issues.length > 0 ? (
          <p className={`text-xs font-medium mb-1.5 ${isCrit ? 'text-danger-text' : 'text-warn-text'}`}>
            {obj.issues[0]}
          </p>
        ) : (
          <p className="text-xs text-lo mb-1.5">No active issues</p>
        )}

        {/* Line 3: rack + ip + last seen */}
        <div className="flex items-center gap-1.5 text-xs text-lo flex-wrap">
          <span className="font-medium text-mid">{obj.rack}</span>
          <span>·</span>
          <span>U{obj.rackUnit}</span>
          <span>·</span>
          <span className="font-mono">{obj.ip}</span>
          <span className="flex items-center gap-0.5 ml-auto">
            <Clock className="w-3 h-3 shrink-0" />
            {obj.lastSeen}
          </span>
        </div>
      </div>

      {/* Right: action */}
      <div className="flex items-center pl-2 pr-3 shrink-0">
        {isCrit && (
          <button
            className="flex items-center gap-1 text-xs font-bold bg-danger text-white px-2.5 py-1.5 rounded-lg active:bg-danger/80"
            onClick={(e) => { e.stopPropagation(); onNavigate(obj.id); }}
          >
            <Terminal className="w-3 h-3" />
            Fix
          </button>
        )}
        {isWarn && (
          <button
            className="flex items-center gap-1 text-xs font-medium border border-warn/30 text-warn-text bg-warn-bg px-2.5 py-1.5 rounded-lg"
            onClick={(e) => { e.stopPropagation(); onNavigate(obj.id); }}
          >
            <Eye className="w-3 h-3" />
            View
          </button>
        )}
        {!isCrit && !isWarn && (
          <ChevronRight className="w-4 h-4 text-lo" />
        )}
      </div>
    </div>
  );
}

// ── Sortable column header ─────────────────────────────────────────────────────
function SortHeader({
  label, sortKey, current, dir, onClick, className = '',
}: {
  label: string; sortKey: SortKey; current: SortKey; dir: 'asc' | 'desc'; onClick: (k: SortKey) => void; className?: string;
}) {
  const active = current === sortKey;
  return (
    <th
      className={`py-3 pr-4 font-semibold cursor-pointer select-none hover:text-hi whitespace-nowrap ${className}`}
      onClick={() => onClick(sortKey)}
      role="columnheader"
      aria-sort={active ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'}
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick(sortKey); }}
    >
      <span className="flex items-center gap-1">
        {label}
        <span className={`inline-flex items-center transition-opacity duration-150 ${active ? 'opacity-100' : 'opacity-30'}`} aria-hidden="true">
          {active
            ? dir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
            : <ArrowUpDown className="w-3 h-3" />
          }
        </span>
      </span>
    </th>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export function ObjectsListPage() {
  const navigate = useNavigate();
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatus]   = useState<Status | 'all'>('all');
  const [typeFilter, setType]       = useState<ObjectType | 'all'>('all');
  const [focusOnIssues, setFocus]   = useState(false);
  const [sortKey, setSortKey]       = useState<SortKey>('status');
  const [sortDir, setSortDir]       = useState<'asc' | 'desc'>('asc');
  const [lastSync]                  = useState('2 min ago');
  const [refreshing, setRefreshing] = useState(false);

  const criticals = useMemo(() => mockObjects.filter(o => o.status === 'critical'), []);
  const warnings  = useMemo(() => mockObjects.filter(o => o.status === 'warning'),  []);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  const filtered = useMemo(() => {
    let rows = mockObjects.filter(obj => {
      if (focusOnIssues && obj.status === 'healthy') return false;
      if (statusFilter !== 'all' && obj.status !== statusFilter) return false;
      if (typeFilter !== 'all' && obj.type !== typeFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          obj.name.toLowerCase().includes(q) ||
          obj.ip.includes(q) ||
          obj.rack.toLowerCase().includes(q) ||
          obj.tags.some(t => t.toLowerCase().includes(q)) ||
          (obj.issues ?? []).some(iss => iss.toLowerCase().includes(q))
        );
      }
      return true;
    });
    return [...rows].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'status')       cmp = STATUS_WEIGHT[a.status] - STATUS_WEIGHT[b.status];
      else if (sortKey === 'name')    cmp = a.name.localeCompare(b.name);
      else if (sortKey === 'rack')    cmp = a.rack.localeCompare(b.rack) || a.rackUnit - b.rackUnit;
      else if (sortKey === 'lastSeen') cmp = a.lastSeen.localeCompare(b.lastSeen);
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [search, statusFilter, typeFilter, focusOnIssues, sortKey, sortDir]);

  const critCount   = criticals.length;
  const warnCount   = warnings.length;
  const healthCount = mockObjects.length - critCount - warnCount;
  const hasFilters  = statusFilter !== 'all' || typeFilter !== 'all' || !!search || focusOnIssues;

  // Status filter pills config
  const STATUS_PILLS = [
    {
      key: 'critical' as Status,
      count: critCount,
      label: 'Critical',
      icon: AlertCircle,
      active: 'bg-danger text-white border-danger',
      inactive: critCount > 0
        ? 'bg-danger-bg text-danger-text border-danger/30 hover:border-danger/60'
        : 'bg-subtle text-lo border-line cursor-default opacity-50',
    },
    {
      key: 'warning' as Status,
      count: warnCount,
      label: 'Warning',
      icon: AlertTriangle,
      active: 'bg-warn text-white border-warn',
      inactive: warnCount > 0
        ? 'bg-warn-bg text-warn-text border-warn/30 hover:border-warn/60'
        : 'bg-subtle text-lo border-line cursor-default opacity-50',
    },
    {
      key: 'healthy' as Status,
      count: healthCount,
      label: 'Healthy',
      icon: CheckCircle2,
      active: 'bg-ok text-white border-ok',
      inactive: 'bg-ok-bg text-ok-text border-ok/30 hover:border-ok/60',
    },
  ];

  return (
    // HCD Accessibility: skip-to-content for keyboard users
    <div className="min-h-screen bg-bg bg-[#f4f4f4]">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-[100] focus:px-4 focus:py-2 focus:bg-info focus:text-white focus:text-sm focus:rounded-br-lg">
        Skip to content
      </a>

      {/* ── Page header ──────────────────────────────────────────────────────── */}
      <div className="bg-surface border-b border-line px-4 md:px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-lg font-bold text-hi leading-none">Infrastructure</h1>
              {/* HCD Empathy: give the operator instant situational awareness */}
              <p className="text-xs text-lo mt-1">
                {mockObjects.length} objects across 4 racks
                {critCount > 0 && (
                  <span className="text-danger-text font-semibold ml-1">
                    · {critCount} need{critCount === 1 ? 's' : ''} attention
                  </span>
                )}
                {critCount === 0 && warnCount === 0 && (
                  <span className="text-ok-text font-medium ml-1">· all systems operational</span>
                )}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Status pills — quick filters with instant triage context */}
              <div className="flex items-center gap-1.5" role="group" aria-label="Filter by status">
                {STATUS_PILLS.map(({ key, count, label, icon: Icon, active, inactive }) => (
                  <button
                    key={key}
                    onClick={() => count > 0 || key === 'healthy' ? setStatus(statusFilter === key ? 'all' : key) : undefined}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-150 ${
                      statusFilter === key ? active : inactive
                    }`}
                    aria-pressed={statusFilter === key}
                    aria-label={`${count} ${label} — click to filter`}
                    disabled={count === 0 && key !== 'healthy'}
                  >
                    <Icon className="w-3 h-3" aria-hidden="true" />
                    <span>{count}</span>
                    <span className="hidden sm:inline">{label}</span>
                  </button>
                ))}
              </div>

              {/* Sync timestamp + refresh */}
              <div className="flex items-center gap-2 pl-2 border-l border-line">
                <span className="text-xs text-lo flex items-center gap-1">
                  <Clock className="w-3 h-3" aria-hidden="true" />
                  {lastSync}
                </span>
                <button
                  className="flex items-center gap-1.5 text-xs text-mid hover:text-hi bg-surface hover:bg-subtle px-2.5 py-1.5 rounded-lg border border-line transition-colors focus:outline-none focus:ring-2 focus:ring-info/30"
                  onClick={handleRefresh}
                  aria-label="Refresh data"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 transition-transform duration-700 ${refreshing ? 'animate-spin' : ''}`}
                    aria-hidden="true"
                  />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── System status band — primary triage zone ─────────────────────────── */}
      <SystemStatusBand
        criticals={criticals}
        warnings={warnings}
        total={mockObjects.length}
        onFilter={s => setStatus(s)}
      />

      {/* ── Filter toolbar ────────────────────────────────────────────────────── */}
      <div className="bg-surface border-b border-line px-4 md:px-6 py-3 sticky top-14 z-20" role="search">
        <div className="max-w-7xl mx-auto flex items-center gap-2 md:gap-3 overflow-x-auto scrollbar-none">

          {/* Search — HCD: clear affordance and helpful placeholder text */}
          <div className="relative shrink-0">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-lo" aria-hidden="true" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, IP, rack…"
              className="pl-8 pr-8 py-1.5 w-48 md:w-64 border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-info/30 focus:border-info bg-surface text-hi placeholder:text-lo transition-shadow"
              aria-label="Search infrastructure objects"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-lo hover:text-mid transition-colors"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Type filter */}
          <select
            value={typeFilter}
            onChange={e => setType(e.target.value as ObjectType | 'all')}
            className="text-xs border border-line rounded-lg px-2.5 py-1.5 bg-surface focus:outline-none focus:ring-2 focus:ring-info/30 text-hi cursor-pointer shrink-0"
            aria-label="Filter by device type"
          >
            <option value="all">All types</option>
            <option value="server">Server</option>
            <option value="switch">Switch</option>
            <option value="router">Router</option>
            <option value="load_balancer">Load Balancer</option>
            <option value="storage">Storage</option>
          </select>

          {/* Focus on issues */}
          <button
            onClick={() => setFocus(v => !v)}
            className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors shrink-0 ${
              focusOnIssues
                ? 'bg-danger-bg text-danger-text border-danger/30'
                : 'bg-subtle text-mid border-line hover:text-hi hover:border-hi/20'
            }`}
            aria-pressed={focusOnIssues}
            aria-label={focusOnIssues ? 'Currently showing issues only — click to show all' : 'Show issues only, hide healthy systems'}
          >
            <AlertCircle className="w-3 h-3" aria-hidden="true" />
            {focusOnIssues ? 'Issues only — clear' : 'Focus on issues'}
          </button>

          {/* Clear all filters */}
          {hasFilters && (
            <button
              onClick={() => { setSearch(''); setStatus('all'); setType('all'); setFocus(false); }}
              className="inline-flex items-center gap-1 text-xs text-info hover:text-info-text transition-colors focus:outline-none focus:ring-2 focus:ring-info/30 rounded"
              aria-label="Clear all active filters"
            >
              <X className="w-3 h-3" /> Clear filters
            </button>
          )}

          {/* Contextual row count — HCD: always show what you're looking at */}
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-lo" role="status" aria-live="polite">
              {filtered.length === mockObjects.length
                ? `${filtered.length} objects`
                : `${filtered.length} of ${mockObjects.length} objects`}
            </span>
            {focusOnIssues && (
              <span className="text-xs text-danger-text font-medium flex items-center gap-1">
                <Info className="w-3 h-3" aria-hidden="true" />
                healthy hidden
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Main table / card list ────────────────────────────────────────────── */}
      <main id="main-content" className="max-w-7xl mx-auto px-4 md:px-6 py-4">
        <div
          className="bg-surface rounded-xl border border-line overflow-clip"
          style={{ boxShadow: 'var(--shadow-card)' }}
        >
          {filtered.length === 0 ? (
            <div className="py-20 text-center px-6" role="status">
              <div className="w-12 h-12 rounded-full bg-subtle flex items-center justify-center mx-auto mb-4">
                {hasFilters
                  ? <Search className="w-5 h-5 text-lo" aria-hidden="true" />
                  : <CheckCircle2 className="w-5 h-5 text-ok" aria-hidden="true" />
                }
              </div>
              <p className="text-mid font-semibold mb-1">
                {hasFilters ? 'No objects match your filters' : 'All clear'}
              </p>
              <p className="text-xs text-lo max-w-xs mx-auto mb-4">
                {hasFilters
                  ? 'Try adjusting your search or removing filters to see more results.'
                  : 'All systems are healthy and reporting normally.'}
              </p>
              {hasFilters && (
                <button
                  onClick={() => { setSearch(''); setStatus('all'); setType('all'); setFocus(false); }}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-info bg-info-bg hover:bg-info/10 px-4 py-2 rounded-lg transition-colors"
                >
                  <X className="w-3 h-3" aria-hidden="true" />
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            <>
              {/* ── Mobile: card list (< md) ── */}
              <div className="md:hidden divide-y divide-line" role="list" aria-label="Infrastructure objects">
                {filtered.map(obj => (
                  <ObjectCard
                    key={obj.id}
                    obj={obj}
                    onNavigate={id => navigate(`/server/${id}`)}
                  />
                ))}
              </div>

              {/* ── Desktop: table (md+) ── */}
              <table className="hidden md:table w-full" role="grid" aria-label="Infrastructure objects">
                <thead className="text-left text-xs text-lo uppercase tracking-wide border-b border-line bg-subtle sticky top-[114px] z-10">
                  <tr role="row" className="border-l-4 border-l-[#F0F0F0]">
                    <th
                      className="pl-4 py-3 pr-3 cursor-pointer select-none hover:text-hi w-[280px]"
                      onClick={() => handleSort('name')}
                      role="columnheader"
                      aria-sort={sortKey === 'name' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
                    >
                      <span className="flex items-center gap-1">
                        Device / Issue
                        <span className={`inline-flex transition-opacity ${sortKey === 'name' ? 'opacity-100' : 'opacity-30'}`} aria-hidden="true">
                          {sortKey === 'name'
                            ? sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                            : <ArrowUpDown className="w-3 h-3" />}
                        </span>
                      </span>
                    </th>
                    <SortHeader label="Severity"  sortKey="status"   current={sortKey} dir={sortDir} onClick={handleSort} />
                    <th className="py-3 pr-4 font-semibold hidden md:table-cell" role="columnheader">Impact</th>
                    <th className="py-3 pr-4 font-semibold hidden lg:table-cell" role="columnheader">IP Address</th>
                    <SortHeader label="Location"  sortKey="rack"     current={sortKey} dir={sortDir} onClick={handleSort} />
                    <SortHeader label="Last seen" sortKey="lastSeen" current={sortKey} dir={sortDir} onClick={handleSort} className="hidden xl:table-cell" />
                    <th className="py-3 pr-4 text-right font-semibold" role="columnheader">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody role="rowgroup">
                  {filtered.map(obj => (
                    <ObjectRow
                      key={obj.id}
                      obj={obj}
                      onNavigate={id => navigate(`/server/${id}`)}
                    />
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-5 mt-3 px-1 flex-wrap" role="note" aria-label="Status legend">
          {(Object.entries(STATUS_CONFIG) as [Status, typeof STATUS_CONFIG[Status]][]).map(([status, cfg]) => {
            const Icon = cfg.icon;
            const colors: Record<Status, string> = { critical: 'text-danger', warning: 'text-warn', healthy: 'text-ok' };
            return (
              <div key={status} className="flex items-center gap-1.5">
                <Icon className={`w-3.5 h-3.5 ${colors[status]}`} aria-hidden="true" />
                <span className="text-xs text-lo">{cfg.label}</span>
              </div>
            );
          })}
          <span className="text-xs text-lo ml-auto hidden sm:block">
            Click any row to open device details
          </span>
        </div>
      </main>
    </div>
  );
}