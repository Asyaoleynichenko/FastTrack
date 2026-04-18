export type Status = 'healthy' | 'warning' | 'critical';
export type ObjectType = 'server' | 'switch' | 'router' | 'load_balancer' | 'storage';

export interface Port {
  id: string;
  name: string;
  speed: string;
  status: 'up' | 'down' | 'unknown';
  connectedTo?: string;
  connectedToId?: string;
  vlan?: number;
  mac?: string;
}

export interface IPAddress {
  address: string;
  mask: string;
  type: 'primary' | 'secondary' | 'virtual' | 'loopback';
  iface: string;
  rdns?: string;
}

export interface NATEntry {
  id: string;
  internal: string;
  external: string;
  protocol: 'TCP' | 'UDP' | 'ICMP' | 'ALL';
  internalPort?: number;
  externalPort?: number;
  description?: string;
}

export interface Comment {
  id: string;
  author: string;
  timestamp: string;
  text: string;
  type?: 'info' | 'warning' | 'action';
}

export interface Connection {
  targetId: string;
  targetName: string;
  type: 'uplink' | 'downlink' | 'peer' | 'management';
  label?: string;
  localPort?: string;
  remotePort?: string;
  bandwidth?: string;
}

export interface NetworkObject {
  id: string;
  name: string;
  status: Status;
  type: ObjectType;
  rack: string;
  rackUnit: number;
  rackSize: number;
  ip: string;
  os?: string;
  cpu?: string;
  ram?: string;
  disk?: string;
  tags: string[];
  lastSeen: string;
  uptime?: string;
  issues?: string[];
  impact?: string[];
  ports: Port[];
  ipAddresses: IPAddress[];
  natEntries: NATEntry[];
  comments: Comment[];
  connections: Connection[];
  vendor?: string;
  model?: string;
  serial?: string;
}

export const RACKS = ['RACK-A01', 'RACK-A02', 'RACK-B01', 'RACK-B02'];

export const mockObjects: NetworkObject[] = [
  // ── RACK-A01 ──────────────────────────────────────────────────
  {
    id: 'sw-a01-core',
    name: 'sw-a01-core',
    status: 'healthy',
    type: 'switch',
    rack: 'RACK-A01',
    rackUnit: 1,
    rackSize: 1,
    ip: '10.0.0.1',
    vendor: 'Cisco',
    model: 'Nexus 9336C-FX2',
    serial: 'CS-9847361-C',
    tags: ['network', 'core'],
    lastSeen: 'Just now',
    uptime: '122d 4h 0m',
    issues: [],
    ports: Array.from({ length: 24 }, (_, i) => ({
      id: `sw-a01-p${i + 1}`,
      name: `port-${i + 1}`,
      speed: i < 20 ? '10G' : '40G',
      status: (i < 18 ? 'up' : i < 22 ? 'down' : 'up') as 'up' | 'down',
      vlan: 100 + (i % 4) * 100,
      mac: `00:4A:2B:3C:4D:${(i + 1).toString(16).padStart(2, '0')}`,
    })),
    ipAddresses: [
      { address: '10.0.0.1', mask: '/24', type: 'primary', iface: 'mgmt0', rdns: 'sw-a01-core.internal' },
    ],
    natEntries: [],
    comments: [],
    connections: [
      { targetId: 'lb-prod-01', targetName: 'lb-prod-01', type: 'uplink', bandwidth: '10G', localPort: 'port-1', remotePort: '1.1' },
      { targetId: 'web-prod-01', targetName: 'web-prod-01', type: 'downlink', bandwidth: '10G', localPort: 'port-12', remotePort: 'eth0' },
      { targetId: 'web-prod-02', targetName: 'web-prod-02', type: 'downlink', bandwidth: '10G', localPort: 'port-13', remotePort: 'eth0' },
    ],
  },
  {
    id: 'lb-prod-01',
    name: 'lb-prod-01',
    status: 'healthy',
    type: 'load_balancer',
    rack: 'RACK-A01',
    rackUnit: 2,
    rackSize: 1,
    ip: '10.0.0.5',
    vendor: 'F5',
    model: 'BIG-IP 2000s',
    serial: 'F5-1029384-B',
    tags: ['production', 'network', 'critical'],
    lastSeen: 'Just now',
    uptime: '87d 12h 5m',
    issues: [],
    ports: [
      { id: 'p-mgmt', name: 'mgmt', speed: '1G', status: 'up', connectedTo: 'mgmt-switch-01', connectedToId: 'mgmt-switch-01', mac: '00:3A:2B:3C:4D:5E' },
      { id: 'p-1.1', name: '1.1', speed: '10G', status: 'up', connectedTo: 'sw-a01-core', connectedToId: 'sw-a01-core', vlan: 100, mac: '00:3A:2B:3C:4D:5F' },
      { id: 'p-1.2', name: '1.2', speed: '10G', status: 'up', connectedTo: 'sw-a01-core', connectedToId: 'sw-a01-core', vlan: 100, mac: '00:3A:2B:3C:4D:60' },
    ],
    ipAddresses: [
      { address: '10.0.0.5', mask: '/24', type: 'primary', iface: 'mgmt', rdns: 'lb-prod-01.internal' },
      { address: '203.0.113.1', mask: '/28', type: 'virtual', iface: '1.1', rdns: 'lb-prod-01.external' },
    ],
    natEntries: [
      { id: 'nat-lb-1', internal: '10.0.1.10', external: '203.0.113.1', protocol: 'TCP', internalPort: 80, externalPort: 80, description: 'HTTP → web-prod-01' },
      { id: 'nat-lb-2', internal: '10.0.1.11', external: '203.0.113.1', protocol: 'TCP', internalPort: 80, externalPort: 80, description: 'HTTP → web-prod-02' },
      { id: 'nat-lb-3', internal: '10.0.1.10', external: '203.0.113.1', protocol: 'TCP', internalPort: 443, externalPort: 443, description: 'HTTPS → web-prod-01' },
    ],
    comments: [],
    connections: [
      { targetId: 'sw-a01-core', targetName: 'sw-a01-core', type: 'downlink', label: 'Core switch uplink', bandwidth: '10G' },
      { targetId: 'web-prod-01', targetName: 'web-prod-01', type: 'downlink', label: 'Backend pool member', bandwidth: '10G' },
      { targetId: 'web-prod-02', targetName: 'web-prod-02', type: 'downlink', label: 'Backend pool member', bandwidth: '10G' },
    ],
  },
  {
    id: 'web-prod-01',
    name: 'web-prod-01',
    status: 'critical',
    type: 'server',
    rack: 'RACK-A01',
    rackUnit: 4,
    rackSize: 2,
    ip: '10.0.1.10',
    os: 'Ubuntu 22.04 LTS',
    cpu: 'Intel Xeon E5-2690 v4 (28 cores)',
    ram: '128 GB ECC DDR4',
    disk: '2× 1TB NVMe SSD (RAID1)',
    vendor: 'Dell',
    model: 'PowerEdge R740',
    serial: 'DL-2847591-A1',
    tags: ['production', 'web', 'critical'],
    lastSeen: '2 min ago',
    uptime: '14d 3h 22m',
    issues: ['Disk failure detected on /dev/sdb', 'Memory ECC errors (threshold exceeded)'],
    impact: ['Serves 40% of prod traffic via lb-prod-01', 'Feeds db-prod-01 for writes', 'Blocked replacement: maintenance window required'],
    ports: [
      { id: 'p-eth0', name: 'eth0', speed: '10G', status: 'up', connectedTo: 'sw-a01-core', connectedToId: 'sw-a01-core', vlan: 100, mac: '00:1A:2B:3C:4D:5E' },
      { id: 'p-eth1', name: 'eth1', speed: '10G', status: 'up', connectedTo: 'sw-a01-core', connectedToId: 'sw-a01-core', vlan: 200, mac: '00:1A:2B:3C:4D:5F' },
      { id: 'p-ilo0', name: 'ilo0', speed: '1G', status: 'up', connectedTo: 'mgmt-switch-01', connectedToId: 'mgmt-switch-01', mac: '00:1A:2B:3C:4D:60' },
      { id: 'p-eth2', name: 'eth2', speed: '1G', status: 'down', mac: '00:1A:2B:3C:4D:61' },
    ],
    ipAddresses: [
      { address: '10.0.1.10', mask: '/24', type: 'primary', iface: 'eth0', rdns: 'web-prod-01.internal' },
      { address: '10.0.2.10', mask: '/24', type: 'secondary', iface: 'eth1', rdns: 'web-prod-01-storage.internal' },
      { address: '172.16.0.10', mask: '/16', type: 'virtual', iface: 'eth0:0' },
    ],
    natEntries: [
      { id: 'nat-w1-1', internal: '10.0.1.10', external: '203.0.113.10', protocol: 'TCP', internalPort: 80, externalPort: 80, description: 'HTTP public traffic via LB' },
      { id: 'nat-w1-2', internal: '10.0.1.10', external: '203.0.113.10', protocol: 'TCP', internalPort: 443, externalPort: 443, description: 'HTTPS public traffic via LB' },
    ],
    comments: [
      { id: 'c-w1-1', author: 'alex.turner', timestamp: '2026-04-17 09:15', text: '🚨 Disk /dev/sdb reporting SMART errors. Replacement part ordered (ETA 24h). Server should be drained ASAP.', type: 'warning' },
      { id: 'c-w1-2', author: 'maria.chen', timestamp: '2026-04-17 07:30', text: 'ECC memory errors started at 06:45 UTC. Monitoring closely. Threshold: 10 errors/hr, currently at 8.', type: 'info' },
      { id: 'c-w1-3', author: 'ops-bot', timestamp: '2026-04-16 22:00', text: 'Automated health check: FAIL — disk I/O latency above threshold (avg 45ms, limit 20ms).', type: 'warning' },
    ],
    connections: [
      { targetId: 'lb-prod-01', targetName: 'lb-prod-01', type: 'uplink', label: 'Load balanced (pool member)', localPort: 'eth0', remotePort: 'port-8', bandwidth: '10G' },
      { targetId: 'sw-a01-core', targetName: 'sw-a01-core', type: 'downlink', label: 'Core switch', localPort: 'eth0', remotePort: 'port-12', bandwidth: '10G' },
      { targetId: 'db-prod-01', targetName: 'db-prod-01', type: 'peer', label: 'Primary database', localPort: 'eth1', remotePort: 'eth0', bandwidth: '10G' },
      { targetId: 'storage-san-01', targetName: 'storage-san-01', type: 'peer', label: 'NFS mount (SAN)', localPort: 'eth1', remotePort: 'e0a', bandwidth: '10G' },
    ],
  },
  {
    id: 'web-prod-02',
    name: 'web-prod-02',
    status: 'warning',
    type: 'server',
    rack: 'RACK-A01',
    rackUnit: 6,
    rackSize: 2,
    ip: '10.0.1.11',
    os: 'Ubuntu 22.04 LTS',
    cpu: 'Intel Xeon E5-2690 v4 (28 cores)',
    ram: '128 GB ECC DDR4',
    disk: '2× 1TB NVMe SSD (RAID1)',
    vendor: 'Dell',
    model: 'PowerEdge R740',
    serial: 'DL-2847592-A1',
    tags: ['production', 'web'],
    lastSeen: '1 min ago',
    uptime: '32d 7h 15m',
    issues: ['High CPU load (avg 87% over 30 min)'],
    impact: ['Serving 60% of prod traffic (web-prod-01 degraded)'],
    ports: [
      { id: 'p-eth0', name: 'eth0', speed: '10G', status: 'up', connectedTo: 'sw-a01-core', connectedToId: 'sw-a01-core', vlan: 100, mac: '00:2A:2B:3C:4D:5E' },
      { id: 'p-eth1', name: 'eth1', speed: '10G', status: 'up', connectedTo: 'sw-a01-core', connectedToId: 'sw-a01-core', vlan: 200, mac: '00:2A:2B:3C:4D:5F' },
      { id: 'p-ilo0', name: 'ilo0', speed: '1G', status: 'up', connectedTo: 'mgmt-switch-01', connectedToId: 'mgmt-switch-01', mac: '00:2A:2B:3C:4D:60' },
    ],
    ipAddresses: [
      { address: '10.0.1.11', mask: '/24', type: 'primary', iface: 'eth0', rdns: 'web-prod-02.internal' },
      { address: '10.0.2.11', mask: '/24', type: 'secondary', iface: 'eth1' },
    ],
    natEntries: [
      { id: 'nat-w2-1', internal: '10.0.1.11', external: '203.0.113.11', protocol: 'TCP', internalPort: 80, externalPort: 80, description: 'HTTP public traffic via LB' },
    ],
    comments: [
      { id: 'c-w2-1', author: 'ops-bot', timestamp: '2026-04-17 08:00', text: 'CPU utilization alert: 87% average over last 30 minutes. Auto-scaling triggered, waiting for new node.', type: 'warning' },
    ],
    connections: [
      { targetId: 'lb-prod-01', targetName: 'lb-prod-01', type: 'uplink', label: 'Load balanced (pool member)', localPort: 'eth0', remotePort: 'port-9', bandwidth: '10G' },
      { targetId: 'sw-a01-core', targetName: 'sw-a01-core', type: 'downlink', label: 'Core switch', localPort: 'eth0', remotePort: 'port-13', bandwidth: '10G' },
      { targetId: 'db-prod-01', targetName: 'db-prod-01', type: 'peer', label: 'Primary database', localPort: 'eth1', remotePort: 'eth1', bandwidth: '10G' },
    ],
  },

  // ── RACK-A02 ──────────────────────────────────────────────────
  {
    id: 'sw-a02-core',
    name: 'sw-a02-core',
    status: 'healthy',
    type: 'switch',
    rack: 'RACK-A02',
    rackUnit: 1,
    rackSize: 1,
    ip: '10.0.0.2',
    vendor: 'Cisco',
    model: 'Nexus 9336C-FX2',
    serial: 'CS-9847362-C',
    tags: ['network', 'core'],
    lastSeen: 'Just now',
    uptime: '90d 8h 0m',
    issues: [],
    ports: Array.from({ length: 24 }, (_, i) => ({
      id: `sw-a02-p${i + 1}`,
      name: `port-${i + 1}`,
      speed: '10G',
      status: (i < 12 ? 'up' : i < 20 ? 'down' : 'up') as 'up' | 'down',
      vlan: 200,
      mac: `00:5A:2B:3C:4D:${(i + 1).toString(16).padStart(2, '0')}`,
    })),
    ipAddresses: [
      { address: '10.0.0.2', mask: '/24', type: 'primary', iface: 'mgmt0', rdns: 'sw-a02-core.internal' },
    ],
    natEntries: [],
    comments: [],
    connections: [
      { targetId: 'db-prod-01', targetName: 'db-prod-01', type: 'downlink', bandwidth: '10G', localPort: 'port-1' },
      { targetId: 'db-replica-01', targetName: 'db-replica-01', type: 'downlink', bandwidth: '10G', localPort: 'port-2' },
      { targetId: 'api-prod-01', targetName: 'api-prod-01', type: 'downlink', bandwidth: '10G', localPort: 'port-3' },
    ],
  },
  {
    id: 'db-prod-01',
    name: 'db-prod-01',
    status: 'warning',
    type: 'server',
    rack: 'RACK-A02',
    rackUnit: 4,
    rackSize: 2,
    ip: '10.0.2.10',
    os: 'RHEL 9.2',
    cpu: 'AMD EPYC 7742 (64 cores)',
    ram: '512 GB ECC DDR4',
    disk: '4× 4TB NVMe SSD (RAID10)',
    vendor: 'HPE',
    model: 'ProLiant DL380 Gen10',
    serial: 'HP-6372810-D',
    tags: ['production', 'database', 'critical'],
    lastSeen: '5 min ago',
    uptime: '45d 2h 10m',
    issues: ['Replication lag to db-replica-01 (2.3s, threshold 1s)'],
    impact: ['Primary DB for web-prod-01, web-prod-02, api-prod-01', 'Replica lag may cause stale reads'],
    ports: [
      { id: 'p-eth0', name: 'eth0', speed: '10G', status: 'up', connectedTo: 'sw-a02-core', connectedToId: 'sw-a02-core', vlan: 200, mac: '00:6A:2B:3C:4D:5E' },
      { id: 'p-eth1', name: 'eth1', speed: '10G', status: 'up', connectedTo: 'sw-a02-core', connectedToId: 'sw-a02-core', vlan: 200, mac: '00:6A:2B:3C:4D:5F' },
    ],
    ipAddresses: [
      { address: '10.0.2.10', mask: '/24', type: 'primary', iface: 'eth0', rdns: 'db-prod-01.internal' },
      { address: '10.0.2.110', mask: '/24', type: 'loopback', iface: 'lo', rdns: 'db-prod-01-loopback.internal' },
    ],
    natEntries: [],
    comments: [
      { id: 'c-db1-1', author: 'dba.jones', timestamp: '2026-04-17 10:00', text: 'Replication lag spiked after large batch job at 09:30. Monitoring to see if self-recovers within 1 hour.', type: 'info' },
      { id: 'c-db1-2', author: 'ops-bot', timestamp: '2026-04-17 09:31', text: 'Alert: db-replica-01 replication lag exceeded 1s threshold. Current: 2.3s.', type: 'warning' },
    ],
    connections: [
      { targetId: 'web-prod-01', targetName: 'web-prod-01', type: 'uplink', label: 'App writes', bandwidth: '10G', remotePort: 'eth1' },
      { targetId: 'web-prod-02', targetName: 'web-prod-02', type: 'uplink', label: 'App writes', bandwidth: '10G', remotePort: 'eth1' },
      { targetId: 'api-prod-01', targetName: 'api-prod-01', type: 'uplink', label: 'API reads/writes', bandwidth: '10G' },
      { targetId: 'db-replica-01', targetName: 'db-replica-01', type: 'peer', label: 'Replication stream', bandwidth: '10G', localPort: 'eth0', remotePort: 'eth0' },
      { targetId: 'sw-a02-core', targetName: 'sw-a02-core', type: 'downlink', label: 'Core switch', bandwidth: '10G' },
      { targetId: 'storage-san-01', targetName: 'storage-san-01', type: 'peer', label: 'iSCSI storage', bandwidth: '10G' },
    ],
  },
  {
    id: 'db-replica-01',
    name: 'db-replica-01',
    status: 'warning',
    type: 'server',
    rack: 'RACK-A02',
    rackUnit: 6,
    rackSize: 2,
    ip: '10.0.2.11',
    os: 'RHEL 9.2',
    cpu: 'AMD EPYC 7742 (64 cores)',
    ram: '512 GB ECC DDR4',
    disk: '4× 4TB NVMe SSD (RAID10)',
    vendor: 'HPE',
    model: 'ProLiant DL380 Gen10',
    serial: 'HP-6372811-D',
    tags: ['production', 'database', 'replica'],
    lastSeen: '5 min ago',
    uptime: '45d 2h 8m',
    issues: ['Replication lag from primary (2.3s, threshold 1s)'],
    ports: [
      { id: 'p-eth0', name: 'eth0', speed: '10G', status: 'up', connectedTo: 'sw-a02-core', connectedToId: 'sw-a02-core', vlan: 200, mac: '00:7A:2B:3C:4D:5E' },
    ],
    ipAddresses: [
      { address: '10.0.2.11', mask: '/24', type: 'primary', iface: 'eth0', rdns: 'db-replica-01.internal' },
    ],
    natEntries: [],
    comments: [],
    connections: [
      { targetId: 'db-prod-01', targetName: 'db-prod-01', type: 'uplink', label: 'Replication source', bandwidth: '10G' },
      { targetId: 'sw-a02-core', targetName: 'sw-a02-core', type: 'downlink', bandwidth: '10G' },
    ],
  },
  {
    id: 'api-prod-01',
    name: 'api-prod-01',
    status: 'healthy',
    type: 'server',
    rack: 'RACK-A02',
    rackUnit: 8,
    rackSize: 2,
    ip: '10.0.1.20',
    os: 'Debian 12 (Bookworm)',
    cpu: 'Intel Xeon Silver 4310 (24 cores)',
    ram: '64 GB ECC DDR4',
    disk: '2× 500GB NVMe SSD',
    vendor: 'Supermicro',
    model: 'SYS-620P-TRT',
    serial: 'SM-4829103-E',
    tags: ['production', 'api'],
    lastSeen: 'Just now',
    uptime: '7d 14h 30m',
    issues: [],
    ports: [
      { id: 'p-eth0', name: 'eth0', speed: '10G', status: 'up', connectedTo: 'sw-a02-core', connectedToId: 'sw-a02-core', vlan: 100, mac: '00:8A:2B:3C:4D:5E' },
    ],
    ipAddresses: [
      { address: '10.0.1.20', mask: '/24', type: 'primary', iface: 'eth0', rdns: 'api-prod-01.internal' },
    ],
    natEntries: [
      { id: 'nat-api-1', internal: '10.0.1.20', external: '203.0.113.20', protocol: 'TCP', internalPort: 8080, externalPort: 443, description: 'API endpoint (TLS termination at LB)' },
    ],
    comments: [],
    connections: [
      { targetId: 'db-prod-01', targetName: 'db-prod-01', type: 'peer', label: 'Primary database', bandwidth: '10G' },
      { targetId: 'sw-a02-core', targetName: 'sw-a02-core', type: 'downlink', bandwidth: '10G' },
    ],
  },

  // ── RACK-B01 ──────────────────────────────────────────────────
  {
    id: 'sw-b01-core',
    name: 'sw-b01-core',
    status: 'critical',
    type: 'switch',
    rack: 'RACK-B01',
    rackUnit: 1,
    rackSize: 1,
    ip: '10.1.0.1',
    vendor: 'Juniper',
    model: 'EX4300-48P',
    serial: 'JN-2948371-F',
    tags: ['network', 'staging'],
    lastSeen: '10 min ago',
    uptime: '3h 12m',
    issues: ['Recent unexpected reboot', '3 ports flapping (port-5, port-9, port-17)'],
    impact: ['All RACK-B01 connectivity depends on this switch', 'Staging environment unstable'],
    ports: Array.from({ length: 24 }, (_, i) => ({
      id: `sw-b01-p${i + 1}`,
      name: `port-${i + 1}`,
      speed: '1G',
      status: ([4, 8, 16].includes(i) ? 'unknown' : i < 15 ? 'up' : 'down') as 'up' | 'down' | 'unknown',
      vlan: 300,
    })),
    ipAddresses: [
      { address: '10.1.0.1', mask: '/24', type: 'primary', iface: 'me0', rdns: 'sw-b01-core.internal' },
    ],
    natEntries: [],
    comments: [
      { id: 'c-sb1-1', author: 'netops.kim', timestamp: '2026-04-17 07:00', text: 'Switch rebooted unexpectedly at 06:48 UTC. Investigating root cause. Ports 5, 9, 17 showing flapping — likely bad SFP modules. May need full replacement.', type: 'warning' },
    ],
    connections: [
      { targetId: 'web-staging-01', targetName: 'web-staging-01', type: 'downlink', bandwidth: '1G' },
      { targetId: 'db-staging-01', targetName: 'db-staging-01', type: 'downlink', bandwidth: '1G' },
      { targetId: 'monitor-01', targetName: 'monitor-01', type: 'downlink', bandwidth: '1G' },
    ],
  },
  {
    id: 'web-staging-01',
    name: 'web-staging-01',
    status: 'healthy',
    type: 'server',
    rack: 'RACK-B01',
    rackUnit: 4,
    rackSize: 2,
    ip: '10.1.1.10',
    os: 'Ubuntu 22.04 LTS',
    cpu: 'Intel Xeon E5-2670 v3 (24 cores)',
    ram: '64 GB ECC DDR4',
    disk: '2× 500GB NVMe',
    vendor: 'Dell',
    model: 'PowerEdge R640',
    serial: 'DL-3741821-B',
    tags: ['staging', 'web'],
    lastSeen: '3 min ago',
    uptime: '5d 9h 12m',
    issues: [],
    ports: [
      { id: 'p-eth0', name: 'eth0', speed: '1G', status: 'up', connectedTo: 'sw-b01-core', connectedToId: 'sw-b01-core', vlan: 300, mac: '00:9A:2B:3C:4D:5E' },
    ],
    ipAddresses: [
      { address: '10.1.1.10', mask: '/24', type: 'primary', iface: 'eth0', rdns: 'web-staging-01.internal' },
    ],
    natEntries: [],
    comments: [],
    connections: [
      { targetId: 'sw-b01-core', targetName: 'sw-b01-core', type: 'downlink', bandwidth: '1G' },
      { targetId: 'db-staging-01', targetName: 'db-staging-01', type: 'peer', label: 'Staging DB', bandwidth: '1G' },
    ],
  },
  {
    id: 'db-staging-01',
    name: 'db-staging-01',
    status: 'healthy',
    type: 'server',
    rack: 'RACK-B01',
    rackUnit: 6,
    rackSize: 2,
    ip: '10.1.2.10',
    os: 'RHEL 9.2',
    cpu: 'Intel Xeon Silver 4310 (24 cores)',
    ram: '128 GB ECC DDR4',
    disk: '2× 2TB NVMe',
    vendor: 'HPE',
    model: 'ProLiant DL360 Gen10',
    serial: 'HP-7382910-D',
    tags: ['staging', 'database'],
    lastSeen: '5 min ago',
    uptime: '12d 20h 5m',
    issues: [],
    ports: [
      { id: 'p-eth0', name: 'eth0', speed: '1G', status: 'up', connectedTo: 'sw-b01-core', connectedToId: 'sw-b01-core', vlan: 300, mac: '00:AA:2B:3C:4D:5E' },
    ],
    ipAddresses: [
      { address: '10.1.2.10', mask: '/24', type: 'primary', iface: 'eth0', rdns: 'db-staging-01.internal' },
    ],
    natEntries: [],
    comments: [],
    connections: [
      { targetId: 'web-staging-01', targetName: 'web-staging-01', type: 'uplink', bandwidth: '1G' },
      { targetId: 'sw-b01-core', targetName: 'sw-b01-core', type: 'downlink', bandwidth: '1G' },
    ],
  },
  {
    id: 'monitor-01',
    name: 'monitor-01',
    status: 'healthy',
    type: 'server',
    rack: 'RACK-B01',
    rackUnit: 10,
    rackSize: 2,
    ip: '10.0.0.50',
    os: 'Ubuntu 22.04 LTS',
    cpu: 'Intel Xeon Silver 4310 (12 cores)',
    ram: '32 GB DDR4',
    disk: '4× 2TB SSD',
    vendor: 'Dell',
    model: 'PowerEdge R540',
    serial: 'DL-8192837-E',
    tags: ['monitoring', 'ops'],
    lastSeen: 'Just now',
    uptime: '60d 1h 45m',
    issues: [],
    ports: [
      { id: 'p-eth0', name: 'eth0', speed: '1G', status: 'up', connectedTo: 'sw-b01-core', connectedToId: 'sw-b01-core', mac: '00:BA:2B:3C:4D:5E' },
    ],
    ipAddresses: [
      { address: '10.0.0.50', mask: '/24', type: 'primary', iface: 'eth0', rdns: 'monitor-01.internal' },
    ],
    natEntries: [],
    comments: [],
    connections: [
      { targetId: 'sw-b01-core', targetName: 'sw-b01-core', type: 'downlink', bandwidth: '1G' },
    ],
  },

  // ── RACK-B02 ──────────────────────────────────────────────────
  {
    id: 'router-edge-01',
    name: 'router-edge-01',
    status: 'healthy',
    type: 'router',
    rack: 'RACK-B02',
    rackUnit: 1,
    rackSize: 1,
    ip: '10.0.0.254',
    vendor: 'Cisco',
    model: 'ASR 1002-X',
    serial: 'CS-3948201-H',
    tags: ['network', 'edge', 'core'],
    lastSeen: 'Just now',
    uptime: '180d 0h 15m',
    issues: [],
    ports: [],
    ipAddresses: [
      { address: '10.0.0.254', mask: '/24', type: 'primary', iface: 'Gi0/0', rdns: 'router-edge-01.internal' },
      { address: '203.0.113.254', mask: '/28', type: 'secondary', iface: 'Gi0/1', rdns: 'gateway.isp.net' },
    ],
    natEntries: [],
    comments: [],
    connections: [
      { targetId: 'sw-a01-core', targetName: 'sw-a01-core', type: 'downlink', bandwidth: '10G' },
      { targetId: 'sw-a02-core', targetName: 'sw-a02-core', type: 'downlink', bandwidth: '10G' },
    ],
  },
  {
    id: 'storage-san-01',
    name: 'storage-san-01',
    status: 'healthy',
    type: 'storage',
    rack: 'RACK-B02',
    rackUnit: 2,
    rackSize: 4,
    ip: '10.0.3.10',
    vendor: 'NetApp',
    model: 'AFF A400',
    serial: 'NA-1029348-G',
    tags: ['storage', 'san', 'production'],
    lastSeen: 'Just now',
    uptime: '200d 5h 30m',
    issues: [],
    ports: [
      { id: 'p-e0a', name: 'e0a', speed: '10G', status: 'up', connectedTo: 'sw-a01-core', connectedToId: 'sw-a01-core', mac: '00:CA:2B:3C:4D:5E' },
      { id: 'p-e0b', name: 'e0b', speed: '10G', status: 'up', connectedTo: 'sw-a02-core', connectedToId: 'sw-a02-core', mac: '00:CA:2B:3C:4D:5F' },
    ],
    ipAddresses: [
      { address: '10.0.3.10', mask: '/24', type: 'primary', iface: 'e0a', rdns: 'storage-san-01.internal' },
      { address: '10.0.3.11', mask: '/24', type: 'secondary', iface: 'e0b' },
    ],
    natEntries: [],
    comments: [],
    connections: [
      { targetId: 'web-prod-01', targetName: 'web-prod-01', type: 'uplink', label: 'NFS mount', bandwidth: '10G' },
      { targetId: 'db-prod-01', targetName: 'db-prod-01', type: 'uplink', label: 'iSCSI LUN', bandwidth: '10G' },
      { targetId: 'backup-01', targetName: 'backup-01', type: 'peer', label: 'Backup target', bandwidth: '10G' },
    ],
  },
  {
    id: 'backup-01',
    name: 'backup-01',
    status: 'healthy',
    type: 'server',
    rack: 'RACK-B02',
    rackUnit: 6,
    rackSize: 2,
    ip: '10.0.3.50',
    os: 'Ubuntu 22.04 LTS',
    cpu: 'Intel Xeon E5-2620 v4 (16 cores)',
    ram: '32 GB DDR4',
    disk: '8× 8TB HDD (RAID6)',
    vendor: 'Supermicro',
    model: 'SYS-6048R-E1CR24L',
    serial: 'SM-9182736-I',
    tags: ['backup', 'ops'],
    lastSeen: '15 min ago',
    uptime: '30d 0h 0m',
    issues: [],
    ports: [
      { id: 'p-eth0', name: 'eth0', speed: '10G', status: 'up', connectedTo: 'sw-a01-core', connectedToId: 'sw-a01-core', mac: '00:DA:2B:3C:4D:5E' },
    ],
    ipAddresses: [
      { address: '10.0.3.50', mask: '/24', type: 'primary', iface: 'eth0', rdns: 'backup-01.internal' },
    ],
    natEntries: [],
    comments: [],
    connections: [
      { targetId: 'storage-san-01', targetName: 'storage-san-01', type: 'peer', label: 'Backup source', bandwidth: '10G' },
    ],
  },
  {
    id: 'mgmt-switch-01',
    name: 'mgmt-switch-01',
    status: 'healthy',
    type: 'switch',
    rack: 'RACK-B02',
    rackUnit: 8,
    rackSize: 1,
    ip: '10.0.0.10',
    vendor: 'Cisco',
    model: 'Catalyst 2960-X',
    serial: 'CS-8271930-J',
    tags: ['network', 'management', 'oob'],
    lastSeen: 'Just now',
    uptime: '250d 6h 0m',
    issues: [],
    ports: Array.from({ length: 24 }, (_, i) => ({
      id: `mgmt-p${i + 1}`,
      name: `fa0/${i + 1}`,
      speed: '1G',
      status: (i < 10 ? 'up' : 'down') as 'up' | 'down',
      vlan: 999,
    })),
    ipAddresses: [
      { address: '10.0.0.10', mask: '/24', type: 'primary', iface: 'vlan1', rdns: 'mgmt-switch-01.internal' },
    ],
    natEntries: [],
    comments: [],
    connections: [
      { targetId: 'web-prod-01', targetName: 'web-prod-01', type: 'management', label: 'iLO/BMC', bandwidth: '1G' },
      { targetId: 'lb-prod-01', targetName: 'lb-prod-01', type: 'management', label: 'OOB mgmt', bandwidth: '1G' },
    ],
  },
];

export function getObjectById(id: string): NetworkObject | undefined {
  return mockObjects.find((o) => o.id === id);
}

export function getObjectsByRack(rack: string): NetworkObject[] {
  return mockObjects.filter((o) => o.rack === rack);
}
