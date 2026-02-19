# BearBull Finance for Obsidian

Embed interactive financial charts from [BearBull](https://www.bearbull.io) directly in your Obsidian notes. View stock prices, financial statements, valuation ratios, dividends, ESG scores, and more without leaving your vault.

## Installation

### Community Plugins

1. Open **Settings > Community Plugins > Browse**
2. Search for **BearBull**
3. Click **Install**, then **Enable**

### Manual

1. Download `main.js`, `manifest.json`, and `styles.css` from the [latest release](https://github.com/bearbull-io/bearbull-finance/releases/latest)
2. Create `<vault>/.obsidian/plugins/bearbull-finance/`
3. Copy the three files into that folder
4. Enable in **Settings > Community Plugins**

## Setup

1. Get an embed API key at [bearbull.io](https://www.bearbull.io)
2. Open **Settings > BearBull** and paste your key

## Usage

Create a fenced code block with the `bb` language tag. Each line is a `key: value` pair. Only `ticker` and `type` are required.

````
```bb
ticker: AAPL
type: IS
```
````

### Chart Types

| Code | Aliases | Description |
|------|---------|-------------|
| `CHART` | `SC` | Stock price chart |
| `CHART_COMPLEX` | `CC` | Advanced stock chart with overlays |
| `PROFILE` | `PRF` | Company profile |
| `INCOME_STATEMENT` | `IS` | Income statement chart |
| `BALANCE_SHEET` | `BS` | Balance sheet chart |
| `CASHFLOW_STATEMENT` | `CS`, `CF` | Cash flow statement chart |
| `REVENUE_BREAKDOWN` | `RB` | Revenue breakdown (by product or geography) |
| `EPS` | | Earnings per share |
| `VALUATION_RATIOS` | `VR`, `RATIO` | Valuation ratios (P/E, P/B, etc.) |
| `DIVIDENDS` | `DIV` | Dividend history |
| `EARNINGS_SURPRISE` | `ES`, `ESURP` | Earnings surprises |
| `FINANCIAL_ESTIMATES` | `AE` | Analyst estimates |
| `MARKET_CAP` | `MC`, `MCAP` | Market capitalization |
| `ESG_SCORE` | `ESG` | ESG scores |
| `FULLTIME_EMPLOYEES` | `FTE` | Full-time employee count |
| `INSTITUTIONAL_OWNERSHIP` | `IH`, `INST` | Institutional holders |
| `CONSTITUENTS` | `CON` | Index constituents |
| `INCOME_STATEMENT_TABLE` | `IST` | Income statement table |
| `BALANCE_SHEET_TABLE` | `BST` | Balance sheet table |
| `CASHFLOW_STATEMENT_TABLE` | `CST`, `CFT` | Cash flow statement table |
| `REVENUE_BREAKDOWN_TABLE` | `RBT`, `REVT` | Revenue breakdown table |

### Options

| Key | Required | Description | Example |
|-----|----------|-------------|---------|
| `ticker` | Yes | One or more symbols, comma-separated | `AAPL` or `AAPL, MSFT` |
| `type` | Yes | Chart type code or alias (see above) | `IS` |
| `subtype` | RB/RBT only | `PRO` (product) or `GEO` (geographic) | `GEO` |
| `from` | No | Start date | `today()-5Y` |
| `to` | No | End date | `today()` |
| `tags` | No | Metric names for IS, BS, CS charts | `revenue, netIncome` |
| `period` | No | `A` (annual) or `Q` (quarterly) | `Q` |
| `theme` | No | `dark`, `light`, or `reading` | `dark` |
| `height` | No | Embed height in pixels | `600` |
| `tf` | No | Show time frame bar (`true`/`false`) | `false` |
| `currency` | No | Currency conversion code | `EUR` |
| `dateformat` | No | Date display format | `dd/mm/yyyy` |
| `thousandseparator` | No | Number grouping character | `,` |

#### Advanced chart options (`CHART_COMPLEX` only)

| Key | Description | Example |
|-----|-------------|---------|
| `indicators` | Overlay indicators (SMA, EPS, REVENUE, EARNINGS_SURPRISE, INSIDER, SENATE) | `SMA, EPS` |
| `insider` | Show insider trading | `true` |
| `senate` | Show senate trading | `true` |
| `table` | Show data table | `true` |

#### Other type-specific options

| Key | Applies to | Description | Example |
|-----|-----------|-------------|---------|
| `view` | `IH` | Institutional holders view mode | `table` |
| `range` | `CON` | Constituents performance range | `1M` |

### Date Expressions

| Expression | Meaning |
|-----------|---------|
| `today()` | Current date |
| `today()-5Y` | 5 years ago |
| `today()-6M` | 6 months ago |
| `today()-30D` | 30 days ago |
| `2024-01-01` | Specific ISO date |

## Examples

**Income statement with selected metrics, quarterly:**

````
```bb
ticker: AAPL
type: IS
from: today()-10Y
tags: revenue, netIncome
period: Q
```
````

**Compare two stocks on a price chart:**

````
```bb
ticker: AAPL, MSFT
type: CHART
from: today()-3Y
```
````

**Revenue breakdown by geography:**

````
```bb
ticker: AAPL
type: RB
subtype: GEO
from: today()-10Y
```
````

**Advanced stock chart with overlays:**

````
```bb
ticker: TSLA
type: CC
from: today()-2Y
indicators: SMA, EPS
```
````

**Balance sheet table in EUR:**

````
```bb
ticker: AAPL
type: BST
currency: EUR
```
````

## Interacting with Charts

Charts are embedded as iframes. By default, scrolling over a chart scrolls the page normally. Click on a chart to interact with it (tooltips, zoom). Click outside the chart or press **Escape** to return to normal scrolling.

## Settings

Open **Settings > BearBull** to configure defaults.

| Setting | Default | Description |
|---------|---------|-------------|
| API Key | -- | Your BearBull embed API key |
| Theme | Auto | Dark, Light, Reading, or Auto (matches Obsidian) |
| Default Period | Annual | Annual or Quarterly for financial statements |
| Show Time Frame Bar | On | Show the annual/quarterly toggle on charts |
| Default Currency | -- | Currency conversion (blank = original currency) |
| Date Format | mm/dd/yyyy | Date display format |
| Thousand Separator | Apostrophe | Character for grouping digits |
| Default From Date | today()-10Y | Default start date for charts |
| Default To Date | today() | Default end date for charts |
| Chart Height | 400 | Default embed height in pixels |

## Support

- Issues: [GitHub](https://github.com/bearbull-io/bearbull-finance/issues)
- Website: [bearbull.io](https://www.bearbull.io)
