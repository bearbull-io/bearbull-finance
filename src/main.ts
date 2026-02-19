import { Plugin } from "obsidian";
import type { BearBullSettings } from "./types";
import { DEFAULT_SETTINGS } from "./types";
import { BearBullSettingTab } from "./settings";
import { parseBlock } from "./parser";
import { renderEmbed, cleanupOverlay } from "./renderer";

function getObsidianTheme(): string {
  return document.body.classList.contains("theme-dark") ? "dark" : "light";
}

export default class BearBullPlugin extends Plugin {
  settings: BearBullSettings;

  async onload() {
    await this.loadSettings();

    this.addSettingTab(new BearBullSettingTab(this.app, this));

    this.registerMarkdownCodeBlockProcessor("bb", (source, el, ctx) => {
      const results = parseBlock(source);

      if (results.length === 0) {
        el.createDiv({ cls: "bearbull-embed-error", text: "Invalid bb block" });
        return;
      }

      const lineStart = ctx.getSectionInfo(el)?.lineStart ?? 0;
      const obsidianTheme = getObsidianTheme();

      for (let i = 0; i < results.length; i++) {
        const parsed = results[i];
        const embedId = `${ctx.sourcePath}:${lineStart}:${i}`;
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
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}
