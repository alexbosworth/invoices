const isString = n => typeof n === 'string';
const readerDisallowed = /[\p{Cc}\p{Cf}\p{Cs}\p{Co}\p{Zl}\p{Zp}]/u;
const unassigned = /(?!\p{Extended_Pictographic})\p{Cn}/u;

/** Determine if text is a valid BOLT 01 string to read and to write

  {
    text: <Text String>
  }

  @throws
  <Error>

  @returns
  {
    is_readable: <Text Is Valid For A Reader Bool>
    is_writable: <Text Is Valid For A Writer Bool>
  }
*/
module.exports = ({text}) => {
  if (!isString(text)) {
    throw new Error('ExpectedTextStringToDetermineTextValidity');
  }

  const isReadable = !readerDisallowed.test(text);

  return {
    // Control, format, private use and line separator characters are rejected
    is_readable: isReadable,
    // Unassigned characters are also not written as a reader may reject them,
    // except in the slots held for pictographs: those can be a newer emoji
    is_writable: isReadable && !unassigned.test(text),
  };
};
