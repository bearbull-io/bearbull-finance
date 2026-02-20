import { MarkdownRenderChild, requestUrl } from "obsidian";
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
// Cache: embedId → { iframe, url, loaded, visible, placeholder }
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

/** Track which embedIds had a successful HEAD check so we skip it on re-render */
const verifiedHosts = new Set<string>();

// ---------------------------------------------------------------------------
// ResizeObserver — triggers sync when any placeholder's container resizes
// (sidebar toggle, pane drag-resize, CSS transitions, etc.)
// ---------------------------------------------------------------------------

let resizeObserver: ResizeObserver | null = null;

function getResizeObserver(): ResizeObserver {
  if (!resizeObserver) {
    resizeObserver = new ResizeObserver(() => requestSync());
  }
  return resizeObserver;
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

/** Resolve the max width the embed should occupy */
function getContentWidth(el: HTMLElement): number {
  // Live preview: .cm-sizer is constrained by max-width: var(--file-line-width)
  // Reading mode: .markdown-preview-sizer is similarly constrained
  for (const sel of [".cm-sizer", ".cm-content", ".markdown-preview-sizer"]) {
    const ancestor = el.closest(sel) as HTMLElement | null;
    if (ancestor) {
      const style = getComputedStyle(ancestor);
      const pl = parseFloat(style.paddingLeft) || 0;
      const pr = parseFloat(style.paddingRight) || 0;
      const w = ancestor.clientWidth - pl - pr;
      if (w > 0 && w < window.innerWidth) return w;
    }
  }

  // Fallback: read --file-line-width directly from computed style
  const flw = getComputedStyle(el).getPropertyValue("--file-line-width").trim();
  if (flw) {
    const px = parseFloat(flw);
    if (!isNaN(px) && px > 0) return px;
  }

  return window.innerWidth;
}

/** Find the scrollable content bounds so we can clip iframes that overflow */
function getClipBounds(el: HTMLElement): DOMRect | null {
  for (const sel of [".cm-scroller", ".markdown-preview-view"]) {
    const ancestor = el.closest(sel) as HTMLElement | null;
    if (ancestor) return ancestor.getBoundingClientRect();
  }
  return null;
}

function syncPositions(): void {
  syncScheduled = false;

  for (const entry of cache.values()) {
    if (!entry.visible || !entry.placeholder) {
      entry.wrapper.style.display = "none";
      continue;
    }

    const rect = entry.placeholder.getBoundingClientRect();

    if (rect.width === 0 || rect.height === 0) {
      entry.wrapper.style.display = "none";
      continue;
    }

    // Placeholder hidden or detached (e.g. tab switched away)
    if (!entry.placeholder.isConnected || entry.placeholder.offsetParent === null) {
      entry.wrapper.style.display = "none";
      continue;
    }

    // Clamp width to the readable content area
    const contentWidth = getContentWidth(entry.placeholder);
    const width = Math.min(rect.width, contentWidth, window.innerWidth - rect.left);

    entry.wrapper.style.display = "block";
    entry.wrapper.style.left = `${rect.left}px`;
    entry.wrapper.style.top = `${rect.top}px`;
    entry.wrapper.style.width = `${width}px`;
    entry.wrapper.style.height = `${rect.height}px`;

    // Clip portions that extend outside the scrollable content area
    const bounds = getClipBounds(entry.placeholder);
    if (bounds) {
      const clipTop = Math.max(0, bounds.top - rect.top);
      const clipRight = Math.max(0, (rect.left + width) - bounds.right);
      const clipBottom = Math.max(0, (rect.top + rect.height) - bounds.bottom);
      const clipLeft = Math.max(0, bounds.left - rect.left);

      if (clipTop + clipBottom >= rect.height || clipLeft + clipRight >= width) {
        entry.wrapper.style.display = "none";
        continue;
      }

      entry.wrapper.style.clipPath =
        (clipTop > 0 || clipRight > 0 || clipBottom > 0 || clipLeft > 0)
          ? `inset(${clipTop}px ${clipRight}px ${clipBottom}px ${clipLeft}px)`
          : "";
    } else {
      entry.wrapper.style.clipPath = "";
    }
  }
}

// ---------------------------------------------------------------------------
// Scroll guard helpers
// ---------------------------------------------------------------------------

/** Walk up from an element to find the nearest scrollable ancestor */
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

/** Remove .interactive from all guards, re-enabling scroll protection */
function deactivateAllGuards(): void {
  for (const entry of cache.values()) {
    entry.guard?.classList.remove("interactive");
  }
}

function onDocumentMousedown(e: MouseEvent): void {
  // If click is inside an active (interactive) wrapper, leave it active
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
      if (entry.isTable) return; // guard handles tables
      const sp = findScrollParent(entry.placeholder);
      if (sp) sp.scrollBy({ top: d.deltaY, left: d.deltaX });
      return;
    }
  }
}

// Listeners — attached once when the overlay is created
let listenersAttached = false;

function attachListeners(): void {
  if (listenersAttached) return;
  listenersAttached = true;

  // Capture phase scroll — fires for any scrollable container in Obsidian
  document.addEventListener("scroll", requestSync, true);
  window.addEventListener("resize", requestSync);

  // Guard deactivation listeners
  document.addEventListener("mousedown", onDocumentMousedown, true);
  document.addEventListener("keydown", onDocumentKeydown);

  // postMessage bridge for iframe scroll forwarding
  window.addEventListener("message", onScrollMessage);
}

function detachListeners(): void {
  if (!listenersAttached) return;
  listenersAttached = false;

  document.removeEventListener("scroll", requestSync, true);
  window.removeEventListener("resize", requestSync);
  document.removeEventListener("mousedown", onDocumentMousedown, true);
  document.removeEventListener("keydown", onDocumentKeydown);
  window.removeEventListener("message", onScrollMessage);
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

  /**
   * Called by Obsidian when the code block container is about to be removed
   * (e.g. scrolled out of viewport). We hide the iframe but keep it in the
   * overlay — no DOM movement, no reload.
   */
  onunload(): void {
    const entry = cache.get(this.embedId);
    if (!entry) return;

    if (entry.placeholder) resizeObserver?.unobserve(entry.placeholder);
    entry.visible = false;
    entry.placeholder = null;
    entry.wrapper.style.display = "none";
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

  // Validate API key
  if (!settings.apiKey) {
    const errorEl = container.createDiv({ cls: "bearbull-embed-error" });
    errorEl.setText("BearBull API key not configured. Set it in Settings → BearBull.");
    return null;
  }

  const url = buildEmbedUrl(parsed, settings, obsidianTheme);
  const height = getIframeHeight(parsed, settings);

  const child = new BearBullEmbed(container, embedId);

  // Create placeholder that reserves space in the document flow
  const placeholder = container.createDiv({ cls: "bearbull-embed-placeholder" });
  placeholder.dataset.bearbullId = embedId;
  placeholder.style.height = `${height}px`;

  // --- Cache hit: reattach to new placeholder --------------------------------
  const cached = cache.get(embedId);
  if (cached && cached.url === url) {
    cached.visible = true;
    cached.placeholder = placeholder;
    getResizeObserver().observe(placeholder);

    if (!cached.loaded) {
      const loadingEl = placeholder.createDiv({ cls: "bearbull-embed-loading" });
      loadingEl.setText("Loading BearBull chart...");
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
  loadingEl.setText("Loading BearBull chart...");

  const isTable = TABLE_TYPES.has(parsed.type);

  const createIframe = () => {
    const ol = getOverlay();

    // Wrapper holds both iframe and guard
    const wrapper = document.createElement("div");
    wrapper.className = "bearbull-iframe-wrapper";
    wrapper.style.display = "none"; // hidden until load

    const iframe = document.createElement("iframe");
    iframe.className = "bearbull-overlay-iframe";
    iframe.src = url;
    iframe.style.background = "transparent";
    iframe.setAttribute("loading", "lazy");
    iframe.setAttribute("allowtransparency", "true");
    iframe.setAttribute("sandbox", "allow-scripts allow-same-origin");

    // Scroll guard — only for table embeds
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
      requestSync(); // show and position now that it's loaded
    });

    iframe.addEventListener("error", () => {
      cache.delete(embedId);
      wrapper.remove();
      showError(loadingEl);
    });

    ol.appendChild(wrapper);
  };

  // Skip HEAD check if we already verified this host during this session
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
// Active-leaf-change — called when Obsidian switches tabs
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
  loadingEl.setText("Could not connect to BearBull");
  loadingEl.classList.add("bearbull-embed-error");
  loadingEl.classList.remove("bearbull-embed-loading");
}
