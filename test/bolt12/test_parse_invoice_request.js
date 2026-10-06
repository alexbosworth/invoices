const strictSame = require('node:assert').strict.deepStrictEqual;
const test = require('node:test');
const {throws} = require('node:assert').strict;

const {encodeTlvStream} = require('bolt01');

const hexAsString = require('./../../bolt12/hex_as_string');
const {parseInvoiceRequest} = require('./../../');

const bitcoin =
  '6fe28c0ab6f1b372c1a6a246ae63f74f931e8365e15a089c68d6190000000000';
const bob =
  '0324653eac434488002cc06bbfb7f10fe18991e35f9fe4302dbea6d2353dc0ab1c';
const byType = (a, b) => BigInt(a.type) < BigInt(b.type) ? -1 : 1;
const prefix = 'lnr';

// From the BOLT 12 signature test vectors
const request =
  'lnr1qqyqqqqqqqqqqqqqqcp4256ypqqkgzshgysy6ct5dpjk6ct5d93kzmpq23e' +
  'x2ct5d9ek293pqthvwfzadd7jejes8q9lhc4rvjxd022zv5l44g6qah82ru5rdpnpjkppqvjx' +
  '204vgdzgsqpvcp4mldl3plscny0rt707gvpdh6ndydfacz43euzqhrurageg3n7kafgsek6gz' +
  '3e9w52parv8gs2hlxzk95tzeswywffxlkeyhml0hh46kndmwf4m6xma3tkq2lu04qz3slje2r' +
  'fthc89vss';

const signature = 'b8f83ea3288cfd6ea510cdb481472575141e8d8744157f98562d162cc1' +
  'c472526fdb24befefbdebab4dbb726bbd1b7d8aec057f8fa805187e5950d2bbe0e5642';

const records = [
  {type: '0', value: '0000000000000000'},
  {type: '6', value: '555344'},
  {type: '8', value: '64'},
  {type: '10', value: '41204d617468656d61746963616c205472656174697365'},
  {
    type: '22',
    value: '02eec7245d6b7d2ccb30380bfbe2a3648cd7a942653f5aa340edcea1f283686619',
  },
  {type: '88', value: bob},
  {type: '240', value: signature},
];

const encodeRecords = extra => encodeTlvStream({
  records: [].concat(records).concat(extra),
}).encoded;

const encoded = encodeRecords([]);

const expected = {
  encoded,
  request,
  signature,
  bip353_name: undefined,
  description: undefined,
  expires_at: undefined,
  features: [],
  issuer: undefined,
  metadata: '0000000000000000',
  mtokens: undefined,
  network: 'bitcoin',
  offer: 'lno1qcp4256ypqqkgzshgysy6ct5dpjk6ct5d93kzmpq23ex2ct5d9ek293pqthvwf' +
    'zadd7jejes8q9lhc4rvjxd022zv5l44g6qah82ru5rdpnpj',
  payer_id: bob,
  payer_note: undefined,
  paths: undefined,
  quantity: undefined,
};

// Expected details for a different request stream
const expectedFor = (hex, overrides) => {
  const details = {
    ...expected,
    encoded: hex,
    request: hexAsString({prefix, hex}).string,
  };

  Object.keys(overrides).forEach(k => details[k] = overrides[k]);

  return details;
};

// A record in the signature range that is not the signature is ignored
const oddSignatureRecord = encodeRecords([{type: '241', value: '00'}]);

// A request that is not for an offer: description, amount, and payer id
const refundRecords = [
  {type: '0', value: '0000000000000000'},
  {type: '10', value: '726566756e64'},
  {type: '82', value: '03e8'},
  {type: '88', value: bob},
];

const refund = encodeTlvStream({records: refundRecords}).encoded;

// Bob's signature over the refund request, which is optional
const refundSignature = '2e5bddcf587a749d9b3c1a7608626ed8aa39ef36bcfc0ba112d5' +
  '37427b1bb7369f79c3cba9e1dbcb479494a985967ef974cbd79533d8aeb10af88070106' +
  'dcbcb';

const bitcoinRefund = encodeTlvStream({
  records: [].concat(refundRecords, {type: '80', value: bitcoin}).sort(byType),
}).encoded;

// Unknown odd records are signed, so the request has a different signature
const unknownRecords = [
  {type: '81', value: '00'},
  {type: '2000000001', value: '00'},
];

const unknownSignature = '15f05f41fbc6a2cd0ea979bfafae431a4c64a0bb70f949f600e' +
  'dafae3f4b9ba35b4a2c455ff3bc555785b47248c8a5b9c5f5bab9323bc0c60751cbbd80c' +
  '6020f';

const withUnknownRecords = alter => encodeTlvStream({
  records: [].concat(
    records.filter(n => n.type !== '240'),
    unknownRecords.map(alter),
    {type: '240', value: unknownSignature}
  ).sort(byType),
}).encoded;

const unknown = withUnknownRecords(n => n);

const tests = [
  {
    args: {},
    description: 'An encoded request or request is required',
    error: 'ExpectedEncodedRequestOrRequestToParseInvoiceRequest',
  },
  {
    args: {encoded, request},
    description: 'Only one of encoded request or request is allowed',
    error: 'UnexpectedEncodedRequestAndRequestToParseInvoiceRequest',
  },
  {
    args: {encoded: 'zz'},
    description: 'A hex encoded request is required',
    error: 'ExpectedHexEncodedInvoiceRequestToParseInvoiceRequest',
  },
  {
    args: {request: 1},
    description: 'A request string is required',
    error: 'ExpectedInvoiceRequestStringToParseInvoiceRequest',
  },
  {
    args: {request: 'lno1'},
    description: 'A request prefix is required',
    error: 'UnexpectedPrefixInBolt12String',
  },
  {
    args: {encoded: encodeRecords([{type: '160', value: '00'}])},
    description: 'Records outside of the request range are not allowed',
    error: 'UnexpectedRecordTypeOutsideRequestRangeInInvoiceRequest',
  },
  {
    args: {encoded: encodeRecords([{type: '242', value: '00'}])},
    description: 'Unknown even signature types are not allowed',
    error: 'UnexpectedUnknownEvenSignatureTypeInInvoiceRequest',
  },
  {
    args: {
      encoded: encodeTlvStream({
        records: records.filter(n => n.type !== '240'),
      }).encoded,
    },
    description: 'A signature is required',
    error: 'ExpectedSignatureInInvoiceRequest',
  },
  {
    args: {
      encoded: encodeTlvStream({
        records: records.map(n => n.type !== '240' ? n : {
          type: n.type,
          value: '00',
        }),
      }).encoded,
    },
    description: 'A valid signature encoding is required',
    error: 'ExpectedValidSignatureEncodingInInvoiceRequest',
  },
  {
    args: {
      encoded: encodeTlvStream({
        records: records.map(n => n.type !== '240' ? n : {
          type: n.type,
          value: n.value.replace(/a/g, 'b'),
        }),
      }).encoded,
    },
    description: 'A valid payer id signature is required',
    error: 'ExpectedValidPayerIdSignatureInInvoiceRequest',
  },
  {
    expected,
    args: {request},
    description: 'An invoice request is parsed',
  },
  {
    expected,
    args: {encoded},
    description: 'An encoded invoice request is parsed',
  },
  {
    expected,
    args: {request: request.toUpperCase()},
    description: 'An uppercase invoice request is parsed',
  },
  {
    expected,
    args: {encoded: encoded.toUpperCase()},
    description: 'An uppercase encoded request is parsed',
  },
  {
    args: {encoded: oddSignatureRecord},
    description: 'An odd signature range record is ignored',
    expected: expectedFor(oddSignatureRecord, {}),
  },
  {
    args: {encoded: refund},
    description: 'A request that is not for an offer has no signature',
    expected: expectedFor(refund, {
      description: 'refund',
      mtokens: '1000',
      offer: undefined,
      signature: undefined,
    }),
  },
  {
    args: {encoded: `${refund}f040${refundSignature}`},
    description: 'A signature on a request without an offer is accepted',
    expected: expectedFor(`${refund}f040${refundSignature}`, {
      description: 'refund',
      mtokens: '1000',
      offer: undefined,
      signature: refundSignature,
    }),
  },
  {
    args: {encoded: `${refund}f040${signature}`},
    description: 'A signature on a request without an offer is checked',
    error: 'ExpectedValidPayerIdSignatureInInvoiceRequest',
  },
  {
    args: {encoded: bitcoinRefund},
    description: 'A redundant bitcoin chain is parsed as bitcoin',
    expected: expectedFor(bitcoinRefund, {
      description: 'refund',
      mtokens: '1000',
      offer: undefined,
      signature: undefined,
    }),
  },
  {
    args: {encoded: unknown},
    description: 'Unknown odd request range records are ignored',
    expected: expectedFor(unknown, {signature: unknownSignature}),
  },
  {
    args: {encoded: withUnknownRecords(n => ({type: n.type, value: '01'}))},
    description: 'A changed unknown record fails the signature',
    error: 'ExpectedValidPayerIdSignatureInInvoiceRequest',
  },
];

tests.forEach(({args, description, error, expected}) => {
  return test(description, (t, end) => {
    if (!!error) {
      throws(() => parseInvoiceRequest(args), new Error(error), 'Got error');
    } else {
      strictSame(parseInvoiceRequest(args), expected, 'Got expected result');
    }

    return end();
  });
});
