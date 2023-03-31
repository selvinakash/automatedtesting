
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

        it('LST009 : Check if the user can change the list as En dash list ', async () => {
            await page.waitForSelector('.jrnlSecPara', { state: 'visible' });
            await page.click('.jrnlSecPara');
            await page.waitForSelector('[data-tooltip="Bullet List"]', { state: 'visible' });
            await page.click('[data-tooltip="Bullet List"]');
            await page.waitForSelector('#unorder-list-dropdown', { state: 'visible' });
            const endashList = (await page.$$('#unorder-list-dropdown li'))[5];
            await endashList.isVisible();
            await endashList.click();
            await page.waitForSelector('ul[type="endash"] p.jrnlListPara', { state: 'visible' });
            await page.waitForSelector('.save-notice', { state: 'visible' });
            await page.waitForSelector('.save-notice:text("Saving...")', { state: 'hidden' });
            var saveNotice = await page.$eval('.save-notice', el => el.innerText);
            await expect(saveNotice).toContain('All changes saved at');
        })

        it('LST010 : Check if the user can change the list as none', async () => {
            await page.waitForSelector('[type="circle"]', { state: 'visible' });
            await page.click('[type="circle"]');
            const unClick = await page.waitForSelector('#unorder-list-dropdown', { state: 'hidden' });
            await page.waitForSelector('[data-tooltip="Bullet List"]', { state: 'visible' });
            await page.click('[data-tooltip="Bullet List"]');
            if (unClick == null) {
                await page.click('[data-tooltip="Bullet List"]');
            }
            await page.waitForSelector('#unorder-list-dropdown', { state: 'visible' });
            const noneList = (await page.$$('#unorder-list-dropdown li'))[6];
            await noneList.isVisible();
            await noneList.click();
            await page.waitForSelector('ul[type="circle"] p.jrnlListPara', { state: 'hidden' });
            await page.waitForSelector('ul[type="none"] p.jrnlListPara', { state: 'visible' });
            await page.waitForSelector('.save-notice', { state: 'visible' });
            await page.waitForSelector('.save-notice:text("Saving...")', { state: 'hidden' });
            var saveNotice = await page.$eval('.save-notice', el => el.innerText);
            await expect(saveNotice).toContain('All changes saved at');
        })

        it('LST011 : Check if all the numbered list types are listed ', async () => {
            await page.waitForSelector('[data-tooltip="Numbered List"]', { state: 'visible' });
            await page.click('[data-tooltip="Numbered List"]');
            await page.waitForSelector('#order-list-dropdown', { state: 'visible' });
            const defaultList1 = (await page.$$('#order-list-dropdown li'))[0];
            await defaultList1.isVisible();
            const loweralphaList = (await page.$$('#order-list-dropdown li'))[1];
            await loweralphaList.isVisible();
            const lowergreekList = (await page.$$('#order-list-dropdown li'))[2];
            await lowergreekList.isVisible();
            const lowerromanList = (await page.$$('#order-list-dropdown li'))[3];
            await lowerromanList.isVisible();
            const upperalphaList = (await page.$$('#order-list-dropdown li'))[4];
            await upperalphaList.isVisible();
            const upperromanList = (await page.$$('#order-list-dropdown li'))[5];
            await upperromanList.isVisible();
            const noneList1 = (await page.$$('#order-list-dropdown li'))[6];
            await noneList1.isVisible();
        })

        it('LST012 : Check if the user can change the list as default numbered list', async () => {
            await page.waitForSelector('.jrnlSecPara', { state: 'visible' });
            await page.click('.jrnlSecPara');
            await page.waitForSelector('[data-tooltip="Numbered List"]', { state: 'visible' });
            await page.click('[data-tooltip="Numbered List"]');
            await page.waitForSelector('#order-list-dropdown', { state: 'visible' });
            const defaultList1 = (await page.$$('#order-list-dropdown li'))[0];
            await defaultList1.isVisible();
            await defaultList1.click();
            await page.waitForSelector('ol[type="decimal"] p.jrnlListPara', { state: 'visible' });
            await page.waitForSelector('.save-notice', { state: 'visible' });
            await page.waitForSelector('.save-notice:text("Saving...")', { state: 'hidden' });
            var saveNotice = await page.$eval('.save-notice', el => el.innerText);
            await expect(saveNotice).toContain('All changes saved at');
        })

        it('LST013 : Check if the user can change the list as lower alpha list', async () => {
            await page.waitForSelector('.jrnlSecPara', { state: 'visible' });
            await page.click('.jrnlSecPara');
            await page.waitForSelector('[data-tooltip="Numbered List"]', { state: 'visible' });
            await page.click('[data-tooltip="Numbered List"]');
            await page.waitForSelector('#order-list-dropdown', { state: 'visible' });
            const loweralphaList = (await page.$$('#order-list-dropdown li'))[1];
            await loweralphaList.isVisible();
            await loweralphaList.click();
            await page.waitForSelector('ol[type="lower-alpha"] p.jrnlListPara', { state: 'visible' });
            await page.waitForSelector('.save-notice', { state: 'visible' });
            await page.waitForSelector('.save-notice:text("Saving...")', { state: 'hidden' });
            var saveNotice = await page.$eval('.save-notice', el => el.innerText);
            await expect(saveNotice).toContain('All changes saved at');
        })

        it('LST014 : Check if the user can change the list as lower greek list ', async () => {
            await page.waitForSelector('.jrnlSecPara', { state: 'visible' });
            await page.click('.jrnlSecPara');
            await page.waitForSelector('[data-tooltip="Numbered List"]', { state: 'visible' });
            await page.click('[data-tooltip="Numbered List"]');
            await page.waitForSelector('#order-list-dropdown', { state: 'visible' });
            const lowergreekList = (await page.$$('#order-list-dropdown li'))[2];
            await lowergreekList.isVisible();
            await lowergreekList.click();
            await page.waitForSelector('ol[type="lower-greek"] p.jrnlListPara', { state: 'visible' });
            await page.waitForSelector('.save-notice', { state: 'visible' });
            await page.waitForSelector('.save-notice:text("Saving...")', { state: 'hidden' });
            var saveNotice = await page.$eval('.save-notice', el => el.innerText);
            await expect(saveNotice).toContain('All changes saved at');
        })

        it('LST015 : Check if the user can change the list as lower roman list ', async () => {
            await page.waitForSelector('.jrnlSecPara', { state: 'visible' });
            await page.click('.jrnlSecPara');
            await page.waitForSelector('[data-tooltip="Numbered List"]', { state: 'visible' });
            await page.click('[data-tooltip="Numbered List"]');
            await page.waitForSelector('#order-list-dropdown', { state: 'visible' });
            const lowerromanList = (await page.$$('#order-list-dropdown li'))[3];
            await lowerromanList.isVisible();
            await lowerromanList.click();
            await page.waitForSelector('ol[type="lower-roman"] p.jrnlListPara', { state: 'visible' });
            await page.waitForSelector('.save-notice', { state: 'visible' });
            await page.waitForSelector('.save-notice:text("Saving...")', { state: 'hidden' });
            var saveNotice = await page.$eval('.save-notice', el => el.innerText);
            await expect(saveNotice).toContain('All changes saved at');
        })

        it('LST016 : Check if the user can change the list as upper alpha list ', async () => {
            await page.waitForSelector('.jrnlSecPara', { state: 'visible' });
            await page.click('.jrnlSecPara');
            await page.waitForSelector('[data-tooltip="Numbered List"]', { state: 'visible' });
            await page.click('[data-tooltip="Numbered List"]');
            await page.waitForSelector('#order-list-dropdown', { state: 'visible' });
            const upperalphaList = (await page.$$('#order-list-dropdown li'))[4];
            await upperalphaList.isVisible();
            await upperalphaList.click();
            await page.waitForSelector('ol[type="upper-alpha"] p.jrnlListPara', { state: 'visible' });
            await page.waitForSelector('.save-notice', { state: 'visible' });
            await page.waitForSelector('.save-notice:text("Saving...")', { state: 'hidden' });
            var saveNotice = await page.$eval('.save-notice', el => el.innerText);
            await expect(saveNotice).toContain('All changes saved at');
        })

        it('LST017 : Check if the user can change the list as upper roman list ', async () => {
            await page.waitForSelector('.jrnlSecPara', { state: 'visible' });
            await page.click('.jrnlSecPara');
            await page.waitForSelector('[data-tooltip="Numbered List"]', { state: 'visible' });
            await page.click('[data-tooltip="Numbered List"]');
            await page.waitForSelector('#order-list-dropdown', { state: 'visible' });
            const upperromanList = (await page.$$('#order-list-dropdown li'))[5];
            await upperromanList.isVisible();
            await upperromanList.click();
            await page.waitForSelector('ol[type="upper-roman"] p.jrnlListPara', { state: 'visible' });
            await page.waitForSelector('.save-notice', { state: 'visible' });
            await page.waitForSelector('.save-notice:text("Saving...")', { state: 'hidden' });
            var saveNotice = await page.$eval('.save-notice', el => el.innerText);
            await expect(saveNotice).toContain('All changes saved at');
        })

        it('LST018 : Check if the user can change the list as none  ', async () => {
            await page.waitForSelector('[type="upper-roman"]', { state: 'visible' });
            await page.click('[type="upper-roman"]');
            const unClick = await page.waitForSelector('#order-list-dropdown', { state: 'hidden' });
            await page.waitForSelector('[data-tooltip="Numbered List"]', { state: 'visible' });
            await page.click('[data-tooltip="Numbered List"]');
            if (unClick == null) {
                await page.click('[data-tooltip="Numbered List"]');
            }
            await page.waitForSelector('#order-list-dropdown', { state: 'visible' });
            const noneList1 = (await page.$$('#order-list-dropdown li'))[6];
            await noneList1.isVisible();
            await noneList1.click();
            await page.waitForSelector('ol[type="upper-roman"] p.jrnlListPara', { state: 'hidden' });
            await page.waitForSelector('ul[type="none"] p.jrnlListPara', { state: 'visible' });
            await page.waitForSelector('.save-notice', { state: 'visible' });
            await page.waitForSelector('.save-notice:text("Saving...")', { state: 'hidden' });
            var saveNotice = await page.$eval('.save-notice', el => el.innerText);
            await expect(saveNotice).toContain('All changes saved at');
        })

        it('LST019 : Check if the user can change the list type from numbered to bullet list type ', async () => {
            await page.waitForSelector('[type="decimal"]', { state: 'visible' });
            await page.click('[type="decimal"]');
            const unClick = await page.waitForSelector('#unorder-list-dropdown', { state: 'hidden' });
            await page.waitForSelector('[data-tooltip="Bullet List"]', { state: 'visible' });
            await page.click('[data-tooltip="Bullet List"]');
            if (unClick == null) {
                await page.click('[data-tooltip="Bullet List"]');
            }
            await page.waitForSelector('#unorder-list-dropdown', { state: 'visible' });
            const circleList = (await page.$$('#unorder-list-dropdown li'))[1];
            await circleList.isVisible();
            await circleList.click();
            await page.waitForSelector('ol[type="decimal"] p.jrnlListPara', { state: 'hidden' });
            await page.waitForSelector('ul[type="circle"] p.jrnlListPara', { state: 'visible' });
            await page.waitForSelector('.save-notice', { state: 'visible' });
            await page.waitForSelector('.save-notice:text("Saving...")', { state: 'hidden' });
            var saveNotice = await page.$eval('.save-notice', el => el.innerText);
            await expect(saveNotice).toContain('All changes saved at');
        })

        it('LST020 : Check if the user can insert the list inside the box', async () => {
            await page.waitForSelector(".jrnlBoxText", { state: 'visible' });
            await page.click(".jrnlBoxText");
            await page.waitForSelector('[data-tooltip="Bullet List"]', { state: 'visible' });
            await page.click('[data-tooltip="Bullet List"]');
            await page.waitForSelector('#unorder-list-dropdown', { state: 'visible' });
            const defaultList = (await page.$$('#unorder-list-dropdown li'))[0];
            await defaultList.isVisible();
            await defaultList.click();
            await page.waitForSelector('[id="BLK_BX1"] ul[type="disc"] p.jrnlListPara', { state: 'visible' });
            await page.waitForSelector('.save-notice', { state: 'visible' });
            await page.waitForSelector('.save-notice:text("Saving...")', { state: 'hidden' });
            var saveNotice = await page.$eval('.save-notice', el => el.innerText);
            await expect(saveNotice).toContain('All changes saved at');
        })

        it('LST021 : Check if the user can insert the list inside the table', async () => {
            await page.waitForSelector('#BLK_T1', { state: 'visible' });
            var tableText = await page.$('#BLK_T1 .jrnlTable tbody td[data-row-index="1"][data-col-index="1"]');
            await tableText.click();
            await page.waitForSelector('[data-tooltip="Bullet List"]', { state: 'visible' });
            await page.click('[data-tooltip="Bullet List"]');
            await page.waitForSelector('#unorder-list-dropdown', { state: 'visible' });
            const circleList = (await page.$$('#unorder-list-dropdown li'))[1];
            await circleList.isVisible();
            await circleList.click();
            await page.waitForSelector('#BLK_T1 .jrnlTable tbody td[data-row-index="1"][data-col-index="1"] ul[type="circle"]',{state:"visible"});
            await page.waitForSelector('.save-notice', { state: 'visible' });
            await page.waitForSelector('.save-notice:text("Saving...")', { state: 'hidden' });
            var saveNotice = await page.$eval('.save-notice', el => el.innerText);
            await expect(saveNotice).toContain('All changes saved at');
        })

        it('LST022 : Check if the user can insert the list in appendix', async () => {
            await page.waitForSelector('.jrnlSecPara', { state: 'visible' });
            await page.click('.jrnlSecPara');
            await page.waitForSelector('[data-name="Insert"]', { state: 'visible' });
            await page.click('[data-name="Insert"]');
            await page.waitForSelector('[data-name="InsertAppendix"]', { state: 'visible' });
            await page.click('[data-name="InsertAppendix"]');
            await page.waitForSelector('[data-name="APPENDIX_edit"]', { state: 'visible' });
            await page.type('[data-name="APPENDIX_edit"] [data-wrapper="true"] [data-class="jrnlAppHead1"]', config.fields.typehead);
            await page.type('[data-name="APPENDIX_edit"] [data-wrapper="true"] [data-class="jrnlAppBlockPara"]', config.fields.typeContent);
            await page.waitForSelector('[data-name="APPENDIX_edit"] .com-save', { state: 'visible' });
            await page.click('[data-name="APPENDIX_edit"] .com-save');
            await page.waitForSelector('[data-name="APPENDIX_edit"]', { state: 'hidden' });
            await page.waitForSelector('[data-name="SaveNotice"]:text("Saving...")', { state: 'hidden' });
            await page.waitForSelector('[data-name="SaveNotice"]', { state: 'visible' });
            var saveNoticeEle1 = await page.$('[data-name="SaveNotice"]');
            var saveNoticeTitle1 = await saveNoticeEle1.textContent();
            expect(saveNoticeTitle1.includes('All changes saved ')).toBeTruthy();
            await page.waitForSelector('[data-id="A1"]', { state: 'visible' });
            await page.click('[data-id="A1"] p[class="jrnlAppBlockPara"]');
            await page.waitForSelector('[data-tooltip="Bullet List"]', { state: 'visible' });
            await page.click('[data-tooltip="Bullet List"]');
            await page.waitForSelector('#unorder-list-dropdown', { state: 'visible' });
            const circleList = (await page.$$('#unorder-list-dropdown li'))[1];
            await circleList.isVisible();
            await circleList.click();
            await page.waitForSelector('[data-id="A1"] ul[type="circle"]',{state:"visible"});
            await page.waitForSelector('.save-notice', { state: 'visible' });
            await page.waitForSelector('.save-notice:text("Saving...")', { state: 'hidden' });
            var saveNotice = await page.$eval('.save-notice', el => el.innerText);
            await expect(saveNotice).toContain('All changes saved at');
        })

        it('LST023 : Check if the user can insert the list in footnote', async () => {
            await page.waitForSelector('.jrnlSecPara', { state: 'visible' });
            await page.click('.jrnlSecPara');
            await page.waitForSelector('[data-name="Insert"]', { state: 'visible' });
            await page.click('[data-name="Insert"]');
            await page.waitForSelector('[data-name="InsertFoot"]', { state: 'visible' });
            await page.click('[data-name="InsertFoot"]');
            await page.waitForSelector('[data-name="FOOTNOTE_edit"]', { state: 'visible' });
            await page.type('[data-name="FOOTNOTE_edit"] [data-class="jrnlFNPara"]', config.fields.typeFootnote);
            await page.waitForSelector('[data-name="FOOTNOTE_edit"] .com-save', { state: 'visible' });
            await page.click('[data-name="FOOTNOTE_edit"] .com-save');
            await page.waitForSelector('[data-name="FOOTNOTE_edit"]', { state: 'hidden' });
            await page.waitForSelector('[data-name="SaveNotice"]:text("Saving...")', { state: 'hidden' });
            await page.waitForSelector('[data-name="SaveNotice"]', { state: 'visible' });
            var saveNoticeEle1 = await page.$('[data-name="SaveNotice"]');
            var saveNoticeTitle1 = await saveNoticeEle1.textContent();
            expect(saveNoticeTitle1.includes('All changes saved ')).toBeTruthy();
            await page.waitForSelector('[data-id="BFN1"]', { state: 'visible' });
            await page.click('[data-id="BFN1"] p[class="jrnlFNPara"]');
            await page.waitForSelector('[data-tooltip="Bullet List"]', { state: 'visible' });
            await page.click('[data-tooltip="Bullet List"]');
            await page.waitForSelector('#unorder-list-dropdown', { state: 'visible' });
            const circleList = (await page.$$('#unorder-list-dropdown li'))[1];
            await circleList.isVisible();
            await circleList.click();
            await page.waitForSelector('[data-id="BFN1"] ul[type="circle"]',{state:"visible"});
            await page.waitForSelector('.save-notice', { state: 'visible' });
            await page.waitForSelector('.save-notice:text("Saving...")', { state: 'hidden' });
            var saveNotice = await page.$eval('.save-notice', el => el.innerText);
            await expect(saveNotice).toContain('All changes saved at');
        })

        it('LST024 : Check if the list are updated in the XML', async () => {
            var pageUrl = config.editor_test.doiurl_editor_list;
            var fileName = "list"
            await commonData.xmlCompare(pageUrl,fileName);
        })
    })
})