const { defineConfig } = require("cypress");


module.exports = defineConfig({
  chromeWebSecurity: false,
  video: true,
  pageLoadTimeout: 240000,
  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});
