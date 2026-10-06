const strictSame = require('node:assert').strict.deepStrictEqual;
const test = require('node:test');
const {throws} = require('node:assert').strict;

const {parseInvoice} = require('./../../');
const {parseInvoiceRequest} = require('./../../');
const {parseOffer} = require('./../../');
const vectors = require('./vectors/interop.json');

const {keys} = Object;

// Parsed details are checked against what the source implementation asserts
const checkDetails = (parsed, expected) => {
  keys(expected).forEach(key => {
    const value = expected[key] === null ? undefined : expected[key];

    return strictSame(parsed[key], value, `Got expected ${key}`);
  });
};

vectors.offers.forEach(({description, expected, offer}) => {
  return test(description, (t, end) => {
    checkDetails(parseOffer({offer}), expected);

    return end();
  });
});

vectors.requests.forEach(({description, expected, request}) => {
  return test(description, (t, end) => {
    checkDetails(parseInvoiceRequest({request}), expected);

    return end();
  });
});

vectors.invoices.forEach(({description, expected, invoice}) => {
  return test(description, (t, end) => {
    const parsed = parseInvoice({invoice});

    checkDetails(parsed, expected.invoice);

    // The invoice is for an offer, which carries the description and issuer
    checkDetails(parseOffer({offer: parsed.offer}), expected.offer);

    return end();
  });
});

vectors.chains.forEach(({description, expected, invoice, offer, request}) => {
  return test(description, (t, end) => {
    checkDetails(parseOffer({offer}), expected.offer);

    const parsedRequest = parseInvoiceRequest({request});

    checkDetails(parsedRequest, expected.request);

    strictSame(parsedRequest.offer, offer, 'Request is for the offer');

    // The invoice is checked against the request that was sent for it
    const parsedInvoice = parseInvoice({invoice, request});

    checkDetails(parsedInvoice, expected.invoice);

    strictSame(parsedInvoice.offer, offer, 'Invoice is for the offer');

    return end();
  });
});

vectors.invalid.forEach(({description, error, invoice, offer}) => {
  return test(description, (t, end) => {
    if (!!offer) {
      throws(() => parseOffer({offer}), new Error(error), 'Got error');
    } else {
      throws(() => parseInvoice({invoice}), new Error(error), 'Got error');
    }

    return end();
  });
});
