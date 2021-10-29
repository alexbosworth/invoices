const {test} = require('@alexbosworth/tap');

const chainAddressAsWords = require('./../../bolt11/chain_address_as_words');

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
    error: 'ExpectedAddressToGetWordsForChainAddress',
  },
  {
    args: makeArgs({network: undefined}),
    description: 'Network name is required',
    error: 'ExpectedNetworkToGetWordsForChainAddress',
  },
  {
    args: makeArgs({}),
    description: 'A chain address is converted to words',
    expected: {
      words: [
        17,  6,  5, 25, 11, 10, 25, 10, 15, 12, 26, 1, 28, 17, 30, 24, 20, 13,
        5, 12, 29,  6, 17, 30, 14,  6,  0, 30, 10, 28, 19,  5,  7,
      ],
    },
  },
];

tests.forEach(({args, description, error, expected}) => {
  return test(description, ({end, equal, strictSame, throws}) => {
    if (!!error) {
      throws(() => chainAddressAsWords(args), new Error(error), 'Got err');
    } else {
      strictSame(chainAddressAsWords(args), expected, 'Got expected words');
    }

    return end();
  });
});
