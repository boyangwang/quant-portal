'use strict';

const Controller = require('egg').Controller;

const conversionCache = {};

const getFinalExpiryYearDigits = (expiryYear, monthDigit, prefixLength) => {
  const currentYear = new Date().getUTCFullYear();
  const currentMonth = new Date().getUTCMonth();
  const currentComparisonYear = expiryYear.length === 1 ? currentYear % 10 : currentYear % 100;
  const expiryYearNumeric = parseInt(expiryYear);
  const expiryMonthNumeric = monthDigit.charCodeAt(0) - 69;

  let finalExpiryYear = currentYear - currentComparisonYear + expiryYearNumeric;
  if (expiryYearNumeric > currentComparisonYear || (expiryYearNumeric === currentComparisonYear && currentMonth > expiryMonthNumeric)) {
    finalExpiryYear = expiryYear.length === 1 ? (finalExpiryYear + 10) : (finalExpiryYear + 100);
  }
  const finalExpiryYearString = '' + finalExpiryYear;

  if (prefixLength === 1) {
    return finalExpiryYearString[3] + finalExpiryYearString + finalExpiryYearString[3];
  } else if (prefixLength === 2) {
    return finalExpiryYearString[3] + finalExpiryYearString;
  } else {
    return finalExpiryYearString[3] + finalExpiryYearString.slice(0, 3);
  }
};

const getCheckDigit = firstEightDigits => {
  let sum = 0;
  for (let i = 0; i < 8; i++) {
    const char = firstEightDigits[i];
    const charCode = firstEightDigits.charCodeAt(i);
    let value = 0;
    if (charCode >= 48 && charCode <= 57) { // is numeric digit
      value = parseInt(char);
    } else if (charCode >= 65 && charCode <= 90) { // is letter (uppercase only)
      value = charCode - 55;
    } else if (char === '*') { // below cases are not applicable in our CUSIP version - included for completeness sake
      value = 36;
    } else if (char === '@') {
      value = 37;
    } else if (char === '#') {
      value = 38;
    }
    if (i % 2 !== 0) { // easy to get off by one err here
      value *= 2;
    }
    sum += Math.floor(value / 10) + value % 10;
  }
  return (10 - (sum % 10)) % 10;
};

const getCusipFromTicker = t => {
  try {
    t = t.toUpperCase().trim();
    const regex = /^([A-Z]{2,3}|[A-Z] )([F-Z])([0-9]{1,2}) (COMDTY|INDEX)$/;
    const match = regex.exec(t);

    const prefix = match[1].trim();
    const expiryMonth = match[2];
    const expiryYear = getFinalExpiryYearDigits(match[3], expiryMonth, prefix.length);

    const firstEightDigits = prefix + expiryMonth + expiryYear;
    return firstEightDigits + getCheckDigit(firstEightDigits);
  } catch (e) {
    return 'Error: failed to convert, check input';
  }
};

class Ticker2CusipController extends Controller {
  async index() {
    const tickers = this.ctx.request.body.data;
    const results = {};
    tickers.forEach(t => {
      if (!conversionCache[t]) {
        conversionCache[t] = getCusipFromTicker(t);
      }
      results[t] = conversionCache[t];
    });
    this.ctx.body = {
      data: results,
    };
    this.ctx.status = 200;
  }
}

module.exports = Ticker2CusipController;
