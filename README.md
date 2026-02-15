# Greens Super Saver Scraper

A tiny Cypress-powered scraper that collects “Super Price” offers from greens.com.mt, saves the results as JSON under the docs/ folder, and serves them via a simple DataTables-powered page published on GitHub Pages.

## Overview
- **Scraper:** Cypress test in [cypress/e2e/greensscraper/api_scraper.cy.js](cypress/e2e/greensscraper/api_scraper.cy.js)
- **Custom command:** `scrapeAndSave()` in [cypress/support/commands.js](cypress/support/commands.js)
- **Outputs:** JSON files and timestamp in [docs/](docs) consumed by the web UI
- **Web UI:** DataTables-based page in [docs/index.htm](docs/index.htm) that fetches JSON from GitHub Pages
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
  - [docs/index.htm](docs/index.htm) + [docs/ajaxtable.js](docs/ajaxtable.js) load JSON and show it in a responsive DataTable with quick switches (Drinks | All Items).
  - The UI also displays the last update time from [docs/lastupdate.txt](docs/lastupdate.txt).

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

## Important: Pages Base URL
- The UI fetches JSON via an absolute GitHub Pages URL in [docs/ajaxtable.js](docs/ajaxtable.js) and [docs/jsontable.js](docs/jsontable.js):
  - Currently set to `https://karmck.github.io/greensscraper/`
- If your GitHub username or repo name differ, update that base URL to your own Pages URL, or switch to relative paths for portability. Example (relative):
```diff
- url: 'https://karmck.github.io/greensscraper/' + file,
+ url: './' + file,
```
- Do the same for `readLastUpdatedTextFile()` and any other absolute fetches.

## Customizing The Scrape
- **Category:** First argument to `scrapeAndSave()` (e.g., `"winecellar"`).
- **Target file:** Second argument becomes the JSON file name under docs/.
- **Product list type:** Third argument: `"products"` or `"offers"`.
- **Pages:** Fourth argument controls how many pages to fetch.
- Adjust calls in [api_scraper.cy.js](cypress/e2e/greensscraper/api_scraper.cy.js) to change scope.
- The filter threshold (≥ 35% off) is inside `scrapeAndSave()` — change the value if needed.

## Data Format
- **Array of objects:** The JSON files hold rows expected by DataTables.
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
  - Ensure the absolute base URL in [docs/ajaxtable.js](docs/ajaxtable.js) matches your Pages site, or use relative paths.

## Project Structure
- [cypress/e2e/greensscraper/api_scraper.cy.js](cypress/e2e/greensscraper/api_scraper.cy.js): Entry test; captures token and invokes scrapes
- [cypress/support/commands.js](cypress/support/commands.js): Implements `scrapeAndSave()` and helpers
- [docs/](docs): Static site + scraped data consumed by the UI
  - [docs/index.htm](docs/index.htm): DataTables UI
  - [docs/ajaxtable.js](docs/ajaxtable.js): Fetch + DataTables wiring
  - [docs/jsontable.js](docs/jsontable.js): Alternative JSON-to-table renderer (not used by default)
  - [docs/data_drinks.json](docs/data_drinks.json), [docs/data_general.json](docs/data_general.json), [docs/lastupdate.txt](docs/lastupdate.txt): Generated content
- [cypress.config.js](cypress.config.js): Cypress configuration and logging task
- [package.json](package.json): Minimal scripts and Cypress dependency

## Notes
- Respect the target site’s Terms of Service. Avoid unnecessary frequency; consider scheduling runs responsibly.
- This repository does not include CI; you can add a scheduled GitHub Actions workflow to run `npm run scrape` and push changes on a cadence.
