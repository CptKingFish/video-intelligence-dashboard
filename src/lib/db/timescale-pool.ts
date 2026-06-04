import "server-only";

/** pg pool options that work with Timescale Cloud TLS from Node. */
export function timescalePoolConfig(connectionString: string) {
  const url = connectionString.includes("uselibpqcompat")
    ? connectionString
    : `${connectionString}${connectionString.includes("?") ? "&" : "?"}uselibpqcompat=true&sslmode=require`;

  return {
    connectionString: url,
    connectionTimeoutMillis: 10_000,
    ssl: { rejectUnauthorized: false as const },
  };
}
