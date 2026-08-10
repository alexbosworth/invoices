const {isSafeInteger} = Number;
const {pow} = Math;
const wordBase = 32;

/** Convert words to a big endian int

  {
    words: [<Bech32 Word Number>]
  }

  @throws
  <Error>

  @returns
  <Big Endian Number>
*/
module.exports = ({words}) => {
  const sum = words.slice().reverse().reduce((total, word, i) => {
    return total + word * pow(wordBase, i);
  },
  Number());

  // Numbers beyond the safe range lose precision instead of staying exact
  if (!isSafeInteger(sum)) {
    throw new Error('ExpectedSafeIntegerValueToConvertWordsToNumber');
  }

  return sum;
};
