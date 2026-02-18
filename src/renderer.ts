import { requestUrl } from "obsidian";
import type { ParsedEmbed, BearBullSettings } from "./types";
import { buildEmbedUrl, getIframeHeight } from "./urlBuilder";

export function renderEmbed(
  container: HTMLElement,
  parsed: ParsedEmbed,
  settings: BearBullSettings,
  obsidianTheme: string,
): void {
  // Clear existing content
  container.empty();
  container.classList.add("bearbull-embed-container");

  // Validate API key
  if (!settings.apiKey) {
    const errorEl = container.createDiv({ cls: "bearbull-embed-error" });
    errorEl.setText("BearBull API key not configured. Set it in Settings → BearBull.");
    return;
  }

  const url = buildEmbedUrl(parsed, settings, obsidianTheme);
  const height = getIframeHeight(parsed, settings);

  // Loading state
  const loadingEl = container.createDiv({ cls: "bearbull-embed-loading" });
  loadingEl.setText("Loading BearBull chart...");

  // Check connectivity before creating iframe
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("timeout")), 8000),
  );

  Promise.race([requestUrl({ url: settings.baseUrl, method: "HEAD" }), timeout])
    .then(() => {
      // Reachable — create iframe
      const iframe = container.createEl("iframe");
      iframe.src = url;
      iframe.style.height = `${height}px`;
      iframe.setAttribute("loading", "lazy");
      iframe.setAttribute("sandbox", "allow-scripts allow-same-origin");

      iframe.addEventListener("load", () => {
        loadingEl.remove();
      });

      iframe.addEventListener("error", () => {
        showError(loadingEl, iframe);
      });
    })
    .catch(() => {
      showError(loadingEl);
    });
}

function showError(loadingEl: HTMLElement, iframe?: HTMLIFrameElement): void {
  loadingEl.setText("Could not connect to BearBull");
  loadingEl.classList.add("bearbull-embed-error");
  loadingEl.classList.remove("bearbull-embed-loading");
  if (iframe) iframe.remove();
}
