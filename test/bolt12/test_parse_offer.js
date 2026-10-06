const strictSame = require('node:assert').strict.deepStrictEqual;
const test = require('node:test');
const {throws} = require('node:assert').strict;

const {encodeTlvStream} = require('bolt01');

const hexAsString = require('./../../bolt12/hex_as_string');
const {parseOffer} = require('./../../');
const stringAsHex = require('./../../bolt12/string_as_hex');
const vectors = require('./vectors/offers.json');

const issuerId =
  '02eec7245d6b7d2ccb30380bfbe2a3648cd7a942653f5aa340edcea1f283686619';

const key =
  '020202020202020202020202020202020202020202020202020202020202020202';

// A point encoding that is not a valid public key
const invalidKey = `02${'ff'.repeat(32)}`;

const bitcoin =
  '6fe28c0ab6f1b372c1a6a246ae63f74f931e8365e15a089c68d6190000000000';

const prefix = 'lno';

// Encode offer records as an offer string
const asOffer = records => hexAsString({
  prefix,
  hex: encodeTlvStream({records}).encoded,
}).string;

// An offer that repeats the bitcoin chain
const repeatedChainsOffer = asOffer([
  {type: '2', value: `${bitcoin}${bitcoin}`},
  {type: '10', value: Buffer.from('Test vectors').toString('hex')},
  {type: '22', value: issuerId},
]);

// An offer that expired one second after the epoch
const expiredOffer = 'lno1pgx9getnwss8vetrw3hhyucwqyq3vggzamrjghtt05kvkvpcp0' +
  'a79gmy3nt6jsn98ad2xs8de6sl9qmgvcvs';

// An offer that expires at the maximum date
const farFutureOffer = 'lno1pgx9getnwss8vetrw3hhyucwqcrahz5lzsqpvggzamrjghtt' +
  '05kvkvpcp0a79gmy3nt6jsn98ad2xs8de6sl9qmgvcvs';

// Offer records for a description with an issuer id and a single path
const pathOffer = path => asOffer([
  {type: '10', value: Buffer.from('Test vectors').toString('hex')},
  {type: '16', value: path},
  {type: '22', value: issuerId},
]);

// A single hop with a one byte encrypted data payload
const hop = `${key}000100`;

const path = {
  key,
  hops: [
    {encrypted_data: '00'.repeat(16), relay_key: key},
    {encrypted_data: '11'.repeat(8), relay_key: key},
  ],
  introduction_node:
    '0324653eac434488002cc06bbfb7f10fe18991e35f9fe4302dbea6d2353dc0ab1c',
};

const noIssuerPath =
  'with no issuer_id and blinded path via Bob (0x424242...), ' +
  'path_key 020202...';

const secondPath =
  '... and with second blinded path via 1x2x3 (direction 1), ' +
  'path_key 020202...';

// Expected details for the valid BOLT 12 offer test vectors
const expected = {
  'Minimal bolt12 offer': {issuer_id: issuerId},
  'with description (but no amount)': {description: 'Test vectors'},
  'for testnet': {description: 'Test vectors', networks: ['testnet']},
  'for bitcoin (redundant)': {description: 'Test vectors'},
  // The unknown liquid chain is not included in the known networks
  'for bitcoin or liquidv1': {description: 'Test vectors'},
  'with metadata': {description: 'Test vectors', metadata: '00'.repeat(16)},
  'with amount': {description: 'Test vectors', mtokens: '10000'},
  'with currency': {
    amount: '10000',
    currency: 'USD',
    description: 'Test vectors',
  },
  'with expiry': {
    description: 'Test vectors',
    expires_at: '2034-12-31T13:30:00.000Z',
  },
  'with issuer': {
    description: 'Test vectors',
    issuer: 'https://bolt12.org BOLT12 industries',
  },
  'with quantity': {description: 'Test vectors', max_quantity: 5},
  'with unlimited (or unknown) quantity': {
    description: 'Test vectors',
    max_quantity: 0,
  },
  'with single quantity (weird but valid)': {
    description: 'Test vectors',
    max_quantity: 1,
  },
  'with feature': {
    description: 'Test vectors',
    features: [{bit: 99, is_required: false, type: undefined}],
  },
  'with blinded path via Bob (0x424242...), path_key 020202...': {
    description: 'Test vectors',
    paths: [path],
  },
  'same, with blinded path first_node_id using sciddir': {
    description: 'Test vectors',
    paths: [{key, hops: path.hops, introduction_edge: '0x0x42x0'}],
  },
  [noIssuerPath]: {
    description: 'Test vectors',
    issuer_id: undefined,
    paths: [path],
  },
  [secondPath]: {
    description: 'Test vectors',
    paths: [
      path,
      {
        key,
        hops: [path.hops[0], {encrypted_data: '22'.repeat(8), relay_key: key}],
        introduction_edge: '1x2x3x1',
      },
    ],
  },
  'unknown odd field': {description: 'Test vectors'},
  'unknown odd experimental field': {description: 'Test vectors'},
};

// Errors for the invalid BOLT 12 offer test vectors
const errors = {
  'Malformed: fields out of order': 'ExpectedAscendingRecordTypesInTlvStream',
  'Malformed: unknown even TLV type 78':
    'UnexpectedUnknownEvenRecordTypeInOffer',
  'Malformed: empty': 'ExpectedIssuerIdOrPathsInOffer',
  'Malformed: truncated at type': 'ExpectedValidTlvStreamToDecodeRecords',
  'Malformed: truncated in length': 'ExpectedValidTlvStreamToDecodeRecords',
  'Malformed: truncated after length': 'ExpectedValidTlvStreamToDecodeRecords',
  'Malformed: truncated in description':
    'ExpectedValidTlvStreamToDecodeRecords',
  'Malformed: invalid offer_chains length': 'ExpectedChainHashesInOfferChains',
  'Malformed: truncated currency UTF-8': 'ExpectedAmountInOfferWithCurrency',
  'Malformed: invalid currency UTF-8': 'ExpectedValidUtf8CurrencyInOffer',
  'Malformed: truncated description UTF-8':
    'ExpectedValidUtf8DescriptionInOffer',
  'Malformed: invalid description UTF-8': 'ExpectedValidUtf8DescriptionInOffer',
  'Malformed: truncated offer_paths': 'ExpectedValidBlindedPathsInOffer',
  'Malformed: zero num_hops in blinded_path':
    'ExpectedAscendingRecordTypesInTlvStream',
  'Malformed: truncated onionmsg_hop in blinded_path':
    'ExpectedValidTlvStreamToDecodeRecords',
  'Malformed: bad first_node_id in blinded_path':
    'ExpectedAscendingRecordTypesInTlvStream',
  'Malformed: bad path_key in blinded_path':
    'ExpectedAscendingRecordTypesInTlvStream',
  'Malformed: bad blinded_node_id in onionmsg_hop':
    'ExpectedAscendingRecordTypesInTlvStream',
  'Malformed: truncated issuer UTF-8': 'ExpectedValidUtf8IssuerInOffer',
  'Malformed: invalid issuer UTF-8': 'ExpectedValidUtf8IssuerInOffer',
  'Malformed: invalid offer_issuer_id': 'ExpectedValidPublicKeyIssuerIdInOffer',
  'Contains type >= 80': 'UnexpectedRecordTypeOutsideOfferRangeInOffer',
  'Contains type > 1999999999': 'ExpectedValidTlvStreamToDecodeRecords',
  'Contains unknown even type (1000000002)':
    'ExpectedValidTlvStreamToDecodeRecords',
  'Contains unknown feature 122': 'UnexpectedUnknownRequiredFeatureBitInOffer',
  'Missing offer_description, but has offer_amount':
    'ExpectedDescriptionInOfferWithAmount',
  'Missing offer_amount with offer_currency':
    'ExpectedAmountInOfferWithCurrency',
  'Invalid: zero offer_amount': 'ExpectedNonZeroAmountInOffer',
  'Invalid: zero offer_amount with currency': 'ExpectedNonZeroAmountInOffer',
  'Missing offer_issuer_id and no offer_path': 'ExpectedIssuerIdOrPathsInOffer',
  'Second offer_path is empty': 'ExpectedValidBlindedPathsInOffer',
  'offer_chains with zero entries': 'ExpectedChainsInOfferChains',
  'Bech32 padding exceeds 4-bit limit':
    'ExpectedValidBech32PaddingInBolt12String',
};

// Expected details of a parsed offer string
const makeExpected = (offer, overrides) => {
  const details = {
    offer,
    amount: undefined,
    currency: undefined,
    description: undefined,
    encoded: stringAsHex({prefix, string: offer}).hex,
    expires_at: undefined,
    features: [],
    is_expired: false,
    issuer: undefined,
    issuer_id: issuerId,
    max_quantity: undefined,
    metadata: undefined,
    mtokens: undefined,
    networks: ['bitcoin'],
    paths: undefined,
  };

  Object.keys(overrides).forEach(k => details[k] = overrides[k]);

  return details;
};

const tests = [
  {
    args: {},
    description: 'An offer is required',
    error: 'ExpectedOfferStringToParseOffer',
  },
  {
    args: {offer: 'lni1'},
    description: 'An offer prefix is required',
    error: 'UnexpectedPrefixInBolt12String',
  },
  {
    args: {encoded: `1621${issuerId}`, offer: 'lno1'},
    description: 'Only one of an encoded offer or an offer is allowed',
    error: 'UnexpectedEncodedOfferAndOfferToParseOffer',
  },
  {
    args: {encoded: 'zz'},
    description: 'A hex encoded offer is required',
    error: 'ExpectedHexEncodedOfferToParseOffer',
  },
  {
    // Absolute expiry beyond the maximum date
    args: {
      offer: 'lno1pgx9getnwss8vetrw3hhyucwprllllllllllllckyypwa3eyt44h6tx' +
        'txquqh7lz5djge4afgfjn7k4rgrkuag0jsd5xvxg',
    },
    description: 'An offer with an out of range expiry is not parsed',
    error: 'ExpectedAbsoluteExpiryWithinDateRangeInOffer',
  },
  {
    // Quantity max beyond the safe integer range
    args: {
      offer: 'lno1pgx9getnwss8vetrw3hhyuc5prllllllllllllckyypwa3eyt44h6tx' +
        'txquqh7lz5djge4afgfjn7k4rgrkuag0jsd5xvxg',
    },
    description: 'An offer with an out of range quantity max is not parsed',
    error: 'ExpectedQuantityMaxWithinSafeRangeInOffer',
  },
  {
    args: {offer: repeatedChainsOffer},
    description: 'A repeated chain is a single network',
    expected: makeExpected(repeatedChainsOffer, {description: 'Test vectors'}),
  },
  {
    args: {offer: expiredOffer},
    description: 'An expired offer is parsed as expired',
    expected: makeExpected(expiredOffer, {
      description: 'Test vectors',
      expires_at: '1970-01-01T00:00:01.000Z',
      is_expired: true,
    }),
  },
  {
    // A correctly encoded record type after the experimental offer range
    args: {
      offer: 'lno1pgx9getnwss8vetrw3hhyuckyypwa3eyt44h6txtxquqh7lz5djge4a' +
        'fgfjn7k4rgrkuag0jsd5xvx07wu6egqpqdl3gcz4k7xeh9sdx5fr2uclhf7f3aqm' +
        '9u9dq38rg6cvsqqqqqqqq',
    },
    description: 'An offer with a record type after the offer range is invalid',
    error: 'UnexpectedRecordTypeOutsideOfferRangeInOffer',
  },
  {
    // A correctly encoded unknown even experimental record type 1000000002
    args: {
      offer: 'lno1pgx9getnwss8vetrw3hhyuckyypwa3eyt44h6txtxquqh7lz5djge4a' +
        'fgfjn7k4rgrkuag0jsd5xvx078wdv5qspqq',
    },
    description: 'An offer with an unknown even experimental type is invalid',
    error: 'UnexpectedUnknownEvenRecordTypeInOffer',
  },
  {
    // An offer that is only for the liquid chain
    args: {
      offer: 'lno1qgspge38tqmzyrdjj3x2qkdr5y80dlfw56ztq6yd9sme995g3gsxqqc' +
        '2p32x2um5ypmx2cm5dae8x93pqthvwfzadd7jejes8q9lhc4rvjxd022zv5l44g6' +
        'qah82ru5rdpnpj',
    },
    description: 'An offer without any known chain is not parsed',
    error: 'ExpectedKnownChainInOfferChains',
  },
  {
    args: {offer: farFutureOffer},
    description: 'An offer that expires far in the future is not expired',
    expected: makeExpected(farFutureOffer, {
      description: 'Test vectors',
      expires_at: '+275745-01-04T19:56:48.000Z',
      is_expired: false,
    }),
  },
  // The test vector for this case has an incorrectly sized offer_paths record
  {
    args: {offer: pathOffer(`${key}${key}00`)},
    description: 'An offer path with zero hops is invalid',
    error: 'ExpectedValidBlindedPathsInOffer',
  },
  // The test vector for this case has an incorrectly sized offer_paths record
  {
    args: {offer: pathOffer(`${invalidKey}${key}01${hop}`)},
    description: 'An offer path with an invalid introduction node is invalid',
    error: 'ExpectedValidBlindedPathsInOffer',
  },
  // The test vector for this case has an incorrectly sized offer_paths record
  {
    args: {offer: pathOffer(`${key}${invalidKey}01${hop}`)},
    description: 'An offer path with an invalid path key is invalid',
    error: 'ExpectedValidBlindedPathsInOffer',
  },
  // The test vector for this case has an incorrectly sized offer_paths record
  {
    args: {offer: pathOffer(`${key}${key}01${invalidKey}000100`)},
    description: 'An offer path with an invalid hop node id is invalid',
    error: 'ExpectedValidBlindedPathsInOffer',
  },
  // The test vector for this case is truncated at the TLV level
  {
    args: {offer: pathOffer(`${key}${key}01${key}001000`)},
    description: 'An offer path with a truncated hop is invalid',
    error: 'ExpectedValidBlindedPathsInOffer',
  },
  // The test vector for this case fails for its missing offer_amount instead
  {
    args: {
      offer: asOffer([
        {type: '6', value: 'c2'},
        {type: '8', value: '2710'},
        {type: '10', value: Buffer.from('Test vectors').toString('hex')},
        {type: '22', value: issuerId},
      ]),
    },
    description: 'An offer with a truncated currency UTF-8 sequence is invalid',
    error: 'ExpectedValidUtf8CurrencyInOffer',
  },
];

vectors.forEach(vector => {
  // An offer for an unknown chain is valid but is not supported for parsing
  const isValid = vector.valid && !errors[vector.description];

  tests.push({
    args: {offer: vector.bolt12},
    description: `Offer vector: ${vector.description}`,
    error: isValid ? undefined : errors[vector.description],
    expected: !isValid ? undefined : makeExpected(vector.bolt12, {
      ...expected[vector.description],
    }),
  });

  // A valid offer parses the same from its encoded TLV stream
  if (isValid) {
    tests.push({
      args: {encoded: stringAsHex({prefix, string: vector.bolt12}).hex},
      description: `Encoded offer vector: ${vector.description}`,
      expected: makeExpected(vector.bolt12, expected[vector.description]),
    });
  }
});

tests.forEach(({args, description, error, expected}) => {
  return test(description, (t, end) => {
    if (!!error) {
      throws(() => parseOffer(args), new Error(error), 'Got expected error');
    } else {
      strictSame(parseOffer(args), expected, 'Got expected offer details');
    }

    return end();
  });
});
