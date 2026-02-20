const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const DOCS_DIR = path.join(__dirname, 'docs');

async function scrapeAndSave(category, fileName, productListType, maxPages, bearerToken) {
  const items = [];
  const pageSize = 100;

  async function scrapePage(page = 1) {
    if (page > maxPages) {
      console.log(`Reached max page limit: ${maxPages}`);
      return;
    }

    const url = `https://www.greens.com.mt/apiservices/retail/sync/productlist` +
      `?Agent=GREENS&Loc=SM&Eid=N/A&SearchCriteria=&page=${page}` +
      `&NumberOfRecords=${pageSize}&SortType=Price&SortDirection=Asc` +
      `&Category=${category}&Category2=&Category3=&Type=&Cid=&Cart=` +
      `&SubType=&Brand=&ProductListType=${productListType}` +
      `&Mobdev=False&Detailed=True`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${bearerToken}`,
      },
    });

    if (!response.ok) {
      console.error(`HTTP error! status: ${response.status}`);
      return;
    }

    const json = await response.json();
    const productList = json.ProductList || [];

    if (!json.result || productList.length === 0) {
      console.log(`Stopping at page ${page} (no more products).`);
      return;
    }

    for (const product of productList) {
      if (product.OfferType !== "Super Price") continue;

      let normalPrice = product.ProductDetails.SALES_PRICE_RRP;
      let offerText = product.OfferText;

      let discountMatch = offerText?.match(/€ \d+(\.\d{1,2})?/);
      let discount = discountMatch
        ? discountMatch[0].split("€ ")[1]
        : 0;

      let percentageDiscount =
        (100 - ((normalPrice - discount) / normalPrice) * 100).toFixed(2);

      if (percentageDiscount < 35) continue;

      let actualPrice = (normalPrice - discount).toFixed(2);
      let savings = (normalPrice - actualPrice).toFixed(2);

      let link =
        "http://www.greens.com.mt/productdetails?pid=" +
        product.ProductDetails.PART_NUMBER;

      let imgFolder =
        product.Image?.match(/products\/([0-9]*)?/)?.[0]?.split("/")[1] || "";

      let imgURL =
        imgFolder
          ? `https://www.greens.com.mt/media/products/${imgFolder}/${product.ProductDetails.PART_NUMBER}.jpg`
          : "https://www.greens.com.mt/media/products/noimages.jpg";

      items.push({
        Category: product.ProductDetails.GROUP_3,
        Product: `<a href='${link}' target='_blank'>${product.ProductDetails.PART_DESCRIPTION}</a>`,
        Image: `<a href='${link}' target='_blank'><img class='product-image-img' src='${imgURL}' loading='lazy'/></a>`,
        NormalPrice: "€" + normalPrice,
        Discount: Math.round(percentageDiscount) + "% off",
        ActualPrice: "€" + actualPrice,
        Savings: "€" + savings,
      });
    }

    console.log(`${items.length} items collected after page ${page}`);

    fs.writeFileSync(
      path.join(DOCS_DIR, `${fileName}.json`),
      JSON.stringify(items)
    );

    if (productList.length < pageSize) {
      console.log(`Last page detected at page ${page}.`);
      return;
    }

    await scrapePage(page + 1);
  }

  await scrapePage(1);
}

async function getBearerToken() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  let bearerToken = null;

  await page.route('**/retail/**', (route) => {
    const request = route.request();
    const authHeader = request.headers()['authorization'];
    if (!bearerToken && authHeader && authHeader.startsWith('Bearer ')) {
      bearerToken = authHeader.replace('Bearer ', '');
      console.log(`Captured Bearer token: ${bearerToken.substring(0, 20)}...`);
    }
    route.continue();
  });

  try {
    await page.goto('https://www.greens.com.mt', { waitUntil: 'networkidle' });
    await page.goto('https://www.greens.com.mt/products?cat=winecellar', { waitUntil: 'networkidle', timeout: 30000 });

    await page.waitForTimeout(3000);

    if (!bearerToken) {
      const response = await page.waitForResponse(
        response => response.url().includes('/retail/') && response.request().headers()['authorization'],
        { timeout: 20000 }
      ).catch(() => null);
      
      if (response) {
        bearerToken = response.request().headers()['authorization'].replace('Bearer ', '');
      }
    }
  } catch (e) {
    console.error('Error getting token:', e.message);
  }

  await browser.close();
  return bearerToken;
}

async function main() {
  if (!fs.existsSync(DOCS_DIR)) {
    fs.mkdirSync(DOCS_DIR, { recursive: true });
  }

  console.log('Getting Bearer token...');
  const bearerToken = await getBearerToken();

  if (!bearerToken) {
    console.error('Failed to obtain Bearer token');
    process.exit(1);
  }

  console.log('Token obtained successfully');

  console.log('\nScraping drinks (winecellar category)...');
  await scrapeAndSave('winecellar', 'data_drinks', 'products', 50, bearerToken);

  console.log('\nScraping general offers...');
  await scrapeAndSave('', 'data_general', 'offers', 150, bearerToken);

  const timestamp = new Date().toLocaleString('en-GB');
  fs.writeFileSync(path.join(DOCS_DIR, 'lastupdate.txt'), timestamp);

  console.log('\nScraping complete!');
  console.log(`- docs/data_drinks.json`);
  console.log(`- docs/data_general.json`);
  console.log(`- docs/lastupdate.txt (${timestamp})`);
}

main().catch(console.error);
