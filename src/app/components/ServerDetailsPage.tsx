import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import {
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Server,
  Network,
  Router,
  Layers,
  HardDrive,
  ArrowRightLeft,
  Globe,
  MessageSquare,
  Zap,
  RefreshCw,
  ShieldAlert,
  ArrowUpDown,
  Tag,
  Clock,
  Copy,
  ExternalLink,
  Activity,
  Cpu,
  MemoryStick,
  Package,
  ChevronDown,
} from 'lucide-react';
import { mockObjects, NetworkObject, Port, getObjectById } from '../data/mockData';
import { RackVisualization } from './RackVisualization';

// ── Static config ──────────────────────────────────────────────────────────────
const TYPE_ICONS: Record<string, React.FC<{ className?: string }>> = {
  server: Server, switch: Network, router: Router, load_balancer: Layers, storage: HardDrive,
};

// ── Incident Command Zone ──────────────────────────────────────────────────────
// Priority: STATE → IMPACT → ACTION. Must answer all three in < 5 seconds.
function IncidentCommandZone({
  object,
  onDrain,
}: {
  object: NetworkObject;
  onDrain: () => void;
}) {
  const Icon = TYPE_ICONS[object.type] ?? Server;

  // ── CRITICAL ────────────────────────────────────────────────────────────────
  if (object.status === 'critical') {
    return (
      <div className="bg-danger-bg border-b-2 border-danger/40">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {/* Col 1: State — WHO/WHAT is broken */}
            <div className="flex items-start gap-4">
              <div className="relative shrink-0 mt-1">
                <span className="absolute inset-0 rounded-full bg-danger animate-ping opacity-40" />
                <span className="relative flex w-5 h-5 rounded-full bg-danger items-center justify-center">
                  <AlertCircle className="w-3 h-3 text-white" />
                </span>
              </div>
              <div>
                <div className="text-danger text-xs font-bold uppercase tracking-widest mb-1.5">
                  Critical — Immediate Action Required
                </div>
                <h1 className="text-2xl font-mono font-bold text-hi leading-none">{object.name}</h1>
                <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-mid">
                  <span className="capitalize">{object.type.replace('_', ' ')}</span>
                  <span className="text-lo">·</span>
                  <span>{object.rack}</span>
                  <span className="text-lo">·</span>
                  <span>U{object.rackUnit}–{object.rackUnit + object.rackSize - 1}</span>
                  <span className="text-lo">·</span>
                  <span className="font-mono">{object.ip}</span>
                </div>
                <div className="mt-1.5 text-xs text-lo">
                  Uptime: {object.uptime ?? '—'} · Last seen: {object.lastSeen}
                </div>
              </div>
            </div>

            {/* Col 2: Impact — WHAT is affected */}
            <div>
              <p className="text-danger text-xs font-bold uppercase tracking-wide mb-2">What's Happening</p>
              <ul className="space-y-1.5 mb-4">
                {(object.issues ?? []).map((issue, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="text-danger shrink-0 font-bold leading-none">▶</span>
                    <span className="text-sm text-hi">{issue}</span>
                  </li>
                ))}
              </ul>
              {object.impact && object.impact.length > 0 && (
                <>
                  <p className="text-mid text-xs font-bold uppercase tracking-wide mb-1.5">
                    Downstream Impact
                  </p>
                  <ul className="space-y-1">
                    {object.impact.map((imp, i) => (
                      <li key={i} className="flex items-center gap-2 mb-[4px]">
                        <span className="text-lo shrink-0 leading-none">→</span>
                        <span className="text-mid text-xs">{imp}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>

            {/* Col 3: Actions — WHAT TO DO */}
            <div>
              <p className="text-lo text-xs font-bold uppercase tracking-wide mb-2">
                Recommended Actions
              </p>
              <div className="space-y-2">
                <button
                  onClick={onDrain}
                  className="w-full flex items-center gap-2 px-4 py-2.5 bg-danger hover:bg-danger/80 text-white rounded-lg text-sm font-bold transition-colors text-left"
                >
                  <ArrowUpDown className="w-4 h-4 shrink-0" />
                  1. Drain Traffic Now
                  <span className="ml-auto text-xs opacity-70 whitespace-nowrap">Recommended</span>
                </button>
                <button className="w-full flex items-center gap-2 px-4 py-2 bg-danger-bg border border-danger/30 text-danger-text hover:bg-danger/10 rounded-lg text-sm transition-colors text-left">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  2. Open Incident Ticket
                </button>
                <button className="w-full flex items-center gap-2 px-4 py-2 bg-surface border border-line text-hi hover:bg-subtle rounded-lg text-sm transition-colors text-left">
                  <RefreshCw className="w-4 h-4 shrink-0 text-lo" />
                  3. Schedule Replacement
                </button>
                <button className="w-full flex items-center gap-2 px-4 py-2 bg-surface border border-line text-hi hover:bg-subtle rounded-lg text-sm transition-colors text-left">
                  <Zap className="w-4 h-4 shrink-0 text-info" />
                  SSH / Console Access
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── WARNING ──────────────────────────────────────────────────────────────────
  if (object.status === 'warning') {
    return (
      <div className="bg-warn-bg border-b border-warn/30 px-4 md:px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-start gap-6 flex-wrap">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-warn shrink-0 mt-0.5" />
              <div>
                <p className="text-warn-text text-sm font-bold uppercase tracking-wide">Warning</p>
                <h1 className="text-xl font-mono font-bold text-hi">{object.name}</h1>
                <p className="text-xs text-lo mt-0.5">
                  {object.type.replace('_', ' ')} · {object.rack} · U{object.rackUnit} · {object.ip}
                </p>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-warn-text uppercase tracking-wide mb-1">Issues</p>
              {(object.issues ?? []).map((issue, i) => (
                <p key={i} className="text-sm text-hi">⚑ {issue}</p>
              ))}
              {object.impact && (
                <p className="text-xs text-mid mt-1">→ {object.impact[0]}</p>
              )}
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={onDrain}
                className="flex items-center gap-2 px-4 py-2 bg-warn-bg border border-warn/30 text-warn-text hover:bg-warn/10 rounded-lg text-sm font-medium transition-colors"
              >
                <ArrowUpDown className="w-4 h-4" />
                Drain Traffic
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-surface border border-line text-hi hover:bg-subtle rounded-lg text-sm transition-colors">
                <ShieldAlert className="w-4 h-4 text-warn" />
                Open Incident
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── HEALTHY ─────────────────────────────────────────────────────────────────
  return (
    <div className="bg-surface border-b border-line px-4 md:px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-ok-bg border border-ok/20 flex items-center justify-center shrink-0">
            {(() => { const Ic = TYPE_ICONS[object.type] ?? Server; return <Ic className="w-5 h-5 text-ok-text" />; })()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-mono font-bold text-hi">{object.name}</h1>
              <span className="flex items-center gap-1 text-xs bg-ok-bg text-ok-text px-2 py-0.5 rounded-full border border-ok/20 font-semibold">
                <CheckCircle2 className="w-3 h-3" /> Healthy
              </span>
            </div>
            <p className="text-xs text-lo mt-0.5">
              {object.type.replace('_', ' ')} · {object.rack} · U{object.rackUnit} · {object.ip}
              · Uptime: {object.uptime ?? '—'}
            </p>
          </div>
        </div>
        <div className="ml-auto flex gap-2">
          <button className="flex items-center gap-1.5 text-sm text-mid hover:text-hi bg-subtle border border-line px-3 py-1.5 rounded-lg transition-colors">
            <Zap className="w-3.5 h-3.5 text-info" /> SSH
          </button>
          <button className="flex items-center gap-1.5 text-sm text-mid hover:text-hi bg-subtle border border-line px-3 py-1.5 rounded-lg transition-colors">
            <Activity className="w-3.5 h-3.5 text-[#8B5CF6]" /> Metrics
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Hardware strip ─────────────────────────────────────────────────────────────
function HardwareStrip({ object }: { object: NetworkObject }) {
  const facts = [
    object.ip       && { label: 'IP',      value: object.ip,       mono: true, icon: Globe },
    object.uptime   && { label: 'Uptime',   value: object.uptime,   mono: false, icon: Clock },
    object.os       && { label: 'OS',       value: object.os,       mono: false, icon: Server },
    object.cpu      && { label: 'CPU',      value: object.cpu,      mono: false, icon: Cpu },
    object.ram      && { label: 'RAM',      value: object.ram,      mono: false, icon: MemoryStick },
    object.disk     && { label: 'Disk',     value: object.disk,     mono: false, icon: HardDrive },
    object.vendor   && { label: 'Vendor',   value: `${object.vendor}${object.model ? ' ' + object.model : ''}`, mono: false, icon: Package },
    object.serial   && { label: 'Serial',   value: object.serial,   mono: true,  icon: Tag },
  ].filter(Boolean) as { label: string; value: string; mono: boolean; icon: React.FC<{ className?: string }> }[];

  if (facts.length === 0) return null;

  return (
    <div className="bg-subtle rounded-xl border border-line p-3 overflow-x-auto bg-[#eff6ff]">
      <div className="flex flex-wrap gap-x-6 gap-y-2 min-w-0">
        {facts.map((f) => (
          <div key={f.label} className="flex items-center gap-1.5 min-w-0">
            <f.icon className="w-3.5 h-3.5 text-lo shrink-0" />
            <span className="text-xs text-lo whitespace-nowrap">{f.label}:</span>
            <span className={`text-xs text-hi ${f.mono ? 'font-mono' : ''} truncate max-w-[200px]`}>
              {f.value}
            </span>
            {f.label === 'IP' && (
              <button
                onClick={() => navigator.clipboard.writeText(f.value)}
                className="text-lo hover:text-mid ml-0.5 shrink-0"
              >
                <Copy className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Port Faceplate ─────────────────────────────────────────────────────────────
// Visual LED-style grid — scan port status in < 2 seconds without reading text
function PortFaceplate({ ports }: { ports: Port[] }) {
  const [hoveredPort, setHoveredPort] = useState<Port | null>(null);
  const [showTable, setShowTable] = useState(false);

  const up      = ports.filter((p) => p.status === 'up').length;
  const down    = ports.filter((p) => p.status === 'down').length;
  const unknown = ports.filter((p) => p.status === 'unknown').length;

  return (
    <div className="bg-surface rounded-xl border border-line overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-line flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-hi">Port Status</span>
          <span className="flex items-center gap-1.5 text-xs">
            <span className="w-2 h-2 rounded-sm bg-ok" />
            <span className="text-ok-text font-semibold">{up} UP</span>
          </span>
          {down > 0 && (
            <span className="flex items-center gap-1.5 text-xs">
              <span className="w-2 h-2 rounded-sm bg-danger" />
              <span className="text-danger-text font-semibold">{down} DOWN</span>
            </span>
          )}
          {unknown > 0 && (
            <span className="flex items-center gap-1.5 text-xs">
              <span className="w-2 h-2 rounded-sm bg-line" />
              <span className="text-lo">{unknown} Unknown</span>
            </span>
          )}
        </div>
        <span className="text-xs text-lo">{ports.length} ports total</span>
      </div>

      {/* Faceplate — light panel with colored port indicators */}
      <div className="px-4 py-3 bg-surface">
        <div className="flex flex-wrap gap-1">
          {ports.map((port) => (
            <div
              key={port.id}
              className={`relative cursor-pointer transition-opacity hover:opacity-70 ${
                port.status === 'up'
                  ? 'bg-ok'
                  : port.status === 'down'
                  ? 'bg-danger'
                  : 'bg-[#94A3B8]'
              }`}
              style={{ width: 20, height: 12, borderRadius: 2 }}
              onMouseEnter={() => setHoveredPort(port)}
              onMouseLeave={() => setHoveredPort(null)}
            />
          ))}
        </div>

        {/* Port tooltip — light card */}
        {hoveredPort && (
          <div className="mt-2 flex items-center gap-3 py-1.5 px-3 rounded-md bg-surface border border-line shadow-subtle">
            <span
              className={`w-2 h-2 rounded-sm shrink-0 ${
                hoveredPort.status === 'up' ? 'bg-ok' : hoveredPort.status === 'down' ? 'bg-danger' : 'bg-[#94A3B8]'
              }`}
            />
            <span className="font-mono text-xs text-hi font-semibold">{hoveredPort.name}</span>
            <span className="text-xs text-lo">{hoveredPort.speed}</span>
            {hoveredPort.connectedTo && (
              <span className="text-xs text-lo">→ {hoveredPort.connectedTo}</span>
            )}
            {hoveredPort.vlan && (
              <span className="text-xs text-lo">VLAN {hoveredPort.vlan}</span>
            )}
            <span
              className={`text-xs font-semibold ml-auto ${
                hoveredPort.status === 'up' ? 'text-ok-text' : hoveredPort.status === 'down' ? 'text-danger-text' : 'text-lo'
              }`}
            >
              {hoveredPort.status.toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* Expandable port table */}
      <button
        className="w-full flex items-center gap-2 px-4 py-2 bg-subtle hover:bg-line/40 border-t border-line text-xs text-mid transition-colors"
        onClick={() => setShowTable((v) => !v)}
      >
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showTable ? 'rotate-180' : ''}`} />
        {showTable ? 'Collapse port table' : 'Expand port table'}
        {down > 0 && (
          <span className="ml-auto text-xs text-danger-text font-semibold">{down} port{down > 1 ? 's' : ''} down</span>
        )}
      </button>

      {showTable && (
        <div className="overflow-x-auto border-t border-line">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-lo uppercase tracking-wide border-b border-line bg-subtle">
                <th className="pl-4 py-2 pr-3 font-semibold">Port</th>
                <th className="py-2 pr-3 font-semibold">Status</th>
                <th className="py-2 pr-3 font-semibold">Speed</th>
                <th className="py-2 pr-3 font-semibold hidden sm:table-cell">VLAN</th>
                <th className="py-2 pr-4 font-semibold hidden md:table-cell">Connected To</th>
              </tr>
            </thead>
            <tbody>
              {ports.slice(0, 24).map((port) => (
                <tr
                  key={port.id}
                  className={`border-b border-line last:border-0 border-l-4 ${
                    port.status === 'down' ? 'border-l-danger bg-danger/[0.03]'
                    : port.status === 'unknown' ? 'border-l-lo'
                    : 'border-l-transparent'
                  }`}
                >
                  <td className="pl-4 py-2 pr-3 font-mono font-semibold text-hi">{port.name}</td>
                  <td className="py-2 pr-3">
                    <span className={`inline-flex items-center gap-1 font-semibold ${
                      port.status === 'up' ? 'text-ok-text' : port.status === 'down' ? 'text-danger-text' : 'text-lo'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        port.status === 'up' ? 'bg-ok' : port.status === 'down' ? 'bg-danger' : 'bg-lo'
                      }`} />
                      {port.status}
                    </span>
                  </td>
                  <td className="py-2 pr-3 font-mono text-mid">{port.speed}</td>
                  <td className="py-2 pr-3 text-lo hidden sm:table-cell">{port.vlan ?? '—'}</td>
                  <td className="py-2 pr-4 hidden md:table-cell">
                    {port.connectedToId ? (
                      <Link to={`/server/${port.connectedToId}`} className="text-info hover:underline font-mono flex items-center gap-1">
                        {port.connectedTo} <ExternalLink className="w-2.5 h-2.5" />
                      </Link>
                    ) : <span className="text-lo">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {ports.length > 24 && (
            <p className="text-center text-xs text-lo py-2">+ {ports.length - 24} more ports</p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Connection Chain ───────────────────────────────────────────────────────────
// Horizontal dependency view: shows where THIS object sits in the traffic path
// Answers "what goes through this object" in < 2 seconds
function ConnectionChain({ object }: { object: NetworkObject }) {
  if (object.connections.length === 0) return null;

  const uplinks   = object.connections.filter((c) => c.type === 'uplink');
  const downlinks = object.connections.filter((c) => c.type === 'downlink');
  const peers     = object.connections.filter((c) => c.type === 'peer');
  const mgmt      = object.connections.filter((c) => c.type === 'management');

  const connStatusDot = (id: string) => {
    const obj = getObjectById(id);
    if (!obj) return 'bg-lo';
    return obj.status === 'critical' ? 'bg-danger' : obj.status === 'warning' ? 'bg-warn' : 'bg-ok';
  };

  return (
    <div className="bg-surface rounded-xl border border-line overflow-hidden">
      <div className="px-4 py-3 border-b border-line">
        <p className="text-sm font-semibold text-hi">Network Connections</p>
        <p className="text-xs text-lo mt-0.5">
          {object.connections.length} direct connection{object.connections.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Traffic path chain — uplinks → THIS → downlinks */}
      {(uplinks.length > 0 || downlinks.length > 0) && (
        <div className="px-4 py-4 border-b border-line overflow-x-auto">
          <div className="flex items-center gap-1 min-w-max">
            {/* Uplinks (things above this in the hierarchy) */}
            {uplinks.map((conn, i) => {
              const target = getObjectById(conn.targetId);
              return (
                <div key={conn.targetId} className="flex items-center gap-1">
                  <Link
                    to={`/server/${conn.targetId}`}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-subtle border border-line hover:border-info/40 hover:bg-info-bg/30 transition-colors group"
                  >
                    <span className={`w-2 h-2 rounded-full shrink-0 ${connStatusDot(conn.targetId)}`} />
                    <span className="font-mono text-xs text-mid group-hover:text-info">{conn.targetName}</span>
                    {conn.bandwidth && <span className="text-lo text-[10px]">{conn.bandwidth}</span>}
                  </Link>
                  <ChevronRight className="w-3.5 h-3.5 text-lo shrink-0" />
                </div>
              );
            })}

            {/* THIS object — highlighted */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-info text-white font-semibold shrink-0">
              <span className="w-2 h-2 rounded-full bg-white/70 shrink-0" />
              <span className="font-mono text-xs">{object.name}</span>
            </div>

            {/* Downlinks (things this serves) */}
            {downlinks.map((conn) => (
              <div key={conn.targetId} className="flex items-center gap-1">
                <ChevronRight className="w-3.5 h-3.5 text-lo shrink-0" />
                <Link
                  to={`/server/${conn.targetId}`}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-subtle border border-line hover:border-info/40 hover:bg-info-bg/30 transition-colors group"
                >
                  <span className={`w-2 h-2 rounded-full shrink-0 ${connStatusDot(conn.targetId)}`} />
                  <span className="font-mono text-xs text-mid group-hover:text-info">{conn.targetName}</span>
                  {conn.bandwidth && <span className="text-lo text-[10px]">{conn.bandwidth}</span>}
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All connections detail list */}
      <div className="divide-y divide-line">
        {object.connections.map((conn) => {
          const target = getObjectById(conn.targetId);
          const dot = connStatusDot(conn.targetId);
          const typeColor: Record<string, string> = {
            uplink:     'bg-info-bg text-info-text border-info/20',
            downlink:   'bg-subtle text-lo border-line',
            peer:       'bg-ok-bg text-ok-text border-ok/20',
            management: 'bg-subtle text-lo border-line',
          };
          return (
            <Link
              key={conn.targetId}
              to={`/server/${conn.targetId}`}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-subtle transition-colors group"
            >
              <span className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-semibold text-hi group-hover:text-info transition-colors">
                    {conn.targetName}
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${typeColor[conn.type] ?? typeColor.peer}`}>
                    {conn.type}
                  </span>
                  {conn.bandwidth && (
                    <span className="text-[10px] font-mono bg-subtle border border-line px-1.5 py-0.5 rounded text-lo">
                      {conn.bandwidth}
                    </span>
                  )}
                </div>
                {conn.label && <p className="text-xs text-lo mt-0.5">{conn.label}</p>}
                {(conn.localPort || conn.remotePort) && (
                  <p className="text-xs text-lo font-mono mt-0.5">
                    {conn.localPort && `${conn.localPort}`}
                    {conn.localPort && conn.remotePort && ' → '}
                    {conn.remotePort && `${conn.remotePort}`}
                  </p>
                )}
              </div>
              {target && target.status !== 'healthy' && (
                <span className={`text-xs px-1.5 py-0.5 rounded font-semibold ${
                  target.status === 'critical' ? 'bg-danger-bg text-danger-text' : 'bg-warn-bg text-warn-text'
                }`}>
                  {target.status}
                </span>
              )}
              <ExternalLink className="w-3 h-3 text-lo group-hover:text-info shrink-0" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// ── IP Table ───────────────────────────────────────────────────────────────────
function IPTable({ object }: { object: NetworkObject }) {
  if (object.ipAddresses.length === 0) return null;
  const typeBadge: Record<string, string> = {
    primary:   'bg-info-bg text-info-text border-info/20',
    secondary: 'bg-subtle text-mid border-line',
    virtual:   'bg-[#EEF2FF] text-[#4338CA] border-[#A5B4FC]/30',
    loopback:  'bg-warn-bg text-warn-text border-warn/20',
  };
  return (
    <div className="bg-surface rounded-xl border border-line overflow-hidden">
      <div className="px-4 py-3 border-b border-line flex items-center justify-between">
        <span className="text-sm font-semibold text-hi">IP Addresses</span>
        <span className="text-xs text-lo">{object.ipAddresses.length} assigned</span>
      </div>
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left text-lo uppercase tracking-wide border-b border-line bg-subtle">
            <th className="pl-4 py-2 pr-3 font-semibold">Address</th>
            <th className="py-2 pr-3 font-semibold hidden sm:table-cell">Interface</th>
            <th className="py-2 pr-3 font-semibold">Type</th>
            <th className="py-2 pr-4 font-semibold hidden md:table-cell">rDNS</th>
          </tr>
        </thead>
        <tbody>
          {object.ipAddresses.map((ip) => (
            <tr key={ip.address} className="border-b border-line last:border-0 hover:bg-subtle">
              <td className="pl-4 py-2 pr-3">
                <div className="flex items-center gap-1">
                  <span className="font-mono font-semibold text-hi">{ip.address}{ip.mask}</span>
                  <button
                    onClick={() => navigator.clipboard.writeText(ip.address)}
                    className="text-lo hover:text-mid"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              </td>
              <td className="py-2 pr-3 font-mono text-lo hidden sm:table-cell">{ip.iface}</td>
              <td className="py-2 pr-3">
                <span className={`px-1.5 py-0.5 rounded-full border text-[10px] font-medium ${typeBadge[ip.type] ?? typeBadge.secondary}`}>
                  {ip.type}
                </span>
              </td>
              <td className="py-2 pr-4 font-mono text-lo hidden md:table-cell">{ip.rdns ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Comments feed ──────────────────────────────────────────────────────────────
function CommentsPanel({ object }: { object: NetworkObject }) {
  const [newComment, setNewComment] = useState('');
  if (object.comments.length === 0 && !newComment) {
    return (
      <div className="bg-surface rounded-xl border border-line p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-hi">Activity Log</span>
        </div>
        <p className="text-xs text-lo text-center py-4">No comments yet.</p>
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a note or action taken…"
          rows={2}
          className="w-full border border-line rounded-lg p-2.5 text-sm text-hi placeholder:text-lo bg-subtle focus:outline-none focus:ring-2 focus:ring-info/30 focus:border-info resize-none"
        />
      </div>
    );
  }

  const typeCls: Record<string, string> = {
    warning: 'border-l-warn bg-warn-bg/50',
    action:  'border-l-ok bg-ok-bg/50',
    info:    'border-l-info bg-info-bg/30',
  };

  return (
    <div className="bg-surface rounded-xl border border-line overflow-hidden">
      <div className="px-4 py-3 border-b border-line">
        <span className="text-sm font-semibold text-hi">Activity Log</span>
        <span className="text-xs text-lo ml-2">{object.comments.length} entries</span>
      </div>
      <div className="divide-y divide-line">
        {object.comments.map((comment) => (
          <div
            key={comment.id}
            className={`px-4 py-3 border-l-4 ${typeCls[comment.type ?? 'info'] ?? typeCls.info}`}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-6 h-6 rounded-full bg-subtle border border-line flex items-center justify-center text-[10px] font-bold text-mid">
                {comment.author.slice(0, 2).toUpperCase()}
              </div>
              <span className="text-xs font-semibold text-hi">{comment.author}</span>
              <span className="text-xs text-lo ml-auto">{comment.timestamp}</span>
            </div>
            <p className="text-sm text-hi leading-relaxed">{comment.text}</p>
          </div>
        ))}
      </div>
      <div className="p-4 border-t border-line bg-subtle bg-[#eff6ff]">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a note, action taken, or observation…"
          rows={2}
          className="w-full border border-line rounded-lg p-2.5 text-sm text-hi placeholder:text-lo bg-surface focus:outline-none focus:ring-2 focus:ring-info/30 focus:border-info resize-none"
        />
        <div className="flex justify-end mt-2">
          <button
            disabled={!newComment.trim()}
            className="px-3 py-1.5 bg-info hover:bg-[#1D4ED8] disabled:opacity-40 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            Post Note
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export function ServerDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [draining, setDraining] = useState(false);

  const object = id ? mockObjects.find((o) => o.id === id) : undefined;

  if (!object) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <p className="text-mid text-lg mb-2">Object not found</p>
          <button onClick={() => navigate('/')} className="text-info hover:underline text-sm">
            ← Back to objects list
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      {/* ── Breadcrumb ─────────────────────────────────────────────────────── */}
      <div className="bg-surface border-b border-line px-4 md:px-6 py-2">
        <div className="max-w-7xl mx-auto flex items-center gap-1.5 text-xs text-lo">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1 hover:text-hi transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Objects
          </button>
          <ChevronRight className="w-3 h-3" />
          <span>{object.rack}</span>
          <ChevronRight className="w-3 h-3" />
          <span className="font-mono font-semibold text-hi">{object.name}</span>
          {object.status !== 'healthy' && (
            <span
              className={`ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                object.status === 'critical'
                  ? 'bg-danger text-white'
                  : 'bg-warn-bg text-warn-text'
              }`}
            >
              {object.status}
            </span>
          )}
        </div>
      </div>

      {/* ── Incident Command Zone ─────────────────────────────────────────── */}
      <IncidentCommandZone object={object} onDrain={() => setDraining((d) => !d)} />

      {/* ── Main content grid ─────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-5">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-5">
          {/* ── Left: operational detail (2/3 width) ────────────────────── */}
          <div className="xl:col-span-2 space-y-4">
            {/* Hardware facts strip */}
            <HardwareStrip object={object} />

            {/* Tags */}
            {object.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {object.tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 text-xs bg-subtle border border-line text-mid px-2 py-1 rounded-full">
                    <Tag className="w-2.5 h-2.5 text-lo" />{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Port faceplate + table */}
            {object.ports.length > 0 && <PortFaceplate ports={object.ports} />}

            {/* Connection chain — dependency path */}
            <ConnectionChain object={object} />

            {/* IP addresses */}
            <IPTable object={object} />

            {/* NAT rules (if any) */}
            {object.natEntries.length > 0 && (
              <div className="bg-surface rounded-xl border border-line overflow-hidden">
                <div className="px-4 py-3 border-b border-line flex items-center justify-between">
                  <span className="text-sm font-semibold text-hi">NAT Rules</span>
                  <span className="text-xs text-lo">{object.natEntries.length} rules</span>
                </div>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-lo uppercase tracking-wide border-b border-line bg-subtle">
                      <th className="pl-4 py-2 pr-3 font-semibold">Internal</th>
                      <th className="py-2 pr-3 font-semibold hidden sm:table-cell">External</th>
                      <th className="py-2 pr-3 font-semibold">Proto</th>
                      <th className="py-2 pr-4 font-semibold hidden md:table-cell">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {object.natEntries.map((entry) => (
                      <tr key={entry.id} className="border-b border-line last:border-0 hover:bg-subtle">
                        <td className="pl-4 py-2 pr-3 font-mono text-hi">
                          {entry.internal}
                          {entry.internalPort && <span className="text-lo">:{entry.internalPort}</span>}
                        </td>
                        <td className="py-2 pr-3 font-mono text-hi hidden sm:table-cell">
                          {entry.external}
                          {entry.externalPort && <span className="text-lo">:{entry.externalPort}</span>}
                        </td>
                        <td className="py-2 pr-3">
                          <span className="font-mono bg-info-bg text-info-text border border-info/20 px-1.5 py-0.5 rounded">
                            {entry.protocol}
                          </span>
                        </td>
                        <td className="py-2 pr-4 text-lo hidden md:table-cell">{entry.description ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Activity / comments */}
            <CommentsPanel object={object} />
          </div>

          {/* ── Right: rack context (sticky on xl) ──────────────────────── */}
          <div className="space-y-4 xl:sticky xl:top-20 xl:self-start">
            <RackVisualization
              rack={object.rack}
              selectedObjectId={object.id}
              allObjects={mockObjects}
            />

            {/* Related alerts — connections with issues */}
            {(() => {
              const problemConnections = object.connections
                .map((c) => ({ conn: c, target: getObjectById(c.targetId) }))
                .filter(({ target }) => target && target.status !== 'healthy');

              if (problemConnections.length === 0) return null;

              return (
                <div className="bg-surface rounded-xl border border-line overflow-hidden">
                  <div className="px-4 py-3 border-b border-line flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-warn" />
                    <span className="text-sm font-semibold text-hi">Connected with Issues</span>
                  </div>
                  <div className="divide-y divide-line">
                    {problemConnections.map(({ conn, target }) => (
                      <Link
                        key={conn.targetId}
                        to={`/server/${conn.targetId}`}
                        className="flex items-center gap-2 px-4 py-2.5 hover:bg-subtle transition-colors group"
                      >
                        <span className={`w-2 h-2 rounded-full shrink-0 ${
                          target!.status === 'critical' ? 'bg-danger' : 'bg-warn'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className="font-mono text-xs font-semibold text-hi group-hover:text-info">
                            {conn.targetName}
                          </p>
                          <p className="text-xs text-lo truncate">
                            {target!.issues?.[0] ?? conn.type}
                          </p>
                        </div>
                        <ExternalLink className="w-3 h-3 text-lo group-hover:text-info shrink-0" />
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}