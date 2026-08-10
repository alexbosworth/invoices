const strictSame = require('node:assert').strict.deepStrictEqual;
const test = require('node:test');
const {throws} = require('node:assert').strict;

const hexAsWords = require('./../../bolt11/hex_as_words');
const hopAsHex = require('./../../bolt11/hop_as_hex');
const wordsAsHopHints = require('./../../bolt11/words_as_hop_hints');

const hops = [
  {
    base_fee_mtokens: '1000',
    channel: '598695x1105x1',
    cltv_delta: 144,
    public_key: '03e7156ae33b0a208d0744199163177e909e80176e55d97a2f221ede0f934dd9ad',
    fee_rate: 2500,
  },
  {
    base_fee_mtokens: '10',
    channel: '600000x2000x3',
    cltv_delta: 40,
    public_key: '021111111111111111111111111111111111111111111111111111111111111111',
    fee_rate: 100,
  },
];

// Hint words are the bech32 words of the concatenated raw hop encodings
const asWords = hints => {
  const hex = hints.map(hop => hopAsHex(hop).hex).join('');

  return hexAsWords({hex}).words;
};

const tests = [
  {
    args: {words: undefined},
    description: 'An array of words is required',
    error: 'ExpectedWordsToInterpretAsHopHints',
  },
  {
    args: {words: []},
    description: 'No words yields no hop hints',
    expected: {hints: []},
  },
  {
    args: {words: asWords(hops.slice(Number(), 1))},
    description: 'Words are converted to a hop hint',
    expected: {hints: hops.slice(Number(), 1)},
  },
  {
    args: {words: asWords(hops)},
    description: 'Words are converted to multiple hop hints',
    expected: {hints: hops},
  },
];

tests.forEach(({args, description, error, expected}) => {
  return test(description, (t, end) => {
    if (!!error) {
      throws(() => wordsAsHopHints(args), new Error(error), 'Got error');
    } else {
      strictSame(wordsAsHopHints(args), expected, 'Got expected hop hints');
    }

    return end();
  });
});
