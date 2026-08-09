const strictSame = require('node:assert').strict.deepStrictEqual;
const test = require('node:test');
const {throws} = require('node:assert').strict;

const {bech32} = require('bech32');

const createSignedRequest = require('./../../bolt11/create_signed_request');

// From the BOLT 11 spec example: "Please send $3 for a cup of coffee"
const request = 'lnbc2500u1pvjluezpp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyq' +
  'cyq5rqwzqfqypqdq5xysxxatsyp3k7enxv4jsxqzpuaztrnwngzn3kdzw5hydlzf03qdgm2h' +
  'dq27cqv3agm2awhz5se903vruatfhq77w3ls4evs3ch9zw97j25emudupq63nyw24cg27h2r' +
  'spfj9srp';

const destination =
  '03e7156ae33b0a208d0744199163177e909e80176e55d97a2f221ede0f934dd9ad';

const signature = 'e89639ba6814e36689d4b91bf125f10351b55da057b00647a8dabaeb' +
  '8a90c95f160f9d5a6e0f79d1fc2b964238b944e2fa4aa677c6f020d466472ab842bd750e';

const signatureWordsCount = 104;

const decoded = bech32.decode(request, Number.MAX_SAFE_INTEGER);

// The tag words are the request words, less the trailing signature words
const tags = decoded.words.slice(
  Number(),
  decoded.words.length - signatureWordsCount
);

const makeArgs = overrides => {
  const args = {destination, signature, tags, hrp: decoded.prefix};

  Object.keys(overrides).forEach(k => args[k] = overrides[k]);

  return args;
};

const tests = [
  {
    args: makeArgs({destination: undefined}),
    description: 'A destination is required',
    error: 'ExpectedDestinationForSignedPaymentRequest',
  },
  {
    args: makeArgs({hrp: undefined}),
    description: 'A human readable part is required',
    error: 'ExpectedHrpForSignedPaymentRequest',
  },
  {
    args: makeArgs({signature: undefined}),
    description: 'A signature is required',
    error: 'ExpectedRequestSignatureForSignedPaymentRequest',
  },
  {
    args: makeArgs({signature: 1}),
    description: 'A hex encoded signature is required',
    error: 'ExpectedValidSignatureHexForSignedPaymentRequest',
  },
  {
    args: makeArgs({tags: undefined}),
    description: 'An array of tag words is required',
    error: 'ExpectedRequestTagsForSignedPaymentRequest',
  },
  {
    args: makeArgs({signature: signature.replace(/e/g, 'a')}),
    description: 'A signature matching the destination is required',
    error: 'ExpectedValidSignatureForSignedPaymentRequest',
  },
  {
    args: makeArgs({}),
    description: 'A signed payment request is assembled',
    expected: {request},
  },
];

tests.forEach(({args, description, error, expected}) => {
  return test(description, (t, end) => {
    if (!!error) {
      throws(() => createSignedRequest(args), new Error(error), 'Got error');
    } else {
      strictSame(createSignedRequest(args), expected, 'Got signed request');
    }

    return end();
  });
});
