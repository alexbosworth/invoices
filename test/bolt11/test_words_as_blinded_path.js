const strictSame = require('node:assert').strict.deepStrictEqual;
const test = require('node:test');
const {throws} = require('node:assert').strict;

const {encodeBigSize} = require('bolt01');
const {featureFlagsAsHex} = require('bolt09');

const hexAsWords = require('./../../bolt11/hex_as_words');
const wordsAsBlindedPath = require('./../../bolt11/words_as_blinded_path');

const asHex = (n, bytes) => BigInt(n).toString(16).padStart(bytes * 2, '0');
const byteLength = hex => hex.length / 2;
const invalidKey = '00'.repeat(33);

// The bLIP 39 test vector blinded path with 3 hops
const longPath = {
  base_fee_mtokens: '40',
  cltv_delta: 130,
  features: [],
  fee_rate: 20,
  hops: [
    {
      encrypted_data: '0102030405',
      relay_key: '03a8c97ed5cd40d474e4ef18c899854b25e5070106504cb225e6d2c112d61a805e',
    },
    {
      encrypted_data: '0504030201',
      relay_key: '0220293926219d8efe733336e2b674570dd96aa763acb3564e6e367b384d861a0a',
    },
    {
      encrypted_data: '0102030405060708090a0b0c0d0e',
      relay_key: '02c75eb336a038294eaaf760158b2e851c3c0937262e35401ae64a1bee71a2e40c',
    },
  ],
  introduction_node: '03a8c97ed5cd40d474e4ef18c899854b25e5070106504cb225e6d2c112d61a805e',
  key: '03f3311e948feb5115242c4e396c81c448ab7ee5fd24c4e24e66c73533cc4f98b8',
  max_htlc_mtokens: '100',
  min_htlc_mtokens: '2',
};

// The bLIP 39 test vector blinded path with 1 hop
const shortPath = {
  base_fee_mtokens: '4',
  cltv_delta: 10,
  features: [],
  fee_rate: 2,
  hops: [
    {
      encrypted_data: '0102030405',
      relay_key: '0220293926219d8efe733336e2b674570dd96aa763acb3564e6e367b384d861a0a',
    },
  ],
  introduction_node: '0220293926219d8efe733336e2b674570dd96aa763acb3564e6e367b384d861a0a',
  key: '02c75eb336a038294eaaf760158b2e851c3c0937262e35401ae64a1bee71a2e40c',
  max_htlc_mtokens: '10',
  min_htlc_mtokens: '0',
};

// Encode a blinded path as bLIP 39 blinded payinfo hex
const pathAsHex = path => {
  const features = featureFlagsAsHex({features: path.features.map(n => n.bit)});

  const hops = path.hops.map(hop => {
    const size = encodeBigSize({number: `${byteLength(hop.encrypted_data)}`});

    return hop.relay_key + size.encoded + hop.encrypted_data;
  });

  return [
    asHex(path.base_fee_mtokens, 4),
    asHex(path.fee_rate, 4),
    asHex(path.cltv_delta, 2),
    asHex(path.min_htlc_mtokens, 8),
    asHex(path.max_htlc_mtokens, 8),
    features.encoded,
    path.key,
    asHex(path.hops.length, 1),
    hops.join(''),
  ].join('');
};

const asWords = hex => hexAsWords({hex}).words;
const featuresLengthOffset = (4 + 4 + 2 + 8 + 8) * 2;
const pathKeyEnd = (4 + 4 + 2 + 8 + 8 + 2 + 33) * 2;
const hopsCountEnd = pathKeyEnd + 2;
const withHops = (path, hops) => ({...path, hops});
const withKey = (path, key) => ({...path, key});

// The hex of the path up to and including the count of hops
const throughHopsCount = path => pathAsHex(path).slice(Number(), hopsCountEnd);

const tests = [
  {
    args: {words: undefined},
    description: 'An array of words is required',
    error: 'ExpectedWordsToInterpretAsBlindedPath',
  },
  {
    args: {words: []},
    description: 'Payment info is required',
    error: 'ExpectedPaymentInfoInBlindedPath',
  },
  {
    args: {
      words: asWords(
        pathAsHex(shortPath).slice(Number(), featuresLengthOffset) + '0001'
      ),
    },
    description: 'Features bytes matching the features length are required',
    error: 'ExpectedFeaturesInBlindedPath',
  },
  {
    args: {words: asWords(pathAsHex(shortPath).slice(Number(), pathKeyEnd))},
    description: 'A path key and a count of hops are required',
    error: 'ExpectedPathKeyInBlindedPath',
  },
  {
    args: {words: asWords(pathAsHex(withKey(shortPath, invalidKey)))},
    description: 'A valid path key is required',
    error: 'ExpectedValidPathKeyInBlindedPath',
  },
  {
    args: {words: asWords(pathAsHex(withHops(shortPath, [])))},
    description: 'At least one hop is required',
    error: 'ExpectedHopsInBlindedPath',
  },
  {
    args: {words: asWords(throughHopsCount(shortPath))},
    description: 'A hop public key is required',
    error: 'ExpectedHopPublicKeyInBlindedPath',
  },
  {
    args: {
      words: asWords(pathAsHex(withHops(shortPath, [{
        encrypted_data: '0102030405',
        relay_key: invalidKey,
      }]))),
    },
    description: 'A valid hop public key is required',
    error: 'ExpectedValidHopPublicKeyInBlindedPath',
  },
  {
    args: {
      words: asWords(throughHopsCount(shortPath) + shortPath.hops[0].relay_key),
    },
    description: 'An encrypted data length is required',
    error: 'ExpectedEncryptedDataLengthInBlindedPath',
  },
  {
    args: {words: asWords(pathAsHex(shortPath).slice(Number(), -2))},
    description: 'Encrypted data matching the length prefix is required',
    error: 'ExpectedEncryptedDataInBlindedPath',
  },
  {
    args: {words: asWords(pathAsHex(shortPath) + '00')},
    description: 'Data beyond the hops is not expected',
    error: 'UnexpectedTrailingBytesInBlindedPath',
  },
  {
    args: {words: asWords(pathAsHex(shortPath))},
    description: 'Words are converted to a blinded path with a single hop',
    expected: {path: shortPath},
  },
  {
    args: {words: asWords(pathAsHex(longPath))},
    description: 'Words are converted to a blinded path with multiple hops',
    expected: {path: longPath},
  },
  {
    args: {
      words: asWords(pathAsHex({
        ...shortPath,
        features: [{bit: 9, is_required: false, type: 'tlv_onion'}],
      })),
    },
    description: 'Path features are decoded',
    expected: {
      path: {
        ...shortPath,
        features: [{bit: 9, is_required: false, type: 'tlv_onion'}],
      },
    },
  },
  {
    args: {
      words: asWords(pathAsHex(withHops(shortPath, [{
        encrypted_data: '01'.repeat(253),
        relay_key: shortPath.hops[0].relay_key,
      }]))),
    },
    description: 'Encrypted data with a multiple byte length prefix is decoded',
    expected: {
      path: withHops(shortPath, [{
        encrypted_data: '01'.repeat(253),
        relay_key: shortPath.hops[0].relay_key,
      }]),
    },
  },
];

tests.forEach(({args, description, error, expected}) => {
  return test(description, (t, end) => {
    if (!!error) {
      throws(() => wordsAsBlindedPath(args), new Error(error), 'Got error');
    } else {
      strictSame(wordsAsBlindedPath(args), expected, 'Got expected path');
    }

    return end();
  });
});
