const { defineConfig } = require("cypress");

module.exports = defineConfig({
  chromeWebSecurity: false,
  video: false,
  pageLoadTimeout: 240000,
  defaultCommandTimeout: 10000,
  e2e: {
    setupNodeEvents(on, config) {

      on('task', {
        log(message) {
          console.log(message)
      
          return null
        },
      })

      
    },
  },
});
