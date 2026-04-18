import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import {
  Bell,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  Server,
  Network,
  Layers,
  HardDrive,
  Router,
  Clock,
  CheckCheck,
  Filter,
  ChevronRight,
  X,
} from 'lucide-react';
import { mockObjects } from '../data/mockData';

// ── Notification types ────────────────────────────────────────────────────────
type NotifSeverity = 'critical' | 'warning' | 'info' | 'resolved';

interface Notification {
  id: string;
  severity: NotifSeverity;
  objectId?: string;
  objectName?: string;
  objectType?: string;
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
  rack?: string;
}

// ── Generate notifications from mockData + static system events ───────────────
function buildNotifications(): Notification[] {
  const notifs: Notification[] = [];
  let idx = 0;

  // Dynamic from live objects
  mockObjects.forEach((obj) => {
    if (obj.status === 'critical' && obj.issues) {
      obj.issues.forEach((issue, i) => {
        notifs.push({
          id: `crit-${obj.id}-${i}`,
          severity: 'critical',
          objectId: obj.id,
          objectName: obj.name,
          objectType: obj.type,
          title: `Critical: ${obj.name}`,
          body: issue,
          timestamp: obj.lastSeen,
          read: false,
          rack: obj.rack,
        });
      });
    }
    if (obj.status === 'warning' && obj.issues) {
      obj.issues.forEach((issue, i) => {
        notifs.push({
          id: `warn-${obj.id}-${i}`,
          severity: 'warning',
          objectId: obj.id,
          objectName: obj.name,
          objectType: obj.type,
          title: `Warning: ${obj.name}`,
          body: issue,
          timestamp: obj.lastSeen,
          read: i > 0, // first warning unread
          rack: obj.rack,
        });
      });
    }
  });

  // Static system notifications
  const staticNotifs: Notification[] = [
    {
      id: 'sys-001',
      severity: 'resolved',
      title: 'Incident resolved: net-core-b01',
      body: 'BGP session restored after 14-minute outage. All downstream routes re-advertised.',
      timestamp: '18 min ago',
      read: true,
    },
    {
      id: 'sys-002',
      severity: 'info',
      title: 'Scheduled maintenance window',
      body: 'RACK-B02 patching window starts tonight 02:00–04:00 UTC. 3 servers will be temporarily offline.',
      timestamp: '1 h ago',
      read: true,
    },
    {
      id: 'sys-003',
      severity: 'warning',
      title: 'TLS certificate expiring soon',
      body: 'Certificate for *.infra.internal expires in 12 days. Renewal required before expiry.',
      timestamp: '2 h ago',
      read: false,
    },
    {
      id: 'sys-004',
      severity: 'info',
      title: 'Config backup completed',
      body: 'Full configuration snapshot taken for 18 network devices across all racks.',
      timestamp: '3 h ago',
      read: true,
    },
    {
      id: 'sys-005',
      severity: 'resolved',
      title: 'Disk health restored: san-b01',
      body: 'RAID rebuild completed successfully on san-b01. Array is healthy.',
      timestamp: '5 h ago',
      read: true,
    },
    {
      id: 'sys-006',
      severity: 'info',
      title: 'New device discovered',
      body: 'Unregistered device detected on VLAN 200 at 10.2.0.47. Auto-tagged for review.',
      timestamp: '7 h ago',
      read: true,
    },
    {
      id: 'sys-007',
      severity: 'warning',
      title: 'High memory utilisation: db-prod-02',
      objectId: 'db-prod-02',
      objectName: 'db-prod-02',
      objectType: 'server',
      body: 'Memory usage at 91% for the last 30 minutes. Consider adding swap or scaling.',
      timestamp: 'Yesterday',
      read: true,
      rack: 'RACK-B01',
    },
    {
      id: 'sys-008',
      severity: 'info',
      title: 'Firmware update available',
      body: 'Cisco Nexus 9336C-FX2 firmware 10.3(5) available. Release notes attached.',
      timestamp: 'Yesterday',
      read: true,
    },
    {
      id: 'sys-009',
      severity: 'resolved',
      title: 'Link flap resolved: RACK-A02 uplink',
      body: 'SFP module replaced on port Gi0/1. Link stable for 2 hours.',
      timestamp: '2 days ago',
      read: true,
    },
    {
      id: 'sys-010',
      severity: 'info',
      title: 'Monthly capacity report',
      body: 'Infrastructure utilisation report for March 2026 is ready to view.',
      timestamp: '3 days ago',
      read: true,
    },
  ];

  return [...notifs, ...staticNotifs];
}

const ALL_NOTIFICATIONS = buildNotifications();

// ── Icon helpers ──────────────────────────────────────────────────────────────
const TYPE_ICONS: Record<string, React.FC<{ className?: string }>> = {
  server: Server, switch: Network, router: Router, load_balancer: Layers, storage: HardDrive,
};

function SeverityIcon({ severity, className = 'w-4 h-4' }: { severity: NotifSeverity; className?: string }) {
  switch (severity) {
    case 'critical': return <AlertCircle className={`${className} text-danger`} />;
    case 'warning':  return <AlertTriangle className={`${className} text-warn`} />;
    case 'resolved': return <CheckCircle2 className={`${className} text-ok`} />;
    default:         return <Info className={`${className} text-info`} />;
  }
}

const SEVERITY_STYLES: Record<NotifSeverity, { dot: string; badge: string; badgeText: string; rowBg: string; border: string }> = {
  critical: {
    dot: 'bg-danger',
    badge: 'bg-danger-bg text-danger-text border-danger/20',
    badgeText: 'Critical',
    rowBg: 'hover:bg-danger-bg/40',
    border: 'border-l-danger',
  },
  warning: {
    dot: 'bg-warn',
    badge: 'bg-warn-bg text-warn-text border-warn/20',
    badgeText: 'Warning',
    rowBg: 'hover:bg-warn-bg/40',
    border: 'border-l-warn',
  },
  resolved: {
    dot: 'bg-ok',
    badge: 'bg-ok-bg text-ok-text border-ok/20',
    badgeText: 'Resolved',
    rowBg: 'hover:bg-ok-bg/40',
    border: 'border-l-ok',
  },
  info: {
    dot: 'bg-info',
    badge: 'bg-info-bg text-info-text border-info/20',
    badgeText: 'Info',
    rowBg: 'hover:bg-info-bg/30',
    border: 'border-l-info',
  },
};

type TabKey = 'all' | NotifSeverity;

// ── Notification row ──────────────────────────────────────────────────────────
function NotifRow({
  notif,
  onMarkRead,
  onClick,
}: {
  notif: Notification;
  onMarkRead: (id: string) => void;
  onClick: (notif: Notification) => void;
}) {
  const styles = SEVERITY_STYLES[notif.severity];
  const ObjIcon = notif.objectType ? (TYPE_ICONS[notif.objectType] ?? Server) : Bell;

  return (
    <div
      className={`group relative flex items-start gap-4 px-5 py-4 border-b border-line border-l-4 ${styles.border} ${styles.rowBg} transition-colors cursor-pointer ${!notif.read ? 'bg-subtle' : 'bg-surface'}`}
      onClick={() => onClick(notif)}
    >
      {/* Unread dot */}
      {!notif.read && (
        <span className={`absolute right-4 top-4 w-2 h-2 rounded-full ${styles.dot} shrink-0`} />
      )}

      {/* Severity icon */}
      <div className={`shrink-0 mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center ${
        notif.severity === 'critical' ? 'bg-danger-bg' :
        notif.severity === 'warning'  ? 'bg-warn-bg' :
        notif.severity === 'resolved' ? 'bg-ok-bg' : 'bg-info-bg'
      }`}>
        <SeverityIcon severity={notif.severity} className="w-4 h-4" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pr-6">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <span className={`text-xs px-1.5 py-0.5 rounded-full border font-medium ${styles.badge}`}>
            {styles.badgeText}
          </span>
          {notif.objectName && (
            <span className="flex items-center gap-1 text-xs text-mid font-mono">
              <ObjIcon className="w-3 h-3 text-lo" />
              {notif.objectName}
            </span>
          )}
          {notif.rack && (
            <span className="text-xs text-lo">{notif.rack}</span>
          )}
        </div>
        <p className={`text-sm ${notif.read ? 'text-mid' : 'text-hi font-medium'} leading-snug`}>
          {notif.title}
        </p>
        <p className="text-xs text-lo mt-0.5 line-clamp-2 leading-relaxed">{notif.body}</p>
        <div className="flex items-center gap-1.5 mt-1.5">
          <Clock className="w-3 h-3 text-lo" />
          <span className="text-xs text-lo">{notif.timestamp}</span>
        </div>
      </div>

      {/* Actions on hover */}
      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5">
        {notif.objectId && (
          <span className="text-xs text-info flex items-center gap-0.5">
            View <ChevronRight className="w-3 h-3" />
          </span>
        )}
      </div>
    </div>
  );
}

// ── Summary stat card ─────────────────────────────────────────────────────────
function StatCard({
  count, label, color, bg, icon: Icon,
}: {
  count: number; label: string; color: string; bg: string; icon: React.FC<{ className?: string }>;
}) {
  return (
    <div className={`${bg} rounded-xl border border-line px-4 py-3 flex items-center gap-3`}>
      <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <div>
        <p className={`text-xl font-bold ${color} leading-none`}>{count}</p>
        <p className="text-xs text-lo mt-0.5">{label}</p>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>(ALL_NOTIFICATIONS);
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  const stats = useMemo(() => ({
    critical: notifications.filter((n) => n.severity === 'critical').length,
    warning:  notifications.filter((n) => n.severity === 'warning').length,
    resolved: notifications.filter((n) => n.severity === 'resolved').length,
    info:     notifications.filter((n) => n.severity === 'info').length,
    unread:   notifications.filter((n) => !n.read).length,
  }), [notifications]);

  const filtered = useMemo(() => {
    let list = notifications;
    if (activeTab !== 'all') list = list.filter((n) => n.severity === activeTab);
    if (showUnreadOnly) list = list.filter((n) => !n.read);
    // Sort: unread first, then by severity priority
    const severityOrder: Record<NotifSeverity, number> = { critical: 0, warning: 1, info: 2, resolved: 3 };
    return [...list].sort((a, b) => {
      if (a.read !== b.read) return a.read ? 1 : -1;
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }, [notifications, activeTab, showUnreadOnly]);

  const markRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleNotifClick = (notif: Notification) => {
    markRead(notif.id);
    if (notif.objectId) navigate(`/server/${notif.objectId}`);
  };

  const TABS: { key: TabKey; label: string; count: number }[] = [
    { key: 'all',      label: 'All',      count: notifications.length },
    { key: 'critical', label: 'Critical', count: stats.critical },
    { key: 'warning',  label: 'Warning',  count: stats.warning },
    { key: 'info',     label: 'Info',     count: stats.info },
    { key: 'resolved', label: 'Resolved', count: stats.resolved },
  ];

  return (
    <div className="min-h-screen bg-bg">

      {/* ── Page header ────────────────────────────────────────────────── */}
      <div className="bg-surface border-b border-line px-4 md:px-6 py-4 md:py-5">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-info-bg flex items-center justify-center">
                <Bell className="w-5 h-5 text-info" />
              </div>
              <div>
                <h1 className="text-hi leading-none flex items-center gap-2">
                  Notifications
                  {stats.unread > 0 && (
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-danger text-white text-[10px] font-bold">
                      {stats.unread}
                    </span>
                  )}
                </h1>
                <p className="text-xs text-lo mt-0.5">{notifications.length} total · {stats.unread} unread</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {stats.unread > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1.5 text-xs text-mid hover:text-hi bg-subtle border border-line px-3 py-1.5 rounded-lg transition-colors"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setShowUnreadOnly((v) => !v)}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                  showUnreadOnly
                    ? 'bg-hi text-white border-hi'
                    : 'bg-subtle text-mid border-line hover:border-hi/20 hover:text-hi'
                }`}
              >
                <Filter className="w-3.5 h-3.5" />
                Unread only
              </button>
            </div>
          </div>

          {/* ── Summary cards ──────────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
            <StatCard count={stats.critical} label="Critical" color="text-danger" bg="bg-danger-bg" icon={AlertCircle} />
            <StatCard count={stats.warning}  label="Warning"  color="text-warn"   bg="bg-warn-bg"   icon={AlertTriangle} />
            <StatCard count={stats.info}     label="Info"     color="text-info"   bg="bg-info-bg"   icon={Info} />
            <StatCard count={stats.resolved} label="Resolved" color="text-ok"     bg="bg-ok-bg"     icon={CheckCircle2} />
          </div>
        </div>
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────────── */}
      <div className="bg-surface border-b border-line px-4 md:px-6 sticky top-14 z-20">
        <div className="max-w-4xl mx-auto flex items-center gap-0.5 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm border-b-2 whitespace-nowrap transition-colors ${
                activeTab === tab.key
                  ? 'border-info text-info font-medium'
                  : 'border-transparent text-mid hover:text-hi hover:border-line'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  activeTab === tab.key
                    ? 'bg-info text-white'
                    : 'bg-subtle text-lo'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Notification list ──────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-4 md:py-5">
        <div className="bg-surface rounded-xl border border-line overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          {filtered.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-full bg-subtle flex items-center justify-center">
                <Bell className="w-6 h-6 text-lo" />
              </div>
              <p className="text-mid text-sm">No notifications</p>
              {showUnreadOnly && (
                <button
                  onClick={() => setShowUnreadOnly(false)}
                  className="flex items-center gap-1 text-xs text-info hover:underline"
                >
                  <X className="w-3 h-3" /> Clear filter
                </button>
              )}
            </div>
          ) : (
            <div>
              {filtered.map((notif) => (
                <NotifRow
                  key={notif.id}
                  notif={notif}
                  onMarkRead={markRead}
                  onClick={handleNotifClick}
                />
              ))}
            </div>
          )}
        </div>

        {filtered.length > 0 && (
          <p className="text-center text-xs text-lo mt-4">
            Showing {filtered.length} of {notifications.length} notifications
          </p>
        )}
      </div>
    </div>
  );
}