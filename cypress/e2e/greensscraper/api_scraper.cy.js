describe('Scrape Super Saver items via API', () => {

  it('gets the token', () => {

    cy.visit('https://www.greens.com.mt');
    cy.get(".country").contains("Malta").click({ force: true });
    cy.intercept('**/retail/**').as('products');

    cy.visit('https://www.greens.com.mt/products?cat=winecellar')
      .wait('@products', { timeout: 20000 })
      .then((xhr) => {

        let authHeader = JSON.stringify(xhr.request.headers.authorization).split(" ")[1].split('"')[0];

        Cypress.env('bearerToken', authHeader)

      });

  })

  it('scrapes super saver drinks', () => {

    cy.scrapeAndSave("winecellar", "data_drinks", "products", 2);


  })

  it('scrapes super saver general items', () => {

    cy.scrapeAndSave("", "data_general", "offers", 2);


  })
});