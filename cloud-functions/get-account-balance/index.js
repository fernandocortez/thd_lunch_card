const puppeteer = require('puppeteer');

exports.getAccountBalance = async function getAccountBalance(pubSubEvent, context, callback) {
  const { accountNumber } = JSON.parse(Buffer.from(pubSubEvent.data, 'base64').toString());

  try {
    const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.goto(process.env.HOME_PAGE_URL);

    // Type into search box
    await page.type('input[name="newCardNumber"]', accountNumber);
    // Click search button
    await page.click('input#gcCheckCardButton');

    await page.waitFor(() => !!document.getElementById('cardBalanceDiv'));

    const accountBalance = await page.evaluate(() => {
      const node = document.querySelector('#cardBalanceDiv > h2');
      return node.textContent;
    });
    const recentAccountHistory = await page.evaluate(() => {
      return Array.prototype.slice.call(document.querySelectorAll('#cardHistory > #table-1 > tbody > tr'))
        .slice(0, 3)
        .map(({ cells }) => {
          const row = Array.prototype.slice.call(cells).map(cell => cell.textContent);
          const [date, transactionType, amount, balance] = row;
          return `${date}  ${amount}`;
        });
    });

    await browser.close();

    const message = accountBalance + '\n\n' + recentAccountHistory.join('\n');
    callback(null, message);
  } catch (err) {
    callback(err, "Failed to get account balance");
  }
};
