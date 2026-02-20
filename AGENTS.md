# Greens Scraper - Agent Guidelines

This document provides guidelines for agents working on this codebase.

## Project Overview

- **Type:** Web scraper + static UI
- **Stack:** Node.js, Playwright, vanilla JavaScript
- **Purpose:** Scrape "Super Price" offers from greens.com.mt and display in a searchable table
- **Output:** Static JSON files served via GitHub Pages from `docs/` folder
- **Automation:** GitHub Actions runs on schedule (weekdays 10:00 UTC)

## Commands

### Install Dependencies
```bash
npm install
```

### Run Scraper
```bash
npm run scrape
```
Runs Playwright scraper headlessly. Outputs JSON to `docs/data_drinks.json` and `docs/data_general.json`.

### Publish to GitHub Pages
```bash
npm run publish
```
Commits and pushes changes. GitHub Pages serves the `docs/` folder.

### Manual GitHub Actions Trigger
```bash
gh workflow run scheduled.yml
```
Triggers the scrape workflow manually.

## Project Structure

```
greensscraper/
├── docs/                                    # Static site + scraped data
│   ├── index.htm                            # Main HTML page
│   ├── ajaxtable.js                        # Table rendering logic
│   └── style.css                           # Dark green theme
├── scrape.js                               # Playwright scraper
├── .github/workflows/scheduled.yml         # GitHub Actions workflow
└── package.json
```

## Code Style Guidelines

### General Principles
- Use vanilla JavaScript (no frameworks) for `docs/` folder
- Use Playwright APIs for scraper code
- Keep functions small and focused (single responsibility)
- Use meaningful variable names

### Naming Conventions
- **Files:** kebab-case (e.g., `scrape.js`, `ajaxtable.js`)
- **Functions:** camelCase (e.g., `scrapeAndSave`, `parseNumber`)
- **Constants:** UPPER_SNAKE_CASE (e.g., `DEFAULT_VIEW`, `pageSize`)
- **CSS classes:** kebab-case with semantic prefixes (e.g., `.offer-row`, `.is-sortable`)

### JavaScript Patterns

#### Imports/Requires
- Use `require()` for Node.js scripts (CommonJS)
- Use ES6 modules where appropriate
```javascript
const { chromium } = require('playwright');
const fs = require('fs');
```

#### Async/Await
- Always use async/await for asynchronous operations
- Always handle errors with try/catch or .catch()
```javascript
async function scrapePage(page = 1) {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      console.error(`HTTP error! status: ${response.status}`);
      return;
    }
  } catch (e) {
    console.error('Error:', e.message);
  }
}
```

#### Error Handling
- Log errors with meaningful messages
- Use early returns to avoid nested conditionals
- Exit with `process.exit(1)` for fatal errors
```javascript
if (!bearerToken) {
  console.error('Failed to obtain Bearer token');
  process.exit(1);
}
```

### HTML/CSS Patterns

#### HTML
- Use semantic HTML5 elements
- Include accessibility attributes (alt text, aria-labels)
- Use data attributes for JavaScript hooks: `data-key`, `data-row-index`

#### CSS
- Keep it simple: no preprocessors needed
- Use CSS custom properties for theming (see `docs/style.css`)
- Prefix utility classes (e.g., `is-`, `has-`) for state: `.is-active`, `.is-sortable`

### Data Handling

#### JSON Output
- Use `JSON.stringify(items, null, 2)` for pretty-printing in debug
- Use `JSON.stringify(items)` (no indent) for production files
- Always include `lastupdate.txt` timestamp when updating data

#### API Requests
- Capture and reuse authentication tokens
- Implement pagination handling
- Filter results server-side when possible

### Git Conventions
- Commit message format: imperative mood (e.g., "Update scraped data")
- Push to default branch for GitHub Pages deployment
- Do not commit node_modules

## Key Files Reference

| File | Purpose |
|------|---------|
| `scrape.js` | Playwright scraper - gets token and runs scrapes |
| `docs/ajaxtable.js` | Table rendering, sorting, filtering, pagination |
| `.github/workflows/scheduled.yml` | GitHub Actions workflow |

## Troubleshooting

- **Token capture fails:** Run `node scrape.js` locally to debug
- **No data scraped:** Check if greens.com.mt API changed
- **Stale data:** JSON fetches use `?v=<timestamp>` cache busting
- **Workflow fails:** Check GitHub Actions logs for errors

## GitHub Actions

- Runs weekdays at 10:00 UTC
- Manual trigger: GitHub → Actions → Scrape on schedule → Run workflow
- Uses `npm install` + `npx playwright install chromium` + `npm run scrape`

## Notes

- Respect greens.com.mt Terms of Service
- The scheduled workflow runs on weekdays only
