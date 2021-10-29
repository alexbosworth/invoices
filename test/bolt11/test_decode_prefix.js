const {test} = require('@alexbosworth/tap');

const decodePrefix = require('./../../bolt11/decode_prefix');

const makeArgs = overrides => {
  const args = {prefix: 'lnbc1p'};

  Object.keys(overrides).forEach(k => args[k] = overrides[k]);

  return args;
};

const tests = [
  {
    args: makeArgs({prefix: 'prefix'}),
    description: 'A valid prefix is required',
    error: 'InvalidPaymentRequestPrefix',
  },
  {
    args: makeArgs({prefix: 'lnzz'}),
    description: 'A known network prefix is required',
    error: 'UnknownCurrencyCodeInPaymentRequest',
  },
  {
    args: makeArgs({}),
    description: 'A prefix is decoded',
    expected: {amount: '1', network: 'bitcoin', units: 'p'},
  },
];

tests.forEach(({args, description, error, expected}) => {
  return test(description, ({end, equal, strictSame, throws}) => {
    if (!!error) {
      throws(() => decodePrefix(args), new Error(error), 'Got err');
    } else {
      strictSame(decodePrefix(args), expected, 'Got expected details');
    }

    return end();
  });
});
