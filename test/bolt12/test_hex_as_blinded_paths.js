const strictSame = require('node:assert').strict.deepStrictEqual;
const test = require('node:test');
const {throws} = require('node:assert').strict;

const hexAsBlindedPaths = require('./../../bolt12/hex_as_blinded_paths');

const key =
  '020202020202020202020202020202020202020202020202020202020202020202';

const introductionNode =
  '0324653eac434488002cc06bbfb7f10fe18991e35f9fe4302dbea6d2353dc0ab1c';

const invalidKey =
  '020000000000000000000000000000000000000000000000000000000000000000';

const hops = [
  {encrypted_data: '00'.repeat(16), relay_key: key},
  {encrypted_data: '11'.repeat(8), relay_key: key},
];

// From the BOLT 12 offer test vectors: blinded path via Bob
const encodedPath = introductionNode + key + '02' + key + '0010' +
  '00'.repeat(16) + key + '0008' + '11'.repeat(8);

// From the BOLT 12 offer test vectors: blinded path via 1x2x3 direction 1
const encodedEdgePath = '010000010000020003' + key + '02' + key + '0010' +
  '00'.repeat(16) + key + '0008' + '22'.repeat(8);

const tests = [
  {
    args: {},
    description: 'Hex is required',
    error: 'ExpectedHexEncodedBlindedPathsToDecode',
  },
  {
    args: {hex: 'zz'},
    description: 'Valid hex is required',
    error: 'ExpectedHexEncodedBlindedPathsToDecode',
  },
  {
    args: {hex: '03'},
    description: 'An introduction node key is required',
    error: 'ExpectedIntroductionNodePublicKeyInBlindedPath',
  },
  {
    args: {hex: invalidKey},
    description: 'A valid introduction node key is required',
    error: 'ExpectedValidIntroductionNodePublicKeyInBlindedPath',
  },
  {
    args: {hex: '0100'},
    description: 'An introduction edge channel id is required',
    error: 'ExpectedChannelIdInBlindedPath',
  },
  {
    args: {hex: '04'},
    description: 'A known introduction encoding is required',
    error: 'UnexpectedIntroductionNodeEncodingInBlindedPath',
  },
  {
    args: {hex: introductionNode},
    description: 'A path key is required',
    error: 'ExpectedPathKeyInBlindedPath',
  },
  {
    args: {hex: `${introductionNode}${invalidKey}`},
    description: 'A valid path key is required',
    error: 'ExpectedValidPathKeyInBlindedPath',
  },
  {
    args: {hex: `${introductionNode}${key}`},
    description: 'A hops count is required',
    error: 'ExpectedHopsCountInBlindedPath',
  },
  {
    args: {hex: `${introductionNode}${key}00`},
    description: 'At least one hop is required',
    error: 'ExpectedHopsInBlindedPath',
  },
  {
    args: {hex: `${introductionNode}${key}01`},
    description: 'A hop public key is required',
    error: 'ExpectedHopPublicKeyInBlindedPath',
  },
  {
    args: {hex: `${introductionNode}${key}01${invalidKey}`},
    description: 'A valid hop public key is required',
    error: 'ExpectedValidHopPublicKeyInBlindedPath',
  },
  {
    args: {hex: `${introductionNode}${key}01${key}`},
    description: 'An encrypted data length is required',
    error: 'ExpectedEncryptedDataLengthInBlindedPath',
  },
  {
    args: {hex: `${introductionNode}${key}01${key}000200`},
    description: 'Encrypted data is required',
    error: 'ExpectedEncryptedDataInBlindedPath',
  },
  {
    args: {hex: ''},
    description: 'No data means no paths',
    expected: {paths: []},
  },
  {
    args: {hex: encodedPath},
    description: 'A blinded path is decoded',
    expected: {paths: [{hops, key, introduction_node: introductionNode}]},
  },
  {
    args: {hex: `${encodedPath}${encodedEdgePath}`},
    description: 'Multiple blinded paths are decoded',
    expected: {
      paths: [
        {hops, key, introduction_node: introductionNode},
        {
          key,
          hops: [hops[0], {encrypted_data: '22'.repeat(8), relay_key: key}],
          introduction_edge: '1x2x3x1',
        },
      ],
    },
  },
];

tests.forEach(({args, description, error, expected}) => {
  return test(description, (t, end) => {
    if (!!error) {
      throws(() => hexAsBlindedPaths(args), new Error(error), 'Got error');
    } else {
      strictSame(hexAsBlindedPaths(args), expected, 'Got expected paths');
    }

    return end();
  });
});
