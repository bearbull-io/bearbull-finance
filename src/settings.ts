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

    const apiKeySetting = new Setting(containerEl)
      .setName("API key")
      .addText((text) =>
        text
          .setPlaceholder("Enter your embed API key")
          .setValue(this.plugin.settings.apiKey)
          .then((t) => {
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
      href: "https://www.bearbull.io/account/obsidianPlugin",
    });
    apiKeySetting.descEl.appendText(". See the ");
    apiKeySetting.descEl.createEl("a", {
      text: "Obsidian guide",
      href: "https://www.bearbull.io/blog/Guide/Obsidian-Note",
    });
    apiKeySetting.descEl.appendText(" to get started.");

    new Setting(containerEl)
      .setName("Theme")
      .setDesc("Color theme for embedded charts.")
      .addDropdown((dropdown) =>
        dropdown
          .addOption("auto", "Auto")
          .addOption("dark", "Dark")
          .addOption("light", "Light")
          .addOption("reading", "Reading")
          .setValue(this.plugin.settings.theme)
          .onChange((value) => {
            this.plugin.settings.theme = value as "dark" | "light" | "reading" | "auto";
            void this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Default period")
      .setDesc("Default time period for financial statements.")
      .addDropdown((dropdown) =>
        dropdown
          .addOption("A", "Annual")
          .addOption("Q", "Quarterly")
          .setValue(this.plugin.settings.defaultPeriod)
          .onChange((value) => {
            this.plugin.settings.defaultPeriod = value as "A" | "Q";
            void this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Show time frame bar")
      .setDesc("Show the annual/quarterly selector on charts.")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.showTimeFrameBar)
          .onChange((value) => {
            this.plugin.settings.showTimeFrameBar = value;
            void this.plugin.saveSettings();
          })
      );

    new Setting(containerEl).setName("Defaults").setHeading();

    new Setting(containerEl)
      .setName("Default currency")
      .setDesc("Currency code for value conversion. Leave blank to skip.")
      .addText((text) =>
        text
          .setPlaceholder("USD")
          .setValue(this.plugin.settings.defaultCurrency)
          .then((t) => {
            t.inputEl.addEventListener("blur", () => {
              this.plugin.settings.defaultCurrency = t.inputEl.value.trim().toUpperCase();
              void this.plugin.saveSettings();
            });
          })
      );

    new Setting(containerEl)
      .setName("Date format")
      .setDesc("Date format used in financial statements and charts.")
      .addDropdown((dropdown) =>
        dropdown
          .addOption("yyyy-mm-dd", "2024-01-31")
          .addOption("dd.mm.yyyy", "31.01.2024")
          .addOption("dd/mm/yyyy", "31/01/2024")
          .addOption("mm/dd/yyyy", "01/31/2024")
          .setValue(this.plugin.settings.dateFormat)
          .onChange((value) => {
            this.plugin.settings.dateFormat = value;
            void this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Thousand separator")
      .setDesc("Character used to separate thousands in numbers.")
      .addDropdown((dropdown) =>
        dropdown
          .addOption("'", "Apostrophe (')")
          .addOption(",", "Comma (,)")
          .addOption(".", "Period (.)")
          .setValue(this.plugin.settings.thousandSeparator)
          .onChange((value) => {
            this.plugin.settings.thousandSeparator = value;
            void this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Default from date")
      .setDesc("Start date for financial data as an absolute or relative date (e.g. today()-1y).")
      .addText((text) =>
        text
          .setValue(this.plugin.settings.defaultFromDate)
          .then((t) => {
            t.inputEl.addEventListener("blur", () => {
              this.plugin.settings.defaultFromDate = t.inputEl.value.trim();
              void this.plugin.saveSettings();
            });
          })
      );

    new Setting(containerEl)
      .setName("Default to date")
      .setDesc("Default end date.")
      .addText((text) =>
        text
          .setValue(this.plugin.settings.defaultToDate)
          .then((t) => {
            t.inputEl.addEventListener("blur", () => {
              this.plugin.settings.defaultToDate = t.inputEl.value.trim();
              void this.plugin.saveSettings();
            });
          })
      );

    new Setting(containerEl).setName("Advanced").setHeading();

    new Setting(containerEl)
      .setName("Chart height")
      .setDesc("Height in pixels for embeds.")
      .addText((text) =>
        text
          .setValue(String(this.plugin.settings.iframeHeight))
          .then((t) => {
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
}
