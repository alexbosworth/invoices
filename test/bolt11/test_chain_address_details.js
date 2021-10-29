const {test} = require('@alexbosworth/tap');

const chainAddressDetails = require('./../../bolt11/chain_address_details');

const makeArgs = overrides => {
  const args = {
    address: 'mk2QpYatsKicvFVuTAQLBryyccRXMUaGHP',
    network: 'testnet',
  };

  Object.keys(overrides).forEach(k => args[k] = overrides[k]);

  return args;
};

const tests = [
  {
    args: makeArgs({address: undefined}),
    description: 'Address is required',
    error: 'ExpectedAddressToDeriveChainAddressDetails',
  },
  {
    args: makeArgs({network: undefined}),
    description: 'Network name is required',
    error: 'ExpectedNetworkToDeriveChainAddressDetails',
  },
  {
    args: makeArgs({address: 'address'}),
    description: 'A valid address is required',
    error: 'ExpectedValidAddressToDeriveChainDetails',
  },
  {
    args: makeArgs({}),
    description: 'A chain address is converted to words',
    expected: {
      hash: '3172b5654f6683c8fb146959d347ce303cae4ca7',
      version: 17,
    },
  },
];

tests.forEach(({args, description, error, expected}) => {
  return test(description, ({end, equal, strictSame, throws}) => {
    if (!!error) {
      throws(() => chainAddressDetails(args), new Error(error), 'Got err');
    } else {
      strictSame(chainAddressDetails(args), expected, 'Got expected details');
    }

    return end();
  });
});
