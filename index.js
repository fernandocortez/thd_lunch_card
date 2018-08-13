const puppeteer = require('puppeteer');

exports.getBalance = async function getBalance(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).end();
    }
    if (req.get('content-type') !== 'application/json') {
        return res.status(406).end();
    }
    if (!req.body.account_number) {
        return res.status(400).send('Account number not present in request');
    }
    if (!/^\d+$/.test(req.body.account_number)) {
        return res.status(400).send('Account number is malformed');
    }

    const cardNumber = String(req.body.account_number);

    try {
        const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
        const page = await browser.newPage();
        await page.goto('https://thehomedepot.alohaenterprise.com:4430/memberlink/GiftCards.html?companyID=thd01');

        // Type into search box
        await page.type('input.formField', cardNumber);
        // Click search button
        await page.click('input#gcCheckCardButton');

        const cardBalance = await page.evaluate(() => {
            const node = document.querySelector('#cardBalanceDiv > h2');
            return node === null ? '0.00' : node.textContent;
        });
        const cardHistory = await page.evaluate(() => {
            return Array.prototype.slice.call(document.querySelectorAll('#cardHistory > #table-1 > tbody > tr'))
                .slice(0, 5)
                .map(({ cells }) => {
                    const row = Array.prototype.slice.call(cells).map(cell => cell.textContent);
                    const [date, _, amount, balance] = row;
                    return { date, amount, balance };
                });
        });

        await browser.close();

        return res.status(200).set('Content-Type', 'application/json').send({
            balance: cardBalance,
            history: cardHistory,
        });
    } catch (err) {
        console.error(err);
        return res.status(500).end();
    }
};
