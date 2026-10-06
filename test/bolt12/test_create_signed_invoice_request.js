const strictSame = require('node:assert').strict.deepStrictEqual;
const test = require('node:test');
const {throws} = require('node:assert').strict;

const {createSignedInvoiceRequest} = require('./../../');
const {createUnsignedInvoiceRequest} = require('./../../');
const {parseInvoiceRequest} = require('./../../');

const bob =
  '0324653eac434488002cc06bbfb7f10fe18991e35f9fe4302dbea6d2353dc0ab1c';

// From the BOLT 12 signature test vectors: Bob requests an invoice
const encoded = '0008000000000000000006035553440801640a1741204d617468656d6174' +
  '6963616c205472656174697365162102eec7245d6b7d2ccb30380bfbe2a3648cd7a9426' +
  '53f5aa340edcea1f28368661958210324653eac434488002cc06bbfb7f10fe18991e35f' +
  '9fe4302dbea6d2353dc0ab1c';

const request =
  'lnr1qqyqqqqqqqqqqqqqqcp4256ypqqkgzshgysy6ct5dpjk6ct5d93kzmpq23e' +
  'x2ct5d9ek293pqthvwfzadd7jejes8q9lhc4rvjxd022zv5l44g6qah82ru5rdpnpjkppqvjx' +
  '204vgdzgsqpvcp4mldl3plscny0rt707gvpdh6ndydfacz43euzqhrurageg3n7kafgsek6gz' +
  '3e9w52parv8gs2hlxzk95tzeswywffxlkeyhml0hh46kndmwf4m6xma3tkq2lu04qz3slje2r' +
  'fthc89vss';

const secret = Buffer.alloc(32, 0x42).toString('hex');

const signature = 'b8f83ea3288cfd6ea510cdb481472575141e8d8744157f98562d162cc1' +
  'c472526fdb24befefbdebab4dbb726bbd1b7d8aec057f8fa805187e5950d2bbe0e5642';

// Bob's payer id is not in this stream, only Alice's issuer id is
const unsignable = '0008000000000000000006035553440801640a1741204d617468656d' +
  '61746963616c205472656174697365162102eec7245d6b7d2ccb30380bfbe2a3648cd7a' +
  '942653f5aa340edcea1f283686619';

// A request that is not for an offer is complete without a signature
const refund = createUnsignedInvoiceRequest({
  description: 'refund',
  mtokens: '1000',
  payer_id: bob,
});

const tests = [
  {
    args: {signature},
    description: 'An encoded unsigned request is required',
    error: 'ExpectedHexEncodedUnsignedStreamToSignStream',
  },
  {
    args: {encoded},
    description: 'A secret or a signature is required',
    error: 'ExpectedSecretKeyOrSignatureToSignStream',
  },
  {
    args: {signature, encoded: unsignable},
    description: 'A payer id is required',
    error: 'ExpectedSigningPublicKeyRecordInStreamToSign',
  },
  {
    args: {encoded, signature: signature.replace(/a/g, 'b')},
    description: 'A valid signature is required',
    error: 'ExpectedValidSignatureForSigningPublicKeyToSignStream',
  },
  {
    args: {secret, encoded: refund.encoded},
    description: 'A request that is not for an offer is not signed',
    error: 'UnexpectedSignatureForInvoiceRequestWithoutOffer',
  },
  {
    args: {secret, encoded: `${encoded}fe773594020100`},
    description: 'An unknown even experimental request record is rejected',
    error: 'UnexpectedUnknownEvenRecordTypeInInvoiceRequest',
  },
  {
    args: {encoded, signature},
    description: 'A signed invoice request is assembled with a signature',
    expected: {request, encoded: `${encoded}f040${signature}`},
  },
  {
    args: {encoded, secret},
    description: 'A signed invoice request is assembled with a secret',
    expected: {},
  },
  {
    args: {secret, encoded: encoded.toUpperCase()},
    description: 'An uppercase encoded request is signed',
    expected: {},
  },
];

tests.forEach(({args, description, error, expected}) => {
  return test(description, (t, end) => {
    if (!!error) {
      throws(
        () => createSignedInvoiceRequest(args),
        new Error(error),
        'Got error'
      );
    } else {
      const signed = createSignedInvoiceRequest(args);

      // A signature made with a secret is not predictable, but is valid
      if (!!expected.encoded) {
        strictSame(signed, expected, 'Got expected signed request');
      }

      const parsed = parseInvoiceRequest({request: signed.request});

      strictSame(parsed.encoded, signed.encoded, 'Signed request is parsed');
    }

    return end();
  });
});
