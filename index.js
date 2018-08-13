const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('https://thehomedepot.alohaenterprise.com:4430/memberlink/GiftCards.html?companyID=thd01');

    // Type into search box
    const cardNumber = process.env.ACCOUNT_NUMBER;
    await page.type('input.formField', cardNumber);
    // Click search button
    await page.click('input#gcCheckCardButton');

    const cardBalance = await page.evaluate(() => document.querySelector('#cardBalanceDiv > h2').textContent);
    const cardHistory = await page.evaluate(() => {
        const history = Array.prototype.slice.call(document.querySelectorAll('#cardHistory > #table-1 > tbody > tr'));
        const recentEntries = history.slice(0, 5);
        return recentEntries.map(({cells}) => {
            const entryData = Array.prototype.slice.call(cells).map(cell => cell.textContent);
            const [date, _, amount, balance] = entryData;
            return {date, amount, balance};
        });
    });

    await browser.close();
})();
