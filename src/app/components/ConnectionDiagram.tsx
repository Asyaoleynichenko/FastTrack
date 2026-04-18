import { useNavigate } from 'react-router';
import { NetworkObject, Connection, getObjectById } from '../data/mockData';

const TYPE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  server:       { bg: '#0f2548', border: '#3b82f6', text: '#93c5fd' },
  switch:       { bg: '#053a22', border: '#10b981', text: '#6ee7b7' },
  router:       { bg: '#1e1b4b', border: '#818cf8', text: '#c7d2fe' },
  load_balancer:{ bg: '#2d1b69', border: '#8b5cf6', text: '#c4b5fd' },
  storage:      { bg: '#0d3344', border: '#0ea5e9', text: '#7dd3fc' },
};

const CONN_TYPE_STYLES: Record<string, { stroke: string; dash?: string; label: string }> = {
  uplink:     { stroke: '#6366f1', label: '↑ uplink' },
  downlink:   { stroke: '#64748b', dash: '4 3', label: '↓ downlink' },
  peer:       { stroke: '#0ea5e9', label: '↔ peer' },
  management: { stroke: '#94a3b8', dash: '2 4', label: '⚙ mgmt' },
};

interface NodePos {
  id: string;
  name: string;
  type: string;
  status: string;
  x: number;
  y: number;
  conn: Connection;
  obj?: NetworkObject;
}

interface Props {
  object: NetworkObject;
}

const W = 620;
const H = 310;
const CX = W / 2;
const CY = H / 2 - 10;
const NODE_R = 32;
const OUTER_R = 118;

export function ConnectionDiagram({ object }: Props) {
  const navigate = useNavigate();
  const connections = object.connections.slice(0, 8);

  const nodes: NodePos[] = connections.map((conn, i) => {
    const total = connections.length;
    const angle = -Math.PI / 2 + (2 * Math.PI / total) * i;
    const radX = total <= 4 ? OUTER_R + 10 : OUTER_R + 20;
    const radY = total <= 4 ? OUTER_R - 10 : OUTER_R + 10;
    return {
      id: conn.targetId,
      name: conn.targetName,
      type: getObjectById(conn.targetId)?.type ?? 'server',
      status: getObjectById(conn.targetId)?.status ?? 'healthy',
      x: CX + radX * Math.cos(angle),
      y: CY + radY * Math.sin(angle),
      conn,
      obj: getObjectById(conn.targetId),
    };
  });

  return (
    <div className="w-full overflow-hidden">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ height: H, fontFamily: 'inherit' }}
      >
        <defs>
          {Object.entries(CONN_TYPE_STYLES).map(([type, style]) => (
            <marker
              key={type}
              id={`arrow-${type}`}
              markerWidth="8"
              markerHeight="8"
              refX="6"
              refY="3"
              orient="auto"
            >
              <path d="M0,0 L0,6 L8,3 z" fill={style.stroke} opacity={0.7} />
            </marker>
          ))}
        </defs>

        {/* Background grid */}
        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#DDE3EE" strokeWidth="0.5" />
        </pattern>
        <rect width={W} height={H} fill="url(#grid)" rx="8" />

        {/* Edges */}
        {nodes.map((node) => {
          const style = CONN_TYPE_STYLES[node.conn.type] ?? CONN_TYPE_STYLES.peer;
          // direction: from center to node for downlink/peer, from node to center for uplink
          const isUplink = node.conn.type === 'uplink';
          const dx = node.x - CX;
          const dy = node.y - CY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const ux = dx / dist;
          const uy = dy / dist;

          const x1 = CX + ux * (NODE_R + 4);
          const y1 = CY + uy * (NODE_R + 4);
          const x2 = node.x - ux * (NODE_R + 4);
          const y2 = node.y - uy * (NODE_R + 4);

          // mid point for label
          const mx = (x1 + x2) / 2;
          const my = (y1 + y2) / 2;

          return (
            <g key={node.id}>
              <line
                x1={isUplink ? x2 : x1}
                y1={isUplink ? y2 : y1}
                x2={isUplink ? x1 : x2}
                y2={isUplink ? y1 : y2}
                stroke={style.stroke}
                strokeWidth="1.5"
                strokeDasharray={style.dash}
                markerEnd={`url(#arrow-${node.conn.type})`}
                opacity={0.7}
              />
              {/* Edge label */}
              {node.conn.label && (
                <text
                  x={mx}
                  y={my - 5}
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize="9"
                  className="select-none"
                >
                  {node.conn.label}
                </text>
              )}
              {/* Bandwidth badge */}
              {node.conn.bandwidth && (
                <text
                  x={mx}
                  y={my + 7}
                  textAnchor="middle"
                  fill={style.stroke}
                  fontSize="8"
                  opacity={0.8}
                  className="select-none"
                >
                  {node.conn.bandwidth}
                </text>
              )}
            </g>
          );
        })}

        {/* Remote nodes */}
        {nodes.map((node) => {
          const colors = TYPE_COLORS[node.type] ?? TYPE_COLORS.server;
          return (
            <g
              key={node.id}
              className="cursor-pointer"
              onClick={() => navigate(`/server/${node.id}`)}
              style={{ cursor: 'pointer' }}
            >
              {/* Outer ring for status */}
              <circle
                cx={node.x}
                cy={node.y}
                r={NODE_R + 4}
                fill="transparent"
                stroke={
                  node.status === 'critical'
                    ? '#ef4444'
                    : node.status === 'warning'
                    ? '#f59e0b'
                    : '#10b981'
                }
                strokeWidth={node.status !== 'healthy' ? 1.5 : 0.5}
                opacity={0.4}
              />
              {/* Main circle */}
              <circle
                cx={node.x}
                cy={node.y}
                r={NODE_R}
                fill={colors.bg}
                stroke={colors.border}
                strokeWidth="1.5"
              />
              {/* Icon placeholder — using text symbol */}
              <text
                x={node.x}
                y={node.y - 4}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={colors.text}
                fontSize="12"
                className="select-none"
              >
                {node.type === 'server'
                  ? '⬜'
                  : node.type === 'switch'
                  ? '⬡'
                  : node.type === 'router'
                  ? '◇'
                  : node.type === 'load_balancer'
                  ? '⬟'
                  : '▧'}
              </text>
              {/* Status dot */}
              <circle
                cx={node.x + NODE_R - 5}
                cy={node.y - NODE_R + 5}
                r={5}
                fill={
                  node.status === 'critical'
                    ? '#ef4444'
                    : node.status === 'warning'
                    ? '#f59e0b'
                    : '#10b981'
                }
              />
              {/* Name label */}
              <text
                x={node.x}
                y={node.y + NODE_R + 12}
                textAnchor="middle"
                fill="#334155"
                fontSize="10"
                fontWeight="500"
                className="select-none"
              >
                {node.name.length > 14 ? node.name.slice(0, 12) + '…' : node.name}
              </text>
              {/* Type label */}
              <text
                x={node.x}
                y={node.y + NODE_R + 23}
                textAnchor="middle"
                fill="#94a3b8"
                fontSize="8"
                className="select-none"
              >
                {node.type.replace('_', ' ')}
              </text>
            </g>
          );
        })}

        {/* Center node (the selected object) */}
        <g>
          {/* Glow */}
          <circle cx={CX} cy={CY} r={NODE_R + 14} fill="#dbeafe" opacity={0.12} />
          <circle cx={CX} cy={CY} r={NODE_R + 8} fill="#bfdbfe" opacity={0.18} />
          {/* Status ring */}
          <circle
            cx={CX}
            cy={CY}
            r={NODE_R + 4}
            fill="transparent"
            stroke={
              object.status === 'critical'
                ? '#ef4444'
                : object.status === 'warning'
                ? '#f59e0b'
                : '#10b981'
            }
            strokeWidth="2.5"
            opacity={0.6}
          />
          {/* Main */}
          <circle cx={CX} cy={CY} r={NODE_R} fill="#0f2548" stroke="#3b82f6" strokeWidth="2" />
          {/* Status dot */}
          <circle
            cx={CX + NODE_R - 5}
            cy={CY - NODE_R + 5}
            r={6}
            fill={
              object.status === 'critical'
                ? '#ef4444'
                : object.status === 'warning'
                ? '#f59e0b'
                : '#10b981'
            }
          />
          {/* Label */}
          <text
            x={CX}
            y={CY + NODE_R + 14}
            textAnchor="middle"
            fill="#1e293b"
            fontSize="11"
            fontWeight="600"
            className="select-none"
          >
            {object.name.length > 16 ? object.name.slice(0, 14) + '…' : object.name}
          </text>
          <text
            x={CX}
            y={CY + NODE_R + 26}
            textAnchor="middle"
            fill="#64748b"
            fontSize="9"
            className="select-none"
          >
            {object.ip}
          </text>
        </g>
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 px-4 pb-3 border-t border-line pt-2 mt-1">
        {Object.entries(CONN_TYPE_STYLES).map(([type, style]) => (
          <div key={type} className="flex items-center gap-1.5">
            <svg width="20" height="8">
              <line x1="0" y1="4" x2="20" y2="4" stroke={style.stroke} strokeWidth="1.5" strokeDasharray={style.dash} />
            </svg>
            <span className="text-xs text-lo">{style.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}