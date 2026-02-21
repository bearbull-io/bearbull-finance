import { Plugin } from "obsidian";
import type { BearBullSettings } from "./types";
import { DEFAULT_SETTINGS } from "./types";
import { BearBullSettingTab } from "./settings";
import { parseBlock } from "./parser";
import { renderEmbed, cleanupOverlay, onActiveLeafChange, onLayoutChange } from "./renderer";

const SECRET_KEY_API = "bearbull-key";

function getObsidianTheme(): string {
  return document.body.classList.contains("theme-dark") ? "dark" : "light";
}

export default class BearBullPlugin extends Plugin {
  settings: BearBullSettings;

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
    const data = await this.loadData();
    this.settings = Object.assign({}, DEFAULT_SETTINGS, data);

    // Migration: move apiKey from data.json → SecretStorage
    if (data?.apiKey) {
      this.app.secretStorage.setSecret(SECRET_KEY_API, data.apiKey);
      delete data.apiKey;
      await this.saveData(data);
    }

    // Load apiKey from SecretStorage
    this.settings.apiKey = this.app.secretStorage.getSecret(SECRET_KEY_API) ?? "";
  }

  async saveSettings() {
    // apiKey → SecretStorage only
    this.app.secretStorage.setSecret(SECRET_KEY_API, this.settings.apiKey);

    // Everything else → data.json (exclude apiKey)
    const { apiKey, ...rest } = this.settings;
    await this.saveData(rest);
  }
}
