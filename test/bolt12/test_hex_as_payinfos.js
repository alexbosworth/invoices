const strictSame = require('node:assert').strict.deepStrictEqual;
const test = require('node:test');
const {throws} = require('node:assert').strict;

const hexAsPayinfos = require('./../../bolt12/hex_as_payinfos');

const encoded = '000003e800000064009000000000000003e80000000005f5e1000000';

const payinfo = {
  base_fee_mtokens: '1000',
  cltv_delta: 144,
  features: [],
  fee_rate: 100,
  max_htlc_mtokens: '100000000',
  min_htlc_mtokens: '1000',
};

const tests = [
  {
    args: {},
    description: 'Hex is required',
    error: 'ExpectedHexEncodedBlindedPayinfosToDecode',
  },
  {
    args: {hex: 'zz'},
    description: 'Valid hex is required',
    error: 'ExpectedHexEncodedBlindedPayinfosToDecode',
  },
  {
    args: {hex: '00'},
    description: 'A base fee is required',
    error: 'ExpectedBaseFeeInBlindedPayinfo',
  },
  {
    args: {hex: encoded.slice(0, 8)},
    description: 'A fee rate is required',
    error: 'ExpectedFeeRateInBlindedPayinfo',
  },
  {
    args: {hex: encoded.slice(0, 16)},
    description: 'A CLTV delta is required',
    error: 'ExpectedCltvDeltaInBlindedPayinfo',
  },
  {
    args: {hex: encoded.slice(0, 20)},
    description: 'A min HTLC is required',
    error: 'ExpectedMinHtlcInPayinfo',
  },
  {
    args: {hex: encoded.slice(0, 36)},
    description: 'A max HTLC is required',
    error: 'ExpectedMaxHtlcInPayinfo',
  },
  {
    args: {hex: encoded.slice(0, 52)},
    description: 'A features length is required',
    error: 'ExpectedFeaturesLengthInBlindedPayinfo',
  },
  {
    args: {hex: `${encoded.slice(0, 52)}0001`},
    description: 'Features are required',
    error: 'ExpectedFeaturesInBlindedPayinfo',
  },
  {
    args: {hex: ''},
    description: 'No data means no payinfos',
    expected: {payinfos: []},
  },
  {
    args: {hex: encoded},
    description: 'A payinfo is decoded',
    expected: {payinfos: [payinfo]},
  },
  {
    args: {hex: `${encoded}${encoded.slice(0, -4)}0003020000`},
    description: 'Multiple payinfos are decoded',
    expected: {
      payinfos: [
        payinfo,
        {
          base_fee_mtokens: '1000',
          cltv_delta: 144,
          features: [
            {bit: 17, is_required: false, type: 'multipath_payments_v0'},
          ],
          fee_rate: 100,
          max_htlc_mtokens: '100000000',
          min_htlc_mtokens: '1000',
        },
      ],
    },
  },
];

tests.forEach(({args, description, error, expected}) => {
  return test(description, (t, end) => {
    if (!!error) {
      throws(() => hexAsPayinfos(args), new Error(error), 'Got error');
    } else {
      strictSame(hexAsPayinfos(args), expected, 'Got expected result');
    }

    return end();
  });
});
