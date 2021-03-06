const { Firestore } = require('@google-cloud/firestore');
const puppeteer = require('puppeteer');

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const firestore = new Firestore();
const account_numbers = firestore.collection('account_numbers');

exports.registerAccountNumber = async function registerAccountNumber(event, context, callback) {
  let accountNumber, phoneNumber;
  try {
    const data = JSON.parse(Buffer.from(event.data, 'base64').toString());
    accountNumber = data.accountNumber;
    phoneNumber = data.phoneNumber;
  } catch (err) {
    return callback(err, 'Failed to get account and phone number from event');
  }

  const matchingRecords = await account_numbers.where('account_number', '==', accountNumber).get();
  const accountNumberAlreadyRegistered = matchingRecords.size > 0;

  if (accountNumberAlreadyRegistered) {
    return callback(null, 'This account number has already been registered');
  }

  try {
    const accountNumberIsValid = await verifyAccountNumber(accountNumber);

    if (accountNumberIsValid) {
      try {
        await account_numbers.doc().create({
          account_number: accountNumber,
          phone_number: phoneNumber,
          am_update: false,
          pm_update: false,
        });
        return callback(null, 'The account number is valid and will be registered');
      } catch (err) {
        return callback(err, "Failed to register account number");
      }
    }

    return callback(null, 'The account number is not valid');
  } catch (err) {
    return callback(err, "Failed to validate account number");
  }
};

async function verifyAccountNumber(accountNumber) {
  try {
    const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.goto(process.env.HOME_PAGE_URL);

    // Type into search box
    await page.type('input[name="newCardNumber"]', accountNumber);
    // Click search button
    await page.click('input#gcCheckCardButton');

    await page.waitFor(() => !!document.getElementById('cardBalanceDiv'));

    // if below h2 found (i.e., not null), then the account number has not been set up
    const noAccountHistoryText = await page.$('#cardHistory > h2');

    await browser.close();

    if (noAccountHistoryText === null) {
      return true;
    }

    return false;
  } catch (err) {
    throw err;
  }
}
