module.exports = {
    verbose: true,
    preset: 'jest-playwright-preset',
    reporters: [
        "default",
          [
            "jest-html-reporters", {
              "publicPath": "./reports/",
              "filename": "reports.html",
              "expand": true
            }
          ]
    ]
    // "coverageReporters": ["text-summary", "html"]
    //prest: 'jest-playwright-jsdom'
}