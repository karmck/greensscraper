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

Cypress.Commands.add('scrapeAndSave', (category, fileName, productListType, numOfPages) => {

  let items = [];
  let pagesToScrape = numOfPages;
  let result = true;

  for (let page = 1; (page <= pagesToScrape && result == true); page++) {

    let authHeader = Cypress.env('bearerToken')


    const options = {
      method: 'GET',
      url: `https://www.greens.com.mt/apiservices/retail/sync/productlist?Agent=GREENS&Loc=SM&Eid=N/A&SearchCriteria=&page=` + (page) + `&NumberOfRecords=100&SortType=Price&SortDirection=Asc&Category=` + category + `&Category2=&Category3=&Type=&Cid=&Cart=&SubType=&Brand=&ProductListType=` + productListType + `&Mobdev=False&Detailed=True`,
      headers: {
        'Authorization': 'Bearer ' + authHeader,
      }
    };

    cy.request(options)
      .then((response) => {


        expect(response.status).to.equal(200);
        let json = response.body;


        var productCount = Object.keys(json.ProductList).length;
        result = response.body.result;


        for (let i = 0; i < productCount; i++) {


          if (json.ProductList[i].OfferType == "Super Saver") {

            let percentageDiscount, savings, actualPrice, discount, discountString = 0;
            let category = json.ProductList[i].ProductDetails.GROUP_3;
            let title = json.ProductList[i].ProductDetails.PART_DESCRIPTION;
            let normalPrice = json.ProductList[i].ProductDetails.SALES_PRICE_RRP;
            let offerText = json.ProductList[i].OfferText;
            let link = "http://www.greens.com.mt/" + "productdetails?pid=" + json.ProductList[i].ProductDetails.PART_NUMBER;
            title = "<a href='" + link + "' target='_blank'>" + title + "</a>";
            let imgFolder = json.ProductList[i].Image.match(/products\/([0-9]*)?/)[0].split("/")[1];
            let imgURL = "https://www.greens.com.mt/media/products/" + imgFolder + "/" + json.ProductList[i].ProductDetails.PART_NUMBER + ".jpg";
            let img = "<a href='" + link + "' target='_blank'><img class='product-image-img' src='" + imgURL + "' loading='lazy'/></a>"

            if (imgFolder == "") img = "<a href='" + link + "' target='_blank'><img class='product-image-img' src='https://www.greens.com.mt/media/products/noimages.jpg' loading='lazy'/></a>"


            //calculate percentage discount off

            //if the offerText regex match is null, set discountString to 0
            discountString = offerText.match(/\€ \d+(\.\d{1,2})?/gm) != null ? offerText.match(/\€ \d+(\.\d{1,2})?/gm)[0] : 0;

            //if discountString is 0, set discount to 0
            discount = discountString !=0 ? discountString.split("€ ")[1] : 0;

            percentageDiscount = (100 - ((normalPrice - discount) / normalPrice) * 100).toFixed(2);

            //calculate actual price
            actualPrice = (normalPrice - discount).toFixed(2);

            //calculate savings
            savings = (normalPrice - actualPrice).toFixed(2);




            if (percentageDiscount >= 15) {
              //push to items object
              items.push({
                Category: category,
                Product: title,
                Image: img,
                NormalPrice: "€" + normalPrice,
                Discount: Math.round(percentageDiscount) + "% off",
                ActualPrice: "€" + actualPrice,
                Savings: "€" + savings,
              })
            }

          }
        }

      })
      .then(() => {

        cy.task('log', items.length + " items collected in total after page " + page);
        cy.task('log', "Writing " + items.length + " items to file after page " + page);
        cy.writeFile('docs/' + fileName + '.json', JSON.stringify(items));
        cy.writeFile('docs/lastupdate.txt', new Date().toLocaleString('en-GB'));

      });

  }


})

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

