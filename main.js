var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => BearBullPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian3 = require("obsidian");

// src/types.ts
var BASE_URL = "https://www.bearbull.io";
var DEFAULT_SETTINGS = {
  apiKey: "",
  theme: "auto",
  defaultPeriod: "A",
  showTimeFrameBar: true,
  defaultCurrency: "",
  defaultFromDate: "today()-10Y",
  defaultToDate: "today()",
  dateFormat: "mm/dd/yyyy",
  thousandSeparator: "'",
  iframeHeight: 400
};

// src/settings.ts
var import_obsidian = require("obsidian");
var BearBullSettingTab = class extends import_obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    new import_obsidian.Setting(containerEl).setName("General").setHeading();
    const apiKeySetting = new import_obsidian.Setting(containerEl).setName("API key").addText(
      (text) => text.setPlaceholder("bb_embed_...").setValue(this.plugin.settings.apiKey).then((t) => {
        t.inputEl.type = "password";
        t.inputEl.autocomplete = "off";
        t.inputEl.addEventListener("blur", () => {
          this.plugin.settings.apiKey = t.inputEl.value.trim();
          void this.plugin.saveSettings();
        });
      })
    );
    apiKeySetting.descEl.appendText("Your embed API key. Get one at ");
    apiKeySetting.descEl.createEl("a", {
      text: "bearbull.io/account",
      href: "https://www.bearbull.io/account/obsidianPlugin"
    });
    apiKeySetting.descEl.appendText(". See the ");
    apiKeySetting.descEl.createEl("a", {
      text: "Obsidian guide",
      href: "https://www.bearbull.io/blog/Guide/Obsidian-Note"
    });
    apiKeySetting.descEl.appendText(" to get started.");
    new import_obsidian.Setting(containerEl).setName("Theme").setDesc("Chart color theme. 'Auto' matches your Obsidian theme.").addDropdown(
      (dropdown) => dropdown.addOption("auto", "Auto").addOption("dark", "Dark").addOption("light", "Light").addOption("reading", "Reading").setValue(this.plugin.settings.theme).onChange((value) => {
        this.plugin.settings.theme = value;
        void this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Default period").setDesc("Default time period for financial statements.").addDropdown(
      (dropdown) => dropdown.addOption("A", "Annual").addOption("Q", "Quarterly").setValue(this.plugin.settings.defaultPeriod).onChange((value) => {
        this.plugin.settings.defaultPeriod = value;
        void this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Show time frame bar").setDesc("Show the annual/quarterly selector on charts.").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.showTimeFrameBar).onChange((value) => {
        this.plugin.settings.showTimeFrameBar = value;
        void this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Defaults").setHeading();
    new import_obsidian.Setting(containerEl).setName("Default currency").setDesc("Convert values to this currency (e.g. USD, EUR). Leave blank for no conversion.").addText(
      (text) => text.setPlaceholder("USD").setValue(this.plugin.settings.defaultCurrency).then((t) => {
        t.inputEl.addEventListener("blur", () => {
          this.plugin.settings.defaultCurrency = t.inputEl.value.trim().toUpperCase();
          void this.plugin.saveSettings();
        });
      })
    );
    new import_obsidian.Setting(containerEl).setName("Date format").setDesc("Date format used in financial statements and charts.").addDropdown(
      (dropdown) => dropdown.addOption("yyyy-mm-dd", "yyyy-mm-dd").addOption("dd.mm.yyyy", "dd.mm.yyyy").addOption("dd/mm/yyyy", "dd/mm/yyyy").addOption("mm/dd/yyyy", "mm/dd/yyyy").setValue(this.plugin.settings.dateFormat).onChange((value) => {
        this.plugin.settings.dateFormat = value;
        void this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Thousand separator").setDesc("Character used to separate thousands in numbers.").addDropdown(
      (dropdown) => dropdown.addOption("'", "Apostrophe (')").addOption(",", "Comma (,)").addOption(".", "Period (.)").setValue(this.plugin.settings.thousandSeparator).onChange((value) => {
        this.plugin.settings.thousandSeparator = value;
        void this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Default from date").setDesc("Default start date. Supports: YYYY-MM-DD, today()-NY, today()-NM, today()-ND.").addText(
      (text) => text.setValue(this.plugin.settings.defaultFromDate).then((t) => {
        t.inputEl.addEventListener("blur", () => {
          this.plugin.settings.defaultFromDate = t.inputEl.value.trim();
          void this.plugin.saveSettings();
        });
      })
    );
    new import_obsidian.Setting(containerEl).setName("Default to date").setDesc("Default end date.").addText(
      (text) => text.setValue(this.plugin.settings.defaultToDate).then((t) => {
        t.inputEl.addEventListener("blur", () => {
          this.plugin.settings.defaultToDate = t.inputEl.value.trim();
          void this.plugin.saveSettings();
        });
      })
    );
    new import_obsidian.Setting(containerEl).setName("Advanced").setHeading();
    new import_obsidian.Setting(containerEl).setName("Chart height").setDesc("Height in pixels for embeds.").addText(
      (text) => text.setValue(String(this.plugin.settings.iframeHeight)).then((t) => {
        t.inputEl.addEventListener("blur", () => {
          const num = parseInt(t.inputEl.value, 10);
          if (!isNaN(num) && num > 0) {
            this.plugin.settings.iframeHeight = num;
            void this.plugin.saveSettings();
          }
        });
      })
    );
  }
};

// src/parser.ts
var ALIAS_TO_CANONICAL = {
  // Canonical names
  CHART: "CHART",
  CHART_COMPLEX: "CHART_COMPLEX",
  PROFILE: "PROFILE",
  INCOME_STATEMENT: "INCOME_STATEMENT",
  BALANCE_SHEET: "BALANCE_SHEET",
  CASHFLOW_STATEMENT: "CASHFLOW_STATEMENT",
  REVENUE_BREAKDOWN: "REVENUE_BREAKDOWN",
  CONSTITUENTS: "CONSTITUENTS",
  FULLTIME_EMPLOYEES: "FULLTIME_EMPLOYEES",
  INSTITUTIONAL_OWNERSHIP: "INSTITUTIONAL_OWNERSHIP",
  EPS: "EPS",
  VALUATION_RATIOS: "VALUATION_RATIOS",
  DIVIDENDS: "DIVIDENDS",
  EARNINGS_SURPRISE: "EARNINGS_SURPRISE",
  FINANCIAL_ESTIMATES: "FINANCIAL_ESTIMATES",
  MARKET_CAP: "MARKET_CAP",
  ESG_SCORE: "ESG_SCORE",
  INCOME_STATEMENT_TABLE: "INCOME_STATEMENT_TABLE",
  BALANCE_SHEET_TABLE: "BALANCE_SHEET_TABLE",
  CASHFLOW_STATEMENT_TABLE: "CASHFLOW_STATEMENT_TABLE",
  REVENUE_BREAKDOWN_TABLE: "REVENUE_BREAKDOWN_TABLE",
  // Short aliases
  SC: "CHART",
  CC: "CHART_COMPLEX",
  PRF: "PROFILE",
  IS: "INCOME_STATEMENT",
  BS: "BALANCE_SHEET",
  CS: "CASHFLOW_STATEMENT",
  CF: "CASHFLOW_STATEMENT",
  RB: "REVENUE_BREAKDOWN",
  CON: "CONSTITUENTS",
  FTE: "FULLTIME_EMPLOYEES",
  IH: "INSTITUTIONAL_OWNERSHIP",
  INST: "INSTITUTIONAL_OWNERSHIP",
  VR: "VALUATION_RATIOS",
  RATIO: "VALUATION_RATIOS",
  DIV: "DIVIDENDS",
  ES: "EARNINGS_SURPRISE",
  ESURP: "EARNINGS_SURPRISE",
  AE: "FINANCIAL_ESTIMATES",
  MC: "MARKET_CAP",
  MCAP: "MARKET_CAP",
  ESG: "ESG_SCORE",
  IST: "INCOME_STATEMENT_TABLE",
  BST: "BALANCE_SHEET_TABLE",
  CST: "CASHFLOW_STATEMENT_TABLE",
  CFT: "CASHFLOW_STATEMENT_TABLE",
  RBT: "REVENUE_BREAKDOWN_TABLE",
  REVT: "REVENUE_BREAKDOWN_TABLE"
};
var SUBTYPE_MAP = {
  PRO: "product",
  PRODUCT: "product",
  GEO: "geo",
  GEOGRAPHY: "geo",
  GEOGRAPHIC: "geo"
};
function parseBlock(source) {
  const lines = source.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
  if (lines.length === 0) return [];
  const parsed = parseKeyValue(source);
  return parsed ? [parsed] : [];
}
function parseKeyValue(section) {
  const kvMap = {};
  for (const line of section.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const colonIdx = trimmed.indexOf(":");
    if (colonIdx <= 0) continue;
    const key = trimmed.slice(0, colonIdx).trim().toLowerCase();
    const value = trimmed.slice(colonIdx + 1).trim();
    if (key && value) kvMap[key] = value;
  }
  const tickerStr = kvMap.ticker ?? kvMap.tickers;
  const typeStr = kvMap.type?.toUpperCase();
  if (!tickerStr || !typeStr) return null;
  const canonicalType = ALIAS_TO_CANONICAL[typeStr];
  if (!canonicalType) return null;
  const tickers = tickerStr.split(/[,|]/).map((t) => t.trim().toUpperCase()).filter((t) => t.length > 0);
  if (tickers.length === 0) return null;
  let subtype;
  if (kvMap.subtype) {
    const sub = kvMap.subtype.toUpperCase();
    subtype = SUBTYPE_MAP[sub];
  }
  const options = {};
  const reservedKeys = /* @__PURE__ */ new Set(["ticker", "tickers", "type", "subtype"]);
  for (const [key, value] of Object.entries(kvMap)) {
    if (reservedKeys.has(key)) continue;
    options[key] = value;
  }
  if (options.tf !== void 0 && options.timeframebar === void 0) {
    options.timeframebar = options.tf;
    delete options.tf;
  }
  return {
    tickers,
    type: canonicalType,
    subtype,
    options
  };
}

// src/renderer.ts
var import_obsidian2 = require("obsidian");

// src/dateUtils.ts
function resolveDate(expr) {
  const trimmed = expr.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  if (trimmed === "today()") {
    return toISO(/* @__PURE__ */ new Date());
  }
  const match = trimmed.match(/^today\(\)\s*-\s*(\d+)(Y|M|D)$/i);
  if (!match) {
    return trimmed;
  }
  const amount = parseInt(match[1], 10);
  const unit = match[2].toUpperCase();
  const now = /* @__PURE__ */ new Date();
  switch (unit) {
    case "Y":
      now.setFullYear(now.getFullYear() - amount);
      break;
    case "M":
      now.setMonth(now.getMonth() - amount);
      break;
    case "D":
      now.setDate(now.getDate() - amount);
      break;
  }
  return toISO(now);
}
function toISO(date) {
  return date.toISOString().split("T")[0];
}

// src/urlBuilder.ts
var TYPE_TO_PATH = {
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
  REVENUE_BREAKDOWN_TABLE: "rbt"
};
var SUPPORTS_PERIOD = /* @__PURE__ */ new Set([
  "INCOME_STATEMENT",
  "BALANCE_SHEET",
  "CASHFLOW_STATEMENT",
  "REVENUE_BREAKDOWN",
  "EPS",
  "VALUATION_RATIOS",
  "DIVIDENDS",
  "EARNINGS_SURPRISE",
  "FINANCIAL_ESTIMATES",
  "MARKET_CAP",
  "ESG_SCORE",
  "FULLTIME_EMPLOYEES",
  "INCOME_STATEMENT_TABLE",
  "BALANCE_SHEET_TABLE",
  "CASHFLOW_STATEMENT_TABLE",
  "REVENUE_BREAKDOWN_TABLE"
]);
var SUPPORTS_DATE_RANGE = /* @__PURE__ */ new Set([
  "CHART",
  "CHART_COMPLEX",
  "INCOME_STATEMENT",
  "BALANCE_SHEET",
  "CASHFLOW_STATEMENT",
  "REVENUE_BREAKDOWN",
  "EPS",
  "VALUATION_RATIOS",
  "DIVIDENDS",
  "EARNINGS_SURPRISE",
  "FINANCIAL_ESTIMATES",
  "MARKET_CAP",
  "ESG_SCORE",
  "FULLTIME_EMPLOYEES",
  "INCOME_STATEMENT_TABLE",
  "BALANCE_SHEET_TABLE",
  "CASHFLOW_STATEMENT_TABLE",
  "REVENUE_BREAKDOWN_TABLE"
]);
var SUPPORTS_CURRENCY = /* @__PURE__ */ new Set([
  "CHART",
  "INCOME_STATEMENT",
  "BALANCE_SHEET",
  "CASHFLOW_STATEMENT",
  "REVENUE_BREAKDOWN",
  "INSTITUTIONAL_OWNERSHIP",
  "INCOME_STATEMENT_TABLE",
  "BALANCE_SHEET_TABLE",
  "CASHFLOW_STATEMENT_TABLE",
  "REVENUE_BREAKDOWN_TABLE"
]);
var SUPPORTS_TIMEFRAMEBAR = /* @__PURE__ */ new Set([
  "CHART",
  "INCOME_STATEMENT",
  "BALANCE_SHEET",
  "CASHFLOW_STATEMENT",
  "EPS",
  "VALUATION_RATIOS",
  "DIVIDENDS",
  "EARNINGS_SURPRISE",
  "FINANCIAL_ESTIMATES",
  "MARKET_CAP",
  "ESG_SCORE",
  "FULLTIME_EMPLOYEES",
  "INCOME_STATEMENT_TABLE",
  "BALANCE_SHEET_TABLE",
  "CASHFLOW_STATEMENT_TABLE",
  "REVENUE_BREAKDOWN_TABLE"
]);
var SUPPORTS_TAGS = /* @__PURE__ */ new Set([
  "INCOME_STATEMENT",
  "BALANCE_SHEET",
  "CASHFLOW_STATEMENT"
]);
var SUPPORTS_SUBTYPE = /* @__PURE__ */ new Set([
  "REVENUE_BREAKDOWN",
  "REVENUE_BREAKDOWN_TABLE"
]);
var INDICATOR_ALIAS = {
  SMA: "simpleMovingAverage",
  EPS: "epsQuarterly,epsYearly",
  REVENUE: "incomeStatmentQuarterly,incomeStatmentYearly",
  EARNINGS_SURPRISE: "earningSurprises",
  INSIDER: "insiderTrading",
  SENATE: "senateTrading"
};
function buildEmbedUrl(parsed, settings, obsidianTheme) {
  const path = TYPE_TO_PATH[parsed.type];
  const url = new URL(`/embed/${path}`, BASE_URL);
  if (parsed.type === "CONSTITUENTS") {
    url.searchParams.set("constituents", parsed.tickers[0]);
  } else {
    url.searchParams.set("ticker", parsed.tickers.join(","));
  }
  url.searchParams.set("apikey", settings.apiKey);
  const theme = parsed.options.theme ?? (settings.theme === "auto" ? obsidianTheme : settings.theme);
  url.searchParams.set("theme", theme);
  url.searchParams.set("dateformat", parsed.options.dateformat ?? settings.dateFormat);
  url.searchParams.set("thousandseparator", parsed.options.thousandseparator ?? settings.thousandSeparator);
  if (SUPPORTS_PERIOD.has(parsed.type)) {
    url.searchParams.set("period", parsed.options.period ?? settings.defaultPeriod);
  }
  if (SUPPORTS_DATE_RANGE.has(parsed.type)) {
    const from = resolveDate(parsed.options.from ?? settings.defaultFromDate);
    const to = resolveDate(parsed.options.to ?? settings.defaultToDate);
    url.searchParams.set("from", from);
    url.searchParams.set("to", to);
  }
  if (SUPPORTS_CURRENCY.has(parsed.type)) {
    const currency = parsed.options.currency ?? settings.defaultCurrency;
    if (currency) {
      url.searchParams.set("currency", currency);
    }
  }
  if (SUPPORTS_TIMEFRAMEBAR.has(parsed.type)) {
    const tfb = parsed.options.timeframebar ?? (settings.showTimeFrameBar ? "true" : "false");
    url.searchParams.set("timeframebar", tfb);
  }
  if (SUPPORTS_TAGS.has(parsed.type)) {
    if (parsed.options.tags) {
      url.searchParams.set("tags", parsed.options.tags);
      url.searchParams.set("showtags", "true");
    }
  }
  if (SUPPORTS_SUBTYPE.has(parsed.type) && parsed.subtype) {
    url.searchParams.set("revenueBy", parsed.subtype);
  }
  if (parsed.type === "CHART_COMPLEX") {
    if (parsed.options.indicators) {
      const resolved = parsed.options.indicators.split(/[,|]/).map((i) => i.trim().toUpperCase()).flatMap((i) => {
        const alias = INDICATOR_ALIAS[i];
        return alias ? alias.split(",") : [i];
      }).join(",");
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
  if (parsed.type === "CONSTITUENTS" && parsed.options.range) {
    url.searchParams.set("range", parsed.options.range);
  }
  if (parsed.type === "INSTITUTIONAL_OWNERSHIP" && parsed.options.view) {
    url.searchParams.set("view", parsed.options.view);
  }
  if (parsed.options.height && parsed.type !== "PROFILE") {
    url.searchParams.set("height", parsed.options.height);
  }
  return url.toString();
}
function getIframeHeight(parsed, settings) {
  if (parsed.type === "PROFILE") {
    return 468;
  }
  if (parsed.options.height) {
    return parseInt(parsed.options.height, 10) || settings.iframeHeight;
  }
  return settings.iframeHeight;
}

// src/renderer.ts
var overlay = null;
function getOverlay() {
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.className = "bearbull-iframe-overlay";
    document.body.appendChild(overlay);
  }
  return overlay;
}
var TABLE_TYPES = /* @__PURE__ */ new Set([
  "INCOME_STATEMENT_TABLE",
  "BALANCE_SHEET_TABLE",
  "CASHFLOW_STATEMENT_TABLE",
  "REVENUE_BREAKDOWN_TABLE"
]);
var cache = /* @__PURE__ */ new Map();
var verifiedHosts = /* @__PURE__ */ new Set();
var resizeObserver = null;
function getResizeObserver() {
  if (!resizeObserver) {
    resizeObserver = new ResizeObserver(() => requestSync());
  }
  return resizeObserver;
}
var workspaceObserver = null;
function observeWorkspace() {
  if (workspaceObserver) return;
  const ws = document.querySelector(".workspace");
  if (!ws) return;
  workspaceObserver = new MutationObserver(() => requestSync());
  workspaceObserver.observe(ws, {
    attributes: true,
    attributeFilter: ["style", "class"],
    subtree: true
  });
}
var syncScheduled = false;
function requestSync() {
  if (syncScheduled) return;
  syncScheduled = true;
  requestAnimationFrame(syncPositions);
}
function getContentWidth(el) {
  for (const sel of [".cm-sizer", ".cm-content", ".markdown-preview-sizer"]) {
    const ancestor = el.closest(sel);
    if (ancestor) {
      const style = getComputedStyle(ancestor);
      const pl = parseFloat(style.paddingLeft) || 0;
      const pr = parseFloat(style.paddingRight) || 0;
      const w = ancestor.clientWidth - pl - pr;
      if (w > 0 && w < window.innerWidth) return w;
    }
  }
  const flw = getComputedStyle(el).getPropertyValue("--file-line-width").trim();
  if (flw) {
    const px = parseFloat(flw);
    if (!isNaN(px) && px > 0) return px;
  }
  return window.innerWidth;
}
function getClipBounds(el) {
  for (const sel of [".cm-scroller", ".markdown-preview-view"]) {
    const ancestor = el.closest(sel);
    if (ancestor) return ancestor.getBoundingClientRect();
  }
  return null;
}
function syncPositions() {
  syncScheduled = false;
  for (const entry of cache.values()) {
    if (!entry.visible || !entry.placeholder) {
      entry.wrapper.hide();
      continue;
    }
    const rect = entry.placeholder.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      entry.wrapper.hide();
      continue;
    }
    if (!entry.placeholder.isConnected || entry.placeholder.offsetParent === null) {
      entry.wrapper.hide();
      continue;
    }
    const contentWidth = getContentWidth(entry.placeholder);
    const width = Math.min(rect.width, contentWidth, window.innerWidth - rect.left);
    entry.wrapper.show();
    entry.wrapper.setCssStyles({
      left: `${rect.left}px`,
      top: `${rect.top}px`,
      width: `${width}px`,
      height: `${rect.height}px`
    });
    const bounds = getClipBounds(entry.placeholder);
    if (bounds) {
      const clipTop = Math.max(0, bounds.top - rect.top);
      const clipRight = Math.max(0, rect.left + width - bounds.right);
      const clipBottom = Math.max(0, rect.top + rect.height - bounds.bottom);
      const clipLeft = Math.max(0, bounds.left - rect.left);
      if (clipTop + clipBottom >= rect.height || clipLeft + clipRight >= width) {
        entry.wrapper.hide();
        continue;
      }
      entry.wrapper.setCssStyles({
        clipPath: clipTop > 0 || clipRight > 0 || clipBottom > 0 || clipLeft > 0 ? `inset(${clipTop}px ${clipRight}px ${clipBottom}px ${clipLeft}px)` : ""
      });
    } else {
      entry.wrapper.setCssStyles({ clipPath: "" });
    }
  }
}
function findScrollParent(el) {
  let current = el?.parentElement ?? null;
  while (current) {
    const { overflowY } = getComputedStyle(current);
    if (/(auto|scroll)/.test(overflowY) && current.scrollHeight > current.clientHeight) {
      return current;
    }
    current = current.parentElement;
  }
  return null;
}
function deactivateAllGuards() {
  for (const entry of cache.values()) {
    entry.guard?.classList.remove("interactive");
  }
}
function onDocumentMousedown(e) {
  for (const entry of cache.values()) {
    if (entry.guard?.classList.contains("interactive") && entry.wrapper.contains(e.target)) {
      return;
    }
  }
  deactivateAllGuards();
}
function onDocumentKeydown(e) {
  if (e.key === "Escape") deactivateAllGuards();
}
function onScrollMessage(e) {
  if (e.origin !== BASE_URL) return;
  const d = e.data;
  if (!d || d.type !== "bearbull-scroll" || typeof d.deltaX !== "number" || typeof d.deltaY !== "number") return;
  for (const entry of cache.values()) {
    if (entry.iframe.contentWindow === e.source) {
      if (entry.isTable) return;
      const sp = findScrollParent(entry.placeholder);
      if (sp) sp.scrollBy({ top: d.deltaY, left: d.deltaX });
      return;
    }
  }
}
function onErrorMessage(e) {
  if (e.origin !== BASE_URL) return;
  const d = e.data;
  if (!d || d.type !== "bearbull-embed-error" || typeof d.error !== "string") return;
  for (const [embedId, entry] of cache.entries()) {
    if (entry.iframe.contentWindow === e.source) {
      collapseToError(embedId, entry, d.error);
      return;
    }
  }
}
var listenersAttached = false;
function attachListeners() {
  if (listenersAttached) return;
  listenersAttached = true;
  document.addEventListener("scroll", requestSync, true);
  window.addEventListener("resize", requestSync);
  document.addEventListener("mousedown", onDocumentMousedown, true);
  document.addEventListener("keydown", onDocumentKeydown);
  window.addEventListener("message", onScrollMessage);
  window.addEventListener("message", onErrorMessage);
  observeWorkspace();
}
function detachListeners() {
  if (!listenersAttached) return;
  listenersAttached = false;
  document.removeEventListener("scroll", requestSync, true);
  window.removeEventListener("resize", requestSync);
  document.removeEventListener("mousedown", onDocumentMousedown, true);
  document.removeEventListener("keydown", onDocumentKeydown);
  window.removeEventListener("message", onScrollMessage);
  window.removeEventListener("message", onErrorMessage);
}
var BearBullEmbed = class extends import_obsidian2.MarkdownRenderChild {
  constructor(containerEl, embedId) {
    super(containerEl);
    this.embedId = embedId;
  }
  onunload() {
    const entry = cache.get(this.embedId);
    if (!entry) return;
    if (entry.placeholder) resizeObserver?.unobserve(entry.placeholder);
    entry.visible = false;
    entry.placeholder = null;
    entry.wrapper.hide();
  }
};
function renderEmbed(container, parsed, settings, obsidianTheme, embedId) {
  container.empty();
  container.classList.add("bearbull-embed-container");
  if (!settings.apiKey) {
    const errorEl = container.createDiv({ cls: "bearbull-embed-error" });
    errorEl.setText("API key not configured. Set it in settings.");
    return null;
  }
  if (import_obsidian2.Platform.isMobile) {
    const info = container.createDiv({ cls: "bearbull-embed-info" });
    info.setText("Embeds are only available on desktop.");
    return null;
  }
  const url = buildEmbedUrl(parsed, settings, obsidianTheme);
  const height = getIframeHeight(parsed, settings);
  const child = new BearBullEmbed(container, embedId);
  const placeholder = container.createDiv({ cls: "bearbull-embed-placeholder" });
  placeholder.dataset.bearbullId = embedId;
  placeholder.setCssStyles({ height: `${height}px` });
  const cached = cache.get(embedId);
  if (cached && cached.url === url) {
    cached.visible = true;
    cached.placeholder = placeholder;
    getResizeObserver().observe(placeholder);
    if (!cached.loaded) {
      const loadingEl2 = placeholder.createDiv({ cls: "bearbull-embed-loading" });
      loadingEl2.setText("Loading chart...");
      cached.iframe.addEventListener("load", () => loadingEl2.remove(), { once: true });
    }
    requestSync();
    return child;
  }
  if (cached) {
    cached.wrapper.remove();
    cache.delete(embedId);
  }
  attachListeners();
  const loadingEl = placeholder.createDiv({ cls: "bearbull-embed-loading" });
  loadingEl.setText("Loading chart...");
  const isTable = TABLE_TYPES.has(parsed.type);
  const createIframe = () => {
    const ol = getOverlay();
    const wrapper = document.createElement("div");
    wrapper.className = "bearbull-iframe-wrapper";
    wrapper.hide();
    const iframe = document.createElement("iframe");
    iframe.className = "bearbull-overlay-iframe";
    iframe.src = url;
    iframe.setAttribute("loading", "lazy");
    iframe.setAttribute("allowtransparency", "true");
    iframe.setAttribute("sandbox", "allow-scripts allow-same-origin");
    let guard = null;
    if (isTable) {
      guard = document.createElement("div");
      guard.className = "bearbull-scroll-guard";
      guard.addEventListener("wheel", (e) => {
        e.preventDefault();
        const scrollParent = findScrollParent(entry.placeholder);
        if (scrollParent) {
          scrollParent.scrollBy({ top: e.deltaY, left: e.deltaX });
        }
      }, { passive: false });
      guard.addEventListener("click", (e) => {
        e.stopPropagation();
        guard.classList.add("interactive");
      });
    }
    wrapper.appendChild(iframe);
    if (guard) wrapper.appendChild(guard);
    const entry = {
      wrapper,
      iframe,
      guard,
      url,
      loaded: false,
      visible: true,
      placeholder,
      height,
      isTable
    };
    cache.set(embedId, entry);
    getResizeObserver().observe(placeholder);
    iframe.addEventListener("load", () => {
      loadingEl.remove();
      entry.loaded = true;
      verifiedHosts.add(BASE_URL);
      requestSync();
    });
    iframe.addEventListener("error", () => {
      cache.delete(embedId);
      wrapper.remove();
      showError(loadingEl);
    });
    ol.appendChild(wrapper);
  };
  if (verifiedHosts.has(BASE_URL)) {
    createIframe();
  } else {
    const timeout = new Promise(
      (_, reject) => setTimeout(() => reject(new Error("timeout")), 8e3)
    );
    Promise.race([(0, import_obsidian2.requestUrl)({ url: BASE_URL, method: "HEAD" }), timeout]).then(() => createIframe()).catch(() => showError(loadingEl));
  }
  return child;
}
function onActiveLeafChange() {
  requestSync();
}
function onLayoutChange() {
  requestSync();
}
function cleanupOverlay() {
  workspaceObserver?.disconnect();
  workspaceObserver = null;
  resizeObserver?.disconnect();
  resizeObserver = null;
  cache.clear();
  verifiedHosts.clear();
  detachListeners();
  if (overlay) {
    overlay.remove();
    overlay = null;
  }
}
function showError(loadingEl) {
  loadingEl.setText("Could not connect to server");
  loadingEl.classList.add("bearbull-embed-error");
  loadingEl.classList.remove("bearbull-embed-loading");
  const placeholder = loadingEl.parentElement;
  if (placeholder) placeholder.setCssStyles({ height: "" });
}
function collapseToError(embedId, entry, message) {
  entry.wrapper.remove();
  cache.delete(embedId);
  if (entry.placeholder) {
    entry.placeholder.setCssStyles({ height: "" });
    entry.placeholder.textContent = "";
    const errorEl = document.createElement("div");
    errorEl.className = "bearbull-embed-error";
    errorEl.textContent = message;
    entry.placeholder.appendChild(errorEl);
  }
}

// src/main.ts
var SECRET_KEY_API = "bearbull-key";
function getObsidianTheme() {
  return document.body.classList.contains("theme-dark") ? "dark" : "light";
}
function simpleHash(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) + hash + str.charCodeAt(i) & 4294967295;
  }
  return `h${(hash >>> 0).toString(36)}`;
}
var BearBullPlugin = class extends import_obsidian3.Plugin {
  async onload() {
    await this.loadSettings();
    this.addSettingTab(new BearBullSettingTab(this.app, this));
    this.registerEvent(
      this.app.workspace.on("active-leaf-change", onActiveLeafChange)
    );
    this.registerEvent(
      this.app.workspace.on("layout-change", onLayoutChange)
    );
    this.registerMarkdownCodeBlockProcessor("bb", (source, el, ctx) => {
      const results = parseBlock(source);
      if (results.length === 0) {
        el.createDiv({ cls: "bearbull-embed-error", text: "Invalid bb block" });
        return;
      }
      const sectionInfo = ctx.getSectionInfo(el);
      const lineKey = sectionInfo ? String(sectionInfo.lineStart) : simpleHash(source);
      const obsidianTheme = getObsidianTheme();
      for (let i = 0; i < results.length; i++) {
        const parsed = results[i];
        const embedId = `${ctx.sourcePath}:${lineKey}:${i}`;
        const container = el.createDiv();
        const child = renderEmbed(container, parsed, this.settings, obsidianTheme, embedId);
        if (child) {
          ctx.addChild(child);
        }
      }
    });
  }
  onunload() {
    cleanupOverlay();
  }
  async loadSettings() {
    const data = await this.loadData();
    this.settings = Object.assign({}, DEFAULT_SETTINGS, data);
    if (data?.apiKey) {
      this.app.secretStorage.setSecret(SECRET_KEY_API, data.apiKey);
      delete data.apiKey;
      await this.saveData(data);
    }
    this.settings.apiKey = this.app.secretStorage.getSecret(SECRET_KEY_API) ?? "";
  }
  async saveSettings() {
    this.app.secretStorage.setSecret(SECRET_KEY_API, this.settings.apiKey);
    const { apiKey: _apiKey, ...rest } = this.settings;
    await this.saveData(rest);
  }
};
