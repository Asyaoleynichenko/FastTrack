import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Server,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  LayoutGrid,
  RefreshCw,
  ChevronRight,
} from 'lucide-react';
import { RACKS, mockObjects, getObjectsByRack, NetworkObject, ObjectType } from '../data/mockData';
import { RackVisualization } from './RackVisualization';

const typeColors: Record<ObjectType, string> = {
  server:        'bg-info',
  switch:        'bg-ok',
  router:        'bg-warn',
  load_balancer: 'bg-[#8B5CF6]',
  storage:       'bg-[#0EA5E9]',
};

const typeLabels: Record<ObjectType, string> = {
  server:        'SRV',
  switch:        'SW',
  router:        'RTR',
  load_balancer: 'LB',
  storage:       'SAN',
};

function RackSummaryCard({
  rack,
  selected,
  onSelect,
}: {
  rack: string;
  selected: boolean;
  onSelect: () => void;
}) {
  const objects    = getObjectsByRack(rack);
  const critical   = objects.filter((o) => o.status === 'critical').length;
  const warning    = objects.filter((o) => o.status === 'warning').length;
  const utilization = Math.round((objects.length / 20) * 100);

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
        selected
          ? 'border-info bg-info-bg ring-2 ring-info/20 ring-offset-1'
          : critical > 0
          ? 'border-danger/30 bg-surface hover:border-danger/50'
          : warning > 0
          ? 'border-warn/30 bg-surface hover:border-warn/50'
          : 'border-line bg-surface hover:border-info/30'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm font-semibold text-hi">{rack}</p>
          <p className="text-xs text-lo mt-0.5">{objects.length} objects · {utilization}% utilized</p>
        </div>
        <div className="flex items-center gap-1">
          {critical > 0 && (
            <span className="flex items-center gap-1 text-xs bg-danger-bg text-danger-text px-2 py-0.5 rounded-full border border-danger/20">
              <AlertCircle className="w-3 h-3" />
              {critical}
            </span>
          )}
          {warning > 0 && (
            <span className="flex items-center gap-1 text-xs bg-warn-bg text-warn-text px-2 py-0.5 rounded-full border border-warn/20">
              <AlertTriangle className="w-3 h-3" />
              {warning}
            </span>
          )}
          {critical === 0 && warning === 0 && (
            <span className="flex items-center gap-1 text-xs bg-ok-bg text-ok-text px-2 py-0.5 rounded-full border border-ok/20">
              <CheckCircle2 className="w-3 h-3" />
              OK
            </span>
          )}
        </div>
      </div>

      {/* Utilization bar */}
      <div className="mb-3">
        <div className="h-1.5 bg-line rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${utilization > 80 ? 'bg-warn' : 'bg-info'}`}
            style={{ width: `${utilization}%` }}
          />
        </div>
      </div>

      {/* Type breakdown */}
      <div className="flex flex-wrap gap-1.5">
        {objects
          .reduce((acc, obj) => {
            const existing = acc.find((a) => a.type === obj.type);
            if (existing) existing.count++;
            else acc.push({ type: obj.type, count: 1 });
            return acc;
          }, [] as { type: ObjectType; count: number }[])
          .map(({ type, count }) => (
            <span key={type} className="flex items-center gap-1 text-xs text-lo">
              <span
                className={`text-white rounded px-1 ${typeColors[type]}`}
                style={{ fontSize: 9, padding: '1px 4px' }}
              >
                {typeLabels[type]}
              </span>
              {count}
            </span>
          ))}
      </div>
    </button>
  );
}

function RackObjectList({ objects }: { objects: NetworkObject[] }) {
  const navigate = useNavigate();
  return (
    <div className="space-y-1">
      {objects.map((obj) => (
        <button
          key={obj.id}
          onClick={() => navigate(`/server/${obj.id}`)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-subtle border border-transparent hover:border-line transition-all text-left group"
        >
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              obj.status === 'critical' ? 'bg-danger' : obj.status === 'warning' ? 'bg-warn' : 'bg-ok'
            }`}
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-mono font-semibold text-hi group-hover:text-info transition-colors truncate">
              {obj.name}
            </p>
            <p className="text-xs text-lo">
              U{obj.rackUnit}–{obj.rackUnit + obj.rackSize - 1} · {obj.ip}
            </p>
          </div>
          <span
            className={`text-white rounded px-1 shrink-0 ${typeColors[obj.type]}`}
            style={{ fontSize: 9, padding: '1px 4px' }}
          >
            {typeLabels[obj.type]}
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-lo group-hover:text-info shrink-0 transition-colors" />
        </button>
      ))}
    </div>
  );
}

export function RacksPage() {
  const [selectedRack, setSelectedRack] = useState<string>(RACKS[0]);

  const totalCritical = mockObjects.filter((o) => o.status === 'critical').length;
  const totalWarning  = mockObjects.filter((o) => o.status === 'warning').length;

  const selectedObjects = getObjectsByRack(selectedRack);

  return (
    <div className="min-h-screen bg-bg">
      {/* Page Header */}
      <div className="bg-surface border-b border-line px-4 md:px-6 py-4 md:py-5">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg md:text-xl font-bold text-hi">Rack Overview</h1>
              <p className="text-xs md:text-sm text-lo mt-0.5">
                {RACKS.length} racks · {mockObjects.length} objects
                {totalCritical > 0 && <span className="text-danger-text ml-2">· {totalCritical} critical</span>}
                {totalWarning  > 0 && <span className="text-warn-text ml-1">· {totalWarning} warning</span>}
              </p>
            </div>
            <button className="flex items-center gap-2 text-sm text-mid hover:text-hi bg-subtle hover:bg-line/40 px-3 py-2 rounded-lg transition-colors border border-line">
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile: horizontal rack selector tabs ── */}
      <div className="lg:hidden bg-surface border-b border-line px-4 py-3">
        <p className="text-[10px] font-semibold text-lo uppercase tracking-wide mb-2">Select Rack</p>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
          {RACKS.map((rack) => {
            const objects  = getObjectsByRack(rack);
            const critical = objects.filter((o) => o.status === 'critical').length;
            const warning  = objects.filter((o) => o.status === 'warning').length;
            const isSelected = selectedRack === rack;
            return (
              <button
                key={rack}
                onClick={() => setSelectedRack(rack)}
                className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                  isSelected
                    ? 'border-info bg-info-bg text-info-text'
                    : critical > 0
                    ? 'border-danger/30 bg-surface text-mid hover:border-danger/50'
                    : warning > 0
                    ? 'border-warn/30 bg-surface text-mid hover:border-warn/50'
                    : 'border-line bg-surface text-mid hover:border-info/30'
                }`}
              >
                <span>{rack}</span>
                {critical > 0 && (
                  <span className="flex items-center gap-0.5 text-[10px] bg-danger-bg text-danger-text px-1.5 py-0.5 rounded-full border border-danger/20">
                    <AlertCircle className="w-2.5 h-2.5" />{critical}
                  </span>
                )}
                {warning > 0 && !critical && (
                  <span className="flex items-center gap-0.5 text-[10px] bg-warn-bg text-warn-text px-1.5 py-0.5 rounded-full border border-warn/20">
                    <AlertTriangle className="w-2.5 h-2.5" />{warning}
                  </span>
                )}
                {critical === 0 && warning === 0 && (
                  <CheckCircle2 className="w-3 h-3 text-ok" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-6">
        <div className="flex gap-6">
          {/* Left: rack selector — desktop only */}
          <div className="w-72 shrink-0 space-y-3 hidden lg:block">
            <p className="text-xs font-semibold text-lo uppercase tracking-wide px-1">Select Rack</p>
            {RACKS.map((rack) => (
              <RackSummaryCard
                key={rack}
                rack={rack}
                selected={selectedRack === rack}
                onSelect={() => setSelectedRack(rack)}
              />
            ))}
          </div>

          {/* Right: selected rack detail */}
          <div className="flex-1 min-w-0 space-y-4">
            <RackVisualization rack={selectedRack} allObjects={mockObjects} />

            <div className="bg-surface rounded-xl border border-line overflow-hidden shadow-subtle">
              <div className="px-4 py-3 border-b border-line flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-hi">{selectedRack} — Objects</p>
                  <p className="text-xs text-lo">{selectedObjects.length} installed devices</p>
                </div>
                <LayoutGrid className="w-4 h-4 text-lo" />
              </div>
              <div className="p-3">
                {selectedObjects.length === 0 ? (
                  <div className="py-10 text-center">
                    <Server className="w-8 h-8 mx-auto mb-2 text-lo opacity-40" />
                    <p className="text-sm text-mid">No objects in this rack.</p>
                  </div>
                ) : (
                  <RackObjectList objects={selectedObjects} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}