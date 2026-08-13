const strictSame = require('node:assert').strict.deepStrictEqual;
const test = require('node:test');
const {throws} = require('node:assert').strict;

const chainAddressAsWords = require('./../../bolt11/chain_address_as_words');
const wordsAsChainAddress = require('./../../bolt11/words_as_chain_address');

const asWords = address => chainAddressAsWords({address, network: 'bitcoin'});

// Fallback addresses from the BOLT 11 spec examples
const p2pkhAddress = '1RustyRX2oai4EYYDpQGWvEL62BBGqN9T';
const p2shAddress = '3EktnHQD7RiAE6uzMj2ZifT9YgRrkSgzQX';
const p2wpkhAddress = 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4';
const signetAddress = 'tb1q6qh9jsxr9tsf4fu5q29p26fmc8zh8m3rsjsp3c';

const makeArgs = overrides => {
  const args = {network: 'bitcoin', words: asWords(p2wpkhAddress).words};

  Object.keys(overrides).forEach(k => args[k] = overrides[k]);

  return args;
};

const tests = [
  {
    args: makeArgs({words: undefined}),
    description: 'An array of words is required',
    error: 'ExpectedWordsToConvertToChainAddress',
  },
  {
    args: makeArgs({words: []}),
    description: 'A non-empty array of words is required',
    error: 'ExpectedWordsToConvertToChainAddress',
  },
  {
    args: makeArgs({network: 'network'}),
    description: 'A known network is required',
    error: 'UnrecognizedNetworkForChainAddress',
  },
  {
    args: makeArgs({words: asWords(p2pkhAddress).words}),
    description: 'Words are converted to a p2pkh chain address',
    expected: {chain_address: p2pkhAddress},
  },
  {
    args: makeArgs({words: asWords(p2shAddress).words}),
    description: 'Words are converted to a p2sh chain address',
    expected: {chain_address: p2shAddress},
  },
  {
    args: makeArgs({}),
    description: 'Words are converted to a witness chain address',
    expected: {chain_address: p2wpkhAddress},
  },
  {
    args: makeArgs({
      network: 'signet',
      words: chainAddressAsWords({
        address: signetAddress,
        network: 'signet',
      }).words,
    }),
    description: 'Words are converted to a signet chain address',
    expected: {chain_address: signetAddress},
  },
  {
    args: makeArgs({words: [9, 1, 2, 3]}),
    description: 'An unrecognized address version returns no address',
    expected: {},
  },
];

tests.forEach(({args, description, error, expected}) => {
  return test(description, (t, end) => {
    if (!!error) {
      throws(() => wordsAsChainAddress(args), new Error(error), 'Got error');
    } else {
      strictSame(wordsAsChainAddress(args), expected, 'Got chain address');
    }

    return end();
  });
});
