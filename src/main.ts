import { Plugin } from "obsidian";
import type { BearBullSettings } from "./types";
import { DEFAULT_SETTINGS } from "./types";
import { BearBullSettingTab } from "./settings";
import { parseEmbed } from "./parser";
import { renderEmbed } from "./renderer";

function getObsidianTheme(): string {
  return document.body.classList.contains("theme-dark") ? "dark" : "light";
}

export default class BearBullPlugin extends Plugin {
  settings: BearBullSettings;

  async onload() {
    await this.loadSettings();

    this.addSettingTab(new BearBullSettingTab(this.app, this));

    // Code block processor — works in both Live Preview and Reading view
    // Syntax: ```bb\nAAPL::BS\nGOOG::IS::2020-01-01::2025-01-01\n```
    this.registerMarkdownCodeBlockProcessor("bb", (source, el) => {
      const lines = source
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      if (lines.length === 0) {
        el.createDiv({ cls: "bearbull-embed-error", text: "Empty bb block" });
        return;
      }

      const obsidianTheme = getObsidianTheme();

      for (const line of lines) {
        const parsed = parseEmbed(line);
        if (!parsed) {
          const errorEl = el.createDiv({ cls: "bearbull-embed-error" });
          errorEl.setText(`Invalid embed syntax: ${line}`);
          continue;
        }

        const container = el.createDiv();
        renderEmbed(container, parsed, this.settings, obsidianTheme);
      }
    });

    // Fallback: markdown post processor for ![[...]] syntax in Reading view
    this.registerMarkdownPostProcessor((el) => {
      const embeds = el.querySelectorAll<HTMLElement>(".internal-embed");

      for (const embed of Array.from(embeds)) {
        const src = embed.getAttribute("src");
        if (!src || !src.includes("::")) continue;

        const parsed = parseEmbed(src);
        if (!parsed) continue;

        renderEmbed(embed, parsed, this.settings, getObsidianTheme());
      }
    });
  }

  onunload() {
    // Obsidian handles code block processor cleanup automatically
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}
