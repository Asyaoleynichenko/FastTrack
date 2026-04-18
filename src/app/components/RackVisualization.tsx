import { useState } from 'react';
import { useNavigate } from 'react-router';
import { NetworkObject, ObjectType, getObjectsByRack } from '../data/mockData';

const MAX_U = 20; // display first 20U for compactness

const typeColors: Record<ObjectType, string> = {
  server:        'bg-info',
  switch:        'bg-ok',
  router:        'bg-warn',
  load_balancer: 'bg-[#8B5CF6]',
  storage:       'bg-[#0EA5E9]',
};

const typeLabels: Record<ObjectType, string> = {
  server: 'SRV',
  switch: 'SW',
  router: 'RTR',
  load_balancer: 'LB',
  storage: 'SAN',
};

interface Props {
  rack: string;
  selectedObjectId?: string;
  allObjects: NetworkObject[];
}

export function RackVisualization({ rack, selectedObjectId, allObjects }: Props) {
  const navigate = useNavigate();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const rackObjects = getObjectsByRack(rack).filter((o) =>
    allObjects.some((a) => a.id === o.id)
  );

  // Build slot occupancy map
  const slotMap: Record<number, NetworkObject | null> = {};
  const startedAt: Record<number, boolean> = {};
  for (let u = 1; u <= MAX_U; u++) slotMap[u] = null;
  for (const obj of rackObjects) {
    for (let u = obj.rackUnit; u < obj.rackUnit + obj.rackSize && u <= MAX_U; u++) {
      slotMap[u] = obj;
      if (u === obj.rackUnit) startedAt[u] = true;
    }
  }

  const hoveredObj = hoveredId ? rackObjects.find((o) => o.id === hoveredId) : null;

  return (
    <div className="bg-surface rounded-xl border border-line overflow-hidden shadow-subtle">
      <div className="px-4 py-3 border-b border-line flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-hi">{rack}</p>
          <p className="text-xs text-lo">
            {rackObjects.length} objects · {MAX_U}U shown
          </p>
        </div>
        <div className="flex gap-1">
          {rackObjects.some((o) => o.status === 'critical') && (
            <span className="w-2 h-2 rounded-full bg-danger" />
          )}
          {rackObjects.some((o) => o.status === 'warning') && (
            <span className="w-2 h-2 rounded-full bg-warn" />
          )}
        </div>
      </div>

      {/* Rack frame — intentionally dark (realistic server rack styling) */}
      <div className="p-3">
        <div className="bg-slate-900 rounded-lg border-2 border-slate-700 overflow-hidden shadow-inner">
          {/* Rack top ear */}
          <div className="flex bg-slate-800 border-b border-slate-700 px-2 py-1">
            <span className="text-slate-500 text-xs font-mono">U#</span>
          </div>

          {/* Units */}
          <div className="p-1 flex flex-col gap-0.5">
            {Array.from({ length: MAX_U }, (_, i) => {
              const u = i + 1;
              const obj = slotMap[u];
              const isStart = startedAt[u];
              const isSelected = obj?.id === selectedObjectId;
              const isHovered = obj?.id === hoveredId;

              if (obj && !isStart) return null; // already rendered in start slot

              const slotHeight = obj ? obj.rackSize * 22 : 22;

              if (!obj) {
                return (
                  <div
                    key={u}
                    className="flex items-center gap-1.5"
                    style={{ height: slotHeight }}
                  >
                    <span className="text-slate-600 text-xs font-mono w-5 text-right shrink-0">
                      {u}
                    </span>
                    <div className="flex-1 rounded bg-slate-800 border border-slate-700/50 h-full" />
                  </div>
                );
              }

              return (
                <div
                  key={u}
                  className="flex items-center gap-1.5 cursor-pointer"
                  style={{ height: slotHeight }}
                  onClick={() => navigate(`/server/${obj.id}`)}
                  onMouseEnter={() => setHoveredId(obj.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  <span className="text-slate-600 text-xs font-mono w-5 text-right shrink-0">
                    {u}
                  </span>
                  <div
                    className={`flex-1 rounded h-full flex items-center gap-2 px-2 transition-all border-l-2 ${
                      isSelected
                        ? 'bg-blue-900/60 border-blue-400 ring-1 ring-blue-400'
                        : isHovered
                        ? 'bg-slate-700 border-slate-500'
                        : obj.status === 'critical'
                        ? 'bg-red-950/50 border-red-500'
                        : obj.status === 'warning'
                        ? 'bg-amber-950/50 border-amber-500'
                        : 'bg-slate-800 border-slate-600'
                    }`}
                  >
                    {/* Type badge */}
                    <span
                      className={`text-white text-xs font-mono px-1 rounded shrink-0 ${typeColors[obj.type]}`}
                      style={{ fontSize: 9, padding: '1px 4px' }}
                    >
                      {typeLabels[obj.type]}
                    </span>

                    {/* Name */}
                    <span className="text-white truncate" style={{ fontSize: 11 }}>
                      {obj.name}
                    </span>

                    {/* Status dot */}
                    <span
                      className={`ml-auto w-1.5 h-1.5 rounded-full shrink-0 ${
                        obj.status === 'critical'
                          ? 'bg-red-500'
                          : obj.status === 'warning'
                          ? 'bg-amber-400'
                          : 'bg-emerald-500'
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Rack bottom marker */}
          <div className="flex bg-slate-800 border-t border-slate-700 px-2 py-1 mt-0.5">
            <span className="text-slate-500 text-xs font-mono ml-6">PDU / power</span>
          </div>
        </div>

        {/* Hover tooltip */}
        {hoveredObj && (
          <div className="mt-3 p-3 bg-subtle border border-line rounded-lg shadow-subtle">
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`w-2 h-2 rounded-full ${
                  hoveredObj.status === 'critical' ? 'bg-danger'
                  : hoveredObj.status === 'warning' ? 'bg-warn'
                  : 'bg-ok'
                }`}
              />
              <span className="text-sm font-semibold text-hi">{hoveredObj.name}</span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              {[
                { label: 'IP',     value: hoveredObj.ip },
                { label: 'Type',   value: hoveredObj.type },
                { label: 'U slot', value: `U${hoveredObj.rackUnit}–U${hoveredObj.rackUnit + hoveredObj.rackSize - 1}` },
                { label: 'Uptime', value: hoveredObj.uptime ?? '—' },
              ].map((row) => (
                <div key={row.label}>
                  <span className="text-xs text-lo">{row.label}</span>
                  <p className="text-xs font-mono text-hi">{row.value}</p>
                </div>
              ))}
            </div>
            {hoveredObj.issues && hoveredObj.issues.length > 0 && (
              <p className="mt-2 text-xs text-danger-text">⚠ {hoveredObj.issues[0]}</p>
            )}
          </div>
        )}

        {/* Legend */}
        <div className="mt-3 flex flex-wrap gap-2">
          {(Object.entries(typeColors) as [ObjectType, string][]).map(([type, color]) => (
            <div key={type} className="flex items-center gap-1">
              <span className={`text-white rounded px-1 ${color}`} style={{ fontSize: 9, padding: '1px 4px' }}>
                {typeLabels[type]}
              </span>
              <span className="text-lo capitalize" style={{ fontSize: 10 }}>
                {type.replace('_', ' ')}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}