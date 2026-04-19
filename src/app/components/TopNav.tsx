import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router';
import {
  Server,
  Search,
  ChevronDown,
  User,
  Settings,
  LogOut,
  X,
  Bell,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  ChevronRight,
  Menu,
} from 'lucide-react';
import { mockObjects } from '../data/mockData';

// ── Profile constants ─────────────────────────────────────────────────────────
const PROFILE_NAME     = 'Asya Oleynichenko';
const PROFILE_EMAIL    = 'Asyaoleynichenko@yandex.ru';
const PROFILE_INITIALS = 'AO';

function Avatar({ size = 'sm' }: { size?: 'sm' | 'md' }) {
  const dim = size === 'sm' ? 'w-7 h-7 text-[11px]' : 'w-9 h-9 text-xs';
  return (
    <span
      className={`${dim} rounded-full flex items-center justify-center font-bold text-white select-none shrink-0`}
      style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)', fontFamily: 'Inter, sans-serif' }}
      aria-label={PROFILE_NAME}
    >
      {PROFILE_INITIALS}
    </span>
  );
}

// ── Notifications ─────────────────────────────────────────────────────────────
type NotifSeverity = 'critical' | 'warning' | 'info' | 'resolved';
interface MiniNotif {
  id: string; severity: NotifSeverity; objectId?: string;
  title: string; body: string; timestamp: string; read: boolean;
}

function buildMiniNotifications(): MiniNotif[] {
  const notifs: MiniNotif[] = [];
  mockObjects.forEach((obj) => {
    if (obj.status === 'critical' && obj.issues?.length)
      notifs.push({ id: `crit-${obj.id}`, severity: 'critical', objectId: obj.id, title: obj.name, body: obj.issues[0], timestamp: obj.lastSeen, read: false });
  });
  mockObjects.forEach((obj) => {
    if (obj.status === 'warning' && obj.issues?.length)
      notifs.push({ id: `warn-${obj.id}`, severity: 'warning', objectId: obj.id, title: obj.name, body: obj.issues[0], timestamp: obj.lastSeen, read: false });
  });
  notifs.push({ id: 'sys-cert',     severity: 'warning',  title: 'TLS certificate expiring',        body: '*.infra.internal expires in 12 days',      timestamp: '2 h ago',   read: false });
  notifs.push({ id: 'sys-resolved', severity: 'resolved', title: 'Incident resolved: net-core-b01', body: 'BGP session restored after 14 min outage', timestamp: '18 min ago', read: true  });
  notifs.push({ id: 'sys-info',     severity: 'info',     title: 'Maintenance window tonight',      body: 'RACK-B02 patching 02:00–04:00 UTC',        timestamp: '1 h ago',   read: true  });
  return notifs.slice(0, 8);
}

const MINI_NOTIFS = buildMiniNotifications();

function NotifSeverityIcon({ severity }: { severity: NotifSeverity }) {
  const cls = 'w-3.5 h-3.5 shrink-0';
  switch (severity) {
    case 'critical': return <AlertCircle  className={`${cls} text-danger`} />;
    case 'warning':  return <AlertTriangle className={`${cls} text-warn`} />;
    case 'resolved': return <CheckCircle2 className={`${cls} text-ok`} />;
    default:         return <Info         className={`${cls} text-info`} />;
  }
}

// ── Nav links config ──────────────────────────────────────────────────────────
const NAV_LINKS = [
  { label: 'Objects', href: '/',        end: true  },
  { label: 'Racks',   href: '/racks',   end: false },
  { label: 'Network', href: '/network', end: false },
];

// ── Top Nav ───────────────────────────────────────────────────────────────────
export function TopNav() {
  const navigate = useNavigate();
  const [showSearch,     setShowSearch]     = useState(false);
  const [searchQuery,    setSearchQuery]    = useState('');
  const [showProfile,    setShowProfile]    = useState(false);
  const [showNotifs,     setShowNotifs]     = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [readIds,        setReadIds]        = useState<Set<string>>(new Set());

  const criticalCount = mockObjects.filter((o) => o.status === 'critical').length;
  const warningCount  = mockObjects.filter((o) => o.status === 'warning').length;
  const unreadCount   = MINI_NOTIFS.filter((n) => !n.read && !readIds.has(n.id)).length;

  const searchResults = searchQuery.length > 1
    ? mockObjects
        .filter((o) =>
          o.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          o.ip.includes(searchQuery) ||
          o.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
        )
        .sort((a, b) => ({ critical: 0, warning: 1, healthy: 2 }[a.status] - { critical: 0, warning: 1, healthy: 2 }[b.status]))
        .slice(0, 8)
    : [];

  const handleNotifClick = (notif: MiniNotif) => {
    setReadIds((prev) => new Set([...prev, notif.id]));
    setShowNotifs(false);
    if (notif.objectId) navigate(`/server/${notif.objectId}`);
    else navigate('/notifications');
  };

  const closeAll = () => {
    setShowProfile(false);
    setShowNotifs(false);
    setShowMobileMenu(false);
  };

  return (
    <>
      {/* ── Main nav bar ───────────────────────────────────────────────────── */}
      <nav
        className="sticky top-0 z-50 bg-surface border-b border-line flex items-center h-14 px-4 gap-2 md:gap-3"
        style={{ fontFamily: 'Inter, sans-serif', boxShadow: '0 1px 0 #D4DEF0, 0 2px 12px rgba(15,27,45,0.05)' }}
      >
        {/* ── Brand ─────────────────────────────────────────────────────── */}
        <NavLink to="/" className="flex items-center gap-2 shrink-0" onClick={closeAll}>
          <div
            className="w-7 h-7 rounded-md flex items-center justify-center bg-[#0F1B2D] shrink-0"
            style={{ boxShadow: '0 1px 4px rgba(15,27,45,0.35)' }}
          >
            <Server className="w-4 h-4 text-white" />
          </div>
          <span className="font-infra-brand text-hi font-bold tracking-tight text-[15px] hidden xs:inline sm:inline">
            InfraView
          </span>
        </NavLink>

        {/* Divider — desktop only */}
        <div className="w-px h-5 bg-line shrink-0 hidden md:block" />

        {/* ── Desktop nav links ─────────────────────────────────────────── */}
        <div className="hidden md:flex items-center gap-0.5">
          {NAV_LINKS.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.end}
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  isActive ? 'bg-subtle text-hi font-semibold' : 'text-mid hover:text-hi hover:bg-subtle'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>

        {/* ── Desktop search ────────────────────────────────────────────── */}
        <div className="hidden md:block flex-1 max-w-sm relative ml-auto">
          {showSearch ? (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-lo" />
              <input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onBlur={() => { setTimeout(() => { setShowSearch(false); setSearchQuery(''); }, 150); }}
                placeholder="Search servers, IPs, racks, tags…"
                className="w-full bg-surface border border-line rounded-lg pl-9 pr-8 py-1.5 text-sm text-hi placeholder:text-lo focus:outline-none focus:border-info focus:ring-2 focus:ring-info/20"
              />
              <button
                onMouseDown={() => { setShowSearch(false); setSearchQuery(''); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-lo hover:text-mid"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              {searchResults.length > 0 && (
                <div
                  className="absolute top-full left-0 right-0 mt-2 bg-surface border border-line rounded-xl overflow-hidden z-50"
                  style={{ boxShadow: 'var(--shadow-popover)' }}
                >
                  {searchResults.map((obj) => (
                    <button
                      key={obj.id}
                      onMouseDown={() => navigate(`/server/${obj.id}`)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-subtle transition-colors text-left border-b border-line last:border-0"
                    >
                      <span className={`w-2 h-2 rounded-full shrink-0 ${obj.status === 'critical' ? 'bg-danger' : obj.status === 'warning' ? 'bg-warn' : 'bg-ok'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-hi font-mono font-medium truncate">{obj.name}</p>
                        <p className="text-xs text-lo">{obj.ip} · {obj.rack} · {obj.type}</p>
                      </div>
                      {obj.issues && obj.issues.length > 0 && (
                        <span className={`text-xs truncate max-w-[140px] shrink-0 font-medium ${obj.status === 'critical' ? 'text-danger-text' : 'text-warn-text'}`}>
                          {obj.issues[0]}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => setShowSearch(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-subtle border border-line rounded-lg text-mid hover:text-hi hover:border-[#B0C4E0] text-sm transition-colors w-full"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="text-lo">Search…</span>
              <kbd className="ml-auto text-[10px] bg-surface border border-line text-lo px-1.5 py-0.5 rounded" aria-label="Keyboard shortcut Command K">⌘K</kbd>
            </button>
          )}
        </div>

        {/* ── Mobile search icon ────────────────────────────────────────── */}
        <button
          className="md:hidden flex items-center justify-center w-8 h-8 rounded-lg hover:bg-subtle transition-colors ml-auto"
          onClick={() => { setShowMobileMenu(true); }}
          aria-label="Open search"
        >
          <Search className="w-4 h-4 text-mid" />
        </button>

        {/* ── Health indicators ─────────────────────────────────────────── */}
        <div
          className="flex items-center gap-1.5 shrink-0"
          role="status"
          aria-live="polite"
          aria-label="System health summary"
        >
          {criticalCount > 0 && (
            <NavLink
              to="/"
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-bold border transition-colors bg-danger-bg border-danger/30 text-danger-text hover:bg-danger/10"
              aria-label={`${criticalCount} critical incidents`}
            >
              <span className="relative flex h-2 w-2 shrink-0" aria-hidden="true">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-danger opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-danger" />
              </span>
              {/* Count always visible; label only on sm+ */}
              <span>{criticalCount}</span>
              <span className="hidden sm:inline">CRIT</span>
            </NavLink>
          )}
          {warningCount > 0 && (
            <NavLink
              to="/"
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-bold border transition-colors bg-warn-bg border-warn/30 text-warn-text hover:bg-warn/10"
              aria-label={`${warningCount} warnings`}
            >
              <span className="w-2 h-2 rounded-full bg-warn shrink-0" aria-hidden="true" />
              <span>{warningCount}</span>
              <span className="hidden sm:inline">WARN</span>
            </NavLink>
          )}
          {criticalCount === 0 && warningCount === 0 && (
            <div
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium bg-ok-bg border border-ok/20 text-ok-text"
              aria-label="All systems operational"
            >
              <span className="w-2 h-2 rounded-full bg-ok" aria-hidden="true" />
              <span className="hidden sm:inline">All OK</span>
            </div>
          )}
        </div>

        {/* ── Notifications bell ────────────────────────────────────────── */}
        <div className="relative shrink-0">
          <button
            onClick={() => { setShowNotifs((v) => !v); setShowProfile(false); setShowMobileMenu(false); }}
            className={`relative flex items-center justify-center w-8 h-8 rounded-lg transition-colors ${showNotifs ? 'bg-subtle' : 'hover:bg-subtle'}`}
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4 text-mid" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-danger text-white flex items-center justify-center text-[9px] font-bold leading-none">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifs && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowNotifs(false)} />
              {/* Responsive width: near-full on mobile, fixed 320px on desktop */}
              <div
                className="absolute right-0 top-full mt-2 w-[min(320px,calc(100vw-1rem))] bg-surface border border-line rounded-xl overflow-hidden z-50"
                style={{ boxShadow: 'var(--shadow-popover)' }}
              >
                <div className="px-4 py-3 border-b border-line flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-hi">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="w-5 h-5 rounded-full bg-danger text-white flex items-center justify-center text-[10px] font-bold">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button onClick={() => setReadIds(new Set(MINI_NOTIFS.map((n) => n.id)))} className="text-xs text-info hover:underline">
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-[min(360px,60vh)] overflow-y-auto divide-y divide-line">
                  {MINI_NOTIFS.length === 0 ? (
                    <div className="py-10 text-center">
                      <Bell className="w-6 h-6 text-lo mx-auto mb-2 opacity-40" />
                      <p className="text-xs text-lo">No notifications</p>
                    </div>
                  ) : (
                    MINI_NOTIFS.map((notif) => {
                      const isRead = notif.read || readIds.has(notif.id);
                      return (
                        <button
                          key={notif.id}
                          onClick={() => handleNotifClick(notif)}
                          className={`w-full flex items-start gap-3 px-4 py-3 hover:bg-subtle text-left transition-colors ${!isRead ? 'bg-subtle/60' : ''}`}
                        >
                          <div className="shrink-0 mt-0.5"><NotifSeverityIcon severity={notif.severity} /></div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs truncate ${!isRead ? 'text-hi font-medium' : 'text-mid'}`}>{notif.title}</p>
                            <p className="text-[11px] text-lo mt-0.5 line-clamp-1">{notif.body}</p>
                            <p className="text-[10px] text-lo mt-0.5">{notif.timestamp}</p>
                          </div>
                          {!isRead && <span className="w-1.5 h-1.5 rounded-full bg-danger mt-1.5 shrink-0" />}
                        </button>
                      );
                    })
                  )}
                </div>
                <div className="border-t border-line">
                  <NavLink
                    to="/notifications"
                    onClick={() => setShowNotifs(false)}
                    className="flex items-center justify-between px-4 py-2.5 text-xs text-info hover:bg-subtle transition-colors font-medium"
                  >
                    View all notifications
                    <ChevronRight className="w-3.5 h-3.5" />
                  </NavLink>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── Profile menu ──────────────────────────────────────────────── */}
        <div className="relative shrink-0">
          <button
            onClick={() => { setShowProfile((v) => !v); setShowNotifs(false); setShowMobileMenu(false); }}
            className="flex items-center gap-1.5 px-1.5 py-1.5 hover:bg-subtle rounded-lg transition-colors"
          >
            <Avatar size="sm" />
            <ChevronDown className="w-3 h-3 text-lo hidden sm:block" />
          </button>

          {showProfile && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowProfile(false)} />
              <div
                className="absolute right-0 top-full mt-2 w-56 bg-surface border border-line rounded-xl overflow-hidden z-50"
                style={{ boxShadow: 'var(--shadow-popover)' }}
              >
                <div className="px-4 py-3 border-b border-line flex items-center gap-3">
                  <Avatar size="md" />
                  <div className="min-w-0">
                    <p className="text-sm text-hi font-semibold truncate">{PROFILE_NAME}</p>
                    <p className="text-xs text-lo truncate">{PROFILE_EMAIL}</p>
                  </div>
                </div>
                <div className="p-1">
                  {[
                    { icon: User,     label: 'Profile'  },
                    { icon: Settings, label: 'Settings' },
                    { icon: LogOut,   label: 'Sign out' },
                  ].map((item) => (
                    <button
                      key={item.label}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-mid hover:bg-subtle hover:text-hi rounded-lg transition-colors"
                      onClick={() => setShowProfile(false)}
                    >
                      <item.icon className="w-4 h-4 shrink-0" />
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── Mobile hamburger ──────────────────────────────────────────── */}
        <button
          className="md:hidden flex items-center justify-center w-8 h-8 rounded-lg hover:bg-subtle transition-colors shrink-0"
          onClick={() => { setShowMobileMenu((v) => !v); setShowNotifs(false); setShowProfile(false); }}
          aria-label={showMobileMenu ? 'Close menu' : 'Open menu'}
          aria-expanded={showMobileMenu}
        >
          {showMobileMenu ? <X className="w-4 h-4 text-mid" /> : <Menu className="w-4 h-4 text-mid" />}
        </button>
      </nav>

      {/* ── Mobile drawer ──────────────────────────────────────────────────── */}
      {showMobileMenu && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-30 bg-black/20 md:hidden" onClick={() => setShowMobileMenu(false)} />

          {/* Drawer panel — slides from below the nav */}
          <div
            className="fixed top-14 left-0 right-0 z-40 bg-surface border-b border-line shadow-lg md:hidden"
            style={{ boxShadow: 'var(--shadow-popover)' }}
          >
            {/* Search bar */}
            <div className="px-4 pt-3 pb-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-lo" />
                <input
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search servers, IPs, racks…"
                  className="w-full bg-subtle border border-line rounded-xl pl-9 pr-8 py-2.5 text-sm text-hi placeholder:text-lo focus:outline-none focus:border-info focus:ring-2 focus:ring-info/20"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-lo hover:text-mid"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Mobile search results */}
              {searchResults.length > 0 && (
                <div className="mt-2 bg-surface border border-line rounded-xl overflow-hidden">
                  {searchResults.map((obj) => (
                    <button
                      key={obj.id}
                      onClick={() => { navigate(`/server/${obj.id}`); setShowMobileMenu(false); setSearchQuery(''); }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-subtle transition-colors text-left border-b border-line last:border-0"
                    >
                      <span className={`w-2 h-2 rounded-full shrink-0 ${obj.status === 'critical' ? 'bg-danger' : obj.status === 'warning' ? 'bg-warn' : 'bg-ok'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-hi font-mono font-medium truncate">{obj.name}</p>
                        <p className="text-xs text-lo">{obj.ip} · {obj.rack}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-line" />

            {/* Nav links */}
            <nav className="px-3 py-2">
              {NAV_LINKS.map((item) => (
                <NavLink
                  key={item.href}
                  to={item.href}
                  end={item.end}
                  onClick={() => setShowMobileMenu(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors ${
                      isActive
                        ? 'bg-subtle text-hi font-semibold'
                        : 'text-mid hover:bg-subtle hover:text-hi'
                    }`
                  }
                >
                  {item.label}
                  <ChevronRight className="w-4 h-4 text-lo ml-auto" />
                </NavLink>
              ))}
            </nav>

            {/* System health summary row */}
            <div className="border-t border-line px-4 py-3 flex items-center gap-3">
              <span className="text-xs text-lo font-medium">System status</span>
              {criticalCount > 0 && (
                <span className="flex items-center gap-1.5 text-xs font-bold text-danger-text bg-danger-bg border border-danger/30 px-2 py-1 rounded-lg">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-danger opacity-60" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-danger" />
                  </span>
                  {criticalCount} Critical
                </span>
              )}
              {warningCount > 0 && (
                <span className="flex items-center gap-1.5 text-xs font-bold text-warn-text bg-warn-bg border border-warn/30 px-2 py-1 rounded-lg">
                  <span className="w-2 h-2 rounded-full bg-warn" />
                  {warningCount} Warning
                </span>
              )}
              {criticalCount === 0 && warningCount === 0 && (
                <span className="flex items-center gap-1.5 text-xs font-medium text-ok-text bg-ok-bg border border-ok/20 px-2 py-1 rounded-lg">
                  <span className="w-2 h-2 rounded-full bg-ok" />
                  All OK
                </span>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
