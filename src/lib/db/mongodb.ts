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
  } catch (err) {
    console.warn('Failed to convert Mongo SRV URI:', err);
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
    }).catch((err) => {
      console.warn(`DNS SRV resolution failed for ${srvName}:`, err);
      return [] as Array<{ name: string; port: number }>;
    });

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
  } catch (err) {
    console.warn('Error during convertMongoSrvToDirectUriViaSrvHosts:', err);
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

  // Try resolving SRV records directly (no insecure IP fallbacks)
  const viaSrvHosts = await convertMongoSrvToDirectUriViaSrvHosts(uri).catch((err) => {
    console.warn('SRV hosts fallback parsing threw an error:', err);
    return null;
  });
  if (viaSrvHosts) fallbackCandidates.push(viaSrvHosts);

  const candidates = [uri, ...fallbackCandidates];
  let lastErr: unknown = null;

  for (const candidate of candidates) {
    // Redact password from connection strings in logging for security
    const loggedCandidate = candidate.replace(/\/\/([^:]+):([^@]+)@/, '//$1:<redacted>@');
    try {
      const client = new MongoClient(candidate, {
        connectTimeoutMS: 10_000,
        serverSelectionTimeoutMS: 10_000,
      });
      await client.connect();
      return client;
    } catch (err) {
      console.warn(`MongoDB candidate connection failed for: ${loggedCandidate}. Error:`, err);
      lastErr = err;
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

