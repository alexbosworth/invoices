const strictSame = require('node:assert').strict.deepStrictEqual;
const test = require('node:test');
const {throws} = require('node:assert').strict;

const taggedHash = require('./../../bolt12/tagged_hash');

const utf8AsHex = utf8 => Buffer.from(utf8, 'utf8').toString('hex');

const tests = [
  {
    args: {tag: utf8AsHex('LnLeaf')},
    description: 'Data is required',
    error: 'ExpectedHexEncodedDataToCalculateTaggedHash',
  },
  {
    args: {data: 'zz', tag: utf8AsHex('LnLeaf')},
    description: 'Hex data is required',
    error: 'ExpectedHexEncodedDataToCalculateTaggedHash',
  },
  {
    args: {data: '010203e8'},
    description: 'A tag is required',
    error: 'ExpectedHexEncodedTagToCalculateTaggedHash',
  },
  {
    args: {data: '010203e8', tag: 'zz'},
    description: 'A hex tag is required',
    error: 'ExpectedHexEncodedTagToCalculateTaggedHash',
  },
  {
    // From the BOLT 12 signature test vectors
    args: {data: '010203e8', tag: utf8AsHex('LnLeaf')},
    description: 'A leaf hash is calculated',
    expected: {
      hash: '67a2a995433890d8fe0c18a1765ad19e98f1fcfeff14c13a45bbc80964a78cf7',
    },
  },
  {
    args: {data: '01', tag: `${utf8AsHex('LnNonce')}010203e8`},
    description: 'A nonce hash is calculated',
    expected: {
      hash: '255a95f5b6b3c6997e2838dc4d9348807fb6da8eb7bbc02d30662d144718b6aa',
    },
  },
  {
    args: {
      data: '608407c18ad9a94d9ea2bcdbe170b6c20c462a7833a197621c916f78cf18e624',
      tag: utf8AsHex('lightninginvoice_requestsignature'),
    },
    description: 'A signature hash is calculated',
    expected: {
      hash: 'aefe3aa88a69772c246dcaef75ed3e7566c08ecc4e9f995233526a5651fc34cd',
    },
  },
];

tests.forEach(({args, description, error, expected}) => {
  return test(description, (t, end) => {
    if (!!error) {
      throws(() => taggedHash(args), new Error(error), 'Got expected error');
    } else {
      strictSame(taggedHash(args), expected, 'Got expected result');
    }

    return end();
  });
});
