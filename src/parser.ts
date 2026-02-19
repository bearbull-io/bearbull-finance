import type { ParsedEmbed, EmbedType } from "./types";

const ALIAS_TO_CANONICAL: Record<string, EmbedType> = {
  // Canonical names
  CHART: "CHART", CHART_COMPLEX: "CHART_COMPLEX", PROFILE: "PROFILE",
  INCOME_STATEMENT: "INCOME_STATEMENT", BALANCE_SHEET: "BALANCE_SHEET",
  CASHFLOW_STATEMENT: "CASHFLOW_STATEMENT", REVENUE_BREAKDOWN: "REVENUE_BREAKDOWN",
  CONSTITUENTS: "CONSTITUENTS", FULLTIME_EMPLOYEES: "FULLTIME_EMPLOYEES",
  INSTITUTIONAL_OWNERSHIP: "INSTITUTIONAL_OWNERSHIP",
  EPS: "EPS", VALUATION_RATIOS: "VALUATION_RATIOS", DIVIDENDS: "DIVIDENDS",
  EARNINGS_SURPRISE: "EARNINGS_SURPRISE", FINANCIAL_ESTIMATES: "FINANCIAL_ESTIMATES",
  MARKET_CAP: "MARKET_CAP", ESG_SCORE: "ESG_SCORE",
  INCOME_STATEMENT_TABLE: "INCOME_STATEMENT_TABLE", BALANCE_SHEET_TABLE: "BALANCE_SHEET_TABLE",
  CASHFLOW_STATEMENT_TABLE: "CASHFLOW_STATEMENT_TABLE", REVENUE_BREAKDOWN_TABLE: "REVENUE_BREAKDOWN_TABLE",
  // Short aliases
  SC: "CHART", CC: "CHART_COMPLEX", PRF: "PROFILE",
  IS: "INCOME_STATEMENT", BS: "BALANCE_SHEET",
  CS: "CASHFLOW_STATEMENT", CF: "CASHFLOW_STATEMENT",
  RB: "REVENUE_BREAKDOWN", CON: "CONSTITUENTS", FTE: "FULLTIME_EMPLOYEES",
  IH: "INSTITUTIONAL_OWNERSHIP", INST: "INSTITUTIONAL_OWNERSHIP",
  VR: "VALUATION_RATIOS", RATIO: "VALUATION_RATIOS",
  DIV: "DIVIDENDS", ES: "EARNINGS_SURPRISE", ESURP: "EARNINGS_SURPRISE",
  AE: "FINANCIAL_ESTIMATES", MC: "MARKET_CAP", MCAP: "MARKET_CAP", ESG: "ESG_SCORE",
  IST: "INCOME_STATEMENT_TABLE", BST: "BALANCE_SHEET_TABLE",
  CST: "CASHFLOW_STATEMENT_TABLE", CFT: "CASHFLOW_STATEMENT_TABLE",
  RBT: "REVENUE_BREAKDOWN_TABLE", REVT: "REVENUE_BREAKDOWN_TABLE",
};

const SUBTYPE_MAP: Record<string, string> = {
  PRO: "product", PRODUCT: "product",
  GEO: "geo", GEOGRAPHY: "geo", GEOGRAPHIC: "geo",
};

/**
 * Main entry point for parsing a `bb` code block.
 *
 * Parses key-value format where each line is `key: value`.
 * Each code block produces exactly one embed.
 */
export function parseBlock(source: string): ParsedEmbed[] {
  const lines = source
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) return [];

  const parsed = parseKeyValue(source);
  return parsed ? [parsed] : [];
}

/**
 * Parses a key-value section into a ParsedEmbed.
 *
 * Example:
 * ```
 * ticker: AAPL
 * type: CS
 * from: today()-5Y
 * to: today()
 * period: Q
 * height: 600
 * ```
 *
 * Required keys: `ticker` (or `tickers`) and `type`. Returns null if missing or invalid.
 */
export function parseKeyValue(section: string): ParsedEmbed | null {
  const kvMap: Record<string, string> = {};

  for (const line of section.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const colonIdx = trimmed.indexOf(":");
    if (colonIdx <= 0) continue;

    const key = trimmed.slice(0, colonIdx).trim().toLowerCase();
    const value = trimmed.slice(colonIdx + 1).trim();
    if (key && value) kvMap[key] = value;
  }

  // Required: ticker (or tickers) and type
  const tickerStr = kvMap.ticker ?? kvMap.tickers;
  const typeStr = kvMap.type?.toUpperCase();
  if (!tickerStr || !typeStr) return null;

  const canonicalType = ALIAS_TO_CANONICAL[typeStr];
  if (!canonicalType) return null;

  const tickers = tickerStr
    .split(/[,|]/)
    .map((t) => t.trim().toUpperCase())
    .filter((t) => t.length > 0);
  if (tickers.length === 0) return null;

  // Optional subtype
  let subtype: string | undefined;
  if (kvMap.subtype) {
    const sub = kvMap.subtype.toUpperCase();
    subtype = SUBTYPE_MAP[sub];
  }

  // Everything else → options
  const options: Record<string, string> = {};
  const reservedKeys = new Set(["ticker", "tickers", "type", "subtype"]);
  for (const [key, value] of Object.entries(kvMap)) {
    if (reservedKeys.has(key)) continue;
    options[key] = value;
  }

  // Resolve `tf` shorthand → `timeframebar`
  if (options.tf !== undefined && options.timeframebar === undefined) {
    options.timeframebar = options.tf;
    delete options.tf;
  }

  return {
    tickers,
    type: canonicalType,
    subtype,
    options,
  };
}
