export interface BearBullSettings {
  apiKey: string;
  baseUrl: string;
  theme: "dark" | "light" | "auto";
  defaultPeriod: "A" | "Q";
  showTimeFrameBar: boolean;
  showTags: boolean;
  defaultFromDate: string;
  defaultToDate: string;
  defaultCurrency: string;
  dateFormat: string;
  iframeHeight: number;
}

export const DEFAULT_SETTINGS: BearBullSettings = {
  apiKey: "",
  baseUrl: "https://bearbull.com",
  theme: "auto",
  defaultPeriod: "A",
  showTimeFrameBar: true,
  showTags: true,
  defaultCurrency: "",
  defaultFromDate: "today()-10Y",
  defaultToDate: "today()",
  dateFormat: "yyyy-mm-dd",
  iframeHeight: 400,
};

export type EmbedType = "CHART" | "IS" | "BS" | "CS" | "RB" | "IH";

export interface ParsedEmbed {
  tickers: string[];
  type: EmbedType;
  subtype?: string;       // For RB: "PRO" | "GEO"
  options: Record<string, string>;
}
