# Greens Super Saver Scraper

A tiny Cypress-powered scraper that collects “Super Price” offers from greens.com.mt, saves the results as JSON under the docs/ folder, and serves them via a modern vanilla JavaScript page published on GitHub Pages.

## Overview
- **Scraper:** Cypress test in [cypress/e2e/greensscraper/api_scraper.cy.js](cypress/e2e/greensscraper/api_scraper.cy.js)
- **Custom command:** `scrapeAndSave()` in [cypress/support/commands.js](cypress/support/commands.js)
- **Outputs:** JSON files and timestamp in [docs/](docs) consumed by the web UI
- **Web UI:** Vanilla JavaScript table in [docs/index.htm](docs/index.htm) using [docs/ajaxtable.js](docs/ajaxtable.js) and [docs/style.css](docs/style.css)
- **Publish:** Push to the default branch; GitHub Pages serves the docs/ folder

## How It Works
- **Auth discovery:**
  - The test visits greens.com.mt and intercepts a `.../retail/...` XHR to capture the `Authorization: Bearer <token>` header, storing it in `Cypress.env('bearerToken')`.
  - See token capture in [api_scraper.cy.js](cypress/e2e/greensscraper/api_scraper.cy.js).
- **API scraping:**
  - `scrapeAndSave(category, fileName, productListType, numOfPages)` issues paged GET requests to `https://www.greens.com.mt/apiservices/retail/sync/productlist` with the captured Bearer token.
  - For each page, it filters items where `OfferType === "Super Price"`, computes discount %, actual price, and savings, then keeps only items with at least 35% off.
  - Results are appended to an array and written to:
    - [docs/<fileName>.json](docs) as an array of rows (Category, Product, Image, NormalPrice, Discount, ActualPrice, Savings)
    - [docs/lastupdate.txt](docs) with a human-readable timestamp
  - Implementation in `scrapeAndSave()` within [cypress/support/commands.js](cypress/support/commands.js).
- **What’s scraped by default:**
  - Drinks “winecellar” category to [docs/data_drinks.json](docs/data_drinks.json) using `productListType = products` and `numOfPages = 50`.
  - General “offers” to [docs/data_general.json](docs/data_general.json) using `productListType = offers` and `numOfPages = 150`.
- **Web publishing:**
  - [docs/index.htm](docs/index.htm) + [docs/ajaxtable.js](docs/ajaxtable.js) load JSON and render a searchable, sortable, paginated table with quick dataset switches (Drinks | All Items).
  - The UI also displays the last update time from [docs/lastupdate.txt](docs/lastupdate.txt).
  - The UI is dark green themed and does not rely on Bootstrap, jQuery, or DataTables.

## Requirements
- **Node.js** 16+ (18+ recommended)
- **Git** with access to push to the repository

## Install
```bash
npm install
```

## Run The Scraper
- **Headless run (default):**
  - Runs Cypress tests that scrape and write JSON/lastupdate to docs/
```bash
npm run scrape
```
- **Open Cypress (debug/interactive):**
```bash
npx cypress open
```
- After a successful run, confirm the updated files:
  - [docs/data_drinks.json](docs/data_drinks.json)
  - [docs/data_general.json](docs/data_general.json)
  - [docs/lastupdate.txt](docs/lastupdate.txt)

## Publish To GitHub Pages
- This project serves static files from the repo’s docs/ folder.
- One-time repo configuration:
  - In GitHub: Settings → Pages → Source → select `Deploy from a branch`
  - Branch: your default branch (e.g., `main`), Folder: `/docs`
  - Save; GitHub Pages URL becomes `https://<your-user>.github.io/<repo-name>/`
- Commit and push the scraped data and site:
```bash
npm run publish
# or to scrape and then push
npm run scrape && npm run postscrape
```
- Visit your Pages URL to see the table.

## UI Features
- **Controls:** search box, row count selector, clickable sort headers, and Previous/Next pagination.
- **Datasets:** one-click toggle between drinks and all items.
- **Styling:** dark green theme with improved table contrast and product link readability.
- **Cache busting:** JSON and timestamp fetches use a `?v=<timestamp>` query to avoid stale cached data.

## Scraper-Friendly Table Selectors
Rows include stable classes/attributes so browser automation or scraping scripts can target records with CSS selectors.

- **Row selector:** `.offer-row`
- **Cell selectors:** `.offer-cell`, plus per-column classes like:
  - `.offer-cell-Product`
  - `.offer-cell-Discount`
  - `.offer-cell-ActualPrice`
- **Row metadata attributes:**
  - `data-row-index`
  - `data-category`
  - `data-product`
  - `data-category-slug`
  - `data-product-slug`

Example selectors:
- `.offer-row[data-category-slug="drinks"]`
- `.offer-row[data-product-slug*="coke"]`
- `.offer-row .offer-cell-ActualPrice`

## Customizing The Scrape
- **Category:** First argument to `scrapeAndSave()` (e.g., `"winecellar"`).
- **Target file:** Second argument becomes the JSON file name under docs/.
- **Product list type:** Third argument: `"products"` or `"offers"`.
- **Pages:** Fourth argument controls how many pages to fetch.
- Adjust calls in [api_scraper.cy.js](cypress/e2e/greensscraper/api_scraper.cy.js) to change scope.
- The filter threshold (≥ 35% off) is inside `scrapeAndSave()` — change the value if needed.

## Data Format
- **Array of objects:** The JSON files hold rows rendered by the vanilla JS table.
- **Fields:**
  - Category: string
  - Product: HTML anchor linking to the Greens product page
  - Image: HTML anchor + `<img>` pointing to the Greens product image
  - NormalPrice: `€<value>`
  - Discount: `NN% off`
  - ActualPrice: `€<value>`
  - Savings: `€<value>`

## Troubleshooting
- **No items collected:**
  - The site/API or auth flow may have changed. Re-run in headed mode (`npx cypress open`) and watch the token capture.
  - Ensure `chromeWebSecurity` is disabled (set in [cypress.config.js](cypress.config.js)).
- **CORS/blocked requests:**
  - Headed mode with a real browser can help. Also ensure the intercept alias resolves before scraping.
- **Pages shows no data:**
  - Confirm GitHub Pages is enabled and the docs/ JSON files exist on the branch that Pages deploys.
  - Confirm your Pages deployment includes the updated [docs/index.htm](docs/index.htm), [docs/ajaxtable.js](docs/ajaxtable.js), and [docs/style.css](docs/style.css).

## Project Structure
- [cypress/e2e/greensscraper/api_scraper.cy.js](cypress/e2e/greensscraper/api_scraper.cy.js): Entry test; captures token and invokes scrapes
- [cypress/support/commands.js](cypress/support/commands.js): Implements `scrapeAndSave()` and helpers
- [docs/](docs): Static site + scraped data consumed by the UI
  - [docs/index.htm](docs/index.htm): Main static page and table controls
  - [docs/ajaxtable.js](docs/ajaxtable.js): Vanilla JS table rendering, sorting/filtering/pagination, dataset switch, scraper selectors
  - [docs/style.css](docs/style.css): Dark green UI theme
  - [docs/jsontable.js](docs/jsontable.js): Legacy/alternative renderer (not used by default)
  - [docs/data_drinks.json](docs/data_drinks.json), [docs/data_general.json](docs/data_general.json), [docs/lastupdate.txt](docs/lastupdate.txt): Generated content
- [cypress.config.js](cypress.config.js): Cypress configuration and logging task
- [package.json](package.json): Minimal scripts and Cypress dependency

## Notes
- Respect the target site’s Terms of Service. Avoid unnecessary frequency; consider scheduling runs responsibly.
- This repository does not include CI; you can add a scheduled GitHub Actions workflow to run `npm run scrape` and push changes on a cadence.
