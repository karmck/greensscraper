// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })

Cypress.Commands.add('scrapeAndSave', (category, fileName, productListType, maxPages) => {

  const items = [];
  const pageSize = 100;
  const authHeader = Cypress.env('bearerToken');

  function scrapePage(page = 1) {

    if (page > maxPages) {
      cy.task('log', 'Reached max page limit.');
      return;
    }

    const options = {
      method: 'GET',
      url:
        `https://www.greens.com.mt/apiservices/retail/sync/productlist` +
        `?Agent=GREENS&Loc=SM&Eid=N/A&SearchCriteria=&page=${page}` +
        `&NumberOfRecords=${pageSize}&SortType=Price&SortDirection=Asc` +
        `&Category=${category}&Category2=&Category3=&Type=&Cid=&Cart=` +
        `&SubType=&Brand=&ProductListType=${productListType}` +
        `&Mobdev=False&Detailed=True`,
      headers: {
        Authorization: 'Bearer ' + authHeader,
      }
    };

    cy.request(options).then((response) => {

      expect(response.status).to.equal(200);

      const json = response.body;
      const productList = json.ProductList || [];

      if (!json.result || productList.length === 0) {
        cy.task('log', `Stopping at page ${page} (no more products).`);
        return;
      }

      productList.forEach((product) => {

        if (product.OfferType !== "Super Price") return;

        let normalPrice = product.ProductDetails.SALES_PRICE_RRP;
        let offerText = product.OfferText;

        let discountMatch = offerText?.match(/€ \d+(\.\d{1,2})?/);
        let discount = discountMatch
          ? discountMatch[0].split("€ ")[1]
          : 0;

        let percentageDiscount =
          (100 - ((normalPrice - discount) / normalPrice) * 100).toFixed(2);

        if (percentageDiscount < 35) return;

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
      });

      cy.task('log', `${items.length} items collected after page ${page}`);

      cy.writeFile(`docs/${fileName}.json`, JSON.stringify(items));
      cy.writeFile('docs/lastupdate.txt', new Date().toLocaleString('en-GB'));

      if (productList.length < pageSize) {
        cy.task('log', `Last page detected at page ${page}.`);
        return;
      }

      scrapePage(page + 1);
    });
  }

  scrapePage(1);
});

Cypress.Commands.add('forceVisit', url => {
  cy.window().then(win => {
    return win.open(url, '_self');
  });
});

Cypress.Commands.add('isElementVisible', (element) => {
  cy.get('body').then($body => {
    if ($body.find(element).length) {
      return true
    } else {
      return false
    }
  })
})

Cypress.Commands.overwrite('log', (subject, message) => cy.task('log', message));
