const strictSame = require('node:assert').strict.deepStrictEqual;
const test = require('node:test');
const {throws} = require('node:assert').strict;

const edgeAsHex = require('./../../bolt12/edge_as_hex');

const tests = [
  {
    args: {},
    description: 'An edge is required',
    error: 'ExpectedEdgeFormatChannelIdToEncodeAsHex',
  },
  {
    args: {edge: 1},
    description: 'An edge string is required',
    error: 'ExpectedEdgeFormatChannelIdToEncodeAsHex',
  },
  {
    args: {edge: '1x2x3'},
    description: 'An edge with a direction is required',
    error: 'ExpectedChannelIdWithDirectionToEncodeEdgeAsHex',
  },
  {
    args: {edge: '1x2x3x2'},
    description: 'An edge direction is zero or one',
    error: 'ExpectedChannelIdWithDirectionToEncodeEdgeAsHex',
  },
  {
    args: {edge: '1x2x3x0'},
    description: 'An edge is encoded as a direction byte and raw channel id',
    expected: {hex: '000000010000020003'},
  },
  {
    args: {edge: '1x2x3x1'},
    description: 'An edge in the other direction has a direction byte of one',
    expected: {hex: '010000010000020003'},
  },
];

tests.forEach(({args, description, error, expected}) => {
  return test(description, (t, end) => {
    if (!!error) {
      throws(() => edgeAsHex(args), new Error(error), 'Got error');
    } else {
      strictSame(edgeAsHex(args), expected, 'Got expected result');
    }

    return end();
  });
});
