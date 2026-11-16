const CODE_PATTERN = /^[A-Z0-9_]{2,24}$/i;

/**
 * An error reduced to its class and code (PostgresError 42P01, Error ECONNREFUSED). Driver
 * messages and parameters can carry a hostname, a connection string or a visitor's message,
 * so logs and the health page only ever get this.
 */
export function errorClass(error: unknown) {
  if (!(error instanceof Error)) return typeof error;
  const code = "code" in error ? error.code : undefined;
  return typeof code === "string" && CODE_PATTERN.test(code) ? `${error.name} ${code}` : error.name;
}
