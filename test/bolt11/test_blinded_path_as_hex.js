const strictSame = require('node:assert').strict.deepStrictEqual;
const test = require('node:test');
const {throws} = require('node:assert').strict;

const blindedPathAsHex = require('./../../bolt11/blinded_path_as_hex');

const blindedKey = '03e7156ae33b0a208d0744199163177e909e80176e55d97a2f221ede0f934dd9ad';
const invalidKey = '00'.repeat(33);
const relayKey = '0220293926219d8efe733336e2b674570dd96aa763acb3564e6e367b384d861a0a';

// The bLIP 39 test vector blinded path with 1 hop
const makeArgs = overrides => {
  const args = {
    base_fee_mtokens: '4',
    cltv_delta: 10,
    features: [],
    fee_rate: 2,
    hops: [{encrypted_data: '0102030405', relay_key: relayKey}],
    key: '02c75eb336a038294eaaf760158b2e851c3c0937262e35401ae64a1bee71a2e40c',
    max_htlc_mtokens: '10',
    min_htlc_mtokens: '0',
  };

  Object.keys(overrides).forEach(k => args[k] = overrides[k]);

  return args;
};

const makeHop = overrides => {
  const hop = {encrypted_data: '0102030405', relay_key: relayKey};

  Object.keys(overrides).forEach(k => hop[k] = overrides[k]);

  return hop;
};

// The bLIP 39 test vector encoding of the 1 hop blinded path
const expectedHex = [
  '00000004',
  '00000002',
  '000a',
  '0000000000000000',
  '000000000000000a',
  '0000',
  '02c75eb336a038294eaaf760158b2e851c3c0937262e35401ae64a1bee71a2e40c',
  '01',
  relayKey,
  '05',
  '0102030405',
].join('');

const tests = [
  {
    args: makeArgs({base_fee_mtokens: undefined}),
    description: 'Base fee millitokens are required',
    error: 'ExpectedBaseFeeMillitokensToConvertBlindedPathToHex',
  },
  {
    args: makeArgs({base_fee_mtokens: 4}),
    description: 'Base fee millitokens are expected as a string',
    error: 'ExpectedBaseFeeMillitokensToConvertBlindedPathToHex',
  },
  {
    args: makeArgs({base_fee_mtokens: '4294967296'}),
    description: 'Base fee millitokens must fit within a uint32',
    error: 'ExpectedEncodeableBaseFeeToConvertBlindedPathToHex',
  },
  {
    args: makeArgs({cltv_delta: undefined}),
    description: 'A cltv delta is required',
    error: 'ExpectedCltvDeltaToConvertBlindedPathToHex',
  },
  {
    args: makeArgs({cltv_delta: 65536}),
    description: 'A cltv delta must fit within a uint16',
    error: 'ExpectedEncodeableCltvDeltaToConvertBlindedPathToHex',
  },
  {
    args: makeArgs({features: 'features'}),
    description: 'Features are expected as an array',
    error: 'ExpectedArrayOfFeaturesToConvertBlindedPathToHex',
  },
  {
    args: makeArgs({features: [{}]}),
    description: 'Features are expected to have feature bits',
    error: 'ExpectedFeatureBitsToConvertBlindedPathToHex',
  },
  {
    args: makeArgs({fee_rate: undefined}),
    description: 'A fee rate is required',
    error: 'ExpectedFeeRateToConvertBlindedPathToHex',
  },
  {
    args: makeArgs({fee_rate: 4294967296}),
    description: 'A fee rate must fit within a uint32',
    error: 'ExpectedEncodeableFeeRateToConvertBlindedPathToHex',
  },
  {
    args: makeArgs({hops: []}),
    description: 'Hops are required',
    error: 'ExpectedArrayOfHopsToConvertBlindedPathToHex',
  },
  {
    args: makeArgs({hops: Array(256).fill(makeHop({}))}),
    description: 'A count of hops must fit within a byte',
    error: 'ExpectedFewerHopsToConvertBlindedPathToHex',
  },
  {
    args: makeArgs({hops: [makeHop({encrypted_data: undefined})]}),
    description: 'Hop encrypted data is required',
    error: 'ExpectedHopEncryptedDataToConvertBlindedPathToHex',
  },
  {
    args: makeArgs({hops: [makeHop({encrypted_data: 'data'})]}),
    description: 'Hop encrypted data is expected to be hex',
    error: 'ExpectedHexHopEncryptedDataToConvertBlindedPathToHex',
  },
  {
    args: makeArgs({hops: [makeHop({relay_key: '00'})]}),
    description: 'Hop relay key is expected to be a compressed public key',
    error: 'ExpectedHopRelayKeyToConvertBlindedPathToHex',
  },
  {
    args: makeArgs({hops: [makeHop({relay_key: invalidKey})]}),
    description: 'Hop relay key is expected to be a valid public key',
    error: 'ExpectedValidHopRelayKeyToConvertBlindedPathToHex',
  },
  {
    args: makeArgs({introduction_node: '00'}),
    description: 'An introduction node is expected to be a compressed key',
    error: 'ExpectedIntroductionNodeKeyToConvertBlindedPathToHex',
  },
  {
    args: makeArgs({introduction_node: invalidKey}),
    description: 'An introduction node is expected to be a valid public key',
    error: 'ExpectedValidIntroductionNodeToConvertBlindedPathToHex',
  },
  {
    args: makeArgs({key: undefined}),
    description: 'A path key is required',
    error: 'ExpectedPathKeyToConvertBlindedPathToHex',
  },
  {
    args: makeArgs({key: invalidKey}),
    description: 'A path key is expected to be a valid public key',
    error: 'ExpectedValidPathKeyToConvertBlindedPathToHex',
  },
  {
    args: makeArgs({max_htlc_mtokens: undefined}),
    description: 'Max HTLC millitokens are required',
    error: 'ExpectedMaxHtlcMillitokensToConvertBlindedPathToHex',
  },
  {
    args: makeArgs({max_htlc_mtokens: '18446744073709551616'}),
    description: 'Max HTLC millitokens must fit within a uint64',
    error: 'ExpectedEncodeableMaxHtlcToConvertBlindedPathToHex',
  },
  {
    args: makeArgs({min_htlc_mtokens: undefined}),
    description: 'Min HTLC millitokens are required',
    error: 'ExpectedMinHtlcMillitokensToConvertBlindedPathToHex',
  },
  {
    args: makeArgs({min_htlc_mtokens: '18446744073709551616'}),
    description: 'Min HTLC millitokens must fit within a uint64',
    error: 'ExpectedEncodeableMinHtlcToConvertBlindedPathToHex',
  },
  {
    args: makeArgs({hops: [makeHop({encrypted_data: '00'.repeat(600)})]}),
    description: 'A path must fit within the tagged field data length',
    error: 'ExpectedBlindedPathWithinDataLengthLimitToConvertToHex',
  },
  {
    args: makeArgs({}),
    description: 'A blinded path is encoded as hex',
    expected: {hex: expectedHex},
  },
  {
    args: makeArgs({features: undefined}),
    description: 'A blinded path without features is encoded as hex',
    expected: {hex: expectedHex},
  },
  {
    args: makeArgs({
      hops: [makeHop({relay_key: blindedKey})],
      introduction_node: relayKey,
    }),
    description: 'An introduction node is encoded in place of the first hop',
    expected: {hex: expectedHex},
  },
  {
    args: makeArgs({features: [{bit: 9}]}),
    description: 'A blinded path with features is encoded as hex',
    expected: {hex: expectedHex.replace(/0000(02c75e)/, '00020200$1')},
  },
  {
    args: makeArgs({
      hops: [makeHop({encrypted_data: '01'.repeat(253)})],
      max_htlc_mtokens: '18446744073709551615',
    }),
    description: 'A long encrypted data length is encoded as a BigSize',
    expected: {
      hex: expectedHex
        .replace('000000000000000a', 'ffffffffffffffff')
        .replace(/05(0102030405)$/, `fd00fd${'01'.repeat(253)}`),
    },
  },
];

tests.forEach(({args, description, error, expected}) => {
  return test(description, (t, end) => {
    if (!!error) {
      throws(() => blindedPathAsHex(args), new Error(error), 'Got error');
    } else {
      strictSame(blindedPathAsHex(args), expected, 'Got expected hex');
    }

    return end();
  });
});
