export const BASE_URL = "https://www.bearbull.io";

export interface BearBullSettings {
  apiKey: string;
  theme: "dark" | "light" | "reading" | "auto";
  defaultPeriod: "A" | "Q";
  showTimeFrameBar: boolean;
  defaultFromDate: string;
  defaultToDate: string;
  defaultCurrency: string;
  dateFormat: string;
  thousandSeparator: string;
  iframeHeight: number;
}

export const DEFAULT_SETTINGS: BearBullSettings = {
  apiKey: "",
  theme: "auto",
  defaultPeriod: "A",
  showTimeFrameBar: true,
  defaultCurrency: "",
  defaultFromDate: "today()-10Y",
  defaultToDate: "today()",
  dateFormat: "mm/dd/yyyy",
  thousandSeparator: "'",
  iframeHeight: 400,
};

export type EmbedType =
  | "CHART" | "CHART_COMPLEX" | "PROFILE"
  | "INCOME_STATEMENT" | "BALANCE_SHEET" | "CASHFLOW_STATEMENT" | "REVENUE_BREAKDOWN"
  | "EPS" | "VALUATION_RATIOS" | "DIVIDENDS" | "EARNINGS_SURPRISE" | "FINANCIAL_ESTIMATES"
  | "MARKET_CAP" | "ESG_SCORE"
  | "FULLTIME_EMPLOYEES" | "INSTITUTIONAL_OWNERSHIP" | "CONSTITUENTS"
  | "INCOME_STATEMENT_TABLE" | "BALANCE_SHEET_TABLE" | "CASHFLOW_STATEMENT_TABLE" | "REVENUE_BREAKDOWN_TABLE";

export interface ParsedEmbed {
  tickers: string[];
  type: EmbedType;
  subtype?: string;
  options: Record<string, string>;
}
