import { App, PluginSettingTab, Setting } from "obsidian";
import type BearBullPlugin from "./main";

export class BearBullSettingTab extends PluginSettingTab {
  plugin: BearBullPlugin;

  constructor(app: App, plugin: BearBullPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl("h2", { text: "BearBull" });

    const apiKeySetting = new Setting(containerEl)
      .setName("BearBull Key")
      .addText((text) =>
        text
          .setPlaceholder("bb_embed_...")
          .setValue(this.plugin.settings.apiKey)
          .then((t) => {
            t.inputEl.type = "password";
            t.inputEl.autocomplete = "off";
            t.inputEl.addEventListener("blur", async () => {
              this.plugin.settings.apiKey = t.inputEl.value.trim();
              await this.plugin.saveSettings();
            });
          })
      );
    apiKeySetting.descEl.appendText("Your BearBull embed API key. Get one at ");
    apiKeySetting.descEl.createEl("a", {
      text: "www.bearbull.io",
      href: "https://www.bearbull.io",
    });
    apiKeySetting.descEl.appendText(".");

    new Setting(containerEl)
      .setName("Theme")
      .setDesc("Chart color theme. 'Auto' matches your Obsidian theme.")
      .addDropdown((dropdown) =>
        dropdown
          .addOption("auto", "Auto")
          .addOption("dark", "Dark")
          .addOption("light", "Light")
          .addOption("reading", "Reading")
          .setValue(this.plugin.settings.theme)
          .onChange(async (value) => {
            this.plugin.settings.theme = value as "dark" | "light" | "reading" | "auto";
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Default Period")
      .setDesc("Default time period for financial statements.")
      .addDropdown((dropdown) =>
        dropdown
          .addOption("A", "Annual")
          .addOption("Q", "Quarterly")
          .setValue(this.plugin.settings.defaultPeriod)
          .onChange(async (value) => {
            this.plugin.settings.defaultPeriod = value as "A" | "Q";
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Show Time Frame Bar")
      .setDesc("Show the annual/quarterly selector on charts.")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.showTimeFrameBar)
          .onChange(async (value) => {
            this.plugin.settings.showTimeFrameBar = value;
            await this.plugin.saveSettings();
          })
      );

    // --- Defaults ---
    containerEl.createEl("h3", { text: "Defaults" });

    new Setting(containerEl)
      .setName("Default Currency")
      .setDesc("Convert values to this currency (e.g. USD, EUR). Leave blank for no conversion.")
      .addText((text) =>
        text
          .setPlaceholder("USD")
          .setValue(this.plugin.settings.defaultCurrency)
          .then((t) => {
            t.inputEl.addEventListener("blur", async () => {
              this.plugin.settings.defaultCurrency = t.inputEl.value.trim().toUpperCase();
              await this.plugin.saveSettings();
            });
          })
      );

    new Setting(containerEl)
      .setName("Date Format")
      .setDesc("Date format used in financial statements and charts.")
      .addDropdown((dropdown) =>
        dropdown
          .addOption("yyyy-mm-dd", "yyyy-mm-dd")
          .addOption("dd.mm.yyyy", "dd.mm.yyyy")
          .addOption("dd/mm/yyyy", "dd/mm/yyyy")
          .addOption("mm/dd/yyyy", "mm/dd/yyyy")
          .setValue(this.plugin.settings.dateFormat)
          .onChange(async (value) => {
            this.plugin.settings.dateFormat = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Thousand Separator")
      .setDesc("Character used to separate thousands in numbers.")
      .addDropdown((dropdown) =>
        dropdown
          .addOption("'", "Apostrophe (')")
          .addOption(",", "Comma (,)")
          .addOption(".", "Period (.)")
          .setValue(this.plugin.settings.thousandSeparator)
          .onChange(async (value) => {
            this.plugin.settings.thousandSeparator = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Default From Date")
      .setDesc("Default start date. Supports: YYYY-MM-DD, today()-NY, today()-NM, today()-ND.")
      .addText((text) =>
        text
          .setValue(this.plugin.settings.defaultFromDate)
          .then((t) => {
            t.inputEl.addEventListener("blur", async () => {
              this.plugin.settings.defaultFromDate = t.inputEl.value.trim();
              await this.plugin.saveSettings();
            });
          })
      );

    new Setting(containerEl)
      .setName("Default To Date")
      .setDesc("Default end date.")
      .addText((text) =>
        text
          .setValue(this.plugin.settings.defaultToDate)
          .then((t) => {
            t.inputEl.addEventListener("blur", async () => {
              this.plugin.settings.defaultToDate = t.inputEl.value.trim();
              await this.plugin.saveSettings();
            });
          })
      );

    // --- Advanced ---
    containerEl.createEl("h3", { text: "Advanced" });

    new Setting(containerEl)
      .setName("Chart Height")
      .setDesc("Height in pixels for embeds.")
      .addText((text) =>
        text
          .setValue(String(this.plugin.settings.iframeHeight))
          .then((t) => {
            t.inputEl.addEventListener("blur", async () => {
              const num = parseInt(t.inputEl.value, 10);
              if (!isNaN(num) && num > 0) {
                this.plugin.settings.iframeHeight = num;
                await this.plugin.saveSettings();
              }
            });
          })
      );

  }
}
