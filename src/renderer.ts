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

interface CacheEntry {
  wrapper: HTMLDivElement;
  iframe: HTMLIFrameElement;
  guard: HTMLDivElement;
  url: string;
  loaded: boolean;
  visible: boolean;
  placeholder: HTMLElement | null;
  height: number;
}

const cache = new Map<string, CacheEntry>();

/** Track which embedIds had a successful HEAD check so we skip it on re-render */
const verifiedHosts = new Set<string>();

// ---------------------------------------------------------------------------
// Position sync — single rAF loop that aligns iframes over their placeholders
// ---------------------------------------------------------------------------

let syncScheduled = false;

function requestSync(): void {
  if (syncScheduled) return;
  syncScheduled = true;
  requestAnimationFrame(syncPositions);
}

function syncPositions(): void {
  syncScheduled = false;

  for (const entry of cache.values()) {
    if (!entry.visible || !entry.placeholder) {
      entry.wrapper.style.display = "none";
      continue;
    }

    const rect = entry.placeholder.getBoundingClientRect();

    // Hide if placeholder is off-screen or has zero dimensions
    if (rect.width === 0 || rect.height === 0) {
      entry.wrapper.style.display = "none";
      continue;
    }

    entry.wrapper.style.display = "block";
    entry.wrapper.style.left = `${rect.left}px`;
    entry.wrapper.style.top = `${rect.top}px`;
    entry.wrapper.style.width = `${rect.width}px`;
    entry.wrapper.style.height = `${rect.height}px`;
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
    entry.guard.classList.remove("interactive");
  }
}

function onDocumentMousedown(e: MouseEvent): void {
  // If click is inside an active (interactive) wrapper, leave it active
  for (const entry of cache.values()) {
    if (entry.guard.classList.contains("interactive") && entry.wrapper.contains(e.target as Node)) {
      return;
    }
  }
  deactivateAllGuards();
}

function onDocumentKeydown(e: KeyboardEvent): void {
  if (e.key === "Escape") deactivateAllGuards();
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
}

function detachListeners(): void {
  if (!listenersAttached) return;
  listenersAttached = false;

  document.removeEventListener("scroll", requestSync, true);
  window.removeEventListener("resize", requestSync);
  document.removeEventListener("mousedown", onDocumentMousedown, true);
  document.removeEventListener("keydown", onDocumentKeydown);
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

    // Scroll guard — intercepts wheel events, click to interact
    const guard = document.createElement("div");
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

    wrapper.appendChild(iframe);
    wrapper.appendChild(guard);

    const entry: CacheEntry = {
      wrapper,
      iframe,
      guard,
      url,
      loaded: false,
      visible: true,
      placeholder,
      height,
    };
    cache.set(embedId, entry);

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
// Cleanup — called from plugin onunload()
// ---------------------------------------------------------------------------

export function cleanupOverlay(): void {
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
