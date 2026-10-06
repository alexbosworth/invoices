const {encodeTlvStream} = require('bolt01');

const numberAsTruncated = require('./number_as_truncated');
const types = require('./conf/tlv_types');

const isHex = n => !(n.length % 2) && /^[0-9A-F]*$/i.test(n);
const isNumber = n => typeof n === 'string' && /^\d+$/.test(n);
const isString = n => typeof n === 'string';
const utf8AsHex = utf8 => Buffer.from(utf8, 'utf8').toString('hex');

/** Create a BOLT 12 invoice error for a problem with a request or an invoice

  `erroneous_field` is the type number of the request or invoice record that
  had a problem. A `suggested_value` for that field requires `erroneous_field`.

  {
    [erroneous_field]: <Erroneous Record Type Number String>
    message: <Error Message String>
    [suggested_value]: <Suggested Record Value Hex String>
  }

  @throws
  <Error>

  @returns
  {
    encoded: <Invoice Error TLV Stream Hex String>
  }
*/
module.exports = args => {
  const field = args.erroneous_field;

  if (field !== undefined && !isNumber(field)) {
    throw new Error('ExpectedErroneousFieldTypeNumberToCreateInvoiceError');
  }

  if (!args.message || !isString(args.message)) {
    throw new Error('ExpectedErrorMessageStringToCreateInvoiceError');
  }

  const hasSuggestion = args.suggested_value !== undefined;

  if (hasSuggestion && !isString(args.suggested_value)) {
    throw new Error('ExpectedSuggestedValueHexStringToCreateInvoiceError');
  }

  if (hasSuggestion && !isHex(args.suggested_value)) {
    throw new Error('ExpectedHexEncodedSuggestedValueToCreateInvoiceError');
  }

  // A suggested value is only meaningful for a specific erroneous field
  if (hasSuggestion && field === undefined) {
    throw new Error('ExpectedErroneousFieldForSuggestedValueInInvoiceError');
  }

  const encoded = {};

  // The erroneous field is the type of the record that has a problem
  if (field !== undefined) {
    encoded.field = numberAsTruncated({number: field}).hex;
  }

  if (hasSuggestion) {
    encoded.suggestion = args.suggested_value.toLowerCase();
  }

  const records = [
    {type: types.error.erroneous_field, value: encoded.field},
    {type: types.error.suggested_value, value: encoded.suggestion},
    {type: types.error.error, value: utf8AsHex(args.message)},
  ];

  const stream = encodeTlvStream({
    records: records.filter(n => n.value !== undefined),
  });

  return {encoded: stream.encoded};
};
