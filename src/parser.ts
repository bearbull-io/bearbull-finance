import type { ParsedEmbed, EmbedType } from "./types";

const VALID_TYPES: Set<string> = new Set(["CHART", "IS", "BS", "CS", "RB", "IH"]);
const VALID_SUBTYPES: Set<string> = new Set(["PRO", "GEO"]);

/**
 * Parses a BearBull embed string from the src attribute of an unresolved internal embed.
 *
 * Supports two syntax styles:
 *
 * Positional:
 *   AAPL::IS
 *   AAPL::IS::today()-5Y::today()
 *   AAPL::IS::today()-5Y::today()::revenue,netIncome
 *   AAPL::RB::PRO::2020-01-01::today()
 *   AAPL,META::CHART::today()-3Y::today()
 *
 * Options (can be combined with positional):
 *   AAPL::IS{period=Q,theme=dark}
 *   AAPL::CS::today()-7Y::today()::operatingCashFlow,freeCashFlow{period=Q,height=600}
 *
 * Full form:
 *   TICKERS::TYPE(::SUBTYPE)?(::FROM)?(::TO)?(::TAGS)?({OPTIONS})?
 */
export function parseEmbed(src: string): ParsedEmbed | null {
  const input = src.trim();

  // Separate trailing {options} block from the rest
  let body = input;
  let optionsStr = "";
  const braceIdx = input.indexOf("{");
  if (braceIdx !== -1) {
    if (!input.endsWith("}")) return null;
    body = input.slice(0, braceIdx);
    optionsStr = input.slice(braceIdx + 1, -1);
  }

  // Split on :: separator
  const segments = body.split("::").map((s) => s.trim());
  if (segments.length < 2) return null;

  // Segment 0: Tickers
  const tickers = segments[0]
    .split(",")
    .map((t) => t.trim().toUpperCase())
    .filter((t) => t.length > 0);
  if (tickers.length === 0) return null;

  // Segment 1: Type
  const typeStr = segments[1].toUpperCase();
  if (!VALID_TYPES.has(typeStr)) return null;

  // Remaining segments: subtype?, from?, to?, tags?
  let subtype: string | undefined;
  let positionalFrom: string | undefined;
  let positionalTo: string | undefined;
  let positionalTags: string | undefined;

  let idx = 2;

  // Check if next segment is a subtype (PRO/GEO)
  if (idx < segments.length && VALID_SUBTYPES.has(segments[idx].toUpperCase())) {
    subtype = segments[idx].toUpperCase();
    idx++;
  }

  // Next segment: from date (contains digits, parens, or hyphens — not pure alpha)
  // `-` means "use plugin default" — treat as undefined (skip)
  if (idx < segments.length && isDateLike(segments[idx])) {
    const val = segments[idx].trim();
    positionalFrom = val === "-" ? undefined : val;
    idx++;
  }

  // Next segment: to date
  if (idx < segments.length && isDateLike(segments[idx])) {
    const val = segments[idx].trim();
    positionalTo = val === "-" ? undefined : val;
    idx++;
  }

  // Next segment: tags (comma-separated metric names — lowercase alpha)
  // `-` means "use plugin default" — treat as undefined (skip)
  if (idx < segments.length) {
    const val = segments[idx].trim();
    positionalTags = val === "-" ? undefined : val;
    idx++;
  }

  // Parse {key=value} options
  const options: Record<string, string> = {};
  if (optionsStr) {
    for (const pair of optionsStr.split(",")) {
      const eqIndex = pair.indexOf("=");
      if (eqIndex > 0) {
        const key = pair.slice(0, eqIndex).trim();
        const value = pair.slice(eqIndex + 1).trim();
        if (key) options[key] = value;
      }
    }
  }

  // Resolve `tf` shorthand → `timeframebar`
  if (options.tf !== undefined && options.timeframebar === undefined) {
    options.timeframebar = options.tf;
    delete options.tf;
  }

  // Positional values populate options (don't override explicit {options})
  if (positionalFrom && !options.from) options.from = positionalFrom;
  if (positionalTo && !options.to) options.to = positionalTo;
  if (positionalTags && !options.tags) options.tags = positionalTags;

  return {
    tickers,
    type: typeStr as EmbedType,
    subtype,
    options,
  };
}

/** Returns true if value looks like a date expression or skip placeholder (not a subtype or tag list) */
function isDateLike(value: string): boolean {
  const v = value.trim();
  // `-` means "use plugin default" — treated as a skipped date slot
  if (v === "-") return true;
  // Matches: today(), today()-5Y, 2020-01-01, etc.
  return /^today\(\)/.test(v) || /^\d{4}-\d{2}-\d{2}$/.test(v);
}
