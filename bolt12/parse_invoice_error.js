const hexAsRecords = require('./hex_as_records');
const hexAsUtf8 = require('./hex_as_utf8');
const truncatedAsNumber = require('./truncated_as_number');
const types = require('./conf/tlv_types');

const findRecord = (records, type) => records.find(n => n.type === type);
const isEven = type => !(BigInt(type) % BigInt(2));
const isHex = n => !(n.length % 2) && /^[0-9A-F]*$/i.test(n);
const isString = n => typeof n === 'string';
const knownTypes = Object.values(types.error);

/** Parse a BOLT 12 invoice error into its component data

  {
    encoded: <Invoice Error TLV Stream Hex String>
  }

  @throws
  <Error>

  @returns
  {
    [erroneous_field]: <Erroneous Record Type Number String>
    message: <Error Message String>
    [suggested_value]: <Suggested Record Value Hex String>
  }
*/
module.exports = ({encoded}) => {
  if (!encoded || !isString(encoded) || !isHex(encoded)) {
    throw new Error('ExpectedHexEncodedInvoiceErrorToParseInvoiceError');
  }

  const {records} = hexAsRecords({hex: encoded});

  // An unknown even record type means the error cannot be understood
  if (!records.every(n => !isEven(n.type) || knownTypes.includes(n.type))) {
    throw new Error('UnexpectedUnknownEvenRecordTypeInInvoiceError');
  }

  const erroneousField = findRecord(records, types.error.erroneous_field);
  const error = findRecord(records, types.error.error);
  const suggestedValue = findRecord(records, types.error.suggested_value);

  if (!error) {
    throw new Error('ExpectedErrorMessageInInvoiceError');
  }

  // A suggested value is only meaningful for a specific erroneous field
  if (!!suggestedValue && !erroneousField) {
    throw new Error('ExpectedErroneousFieldForSuggestedValueInInvoiceError');
  }

  const decoded = {};

  if (!!erroneousField) {
    try {
      decoded.field = truncatedAsNumber({hex: erroneousField.value}).number;
    } catch (err) {
      throw new Error('ExpectedValidErroneousFieldInInvoiceError');
    }
  }

  try {
    decoded.message = hexAsUtf8({hex: error.value}).string;
  } catch (err) {
    throw new Error('ExpectedValidUtf8ErrorMessageInInvoiceError');
  }

  return {
    erroneous_field: decoded.field,
    message: decoded.message,
    suggested_value: !suggestedValue ? undefined : suggestedValue.value,
  };
};
