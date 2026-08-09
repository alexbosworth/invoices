const strictSame = require('node:assert').strict.deepStrictEqual;
const test = require('node:test');
const {throws} = require('node:assert').strict;

const hopAsHex = require('./../../bolt11/hop_as_hex');

const makeArgs = overrides => {
  const args = {
    base_fee_mtokens: '1000',
    channel: '598695x1105x1',
    cltv_delta: 144,
    fee_rate: 2500,
    public_key: '03e7156ae33b0a208d0744199163177e909e80176e55d97a2f221ede0f934dd9ad',
  };

  Object.keys(overrides).forEach(k => args[k] = overrides[k]);

  return args;
};

const tests = [
  {
    args: makeArgs({base_fee_mtokens: undefined}),
    description: 'Base fee millitokens are required',
    error: 'ExpectedBaseFeeMillitokensToConvertHopToHex',
  },
  {
    args: makeArgs({channel: undefined}),
    description: 'A channel id is required',
    error: 'ExpectedChannelToConvertHopToHex',
  },
  {
    args: makeArgs({cltv_delta: undefined}),
    description: 'A cltv delta is required',
    error: 'ExpectedCltvDeltaToConvertHopToHex',
  },
  {
    args: makeArgs({fee_rate: undefined}),
    description: 'A fee rate is required',
    error: 'ExpectedHopFeeRateToConvertHopToHex',
  },
  {
    args: makeArgs({public_key: undefined}),
    description: 'A public key is required',
    error: 'ExpectedHopPublicKeyToConvertHopToHex',
  },
  {
    args: makeArgs({}),
    description: 'A hop is encoded as hex',
    expected: {
      hex: '03e7156ae33b0a208d0744199163177e909e80176e55d97a2f221ede0f934dd9ad0922a70004510001000003e8000009c40090',
    },
  },
];

tests.forEach(({args, description, error, expected}) => {
  return test(description, (t, end) => {
    if (!!error) {
      throws(() => hopAsHex(args), new Error(error), 'Got expected error');
    } else {
      strictSame(hopAsHex(args), expected, 'Got expected hop hint hex');
    }

    return end();
  });
});
