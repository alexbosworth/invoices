const strictSame = require('node:assert').strict.deepStrictEqual;
const test = require('node:test');
const {throws} = require('node:assert').strict;

const blindedPathsAsHex = require('./../../bolt12/blinded_paths_as_hex');

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

const makePath = overrides => {
  const path = {hops, key, introduction_node: introductionNode};

  Object.keys(overrides).forEach(k => path[k] = overrides[k]);

  return path;
};

const tests = [
  {
    args: {},
    description: 'Paths are required',
    error: 'ExpectedArrayOfBlindedPathsToEncodeAsHex',
  },
  {
    args: {paths: [makePath({hops: []})]},
    description: 'Path hops are required',
    error: 'ExpectedArrayOfHopsInBlindedPathToEncodeAsHex',
  },
  {
    args: {paths: [makePath({hops: [...Array(256)].map(() => hops[0])})]},
    description: 'Path hops must fit in a single count byte',
    error: 'ExpectedFewerHopsInBlindedPathToEncodeAsHex',
  },
  {
    args: {paths: [makePath({hops: [{relay_key: key}]})]},
    description: 'Hop encrypted data is required',
    error: 'ExpectedHopEncryptedDataInBlindedPathToEncodeAsHex',
  },
  {
    args: {
      paths: [makePath({hops: [{encrypted_data: 'zz', relay_key: key}]})],
    },
    description: 'Hop encrypted data hex is required',
    error: 'ExpectedHexHopEncryptedDataInBlindedPathToEncodeAsHex',
  },
  {
    args: {
      paths: [makePath({
        hops: [{encrypted_data: '00'.repeat(65536), relay_key: key}],
      })],
    },
    description: 'Hop encrypted data must fit in a length prefix',
    error: 'ExpectedShorterHopEncryptedDataInBlindedPathToEncode',
  },
  {
    args: {paths: [makePath({hops: [{encrypted_data: '00'}]})]},
    description: 'Hop relay keys are required',
    error: 'ExpectedHopRelayKeyInBlindedPathToEncodeAsHex',
  },
  {
    args: {
      paths: [makePath({
        hops: [{encrypted_data: '00', relay_key: invalidKey}],
      })],
    },
    description: 'Valid hop relay keys are required',
    error: 'ExpectedValidHopRelayKeyInBlindedPathToEncodeAsHex',
  },
  {
    args: {paths: [makePath({introduction_node: undefined})]},
    description: 'An introduction node or edge is required',
    error: 'ExpectedIntroductionNodeOrEdgeInBlindedPathToEncodeAsHex',
  },
  {
    args: {
      paths: [makePath({introduction_edge: '1x2x3x1', introduction_node: key})],
    },
    description: 'Only one of introduction node or edge is allowed',
    error: 'ExpectedIntroductionNodeOrEdgeInBlindedPathToEncodeAsHex',
  },
  {
    args: {
      paths: [makePath({introduction_edge: 1, introduction_node: undefined})],
    },
    description: 'An introduction edge string is required',
    error: 'ExpectedIntroductionEdgeStringInBlindedPathToEncodeAsHex',
  },
  {
    args: {
      paths: [makePath({
        introduction_edge: '1x2x3',
        introduction_node: undefined,
      })],
    },
    description: 'An introduction edge with a direction is required',
    error: 'ExpectedIntroductionEdgeFormatInBlindedPathToEncodeAsHex',
  },
  {
    args: {paths: [makePath({introduction_node: 'zz'})]},
    description: 'An introduction node key is required',
    error: 'ExpectedIntroductionNodeKeyInBlindedPathToEncodeAsHex',
  },
  {
    args: {paths: [makePath({introduction_node: invalidKey})]},
    description: 'A valid introduction node key is required',
    error: 'ExpectedValidIntroductionNodeKeyInBlindedPathToEncode',
  },
  {
    args: {paths: [makePath({key: undefined})]},
    description: 'A path key is required',
    error: 'ExpectedPathKeyInBlindedPathToEncodeAsHex',
  },
  {
    args: {paths: [makePath({key: invalidKey})]},
    description: 'A valid path key is required',
    error: 'ExpectedValidPathKeyInBlindedPathToEncodeAsHex',
  },
  {
    args: {paths: [makePath({})]},
    description: 'A blinded path is encoded',
    expected: {hex: encodedPath},
  },
  {
    args: {
      paths: [
        makePath({}),
        makePath({
          hops: [hops[0], {encrypted_data: '22'.repeat(8), relay_key: key}],
          introduction_edge: '1x2x3x1',
          introduction_node: undefined,
        }),
      ],
    },
    description: 'Multiple blinded paths are encoded',
    expected: {hex: `${encodedPath}${encodedEdgePath}`},
  },
];

tests.forEach(({args, description, error, expected}) => {
  return test(description, (t, end) => {
    if (!!error) {
      throws(() => blindedPathsAsHex(args), new Error(error), 'Got error');
    } else {
      strictSame(blindedPathsAsHex(args), expected, 'Got expected result');
    }

    return end();
  });
});
