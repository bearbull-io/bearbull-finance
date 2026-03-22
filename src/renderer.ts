import { MarkdownRenderChild, Platform, requestUrl } from "obsidian";
import { BASE_URL } from "./types";
import type { ParsedEmbed, BearBullSettings } from "./types";
import { buildEmbedUrl, getIframeHeight } from "./urlBuilder";

// ---------------------------------------------------------------------------
// Fixed-position overlay: iframes live permanently in a fixed overlay on
// document.body and are positioned over placeholder divs in code blocks.
// This avoids DOM reparenting which causes iframe reloads.
// ---------------------------------------------------------------------------

let overlay: HTMLDivElement | null = null;

function getOverlay(): HTMLDivElement {
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.className = "bearbull-iframe-overlay";
    document.body.appendChild(overlay);
  }
  return overlay;
}

// ---------------------------------------------------------------------------
// Cache: embedId → CacheEntry
// ---------------------------------------------------------------------------

const TABLE_TYPES = new Set([
  "INCOME_STATEMENT_TABLE",
  "BALANCE_SHEET_TABLE",
  "CASHFLOW_STATEMENT_TABLE",
  "REVENUE_BREAKDOWN_TABLE",
]);

interface CacheEntry {
  wrapper: HTMLDivElement;
  iframe: HTMLIFrameElement;
  guard: HTMLDivElement | null;
  url: string;
  loaded: boolean;
  visible: boolean;
  placeholder: HTMLElement | null;
  height: number;
  isTable: boolean;
}

const cache = new Map<string, CacheEntry>();

const verifiedHosts = new Set<string>();

// ---------------------------------------------------------------------------
// Observers
// ---------------------------------------------------------------------------

let resizeObserver: ResizeObserver | null = null;

function getResizeObserver(): ResizeObserver {
  if (!resizeObserver) {
    resizeObserver = new ResizeObserver(() => requestSync());
  }
  return resizeObserver;
}

let workspaceObserver: MutationObserver | null = null;

function observeWorkspace(): void {
  if (workspaceObserver) return;
  const ws = document.querySelector(".workspace");
  if (!ws) return;
  workspaceObserver = new MutationObserver(() => requestSync());
  workspaceObserver.observe(ws, {
    attributes: true,
    attributeFilter: ["style", "class"],
    subtree: true,
  });
}

// ---------------------------------------------------------------------------
// Position sync — single rAF loop that aligns iframes over their placeholders
// ---------------------------------------------------------------------------

let syncScheduled = false;

function requestSync(): void {
  if (syncScheduled) return;
  syncScheduled = true;
  requestAnimationFrame(syncPositions);
}

function getContentWidth(el: HTMLElement): number {
  for (const sel of [".cm-sizer", ".cm-content", ".markdown-preview-sizer"]) {
    const ancestor = el.closest<HTMLElement>(sel);
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

function getClipBounds(el: HTMLElement): DOMRect | null {
  for (const sel of [".cm-scroller", ".markdown-preview-view"]) {
    const ancestor = el.closest<HTMLElement>(sel);
    if (ancestor) return ancestor.getBoundingClientRect();
  }
  return null;
}

function syncPositions(): void {
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
      height: `${rect.height}px`,
    });

    const bounds = getClipBounds(entry.placeholder);
    if (bounds) {
      const clipTop = Math.max(0, bounds.top - rect.top);
      const clipRight = Math.max(0, (rect.left + width) - bounds.right);
      const clipBottom = Math.max(0, (rect.top + rect.height) - bounds.bottom);
      const clipLeft = Math.max(0, bounds.left - rect.left);

      if (clipTop + clipBottom >= rect.height || clipLeft + clipRight >= width) {
        entry.wrapper.hide();
        continue;
      }

      entry.wrapper.setCssStyles({
        clipPath: (clipTop > 0 || clipRight > 0 || clipBottom > 0 || clipLeft > 0)
          ? `inset(${clipTop}px ${clipRight}px ${clipBottom}px ${clipLeft}px)`
          : "",
      });
    } else {
      entry.wrapper.setCssStyles({ clipPath: "" });
    }
  }
}

// ---------------------------------------------------------------------------
// Scroll guard helpers
// ---------------------------------------------------------------------------

function findScrollParent(el: HTMLElement | null): HTMLElement | null {
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

function deactivateAllGuards(): void {
  for (const entry of cache.values()) {
    entry.guard?.classList.remove("interactive");
  }
}

function onDocumentMousedown(e: MouseEvent): void {
  for (const entry of cache.values()) {
    if (entry.guard?.classList.contains("interactive") && entry.wrapper.contains(e.target as Node)) {
      return;
    }
  }
  deactivateAllGuards();
}

function onDocumentKeydown(e: KeyboardEvent): void {
  if (e.key === "Escape") deactivateAllGuards();
}

function onScrollMessage(e: MessageEvent): void {
  if (e.origin !== BASE_URL) return;
  const d = e.data;
  if (
    !d ||
    d.type !== "bearbull-scroll" ||
    typeof d.deltaX !== "number" ||
    typeof d.deltaY !== "number"
  ) return;

  for (const entry of cache.values()) {
    if (entry.iframe.contentWindow === e.source) {
      if (entry.isTable) return;
      const sp = findScrollParent(entry.placeholder);
      if (sp) sp.scrollBy({ top: d.deltaY, left: d.deltaX });
      return;
    }
  }
}

function onErrorMessage(e: MessageEvent): void {
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

// ---------------------------------------------------------------------------
// Listeners — attached once when the overlay is created
// ---------------------------------------------------------------------------

let listenersAttached = false;

function attachListeners(): void {
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

function detachListeners(): void {
  if (!listenersAttached) return;
  listenersAttached = false;

  document.removeEventListener("scroll", requestSync, true);
  window.removeEventListener("resize", requestSync);
  document.removeEventListener("mousedown", onDocumentMousedown, true);
  document.removeEventListener("keydown", onDocumentKeydown);
  window.removeEventListener("message", onScrollMessage);
  window.removeEventListener("message", onErrorMessage);
}

// ---------------------------------------------------------------------------
// BearBullEmbed — MarkdownRenderChild lifecycle
// ---------------------------------------------------------------------------

export class BearBullEmbed extends MarkdownRenderChild {
  private embedId: string;

  constructor(containerEl: HTMLElement, embedId: string) {
    super(containerEl);
    this.embedId = embedId;
  }

  onunload(): void {
    const entry = cache.get(this.embedId);
    if (!entry) return;

    if (entry.placeholder) resizeObserver?.unobserve(entry.placeholder);
    entry.visible = false;
    entry.placeholder = null;
    entry.wrapper.hide();
  }
}

// ---------------------------------------------------------------------------
// renderEmbed — public API
// ---------------------------------------------------------------------------

export function renderEmbed(
  container: HTMLElement,
  parsed: ParsedEmbed,
  settings: BearBullSettings,
  obsidianTheme: string,
  embedId: string,
): BearBullEmbed | null {
  container.empty();
  container.classList.add("bearbull-embed-container");

  if (!settings.apiKey) {
    const errorEl = container.createDiv({ cls: "bearbull-embed-error" });
    errorEl.setText("API key not configured. Set it in settings.");
    return null;
  }

  if (Platform.isMobile) {
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

  // --- Cache hit: reattach to new placeholder --------------------------------
  const cached = cache.get(embedId);
  if (cached && cached.url === url) {
    cached.visible = true;
    cached.placeholder = placeholder;
    getResizeObserver().observe(placeholder);

    if (!cached.loaded) {
      const loadingEl = placeholder.createDiv({ cls: "bearbull-embed-loading" });
      loadingEl.setText("Loading chart...");
      cached.iframe.addEventListener("load", () => loadingEl.remove(), { once: true });
    }

    requestSync();
    return child;
  }

  // Cache miss or stale (URL changed) — clean up old entry
  if (cached) {
    cached.wrapper.remove();
    cache.delete(embedId);
  }

  // --- Create new iframe in the overlay --------------------------------------
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

    let guard: HTMLDivElement | null = null;
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
        guard!.classList.add("interactive");
      });
    }

    wrapper.appendChild(iframe);
    if (guard) wrapper.appendChild(guard);

    const entry: CacheEntry = {
      wrapper,
      iframe,
      guard,
      url,
      loaded: false,
      visible: true,
      placeholder,
      height,
      isTable,
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
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), 8000),
    );
    Promise.race([requestUrl({ url: BASE_URL, method: "HEAD" }), timeout])
      .then(() => createIframe())
      .catch(() => showError(loadingEl));
  }

  return child;
}

// ---------------------------------------------------------------------------
// Active-leaf-change / layout-change
// ---------------------------------------------------------------------------

export function onActiveLeafChange(): void {
  requestSync();
}

export function onLayoutChange(): void {
  requestSync();
}

// ---------------------------------------------------------------------------
// Cleanup — called from plugin onunload()
// ---------------------------------------------------------------------------

export function cleanupOverlay(): void {
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function showError(loadingEl: HTMLElement): void {
  loadingEl.setText("Could not connect to server");
  loadingEl.classList.add("bearbull-embed-error");
  loadingEl.classList.remove("bearbull-embed-loading");
  const placeholder = loadingEl.parentElement;
  if (placeholder) placeholder.setCssStyles({ height: "" });
}

function collapseToError(embedId: string, entry: CacheEntry, message: string): void {
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
