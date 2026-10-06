const strictSame = require('node:assert').strict.deepStrictEqual;
const test = require('node:test');

const {createOffer} = require('./../../');
const vectors = require('./vectors/offers.json');

const description = 'Test vectors';

const issuerId =
  '02eec7245d6b7d2ccb30380bfbe2a3648cd7a942653f5aa340edcea1f283686619';

const key =
  '020202020202020202020202020202020202020202020202020202020202020202';

const path = {
  key,
  hops: [
    {encrypted_data: '00'.repeat(16), relay_key: key},
    {encrypted_data: '11'.repeat(8), relay_key: key},
  ],
  introduction_node:
    '0324653eac434488002cc06bbfb7f10fe18991e35f9fe4302dbea6d2353dc0ab1c',
};

const offerVector = description => vectors.find(n => {
  return n.description === description;
}).bolt12;

// Arguments that recreate the valid BOLT 12 offer test vectors
const tests = [
  {
    args: {issuer_id: issuerId},
    description: 'Minimal bolt12 offer',
    expected: {offer: offerVector('Minimal bolt12 offer')},
  },
  {
    args: {description, issuer_id: issuerId},
    description: 'An offer with description but no amount',
    expected: {offer: offerVector('with description (but no amount)')},
  },
  {
    args: {description, issuer_id: issuerId, networks: ['testnet']},
    description: 'An offer for testnet',
    expected: {offer: offerVector('for testnet')},
  },
  {
    args: {description, issuer_id: issuerId, networks: ['bitcoin']},
    description: 'An offer for bitcoin omits the chain',
    expected: {offer: offerVector('with description (but no amount)')},
  },
  {
    args: {description, issuer_id: issuerId, metadata: '00'.repeat(16)},
    description: 'An offer with metadata',
    expected: {offer: offerVector('with metadata')},
  },
  {
    args: {description, issuer_id: issuerId, mtokens: '10000'},
    description: 'An offer with an amount',
    expected: {offer: offerVector('with amount')},
  },
  {
    args: {description, amount: '10000', currency: 'USD', issuer_id: issuerId},
    description: 'An offer with a currency amount',
    expected: {offer: offerVector('with currency')},
  },
  {
    args: {
      description,
      expires_at: '2034-12-31T13:30:00.000Z',
      issuer_id: issuerId,
    },
    description: 'An offer with an expiry',
    expected: {offer: offerVector('with expiry')},
  },
  {
    args: {
      description,
      issuer: 'https://bolt12.org BOLT12 industries',
      issuer_id: issuerId,
    },
    description: 'An offer with an issuer',
    expected: {offer: offerVector('with issuer')},
  },
  {
    args: {description, issuer_id: issuerId, max_quantity: 5},
    description: 'An offer with a quantity',
    expected: {offer: offerVector('with quantity')},
  },
  {
    args: {description, issuer_id: issuerId, max_quantity: 0},
    description: 'An offer with an unlimited quantity',
    expected: {offer: offerVector('with unlimited (or unknown) quantity')},
  },
  {
    args: {description, features: [{bit: 99}], issuer_id: issuerId},
    description: 'An offer with a feature',
    expected: {offer: offerVector('with feature')},
  },
  {
    args: {description, issuer_id: issuerId, paths: [path]},
    description: 'An offer with a blinded path',
    expected: {
      offer: offerVector(
        'with blinded path via Bob (0x424242...), path_key 020202...'
      ),
    },
  },
  {
    args: {description, paths: [path]},
    description: 'An offer with a blinded path and no issuer id',
    expected: {
      offer: offerVector(
        'with no issuer_id and blinded path via Bob (0x424242...), ' +
        'path_key 020202...'
      ),
    },
  },
  {
    args: {
      description,
      issuer_id: issuerId,
      paths: [
        path,
        {
          key,
          hops: [
            path.hops[0],
            {encrypted_data: '22'.repeat(8), relay_key: key},
          ],
          introduction_edge: '1x2x3x1',
        },
      ],
    },
    description: 'An offer with two blinded paths',
    expected: {
      offer: offerVector(
        '... and with second blinded path via 1x2x3 (direction 1), ' +
        'path_key 020202...'
      ),
    },
  },
  {
    args: {description, features: [], issuer_id: issuerId},
    description: 'An offer with empty features omits features',
    expected: {offer: offerVector('with description (but no amount)')},
  },
];

tests.forEach(({args, description, expected}) => {
  return test(description, (t, end) => {
    strictSame(createOffer(args), expected, 'Got expected offer');

    return end();
  });
});
