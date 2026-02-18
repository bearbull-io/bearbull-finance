# BearBull Finance for Obsidian

Embed interactive [BearBull](https://bearbull.com) financial charts directly in your Obsidian notes — stock prices, income statements, balance sheets, cashflow statements, revenue breakdowns, and institutional holders.

## Installation

### From Obsidian Community Plugins

1. Open **Settings** → **Community Plugins** → **Browse**
2. Search for **BearBull**
3. Click **Install**, then **Enable**

### Manual Installation

1. Download `main.js`, `manifest.json`, and `styles.css` from the [latest release](https://github.com/bearbull-io/bearbull-finance/releases/latest)
2. Create a folder at `<vault>/.obsidian/plugins/bearbull-finance/`
3. Copy the three files into that folder
4. Enable the plugin in **Settings** → **Community Plugins**

## Setup

1. Get an embed API key at [bearbull.com/account/apiKeys](https://bearbull.com/account/apiKeys)
2. Open **Settings** → **BearBull** and paste your API key

## Syntax

### Code Block

Use a `bb` code block to embed one or more charts:

````
```bb
AAPL::IS::today()-10Y::today()::revenue,netIncome
```
````

### Wiki Link

Use wiki-link syntax for inline single embeds:

```
![[AAPL::CHART::today()-3Y::today()]]
```

### Format

```
TICKERS::TYPE(::SUBTYPE)?(::FROM)?(::TO)?(::TAGS)?({OPTIONS})?
```

| Component    | Required | Description                                   | Example                     |
| ------------ | -------- | --------------------------------------------- | --------------------------- |
| **TICKERS**  | Yes      | One or more symbols, comma-separated          | `AAPL` or `AAPL,MSFT`      |
| **TYPE**     | Yes      | Chart type (see below)                        | `IS`                        |
| **SUBTYPE**  | RB only  | `PRO` (product) or `GEO` (geographic)         | `PRO`                       |
| **FROM**     | No       | Start date expression, or `-` to skip         | `today()-5Y`                |
| **TO**       | No       | End date expression, or `-` to skip           | `today()`                   |
| **TAGS**     | No       | Comma-separated metric names                  | `revenue,netIncome`         |
| **OPTIONS**  | No       | Key-value pairs in braces                     | `{period=Q,height=500}`     |

### Chart Types

| Code    | Description              |
| ------- | ------------------------ |
| `CHART` | Stock price chart        |
| `IS`    | Income statement         |
| `BS`    | Balance sheet            |
| `CS`    | Cashflow statement       |
| `RB`    | Revenue breakdown        |
| `IH`    | Institutional holders    |

### Date Expressions

- `today()` — current date
- `today()-5Y` — 5 years ago (also `NM` for months, `ND` for days)
- `2024-01-01` — specific ISO date
- `-` — skip (use plugin default)

### Inline Options

Append `{key=value,...}` to override settings per embed:

| Option         | Values               | Description                    |
| -------------- | -------------------- | ------------------------------ |
| `period`       | `A`, `Q`             | Annual or quarterly data       |
| `theme`        | `dark`, `light`      | Override chart theme           |
| `height`       | Number (px)          | Chart height in pixels         |
| `tf`           | `true`, `false`      | Show/hide time frame bar       |
| `tags`         | Comma-separated      | Metric tags to display         |
| `from` / `to`  | Date expression      | Override date range            |
| `currency`     | Currency code        | Convert values (e.g. `EUR`)    |
| `dateformat`   | Format string        | Date display format            |

### Examples

```
AAPL::CHART::today()-5Y::today()
AAPL::IS::today()-10Y::today()::revenue,netIncome
AAPL::BS::today()-10Y::today()::totalAssets,totalLiabilities
AAPL::CS{period=Q,height=600}
AAPL::RB::PRO::today()-10Y::today()
AAPL::RB::GEO
AAPL::IH
AAPL,MSFT::CHART::today()-3Y::today()
```

## Settings

| Setting              | Default           | Description                                    |
| -------------------- | ----------------- | ---------------------------------------------- |
| API Key              | —                 | Your BearBull embed API key                    |
| Theme                | Auto              | Dark, Light, or Auto (matches Obsidian theme)  |
| Default Period       | Annual            | Annual or Quarterly for financial statements   |
| Show Time Frame Bar  | On                | Show the annual/quarterly selector             |
| Show Tags            | On                | Show the metric tag selector                   |
| Default Currency     | —                 | Currency conversion (leave blank for original) |
| Date Format          | yyyy-mm-dd        | Date display format                            |
| Default From Date    | today()-10Y       | Default start date                             |
| Default To Date      | today()           | Default end date                               |
| Iframe Height        | 400               | Default embed height in pixels                 |
| Base URL             | bearbull.com      | BearBull server URL (advanced)                 |

## Support

- Issues: [GitHub Issues](https://github.com/bearbull-io/bearbull-finance/issues)
- Website: [bearbull.com](https://bearbull.com)
