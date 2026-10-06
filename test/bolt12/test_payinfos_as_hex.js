const strictSame = require('node:assert').strict.deepStrictEqual;
const test = require('node:test');
const {throws} = require('node:assert').strict;

const payinfosAsHex = require('./../../bolt12/payinfos_as_hex');

const makePayinfo = overrides => {
  const payinfo = {
    base_fee_mtokens: '1000',
    cltv_delta: 144,
    fee_rate: 100,
    max_htlc_mtokens: '100000000',
    min_htlc_mtokens: '1000',
  };

  Object.keys(overrides).forEach(k => payinfo[k] = overrides[k]);

  return payinfo;
};

const encoded = '000003e800000064009000000000000003e80000000005f5e1000000';

const tests = [
  {
    args: {},
    description: 'Payinfos are required',
    error: 'ExpectedArrayOfBlindedPayinfosToEncodeAsHex',
  },
  {
    args: {payinfos: [makePayinfo({base_fee_mtokens: undefined})]},
    description: 'Base fee millitokens are required',
    error: 'ExpectedBaseFeeMillitokensInBlindedPayinfoToEncode',
  },
  {
    args: {payinfos: [makePayinfo({base_fee_mtokens: '4294967296'})]},
    description: 'Base fee millitokens must be encodeable',
    error: 'ExpectedEncodeableBaseFeeInBlindedPayinfoToEncode',
  },
  {
    args: {payinfos: [makePayinfo({cltv_delta: 65536})]},
    description: 'CLTV delta must be encodeable',
    error: 'ExpectedEncodeableCltvDeltaInBlindedPayinfoToEncode',
  },
  {
    args: {payinfos: [makePayinfo({features: 'features'})]},
    description: 'Features must be an array',
    error: 'ExpectedArrayOfFeaturesInBlindedPayinfoToEncode',
  },
  {
    args: {payinfos: [makePayinfo({features: [{}]})]},
    description: 'Features must have bits',
    error: 'ExpectedFeatureBitsInBlindedPayinfoToEncode',
  },
  {
    args: {payinfos: [makePayinfo({fee_rate: -1})]},
    description: 'Fee rate must be encodeable',
    error: 'ExpectedEncodeableFeeRateInBlindedPayinfoToEncode',
  },
  {
    args: {payinfos: [makePayinfo({max_htlc_mtokens: undefined})]},
    description: 'Max HTLC millitokens are required',
    error: 'ExpectedMaxHtlcMillitokensInBlindedPayinfoToEncode',
  },
  {
    args: {payinfos: [makePayinfo({max_htlc_mtokens: '18446744073709551616'})]},
    description: 'Max HTLC millitokens must be encodeable',
    error: 'ExpectedEncodeableMaxHtlcInBlindedPayinfoToEncode',
  },
  {
    args: {payinfos: [makePayinfo({min_htlc_mtokens: undefined})]},
    description: 'Min HTLC millitokens are required',
    error: 'ExpectedMinHtlcMillitokensInBlindedPayinfoToEncode',
  },
  {
    args: {payinfos: [makePayinfo({min_htlc_mtokens: '18446744073709551616'})]},
    description: 'Min HTLC millitokens must be encodeable',
    error: 'ExpectedEncodeableMinHtlcInBlindedPayinfoToEncode',
  },
  {
    args: {payinfos: [makePayinfo({features: [{bit: 524280}]})]},
    description: 'A feature bit must fit in the features length',
    error: 'ExpectedFeatureBitWithinMaximumInBlindedPayinfoToEncode',
  },
  {
    args: {payinfos: [makePayinfo({})]},
    description: 'A payinfo is encoded',
    expected: {hex: encoded},
  },
  {
    args: {payinfos: [makePayinfo({}), makePayinfo({features: [{bit: 17}]})]},
    description: 'Multiple payinfos are encoded',
    expected: {hex: `${encoded}${encoded.slice(0, -4)}0003020000`},
  },
];

tests.forEach(({args, description, error, expected}) => {
  return test(description, (t, end) => {
    if (!!error) {
      throws(() => payinfosAsHex(args), new Error(error), 'Got error');
    } else {
      strictSame(payinfosAsHex(args), expected, 'Got expected result');
    }

    return end();
  });
});
