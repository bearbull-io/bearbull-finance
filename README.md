# BearBull Obsidian Plugin

## Introduction

The BearBull Obsidian plugin embeds interactive financial data directly in your notes. Write a short code block and the plugin renders a chart inline — stock price charts, income statements, balance sheets, cashflow statements, revenue breakdowns, and more. All data stays up to date without leaving Obsidian.

---

## Installation

**Option 1 — Community Plugins:**

1. Open **Obsidian Settings** and go to **Community Plugins**.
2. Click **Browse** and search for **BearBull**.
3. Click **Install**, then **Enable**.

**Option 2 — Manual Install from GitHub:**

1. Download the latest release from [github.com/bearbull-io/bearbull-finance](https://github.com/bearbull-io/bearbull-finance).
2. Extract the files into your vault's `.obsidian/plugins/bearbull-finance/` folder.
3. Restart Obsidian and enable the plugin in **Settings > Community Plugins**.

---

## Setup

After enabling the plugin, open its settings panel. The following options are available:

| Setting | Default | Description |
|---------|---------|-------------|
| API Key | — | Required. Get yours at [bearbull.io](https://www.bearbull.io) |
| Theme | `auto` | `dark`, `light`, or `auto` (matches your Obsidian theme) |
| Default Period | `A` | `A` (Annual) or `Q` (Quarterly) |
| Show Time Frame Bar | `true` | Show or hide the annual/quarterly selector on embeds |
| Default Currency | — | Currency code for conversion (e.g. `EUR`). Leave blank for no conversion |
| Date Format | `yyyy-mm-dd` | Also: `dd.mm.yyyy`, `dd/mm/yyyy`, `mm/dd/yyyy` |
| Default From | `today()-10Y` | Start date expression |
| Default To | `today()` | End date expression |
| Height | `400` | Embed height in pixels |

Every setting acts as a default and can be overridden per embed.

---

## Embed Types

### Price Charts

| Type | Description |
|------|-------------|
| `CHART` | Candlestick chart (single ticker) or comparison line chart (multiple tickers) |

### Financial Statements

| Type | Description |
|------|-------------|
| `IS` | Income Statement |
| `BS` | Balance Sheet |
| `CS` | Cash Flow Statement |
| `RB` | Revenue Breakdown |
| `EPS` | Earnings Per Share |

### Valuation & Market Data

| Type | Description |
|------|-------------|
| `MC` | Market Cap & Enterprise Value |
| `VR` | Valuation Ratios |

### Earnings & Estimates

| Type | Description |
|------|-------------|
| `ES` | Earnings Surprises |
| `FE` | Analyst Estimates |

### Dividends & ESG

| Type | Description |
|------|-------------|
| `DIV` | Dividends |
| `ESG` | ESG Rating |

### Company Data

| Type | Description |
|------|-------------|
| `EC` | Employee Count |
| `IH` | Insider Holdings |

---

## Syntax

Each line is a `key: value` pair inside a fenced `bb` code block. Only `ticker` and `type` are required — everything else is optional and falls back to your plugin settings.

````
```bb
ticker: AAPL
type: IS
period: Q
from: today()-5Y
to: today()
```
````

### Format auto-detection

If any non-empty line in a `bb` block matches `key: value` (contains `:` but not `::`), the entire block is treated as key-value format.

---

## Options Reference

All options are optional except `ticker` (or `constituents` for CON) and `type`. Defaults come from plugin settings.

| Option | Values | Description |
|--------|--------|-------------|
| `ticker` | e.g. `AAPL` or `AAPL,GOOG` | One or more stock tickers (comma-separated) |
| `constituents` | e.g. `S&P500` or `S&P500,DJI` | Index names for CON type (comma-separated) |
| `type` | `CHART` `IS` `BS` `CS` `RB` `EPS` `MC` `VR` `ES` `FE` `DIV` `ESG` `EC` `IH` `CON` | Embed type |
| `subtype` | `PRO` or `GEO` | Revenue Breakdown: by product or geography |
| `period` | `A` `Q` `ZOOMA` `ZOOMQ` | Data period |
| `from` | `today()-NY` or `YYYY-MM-DD` | Start date |
| `to` | `today()` or `YYYY-MM-DD` | End date |
| `theme` | `dark` `light` `reading` | Override the color theme |
| `currency` | e.g. `USD`, `EUR`, `CHF` | Convert values to a specific currency |
| `dateformat` | `yyyy-mm-dd` `dd.mm.yyyy` `dd/mm/yyyy` `mm/dd/yyyy` | Date display format |
| `timeframebar` | `true` or `false` | Show/hide the period selector bar |
| `tf` | `true` or `false` | Shorthand for `timeframebar` |
| `height` | e.g. `600` | Embed height in pixels |

### Period values

| Value | Description |
|-------|-------------|
| `A` | Annual data (default) |
| `Q` | Quarterly data |
| `ZOOMA` | Annual data with zoom controls |
| `ZOOMQ` | Quarterly data with zoom controls |

Period is supported by: `IS`, `BS`, `CS`, `RB`, `EPS`.

### Date expressions

| Expression | Result |
|------------|--------|
| `today()` | Current date |
| `today()-5Y` | 5 years ago |
| `today()-6M` | 6 months ago |
| `today()-30D` | 30 days ago |
| `2024-01-01` | Specific ISO date |

> [!tip]
> Dates resolve at render time, so `today()-5Y` always shows the last 5 years of data.
