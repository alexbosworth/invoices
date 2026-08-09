const strictSame = require('node:assert').strict.deepStrictEqual;
const test = require('node:test');
const {throws} = require('node:assert').strict;

const {bech32} = require('bech32');

const hexAsWords = require('./../../bolt11/hex_as_words');
const signatureFromWords = require('./../../bolt11/signature_from_words');

// From the BOLT 11 spec example: "Please send $3 for a cup of coffee"
const request = 'lnbc2500u1pvjluezpp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqdq5xysxxatsyp3k7enxv4jsxqzpuaztrnwngzn3kdzw5hydlzf03qdgm2hdq27cqv3agm2awhz5se903vruatfhq77w3ls4evs3ch9zw97j25emudupq63nyw24cg27h2rspfj9srp';

const signature = 'e89639ba6814e36689d4b91bf125f10351b55da057b00647a8dabaeb8a90c95f160f9d5a6e0f79d1fc2b964238b944e2fa4aa677c6f020d466472ab842bd750e';

const signatureWordsCount = 104;

// The signature words are the trailing words of the request
const words = bech32
  .decode(request, Number.MAX_SAFE_INTEGER)
  .words
  .slice(-signatureWordsCount);

const tests = [
  {
    args: {words: undefined},
    description: 'An array of words is required',
    error: 'ExpectedValidSignatureBuffer',
  },
  {
    args: {words: [0, 0, 0, 0]},
    description: 'A full length signature is required',
    error: 'InvalidOrMissingSignatureInPaymentRequest',
  },
  {
    args: {words: hexAsWords({hex: `${signature}04`}).words},
    description: 'A known recovery flag is required',
    error: 'InvalidOrMissingSignatureInPaymentRequest',
  },
  {
    args: {words},
    description: 'A signature is derived from words',
    expected: {recovery: 1, signature: Buffer.from(signature, 'hex')},
  },
];

tests.forEach(({args, description, error, expected}) => {
  return test(description, (t, end) => {
    if (!!error) {
      throws(() => signatureFromWords(args), new Error(error), 'Got error');
    } else {
      strictSame(signatureFromWords(args), expected, 'Got signature');
    }

    return end();
  });
});
