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

function simpleHash(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) & 0xffffffff;
  }
  return `h${(hash >>> 0).toString(36)}`;
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

      const sectionInfo = ctx.getSectionInfo(el);
      const lineKey = sectionInfo
        ? String(sectionInfo.lineStart)
        : simpleHash(source);
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

    const { apiKey: _, ...rest } = this.settings;
    await this.saveData(rest);
  }
}
