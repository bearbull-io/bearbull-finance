import type { ParsedEmbed, BearBullSettings } from "./types";
import { resolveDate } from "./dateUtils";

const TYPE_TO_PATH: Record<string, string> = {
  CHART: "chart",
  IS: "is",
  BS: "bs",
  CS: "cs",
  RB: "rb",
  IH: "ih",
};

export function buildEmbedUrl(parsed: ParsedEmbed, settings: BearBullSettings, obsidianTheme: string): string {
  const path = TYPE_TO_PATH[parsed.type];
  const url = new URL(`/embed/${path}`, settings.baseUrl);

  // Tickers
  url.searchParams.set("ticker", parsed.tickers.join(","));

  // API key
  url.searchParams.set("apikey", settings.apiKey);

  // Theme
  const theme = parsed.options.theme
    ?? (settings.theme === "auto" ? obsidianTheme : settings.theme);
  url.searchParams.set("theme", theme);

  // Period (for financial statements)
  if (["IS", "BS", "CS", "RB"].includes(parsed.type)) {
    url.searchParams.set("period", parsed.options.period ?? settings.defaultPeriod);
  }

  // Revenue breakdown subtype
  if (parsed.type === "RB" && parsed.subtype) {
    url.searchParams.set("revenueBy", parsed.subtype === "PRO" ? "product" : "geographic");
  }

  // Time frame bar (supports `tf` shorthand via parser normalization)
  const tfb = parsed.options.timeframebar ?? (settings.showTimeFrameBar ? "true" : "false");
  url.searchParams.set("timeframebar", tfb);

  // Tags — `tags=false` hides the selector entirely
  if (parsed.options.tags === "false") {
    url.searchParams.set("tags", "false");
  } else if (parsed.options.tags) {
    url.searchParams.set("tags", parsed.options.tags);
  } else if (!settings.showTags) {
    url.searchParams.set("tags", "false");
  }

  // Currency
  const currency = parsed.options.currency ?? settings.defaultCurrency;
  if (currency) {
    url.searchParams.set("currency", currency);
  }

  // Date format
  url.searchParams.set("dateformat", parsed.options.dateformat ?? settings.dateFormat);

  // Date range
  const from = resolveDate(parsed.options.from ?? settings.defaultFromDate);
  const to = resolveDate(parsed.options.to ?? settings.defaultToDate);
  url.searchParams.set("from", from);
  url.searchParams.set("to", to);

  return url.toString();
}

export function getIframeHeight(parsed: ParsedEmbed, settings: BearBullSettings): number {
  if (parsed.options.height) {
    return parseInt(parsed.options.height, 10) || settings.iframeHeight;
  }
  return settings.iframeHeight;
}
