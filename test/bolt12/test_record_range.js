const strictSame = require('node:assert').strict.deepStrictEqual;
const test = require('node:test');
const {throws} = require('node:assert').strict;

const recordRange = require('./../../bolt12/record_range');

const tests = [
  {
    args: {},
    description: 'A type is required',
    error: 'ExpectedRecordTypeNumberStringToDetermineRecordRange',
  },
  {
    args: {type: 1},
    description: 'A type number string is required',
    error: 'ExpectedRecordTypeNumberStringToDetermineRecordRange',
  },
  {
    args: {type: '0'},
    description: 'Type zero is the request metadata',
    expected: {range: 'request'},
  },
  {
    args: {type: '1'},
    description: 'Offer range starts at type one',
    expected: {range: 'offer'},
  },
  {
    args: {type: '79'},
    description: 'Offer range ends at type 79',
    expected: {range: 'offer'},
  },
  {
    args: {type: '80'},
    description: 'Request range starts at type 80',
    expected: {range: 'request'},
  },
  {
    args: {type: '159'},
    description: 'Request range ends at type 159',
    expected: {range: 'request'},
  },
  {
    args: {type: '160'},
    description: 'Invoice range starts at type 160',
    expected: {range: 'invoice'},
  },
  {
    args: {type: '239'},
    description: 'Invoice range ends at type 239',
    expected: {range: 'invoice'},
  },
  {
    args: {type: '240'},
    description: 'Signature range starts at type 240',
    expected: {range: 'signature'},
  },
  {
    args: {type: '1000'},
    description: 'Signature range ends at type 1000',
    expected: {range: 'signature'},
  },
  {
    args: {type: '1001'},
    description: 'Types after the signature range are not in a range',
    expected: {range: undefined},
  },
  {
    args: {type: '999999999'},
    description: 'Types before the experimental ranges are not in a range',
    expected: {range: undefined},
  },
  {
    args: {type: '1000000000'},
    description: 'Experimental offer range',
    expected: {range: 'offer'},
  },
  {
    args: {type: '1999999999'},
    description: 'Experimental offer range ends at type 1999999999',
    expected: {range: 'offer'},
  },
  {
    args: {type: '2000000000'},
    description: 'Experimental request range',
    expected: {range: 'request'},
  },
  {
    args: {type: '2999999999'},
    description: 'Experimental request range ends at type 2999999999',
    expected: {range: 'request'},
  },
  {
    args: {type: '3000000000'},
    description: 'Experimental invoice range starts at type 3000000000',
    expected: {range: 'invoice'},
  },
  {
    args: {type: '3999999999'},
    description: 'Experimental invoice range',
    expected: {range: 'invoice'},
  },
  {
    args: {type: '4000000000'},
    description: 'Types after the experimental ranges are not in a range',
    expected: {range: undefined},
  },
];

tests.forEach(({args, description, error, expected}) => {
  return test(description, (t, end) => {
    if (!!error) {
      throws(() => recordRange(args), new Error(error), 'Got expected error');
    } else {
      strictSame(recordRange(args), expected, 'Got expected result');
    }

    return end();
  });
});
