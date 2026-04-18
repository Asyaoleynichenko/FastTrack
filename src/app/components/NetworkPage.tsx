import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Network,
  Router,
  Layers,
  AlertCircle,
  AlertTriangle,
  ExternalLink,
  ArrowRight,
  Globe,
  Shield,
  Activity,
  RefreshCw,
} from 'lucide-react';
import { mockObjects, NetworkObject, ObjectType } from '../data/mockData';

const NETWORK_TYPES: ObjectType[] = ['switch', 'router', 'load_balancer'];

const TYPE_CONFIG: Record<string, {
  icon: React.FC<{ className?: string }>;
  color: string;
  bg: string;
  label: string;
}> = {
  switch:        { icon: Network, color: 'text-ok-text',      bg: 'bg-ok-bg border-ok/20',      label: 'Switch'        },
  router:        { icon: Router,  color: 'text-warn-text',    bg: 'bg-warn-bg border-warn/20',   label: 'Router'        },
  load_balancer: { icon: Layers,  color: 'text-[#4338CA]',   bg: 'bg-[#EEF2FF] border-[#A5B4FC]/30', label: 'Load Balancer' },
};

const STATUS_DOT: Record<string, string> = {
  healthy:  'bg-ok',
  warning:  'bg-warn',
  critical: 'bg-danger',
};

// ── Topology tiers ────────────────────────────────────────────────────────────
const TIERS = [
  { label: 'Edge / WAN',  ids: ['router-edge-01'],                      description: 'Internet-facing routers and gateways' },
  { label: 'Core',        ids: ['sw-a01-core', 'sw-a02-core', 'sw-b01-core'], description: 'Core switching fabric'          },
  { label: 'Services',    ids: ['lb-prod-01', 'mgmt-switch-01'],        description: 'Load balancers and management'        },
];

function StatusPulse({ status }: { status: string }) {
  return (
    <span className="relative flex h-2.5 w-2.5 shrink-0">
      {status !== 'healthy' && (
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${STATUS_DOT[status]} opacity-50`} />
      )}
      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${STATUS_DOT[status]}`} />
    </span>
  );
}

function NetworkDeviceRow({ obj }: { obj: NetworkObject }) {
  const navigate = useNavigate();
  const cfg  = TYPE_CONFIG[obj.type] ?? TYPE_CONFIG.switch;
  const Icon = cfg.icon;
  const upPorts   = obj.ports.filter((p) => p.status === 'up').length;
  const downPorts = obj.ports.filter((p) => p.status === 'down').length;

  return (
    <tr
      className="group hover:bg-subtle cursor-pointer border-b border-line last:border-0 transition-colors"
      onClick={() => navigate(`/server/${obj.id}`)}
    >
      <td className="pl-5 py-3 w-10">
        <StatusPulse status={obj.status} />
      </td>
      <td className="py-3 pr-4">
        <div className="flex items-center gap-2 mb-0.5">
          <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${cfg.bg} ${cfg.color}`}>
            <Icon className="w-3 h-3" />
            {cfg.label}
          </span>
        </div>
        <p className="font-mono text-sm font-semibold text-hi group-hover:text-info transition-colors">
          {obj.name}
        </p>
      </td>
      <td className="py-3 pr-4 hidden sm:table-cell">
        <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full border font-medium ${
          obj.status === 'critical' ? 'bg-danger-bg text-danger-text border-danger/20'
          : obj.status === 'warning' ? 'bg-warn-bg text-warn-text border-warn/20'
          : 'bg-ok-bg text-ok-text border-ok/20'
        }`}>
          {obj.status}
        </span>
        {obj.issues && obj.issues.length > 0 && (
          <p className="text-xs text-lo mt-0.5 max-w-xs truncate">{obj.issues[0]}</p>
        )}
      </td>
      <td className="py-3 pr-4 hidden md:table-cell">
        <span className="font-mono text-xs text-mid bg-subtle border border-line px-2 py-0.5 rounded-md">{obj.ip}</span>
      </td>
      <td className="py-3 pr-4 hidden lg:table-cell">
        {obj.ports.length > 0 ? (
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-xs text-ok-text">
              <span className="w-1.5 h-1.5 rounded-full bg-ok" />{upPorts} up
            </span>
            {downPorts > 0 && (
              <span className="flex items-center gap-1 text-xs text-danger-text">
                <span className="w-1.5 h-1.5 rounded-full bg-danger" />{downPorts} down
              </span>
            )}
          </div>
        ) : (
          <span className="text-xs text-lo">—</span>
        )}
      </td>
      <td className="py-3 pr-4 hidden xl:table-cell">
        <span className="text-xs text-lo">{obj.connections.length} peer{obj.connections.length !== 1 ? 's' : ''}</span>
      </td>
      <td className="py-3 pr-4 hidden lg:table-cell">
        <span className="text-xs text-mid font-medium">{obj.rack}</span>
      </td>
      <td className="py-3 pr-4 hidden xl:table-cell">
        <span className="text-xs text-lo">{obj.uptime ?? '—'}</span>
      </td>
      <td className="py-3 pr-4 text-right">
        <button
          className="opacity-0 group-hover:opacity-100 inline-flex items-center gap-1 text-xs text-info-text bg-info-bg hover:bg-info/10 px-2 py-1 rounded-md transition-all"
          onClick={(e) => { e.stopPropagation(); navigate(`/server/${obj.id}`); }}
        >
          View <ExternalLink className="w-3 h-3" />
        </button>
      </td>
    </tr>
  );
}

function TierNode({ obj }: { obj: NetworkObject }) {
  const navigate = useNavigate();
  const cfg  = TYPE_CONFIG[obj.type] ?? TYPE_CONFIG.switch;
  const Icon = cfg.icon;

  return (
    <button
      onClick={() => navigate(`/server/${obj.id}`)}
      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 bg-surface hover:shadow-card transition-all group min-w-[100px] ${
        obj.status === 'critical' ? 'border-danger/30 hover:border-danger/50'
        : obj.status === 'warning' ? 'border-warn/30 hover:border-warn/50'
        : 'border-line hover:border-info/30'
      }`}
    >
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${cfg.bg}`}>
        <Icon className={`w-5 h-5 ${cfg.color}`} />
      </div>
      <p className="font-mono text-xs font-semibold text-hi group-hover:text-info transition-colors text-center leading-tight">
        {obj.name}
      </p>
      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[obj.status]}`} />
    </button>
  );
}

export function NetworkPage() {
  const [activeSection, setActiveSection] = useState<'topology' | 'devices'>('topology');

  const networkDevices = mockObjects.filter((o) => NETWORK_TYPES.includes(o.type));
  const criticalCount  = networkDevices.filter((o) => o.status === 'critical').length;
  const warningCount   = networkDevices.filter((o) => o.status === 'warning').length;
  const healthyCount   = networkDevices.filter((o) => o.status === 'healthy').length;

  const externalIPs  = mockObjects.flatMap((o) => o.ipAddresses.filter((ip) => ip.address.startsWith('203.')));
  const totalNATRules = mockObjects.reduce((sum, o) => sum + o.natEntries.length, 0);

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <div className="bg-surface border-b border-line px-4 md:px-6 py-4 md:py-5">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-lg md:text-xl font-bold text-hi">Network</h1>
              <p className="text-xs md:text-sm text-lo mt-0.5">{networkDevices.length} network devices across all racks</p>
            </div>
            <button className="flex items-center gap-2 text-sm text-mid hover:text-hi bg-subtle hover:bg-line/40 px-3 py-2 rounded-lg transition-colors border border-line">
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: Activity,      label: 'Healthy devices', value: healthyCount,    color: 'text-ok-text',     bg: 'bg-ok-bg border-ok/20'           },
              { icon: AlertTriangle, label: 'Warnings',        value: warningCount,    color: 'text-warn-text',   bg: 'bg-warn-bg border-warn/20'        },
              { icon: Globe,         label: 'Public IPs',      value: externalIPs.length, color: 'text-info-text', bg: 'bg-info-bg border-info/20'       },
              { icon: Shield,        label: 'NAT rules',       value: totalNATRules,   color: 'text-[#4338CA]',  bg: 'bg-[#EEF2FF] border-[#A5B4FC]/30' },
            ].map((stat) => (
              <div key={stat.label} className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${stat.bg}`}>
                <stat.icon className={`w-4 h-4 ${stat.color} shrink-0`} />
                <div>
                  <p className={`text-xl font-bold leading-none ${stat.color}`}>{stat.value}</p>
                  <p className={`text-xs mt-0.5 ${stat.color} opacity-70`}>{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-6 space-y-4">
        {/* Section toggle */}
        <div className="flex items-center gap-1 bg-subtle border border-line rounded-lg p-0.5 w-fit">
          {(['topology', 'devices'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setActiveSection(s)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                activeSection === s
                  ? 'bg-surface text-hi shadow-subtle border border-line'
                  : 'text-lo hover:text-mid'
              }`}
            >
              {s === 'topology' ? 'Topology' : `Devices (${networkDevices.length})`}
            </button>
          ))}
        </div>

        {/* ── Topology view ── */}
        {activeSection === 'topology' && (
          <div className="bg-surface rounded-xl border border-line shadow-subtle overflow-hidden">
            <div className="px-5 py-4 border-b border-line">
              <p className="text-sm font-semibold text-hi">Network Topology</p>
              <p className="text-xs text-lo mt-0.5">3-tier architecture — click any device to view details</p>
            </div>
            <div className="p-6 space-y-6">
              {TIERS.map((tier, tierIdx) => {
                const tierObjects = tier.ids
                  .map((id) => mockObjects.find((o) => o.id === id))
                  .filter(Boolean) as NetworkObject[];
                if (tierObjects.length === 0) return null;

                return (
                  <div key={tier.label}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-px flex-1 bg-line" />
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-semibold text-hi uppercase tracking-wide">{tier.label}</span>
                        <span className="text-xs text-lo">— {tier.description}</span>
                      </div>
                      <div className="h-px flex-1 bg-line" />
                    </div>

                    <div className="flex flex-wrap justify-center gap-4">
                      {tierObjects.map((obj) => <TierNode key={obj.id} obj={obj} />)}
                    </div>

                    {tierIdx < TIERS.length - 1 && (
                      <div className="flex justify-center mt-4">
                        <div className="flex flex-col items-center gap-0.5">
                          <div className="w-px h-4 bg-line" />
                          <ArrowRight className="w-3.5 h-3.5 text-lo rotate-90" />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {/* Legend */}
            <div className="px-5 py-3 border-t border-line bg-subtle flex flex-wrap gap-4">
              {Object.entries(TYPE_CONFIG).map(([type, cfg]) => {
                const Icon = cfg.icon;
                return (
                  <div key={type} className="flex items-center gap-1.5">
                    <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                    <span className="text-xs text-lo">{cfg.label}</span>
                  </div>
                );
              })}
              <div className="ml-auto flex items-center gap-3">
                {[
                  { dot: 'bg-ok',     label: 'Healthy'  },
                  { dot: 'bg-warn',   label: 'Warning'  },
                  { dot: 'bg-danger', label: 'Critical' },
                ].map(({ dot, label }) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${dot}`} />
                    <span className="text-xs text-lo">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Devices table ── */}
        {activeSection === 'devices' && (
          <div className="bg-surface rounded-xl border border-line shadow-subtle overflow-clip">
            {criticalCount > 0 && (
              <div className="px-5 py-2.5 bg-danger-bg border-b border-danger/20 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-danger shrink-0" />
                <span className="text-xs text-danger-text font-medium">
                  {criticalCount} network device{criticalCount > 1 ? 's' : ''} in critical state — immediate attention required
                </span>
              </div>
            )}
            <table className="w-full">
              <thead className="sticky top-14 z-10 bg-subtle border-b border-line">
                <tr className="text-left text-xs text-lo uppercase tracking-wide">
                  <th className="pl-5 py-3 w-10" />
                  <th className="py-3 pr-4 font-semibold">Device</th>
                  <th className="py-3 pr-4 font-semibold hidden sm:table-cell">Status</th>
                  <th className="py-3 pr-4 font-semibold hidden md:table-cell">IP</th>
                  <th className="py-3 pr-4 font-semibold hidden lg:table-cell">Ports</th>
                  <th className="py-3 pr-4 font-semibold hidden xl:table-cell">Connections</th>
                  <th className="py-3 pr-4 font-semibold hidden lg:table-cell">Rack</th>
                  <th className="py-3 pr-4 font-semibold hidden xl:table-cell">Uptime</th>
                  <th className="py-3 pr-4" />
                </tr>
              </thead>
              <tbody>
                {['critical', 'warning', 'healthy'].flatMap((status) =>
                  networkDevices
                    .filter((o) => o.status === status)
                    .map((obj) => <NetworkDeviceRow key={obj.id} obj={obj} />)
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Public IP summary (topology view only) */}
        {activeSection === 'topology' && externalIPs.length > 0 && (
          <div className="bg-surface rounded-xl border border-line shadow-subtle overflow-hidden">
            <div className="px-5 py-4 border-b border-line flex items-center gap-2">
              <Globe className="w-4 h-4 text-info" />
              <p className="text-sm font-semibold text-hi">Public IP Addresses</p>
              <span className="text-xs text-lo ml-auto">{externalIPs.length} assigned</span>
            </div>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {externalIPs.map((ip, i) => {
                const owner = mockObjects.find((o) => o.ipAddresses.some((a) => a.address === ip.address));
                return (
                  <div
                    key={`${ip.address}-${i}`}
                    className="flex items-center gap-3 px-3 py-2.5 bg-subtle rounded-lg border border-line"
                  >
                    <Globe className="w-3.5 h-3.5 text-lo shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-xs font-semibold text-hi">{ip.address}{ip.mask}</p>
                      <p className="text-xs text-lo truncate">{owner?.name ?? '—'} · {ip.iface}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}