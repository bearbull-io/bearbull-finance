import { BASE_URL } from "./types";
import type { ParsedEmbed, EmbedType, BearBullSettings } from "./types";
import { resolveDate } from "./dateUtils";

const TYPE_TO_PATH: Record<EmbedType, string> = {
  CHART: "chart",
  CHART_COMPLEX: "chart-complex",
  PROFILE: "profile",
  INCOME_STATEMENT: "is",
  BALANCE_SHEET: "bs",
  CASHFLOW_STATEMENT: "cs",
  REVENUE_BREAKDOWN: "rb",
  CONSTITUENTS: "constituents",
  FULLTIME_EMPLOYEES: "fte",
  INSTITUTIONAL_OWNERSHIP: "ih",
  EPS: "eps",
  VALUATION_RATIOS: "ratios",
  DIVIDENDS: "dividends",
  EARNINGS_SURPRISE: "earnings-surprise",
  FINANCIAL_ESTIMATES: "estimates",
  MARKET_CAP: "market-cap",
  ESG_SCORE: "esg",
  INCOME_STATEMENT_TABLE: "ist",
  BALANCE_SHEET_TABLE: "bst",
  CASHFLOW_STATEMENT_TABLE: "cst",
  REVENUE_BREAKDOWN_TABLE: "rbt",
};

const SUPPORTS_PERIOD: Set<EmbedType> = new Set([
  "INCOME_STATEMENT", "BALANCE_SHEET", "CASHFLOW_STATEMENT", "REVENUE_BREAKDOWN",
  "EPS", "VALUATION_RATIOS", "DIVIDENDS", "EARNINGS_SURPRISE", "FINANCIAL_ESTIMATES",
  "MARKET_CAP", "ESG_SCORE", "FULLTIME_EMPLOYEES",
  "INCOME_STATEMENT_TABLE", "BALANCE_SHEET_TABLE", "CASHFLOW_STATEMENT_TABLE", "REVENUE_BREAKDOWN_TABLE",
]);

const SUPPORTS_DATE_RANGE: Set<EmbedType> = new Set([
  "CHART", "CHART_COMPLEX",
  "INCOME_STATEMENT", "BALANCE_SHEET", "CASHFLOW_STATEMENT", "REVENUE_BREAKDOWN",
  "EPS", "VALUATION_RATIOS", "DIVIDENDS", "EARNINGS_SURPRISE", "FINANCIAL_ESTIMATES",
  "MARKET_CAP", "ESG_SCORE", "FULLTIME_EMPLOYEES",
  "INCOME_STATEMENT_TABLE", "BALANCE_SHEET_TABLE", "CASHFLOW_STATEMENT_TABLE", "REVENUE_BREAKDOWN_TABLE",
]);

const SUPPORTS_CURRENCY: Set<EmbedType> = new Set([
  "CHART",
  "INCOME_STATEMENT", "BALANCE_SHEET", "CASHFLOW_STATEMENT", "REVENUE_BREAKDOWN",
  "INSTITUTIONAL_OWNERSHIP",
  "INCOME_STATEMENT_TABLE", "BALANCE_SHEET_TABLE", "CASHFLOW_STATEMENT_TABLE", "REVENUE_BREAKDOWN_TABLE",
]);

const SUPPORTS_TIMEFRAMEBAR: Set<EmbedType> = new Set([
  "CHART",
  "INCOME_STATEMENT", "BALANCE_SHEET", "CASHFLOW_STATEMENT",
  "EPS", "VALUATION_RATIOS", "DIVIDENDS", "EARNINGS_SURPRISE", "FINANCIAL_ESTIMATES",
  "MARKET_CAP", "ESG_SCORE", "FULLTIME_EMPLOYEES",
  "INCOME_STATEMENT_TABLE", "BALANCE_SHEET_TABLE", "CASHFLOW_STATEMENT_TABLE", "REVENUE_BREAKDOWN_TABLE",
]);

const SUPPORTS_TAGS: Set<EmbedType> = new Set([
  "INCOME_STATEMENT", "BALANCE_SHEET", "CASHFLOW_STATEMENT",
]);

const SUPPORTS_SUBTYPE: Set<EmbedType> = new Set([
  "REVENUE_BREAKDOWN", "REVENUE_BREAKDOWN_TABLE",
]);

const INDICATOR_ALIAS: Record<string, string> = {
  SMA: "simpleMovingAverage",
  EPS: "epsQuarterly,epsYearly",
  REVENUE: "incomeStatmentQuarterly,incomeStatmentYearly",
  EARNINGS_SURPRISE: "earningSurprises",
  INSIDER: "insiderTrading",
  SENATE: "senateTrading",
};

export function buildEmbedUrl(parsed: ParsedEmbed, settings: BearBullSettings, obsidianTheme: string): string {
  const path = TYPE_TO_PATH[parsed.type];
  const url = new URL(`/embed/${path}`, BASE_URL);

  // Tickers (for CONSTITUENTS, first ticker is the index)
  if (parsed.type === "CONSTITUENTS") {
    url.searchParams.set("constituents", parsed.tickers[0]);
  } else {
    url.searchParams.set("ticker", parsed.tickers.join(","));
  }

  // API key
  url.searchParams.set("apikey", settings.apiKey);

  // Theme
  const theme = parsed.options.theme
    ?? (settings.theme === "auto" ? obsidianTheme : settings.theme);
  url.searchParams.set("theme", theme);

  // Date format
  url.searchParams.set("dateformat", parsed.options.dateformat ?? settings.dateFormat);

  // Thousand separator
  url.searchParams.set("thousandseparator", parsed.options.thousandseparator ?? settings.thousandSeparator);

  // Period
  if (SUPPORTS_PERIOD.has(parsed.type)) {
    url.searchParams.set("period", parsed.options.period ?? settings.defaultPeriod);
  }

  // Date range
  if (SUPPORTS_DATE_RANGE.has(parsed.type)) {
    const from = resolveDate(parsed.options.from ?? settings.defaultFromDate);
    const to = resolveDate(parsed.options.to ?? settings.defaultToDate);
    url.searchParams.set("from", from);
    url.searchParams.set("to", to);
  }

  // Currency
  if (SUPPORTS_CURRENCY.has(parsed.type)) {
    const currency = parsed.options.currency ?? settings.defaultCurrency;
    if (currency) {
      url.searchParams.set("currency", currency);
    }
  }

  // Time frame bar
  if (SUPPORTS_TIMEFRAMEBAR.has(parsed.type)) {
    const tfb = parsed.options.timeframebar ?? (settings.showTimeFrameBar ? "true" : "false");
    url.searchParams.set("timeframebar", tfb);
  }

  // Tags (financial statement charts only)
  if (SUPPORTS_TAGS.has(parsed.type)) {
    if (parsed.options.tags) {
      url.searchParams.set("tags", parsed.options.tags);
      url.searchParams.set("showtags", "true");
    }
  }

  // Subtype (revenue breakdown)
  if (SUPPORTS_SUBTYPE.has(parsed.type) && parsed.subtype) {
    url.searchParams.set("revenueBy", parsed.subtype);
  }

  // CHART_COMPLEX specifics: indicators, insider, senate, table
  if (parsed.type === "CHART_COMPLEX") {
    if (parsed.options.indicators) {
      const resolved = parsed.options.indicators
        .split(/[,|]/)
        .map((i) => i.trim().toUpperCase())
        .flatMap((i) => {
          const alias = INDICATOR_ALIAS[i];
          return alias ? alias.split(",") : [i];
        })
        .join(",");
      url.searchParams.set("indicators", resolved);
    }
    if (parsed.options.insider) {
      url.searchParams.set("insider", parsed.options.insider);
    }
    if (parsed.options.senate) {
      url.searchParams.set("senate", parsed.options.senate);
    }
    if (parsed.options.table) {
      url.searchParams.set("table", parsed.options.table);
    }
  }

  // CONSTITUENTS specifics: range
  if (parsed.type === "CONSTITUENTS" && parsed.options.range) {
    url.searchParams.set("range", parsed.options.range);
  }

  // INSTITUTIONAL_OWNERSHIP specifics: view
  if (parsed.type === "INSTITUTIONAL_OWNERSHIP" && parsed.options.view) {
    url.searchParams.set("view", parsed.options.view);
  }

  // Height (iframe attribute, but also sent as param if specified)
  if (parsed.options.height) {
    url.searchParams.set("height", parsed.options.height);
  }

  return url.toString();
}

export function getIframeHeight(parsed: ParsedEmbed, settings: BearBullSettings): number {
  if (parsed.options.height) {
    return parseInt(parsed.options.height, 10) || settings.iframeHeight;
  }
  return settings.iframeHeight;
}
