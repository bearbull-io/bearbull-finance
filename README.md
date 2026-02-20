# BearBull Finance for Obsidian

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

After enabling the plugin, open its settings panel (**Settings > BearBull**). The following options are available:

| Setting | Default | Description |
|---------|---------|-------------|
| API Key | — | Required. Get yours at [bearbull.io](https://www.bearbull.io) |
| Theme | `auto` | `dark`, `light`, `reading`, or `auto` (matches your Obsidian theme) |
| Default Period | `A` | `A` (Annual) or `Q` (Quarterly) |
| Show Time Frame Bar | `true` | Show or hide the annual/quarterly selector on embeds |
| Default Currency | — | Currency code for conversion (e.g. `EUR`). Leave blank for no conversion |
| Date Format | `mm/dd/yyyy` | Also: `dd.mm.yyyy`, `dd/mm/yyyy`, `yyyy-mm-dd` |
| Default From | `today()-10Y` | Start date expression |
| Default To | `today()` | End date expression |
| Height | `400` | Embed height in pixels |
| Thousand Separator | `'` | Thousands grouping character |

Every setting acts as a default and can be overridden per embed.

---

## Embeds Reference

Create a fenced code block with the language tag `bb`. Inside, use `type:` to specify the embed and `ticker:` for the stock symbol. All other fields are optional and fall back to your plugin settings.

---

### Stock Price Charts

#### Simple Chart

An interactive line chart showing historical stock prices. Supports multiple tickers for comparison.

````
```bb
type: CHART
ticker: AAPL
from: today()-1Y
```
````

#### Advanced Chart with Indicators

A candlestick chart with optional technical overlays. **Only one ticker is allowed** — indicators do not support multi-ticker mode.

Use the `indicators` option with a comma-separated list of overlays:

| Indicator | Description |
|-----------|-------------|
| `SMA` | Simple Moving Average |
| `EPS` | Earnings Per Share (quarterly) |
| `REVENUE` | Revenue (quarterly) |
| `EARNINGS_SURPRISE` | Actual vs estimated earnings |
| `INSIDER` | Insider trading activity |
| `SENATE` | Senate trading activity |

For `INSIDER` and `SENATE`, you can optionally filter by name using the `insider` or `senate` option.

````
```bb
type: CHART_COMPLEX
ticker: AAPL
from: today()-1Y
indicators: SMA, EPS, REVENUE
```
````

With insider name filter:

````
```bb
type: CHART_COMPLEX
ticker: AAPL
indicators: INSIDER
insider: Tim Cook
```
````

---

### Company

#### Profile

Displays key company information such as sector, industry, market cap, CEO, and more.

````
```bb
type: PROFILE
ticker: AAPL
```
````

---

### Financial Statements

#### Income Statement

Revenue, expenses, and profitability over time. Use `tags` to select specific metrics.

````
```bb
type: INCOME_STATEMENT
ticker: AAPL
period: Q
tags: revenue, grossProfit, netIncome
```
````

#### Balance Sheet

Assets, liabilities, and shareholders' equity.

````
```bb
type: BALANCE_SHEET
ticker: AAPL
```
````

#### Cashflow Statement

Operating, investing, and financing cash flows.

````
```bb
type: CASHFLOW_STATEMENT
ticker: AAPL
period: Q
```
````

---

### Revenue Breakdown

#### By Product

Revenue split by product segment.

````
```bb
type: REVENUE_BREAKDOWN
subtype: PRODUCT
ticker: AAPL
```
````

#### By Geography

Revenue split by geographic region.

````
```bb
type: REVENUE_BREAKDOWN
subtype: GEOGRAPHY
ticker: AAPL
```
````

---

### Valuation & Metrics

#### Earnings Per Share (EPS)

Earnings per share over time with annual or quarterly granularity.

````
```bb
type: EPS
ticker: AAPL
period: Q
```
````

#### Valuation Ratios

Price-to-earnings, price-to-sales, and other key valuation multiples.

````
```bb
type: VALUATION_RATIOS
ticker: AAPL
```
````

#### Market Cap

Market capitalization and enterprise value over time.

````
```bb
type: MARKET_CAP
ticker: AAPL
```
````

#### ESG Score

Environmental, Social, and Governance ratings.

````
```bb
type: ESG_SCORE
ticker: AAPL
```
````

---

### Events

#### Dividends

Historical dividend payments.

````
```bb
type: DIVIDENDS
ticker: AAPL
```
````

#### Earnings Surprise

Actual vs estimated earnings per quarter.

````
```bb
type: EARNINGS_SURPRISE
ticker: AAPL
```
````

#### Financial Estimates

Analyst revenue and earnings estimates vs actuals.

````
```bb
type: FINANCIAL_ESTIMATES
ticker: AAPL
```
````

---

### Other

#### Full-Time Employees

Historical headcount over time.

````
```bb
type: FULLTIME_EMPLOYEES
ticker: AAPL
```
````

#### Institutional Ownership

Top institutional holders, their positions, and portfolio weight.

````
```bb
type: INSTITUTIONAL_OWNERSHIP
ticker: AAPL
```
````

#### Constituents

Index constituents for major indexes.

````
```bb
type: CONSTITUENTS
tickers: SP500
```
````

---

### Tables

Table embeds render the raw financial data in a sortable table format.

#### Income Statement Table

````
```bb
type: INCOME_STATEMENT_TABLE
ticker: AAPL
```
````

#### Balance Sheet Table

````
```bb
type: BALANCE_SHEET_TABLE
ticker: AAPL
```
````

#### Cashflow Statement Table

````
```bb
type: CASHFLOW_STATEMENT_TABLE
ticker: AAPL
```
````

#### Revenue Breakdown Table

````
```bb
type: REVENUE_BREAKDOWN_TABLE
subtype: PRODUCT
ticker: AAPL
```
````

---

## Embed Options Reference

Every embed accepts the following options. Only specify options that differ from your plugin defaults.

| Option | Values | Default | Description |
|--------|--------|---------|-------------|
| `type` | See embed types above | — | **Required.** The embed type |
| `ticker` / `tickers` | Comma or pipe separated | — | **Required.** Stock symbol(s) |
| `subtype` | `PRODUCT`, `GEOGRAPHY` | — | For revenue breakdown embeds only |
| `period` | `A`, `Q` | `A` | Annual or Quarterly |
| `from` | Date or expression | `today()-10Y` | Start date |
| `to` | Date or expression | `today()` | End date |
| `theme` | `auto`, `dark`, `light`, `reading` | `auto` | Color theme |
| `currency` | ISO code (e.g. `EUR`, `CHF`) | — | Convert values to this currency |
| `height` | Number | `400` | Chart height in pixels |
| `timeframebar` | `true`, `false` | `true` | Show period selector |
| `dateformat` | `mm/dd/yyyy`, `dd.mm.yyyy`, `dd/mm/yyyy`, `yyyy-mm-dd` | `mm/dd/yyyy` | Date display format |
| `thousandseparator` | `'`, `,`, `.` | `'` | Thousands grouping character |
| `tags` | Comma-separated metric keys | — | Pre-select specific data series |
| `indicators` | Comma-separated | — | `CHART_COMPLEX` only: `SMA`, `EPS`, `REVENUE`, `EARNINGS_SURPRISE`, `INSIDER`, `SENATE` |
| `insider` | Name string | — | Filter insider trading by name (requires `INSIDER` indicator) |
| `senate` | Name string | — | Filter senate trading by name (requires `SENATE` indicator) |

**Date expressions:** Use `today()` for the current date, or subtract time with `today()-5Y`, `today()-6M`, `today()-30D`.
