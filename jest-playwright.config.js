// https://github.com/playwright-community/jest-playwright/#configuration
// https://github.com/playwright-community/jest-playwright/issues/567

module.exports = {
    setTimeout: 10*1000,
    browsers: [
        {
            name: 'chromium',
            displayName: 'Chrome',
            launchOptions: {
                headless: false,
                // executablePath:
                    // process.env.CHROME_EXEC_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
            }
        }
        // {
        //     name: 'firefox',
        //     displayName: 'firefox',
        //     launchOptions: {
        //         headless: true,
        //         // executablePath:
        //             // process.env.CHROME_EXEC_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        //     },
        // },
        // {
        //     name: 'webkit',
        //     displayName: 'Safari',
        //     launchOptions: {
        //         headless: true,
        //         // executablePath:
        //             // process.env.WEBKIT_EXEC_PATH || '/Applications/Safari.app/Contents/MacOS/Safari',
        //     },
        // }
    ],
    exitOnPageError: false, // GitHub currently throws errors
}
