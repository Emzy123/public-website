import { MongoClient, Db } from 'mongodb';
import { Resolver } from 'node:dns';

let clientPromise: Promise<MongoClient> | null = null;

function convertMongoSrvToDirectUri(srvUri: string): string | null {
  try {
    const u = new URL(srvUri);
    if (u.protocol !== 'mongodb+srv:') return null;

    const hostname = u.hostname;
    const username = u.username ? encodeURIComponent(u.username) : '';
    const password = u.password ? encodeURIComponent(u.password) : '';
    const credentials = u.username ? `${username}:${password}@` : '';

    const pathname = u.pathname || '/';

    const params = new URLSearchParams(u.search);
    // Atlas typically requires TLS, so ensure it's enabled for the direct URI.
    if (!params.has('tls')) params.set('tls', 'true');
    // Direct connection avoids needing replica set discovery from SRV records.
    if (!params.has('directConnection')) params.set('directConnection', 'true');
    if (!params.has('authSource')) params.set('authSource', 'admin');

    return `mongodb://${credentials}${hostname}:27017${pathname}?${params.toString()}`;
  } catch {
    return null;
  }
}

async function convertMongoSrvToDirectUriViaIp(srvUri: string): Promise<string | null> {
  try {
    const u = new URL(srvUri);
    if (u.protocol !== 'mongodb+srv:') return null;

    const hostname = u.hostname;
    const username = u.username ? encodeURIComponent(u.username) : '';
    const password = u.password ? encodeURIComponent(u.password) : '';
    const credentials = u.username ? `${username}:${password}@` : '';

    const params = new URLSearchParams(u.search);
    if (!params.has('tls')) params.set('tls', 'true');
    if (!params.has('directConnection')) params.set('directConnection', 'true');
    if (!params.has('authSource')) params.set('authSource', 'admin');
    // When connecting by IP, the TLS cert hostname won't match; allow it.
    if (!params.has('tlsAllowInvalidHostnames')) params.set('tlsAllowInvalidHostnames', 'true');

    const pathname = u.pathname || '/';

    const resolver = new Resolver();
    resolver.setServers(['8.8.8.8', '1.1.1.1']);
    const ips = await new Promise<string[]>((resolve, reject) => {
      resolver.resolve4(hostname, (err, addresses) => {
        if (err) return reject(err);
        resolve(addresses);
      });
    }).catch((dnsErr) => {
      console.error('Atlas host IP resolution failed (public DNS).', {
        hostname,
        dnsErr: (dnsErr as any)?.code ?? dnsErr,
      });
      return [];
    });
    const ip = ips[0];
    if (!ip) return null;

    return `mongodb://${credentials}${ip}:27017${pathname}?${params.toString()}`;
  } catch {
    return null;
  }
}

async function convertMongoSrvToDirectUriViaSrvIps(srvUri: string): Promise<string | null> {
  try {
    const u = new URL(srvUri);
    if (u.protocol !== 'mongodb+srv:') return null;

    const hostname = u.hostname;
    const username = u.username ? encodeURIComponent(u.username) : '';
    const password = u.password ? encodeURIComponent(u.password) : '';
    const credentials = u.username ? `${username}:${password}@` : '';

    const params = new URLSearchParams(u.search);
    if (!params.has('tls')) params.set('tls', 'true');
    if (!params.has('authSource')) params.set('authSource', 'admin');
    // We're connecting via IPs, so the TLS cert hostname won't match.
    if (!params.has('tlsAllowInvalidHostnames')) params.set('tlsAllowInvalidHostnames', 'true');

    const srvName = `_mongodb._tcp.${hostname}`;
    const resolver = new Resolver();
    resolver.setServers(['8.8.8.8', '1.1.1.1']);

    const srvRecords = await new Promise<
      Array<{ name: string; port: number; priority: number; weight: number }>
    >((resolve, reject) => {
      resolver.resolveSrv(srvName, (err, addresses) => {
        if (err) return reject(err);
        resolve(addresses as any);
      });
    }).catch(() => []);

    const uniqueHostPorts = new Set<string>();

    for (const rec of srvRecords) {
      const target = String(rec.name).replace(/\.$/, '');
      const port = rec.port || 27017;
      const ips = await new Promise<string[]>((resolve, reject) => {
        resolver.resolve4(target, (err, addresses) => {
          if (err) return reject(err);
          resolve(addresses as any);
        });
      }).catch(() => []);

      for (const ip of ips) {
        uniqueHostPorts.add(`${ip}:${port}`);
      }
    }

    if (uniqueHostPorts.size === 0) return null;

    const hosts = Array.from(uniqueHostPorts).join(',');
    const pathname = u.pathname || '/';
    return `mongodb://${credentials}${hosts}${pathname}?${params.toString()}`;
  } catch {
    return null;
  }
}

async function convertMongoSrvToDirectUriViaSrvHosts(srvUri: string): Promise<string | null> {
  try {
    const u = new URL(srvUri);
    if (u.protocol !== 'mongodb+srv:') return null;

    const hostname = u.hostname;
    const username = u.username ? encodeURIComponent(u.username) : '';
    const password = u.password ? encodeURIComponent(u.password) : '';
    const credentials = u.username ? `${username}:${password}@` : '';

    const params = new URLSearchParams(u.search);
    if (!params.has('tls')) params.set('tls', 'true');
    if (!params.has('authSource')) params.set('authSource', 'admin');

    const srvName = `_mongodb._tcp.${hostname}`;
    const resolver = new Resolver();
    resolver.setServers(['8.8.8.8', '1.1.1.1']);

    const srvRecords = await new Promise<Array<{ name: string; port: number }>>((resolve, reject) => {
      resolver.resolveSrv(srvName, (err, addresses) => {
        if (err) return reject(err);
        resolve(addresses as any);
      });
    }).catch(() => []);

    const uniqueHostPorts = new Set<string>();
    for (const rec of srvRecords) {
      const target = String(rec.name).replace(/\.$/, '');
      const port = rec.port || 27017;
      uniqueHostPorts.add(`${target}:${port}`);
    }

    if (uniqueHostPorts.size === 0) return null;

    const hosts = Array.from(uniqueHostPorts).join(',');
    const pathname = u.pathname || '/';
    return `mongodb://${credentials}${hosts}${pathname}?${params.toString()}`;
  } catch {
    return null;
  }
}

async function connectMongoWithFallback(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB;
  const directUri = process.env.MONGODB_URI_DIRECT;

  if (!uri) throw new Error('Missing MONGODB_URI env var');
  if (!dbName) throw new Error('Missing MONGODB_DB env var');

  const fallbackCandidates: string[] = [];
  if (directUri) fallbackCandidates.push(directUri);

  const autoConverted = convertMongoSrvToDirectUri(uri);
  if (autoConverted) fallbackCandidates.push(autoConverted);

  // Last-resort: resolve the Atlas hostname using a public DNS resolver,
  // then connect by IP (with TLS hostname validation disabled for this hop).
  const viaIp = await convertMongoSrvToDirectUriViaIp(uri).catch(() => null);
  if (viaIp) fallbackCandidates.push(viaIp);

  // Also try: resolve SRV -> shard hostnames -> connect by hostname.
  // This preserves TLS SNI and often works even when A record for the SRV hostname is missing.
  const viaSrvHosts = await convertMongoSrvToDirectUriViaSrvHosts(uri).catch(() => null);
  if (viaSrvHosts) fallbackCandidates.push(viaSrvHosts);

  // Best-effort: resolve SRV -> shard hostnames -> A records -> connect by IP.
  // This avoids both SRV and A record issues on your network (but may require TLS quirks).
  const viaSrvIps = await convertMongoSrvToDirectUriViaSrvIps(uri).catch(() => null);
  if (viaSrvIps) fallbackCandidates.push(viaSrvIps);

  const candidates = [uri, ...fallbackCandidates];
  let lastErr: unknown = null;

  for (const candidate of candidates) {
    const client = new MongoClient(candidate, {
      connectTimeoutMS: 10_000,
      serverSelectionTimeoutMS: 10_000,
    });

    try {
      await client.connect();
      return client;
    } catch (err) {
      lastErr = err;
      // Try the next candidate (direct URI) if SRV/DNS is failing.
    }
  }

  throw lastErr ?? new Error('Failed to connect to MongoDB');
}

function getEnv() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB;

  if (!uri) {
    throw new Error('Missing MONGODB_URI env var');
  }
  if (!dbName) {
    throw new Error('Missing MONGODB_DB env var');
  }

  return { uri, dbName };
}

export async function getMongoDb(): Promise<Db> {
  const { dbName } = getEnv();

  if (!clientPromise) {
    clientPromise = connectMongoWithFallback().catch((err) => {
      clientPromise = null;
      throw err;
    });
  }

  const client = await clientPromise;
  return client.db(dbName);
}

