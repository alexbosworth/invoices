const strictSame = require('node:assert').strict.deepStrictEqual;
const test = require('node:test');
const {throws} = require('node:assert').strict;

const recordsAsOffer = require('./../../bolt12/records_as_offer');

const issuerId = {
  type: '22',
  value: '02eec7245d6b7d2ccb30380bfbe2a3648cd7a942653f5aa340edcea1f283686619',
};

const description = {type: '10', value: '5465737420766563746f7273'};

const makeExpected = overrides => {
  const details = {
    amount: undefined,
    currency: undefined,
    description: undefined,
    expires_at: undefined,
    features: [],
    is_expired: false,
    issuer: undefined,
    issuer_id: issuerId.value,
    max_quantity: undefined,
    metadata: undefined,
    mtokens: undefined,
    networks: ['bitcoin'],
    paths: undefined,
  };

  Object.keys(overrides).forEach(k => details[k] = overrides[k]);

  return details;
};

const afterNetworkChange = ({networks}) => {
  const args = {records: [issuerId]};

  const offer = recordsAsOffer(args);

  offer.networks.splice(Number(), offer.networks.length, ...networks);

  return recordsAsOffer(args);
};

const tests = [
  {
    args: {},
    description: 'Records are required',
    error: 'ExpectedArrayOfRecordsToDeriveOfferDetails',
  },
  {
    args: {records: [{}]},
    description: 'Record types and values are required',
    error: 'ExpectedRecordTypesAndValuesToDeriveOfferDetails',
  },
  {
    args: {records: [{type: '22', value: '00'}]},
    description: 'A public key issuer id is required',
    error: 'ExpectedPublicKeyIssuerIdInOffer',
  },
  {
    args: {records: [description, issuerId, {type: '8', value: '0001'}]},
    description: 'A minimally encoded amount is required',
    error: 'ExpectedValidAmountInOffer',
  },
  {
    args: {records: [description, issuerId, {type: '14', value: '0001'}]},
    description: 'A minimally encoded expiry is required',
    error: 'ExpectedValidAbsoluteExpiryInOffer',
  },
  {
    args: {records: [description, issuerId, {type: '16', value: ''}]},
    description: 'Paths are required in offer paths',
    error: 'ExpectedBlindedPathsInOfferPaths',
  },
  {
    args: {records: [description, issuerId, {type: '20', value: '0001'}]},
    description: 'A minimally encoded quantity max is required',
    error: 'ExpectedValidQuantityMaxInOffer',
  },
  {
    args: {records: [{type: '10', value: '00'}]},
    description: 'An issuer id or paths is required',
    error: 'ExpectedIssuerIdOrPathsInOffer',
  },
  {
    args: {records: [{type: '10', value: '00'}], is_issuer_optional: true},
    description: 'An issuer id or paths is not required when optional',
    expected: makeExpected({description: '\u0000', issuer_id: undefined}),
  },
  {
    args: {records: [{type: '88', value: '00'}, issuerId]},
    description: 'Records outside of the offer range are ignored',
    expected: makeExpected({}),
  },
  {
    args: {records: [{type: '4', value: ''}, issuerId]},
    description: 'Empty metadata is returned',
    expected: makeExpected({metadata: ''}),
  },
  {
    args: {records: [{type: '12', value: ''}, issuerId]},
    description: 'Empty features are returned',
    expected: makeExpected({features: []}),
  },
  {
    args: {networks: ['bitcoin', 'testnet']},
    description: 'Adding a network does not affect later offers',
    expected: makeExpected({}),
    method: afterNetworkChange,
  },
  {
    args: {networks: []},
    description: 'Clearing networks does not affect later offers',
    expected: makeExpected({}),
    method: afterNetworkChange,
  },
];

tests.forEach(({args, description, error, expected, method}) => {
  return test(description, (t, end) => {
    const derive = method || recordsAsOffer;

    if (!!error) {
      throws(() => derive(args), new Error(error), 'Got error');
    } else {
      strictSame(derive(args), expected, 'Got expected result');
    }

    return end();
  });
});
