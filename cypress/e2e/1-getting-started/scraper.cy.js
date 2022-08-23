describe('Collecting Data', () => {
  // before(() => {
  //   cy.visit('https://www.greens.com.mt');
  // });

  //items object
  let items = [];


  it('parses xhr response on every page', () => {

    Cypress.on('uncaught:exception', (err, runnable) => {
      return false;
    });

    cy.visit('https://www.greens.com.mt/products?cat=winecellar');

    cy.get(".country").contains("Malta").click({ force: true });

    cy.intercept('**/retail/**').as('products');

    cy.visit('https://www.greens.com.mt/products?cat=winecellar');

    //sort by price
    cy.get('.simple-drop-down select').select('Price', { force: true });

    for (let page = 0; page < 65; page++) {


          if (cy.isElementVisible('.square-button .fa-angle-right')) {

            // next button was found
            console.log("Next button was found");

            cy.get('.product-image').first().should('be.visible');

            cy.wait("@products").then(xhr => {
              expect(xhr.response.statusCode).to.eq(200);

              let json = xhr.response.body;

              for (let i = 0; i < 36; i++) {

                let offerType = json.ProductList[i].OfferType;

                if (offerType == "Super Saver") {

                  let category = json.ProductList[i].ProductDetails.GROUP_3;
                  let title = json.ProductList[i].ProductDetails.PART_DESCRIPTION;
                  let normalPrice = json.ProductList[i].ProductDetails.SALES_PRICE_RRP;
                  let offerText = json.ProductList[i].OfferText;
                  let link = "http://www.greens.com.mt/" + "productdetails?pid=" + json.ProductList[i].ProductDetails.PART_NUMBER;

                  //calculate percentage discount off
                  let discountString = offerText.match(/\€ \d+(\.\d{1,2})?/gm)[0];
                  let discount = discountString.split("€ ")[1];
                  let percentageDiscount = (100 - ((normalPrice - discount) / normalPrice) * 100).toFixed(2);

                  //calculate actual price
                  let actualPrice = (normalPrice - discount).toFixed(2);

                  //calculate savings
                  let savings = (normalPrice - actualPrice).toFixed(2);

                  //push to items object
                  items.push({
                    Category: category,
                    Title: title,
                    NormalPrice: normalPrice,
                    DiscountPercent: percentageDiscount,
                    ActualPrice: actualPrice,
                    Savings: savings,
                    Link: link,
                  })


                  console.log(JSON.stringify(items));

                }

              }
              //write json to disk    
              cy.writeFile('cypress/downloads/data.json', JSON.stringify(items));

            });

            cy.get('.square-button .fa-angle-right').first().should('be.visible');
            cy.get(".square-button .fa-angle-right").first().click({ force: true });

          }

      

    }

    cy.forceVisit("https://www.convertjson.com/json-to-html-table.htm")


    cy
      .readFile('cypress/downloads/data.json')
      .then((str) => {

        //paste json into textarea
        cy.get("#txt1").invoke('val', JSON.stringify(str))
        //click generate
        cy.get("input#btnRun.btn.btn-primary").click()
        cy.wait(1000);
        //sort by discount asscending then descending
        cy.get('[aria-label="DiscountPercent: activate to sort column ascending"]').click()
        cy.wait(1000);
        cy.get('[aria-label="DiscountPercent: activate to sort column descending"]').click()
        cy.wait(1000);
        //sort by category
        cy.get('[aria-label="Category: activate to sort column ascending"]').click()
        //click the pdf download button
        cy.get(".buttons-pdf").click()

      })



  }



  )
});