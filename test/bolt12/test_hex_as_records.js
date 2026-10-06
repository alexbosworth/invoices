const strictSame = require('node:assert').strict.deepStrictEqual;
const test = require('node:test');
const {throws} = require('node:assert').strict;

const hexAsRecords = require('./../../bolt12/hex_as_records');

const tests = [
  {
    args: {},
    description: 'Hex is required',
    error: 'ExpectedHexEncodedTlvStreamToDecodeRecords',
  },
  {
    args: {hex: 'zz'},
    description: 'Valid hex is required',
    error: 'ExpectedHexEncodedTlvStreamToDecodeRecords',
  },
  {
    args: {hex: '0a03'},
    description: 'A valid TLV stream is required',
    error: 'ExpectedValidTlvStreamToDecodeRecords',
  },
  {
    args: {hex: '0a01000801ff'},
    description: 'Ascending record types are required',
    error: 'ExpectedAscendingRecordTypesInTlvStream',
  },
  {
    args: {hex: '0a01000a0101'},
    description: 'Repeated record types are not allowed',
    error: 'ExpectedAscendingRecordTypesInTlvStream',
  },
  {
    args: {hex: ''},
    description: 'An empty stream has no records',
    expected: {records: []},
  },
  {
    args: {hex: '00'.repeat(32769)},
    description: 'A stream is limited to the size of an onion message',
    error: 'ExpectedShorterTlvStreamToDecodeRecords',
  },
  {
    args: {hex: '0801ff0a00fe3b9aca210568656c6c6f'},
    description: 'Records are decoded from a stream',
    expected: {
      records: [
        {type: '8', value: 'ff'},
        {type: '10', value: ''},
        {type: '1000000033', value: '68656c6c6f'},
      ],
    },
  },
];

tests.forEach(({args, description, error, expected}) => {
  return test(description, (t, end) => {
    if (!!error) {
      throws(() => hexAsRecords(args), new Error(error), 'Got error');
    } else {
      strictSame(hexAsRecords(args), expected, 'Got expected result');
    }

    return end();
  });
});
