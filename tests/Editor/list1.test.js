
var config = require('../../configFiles/Editor/list.json');
var dotenv = require('dotenv');
var commonData = require('../../commonfunctionality');
dotenv.config();
var fs = require('fs')
let chai = require('chai');
let chaiHttp = require('chai-http');
chai.use(chaiHttp);
var path = require('path');
const { dirname } = require('path');
var testName = 'editor_test';
var saveObject = {};
var saveObjectArr = [];
// Needs to be higher than the default Playwright timeout
jest.setTimeout(100 * 1000)

beforeAll(async () => {
    var data = config.editor_test.articletotest
    for (var xmlFile = 0; xmlFile < data.length; xmlFile++) {
        var filePath = path.resolve("./tests/xmls/" + config[testName]["articletotest"][xmlFile]["doi"] + ".xml");
        console.log(filePath)
        if (fs.existsSync(filePath)) {
            var responseData = await commonData.resetData(config, xmlFile, testName, filePath)
            await expect(responseData.status).toEqual(200);
        }
        else {
            console.log(filePath + " No scuch file in the directory,Please check the xmlFile.");
        }
    }

    try {
        //log in credentials from .env file
        const pageURL = process.env.siteName + config.baseurl;
        await page.goto(pageURL);
        await page.type('#username', process.env.kusername);
        await page.type('#password', process.env.password);

        await page.click('.input-field.login');
        // either we get the confirmation panel to confirm or we get to see the new dashboard with customer cards
        // wait till we get to see one of these
        await page.waitForSelector('//span[text() = "BMJ"]|//div[@class="col s6 confirmationPanel"]', { state: 'visible' });
        // if the page url is not the same, then we are waiting for confirmation
        if (pageURL != page.url()) {
            await page.click('.confirm');
        }
        // wait for the customer cards to load, i.e., "".card"
        await page.waitForSelector('#customerSelectionDiv .customerTitle .customerTitleDiv', { state: 'visible' });
        const newPage = process.env.siteName + config.editor_test.doiurl_editor_list;
        await page.goto(newPage);
        await page.waitForLoadState();
    }
    catch (error) {
        console.log(error)
    }
})

describe('Editor', () => {
    describe('Editor - Lists', () => {
        it('LST002 : Check if there are two list icon present', async () => {
            await page.waitForSelector('[data-tooltip="Bullet List"]', { state: 'visible' });
            await page.waitForSelector('[data-tooltip="Numbered List"]', { state: 'visible' });
        })

        it('LST003 : Check if all the bullet list types are listed ', async () => {
            await page.waitForSelector('[data-tooltip="Bullet List"]', { state: 'visible' });
            await page.click('[data-tooltip="Bullet List"]');
            await page.waitForSelector('#unorder-list-dropdown', { state: 'visible' });
            const defaultList = (await page.$$('#unorder-list-dropdown li'))[0];
            await defaultList.isVisible();
            const circleList = (await page.$$('#unorder-list-dropdown li'))[1];
            await circleList.isVisible();
            const discList = (await page.$$('#unorder-list-dropdown li'))[2];
            await discList.isVisible();
            const squareList = (await page.$$('#unorder-list-dropdown li'))[3];
            await squareList.isVisible();
            const checkboxList = (await page.$$('#unorder-list-dropdown li'))[4];
            await checkboxList.isVisible();
            const endashList = (await page.$$('#unorder-list-dropdown li'))[5];
            await endashList.isVisible();
            const noneList = (await page.$$('#unorder-list-dropdown li'))[6];
            await noneList.isVisible();
        })

        it('LST004 : Check if the user can change the list as default list', async () => {
            await page.waitForSelector('.jrnlSecPara', { state: 'visible' });
            await page.click('.jrnlSecPara');
            await page.waitForSelector('[data-tooltip="Bullet List"]', { state: 'visible' });
            await page.click('[data-tooltip="Bullet List"]');
            await page.waitForSelector('#unorder-list-dropdown', { state: 'visible' });
            const defaultList = (await page.$$('#unorder-list-dropdown li'))[0];
            await defaultList.isVisible();
            await defaultList.click();
            await page.waitForSelector('ul[type="disc"] p.jrnlListPara', { state: 'visible' });
            await page.waitForSelector('.save-notice', { state: 'visible' });
            await page.waitForSelector('.save-notice:text("Saving...")', { state: 'hidden' });
            var saveNotice = await page.$eval('.save-notice', el => el.innerText);
            await expect(saveNotice).toContain('All changes saved at');
        })

        it('LST005 : Check if the user can change the list as circle list', async () => {
            await page.waitForSelector('.jrnlSecPara', { state: 'visible' });
            await page.click('.jrnlSecPara');
            await page.waitForSelector('[data-tooltip="Bullet List"]', { state: 'visible' });
            await page.click('[data-tooltip="Bullet List"]');
            await page.waitForSelector('#unorder-list-dropdown', { state: 'visible' });
            const circleList = (await page.$$('#unorder-list-dropdown li'))[1];
            await circleList.isVisible();
            await circleList.click();
            await page.waitForSelector('ul[type="circle"] p.jrnlListPara', { state: 'visible' });
            await page.waitForSelector('.save-notice', { state: 'visible' });
            await page.waitForSelector('.save-notice:text("Saving...")', { state: 'hidden' });
            var saveNotice = await page.$eval('.save-notice', el => el.innerText);
            await expect(saveNotice).toContain('All changes saved at');
        })

        it('LST006 : Check if the user can change the list as disc list ', async () => {
            await page.waitForSelector('.jrnlSecPara', { state: 'visible' });
            await page.click('.jrnlSecPara');
            await page.waitForSelector('[data-tooltip="Bullet List"]', { state: 'visible' });
            await page.click('[data-tooltip="Bullet List"]');
            await page.waitForSelector('#unorder-list-dropdown', { state: 'visible' });
            const discList = (await page.$$('#unorder-list-dropdown li'))[2];
            await discList.isVisible();
            await discList.click();
            await page.waitForSelector('ul[type="disc"] p.jrnlListPara', { state: 'visible' });
            await page.waitForSelector('.save-notice', { state: 'visible' });
            await page.waitForSelector('.save-notice:text("Saving...")', { state: 'hidden' });
            var saveNotice = await page.$eval('.save-notice', el => el.innerText);
            await expect(saveNotice).toContain('All changes saved at');
        })

        it('LST007 : Check if the user can change the list as square list ', async () => {
            await page.waitForSelector('.jrnlSecPara', { state: 'visible' });
            await page.click('.jrnlSecPara');
            await page.waitForSelector('[data-tooltip="Bullet List"]', { state: 'visible' });
            await page.click('[data-tooltip="Bullet List"]');
            await page.waitForSelector('#unorder-list-dropdown', { state: 'visible' });
            const squareList = (await page.$$('#unorder-list-dropdown li'))[3];
            await squareList.isVisible();
            await squareList.click();
            await page.waitForSelector('ul[type="square"] p.jrnlListPara', { state: 'visible' });
            await page.waitForSelector('.save-notice', { state: 'visible' });
            await page.waitForSelector('.save-notice:text("Saving...")', { state: 'hidden' });
            var saveNotice = await page.$eval('.save-notice', el => el.innerText);
            await expect(saveNotice).toContain('All changes saved at');
        })

        it('LST008 : Check if the user can change the list as checkbox list ', async () => {
            await page.waitForSelector('.jrnlSecPara', { state: 'visible' });
            await page.click('.jrnlSecPara');
            await page.waitForSelector('[data-tooltip="Bullet List"]', { state: 'visible' });
            await page.click('[data-tooltip="Bullet List"]');
            await page.waitForSelector('#unorder-list-dropdown', { state: 'visible' });
            const checkboxList = (await page.$$('#unorder-list-dropdown li'))[4];
            await checkboxList.isVisible();
            await checkboxList.click();
            await page.waitForSelector('ul[type="check-box"] p.jrnlListPara', { state: 'visible' });
            await page.waitForSelector('.save-notice', { state: 'visible' });
            await page.waitForSelector('.save-notice:text("Saving...")', { state: 'hidden' });
            var saveNotice = await page.$eval('.save-notice', el => el.innerText);
            await expect(saveNotice).toContain('All changes saved at');
        })
    })
})
