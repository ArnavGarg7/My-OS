export interface BytesFormatOptions {
  /** Decimal places. Default 1. */
  decimals?: number;
  /** Use binary (1024) units. Default true. */
  binary?: boolean;
}

const BINARY_UNITS = ["B", "KiB", "MiB", "GiB", "TiB", "PiB"];
const DECIMAL_UNITS = ["B", "KB", "MB", "GB", "TB", "PB"];

/** Human-readable byte size, e.g. "1.4 MiB" / "1.5 MB". */
export function formatBytes(bytes: number, options: BytesFormatOptions = {}): string {
  const { decimals = 1, binary = true } = options;
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";

  const base = binary ? 1024 : 1000;
  const units = binary ? BINARY_UNITS : DECIMAL_UNITS;
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(base)), units.length - 1);
  const value = bytes / Math.pow(base, exponent);
  const formatted = exponent === 0 ? String(bytes) : value.toFixed(decimals);
  return `${formatted} ${units[exponent]}`;
}

/** Alias of {@link formatBytes} using decimal (1000) units by default. */
export function formatFileSize(bytes: number, options: BytesFormatOptions = {}): string {
  return formatBytes(bytes, { binary: false, ...options });
}
