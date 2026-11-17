const numberAsWords = require('./number_as_words');
const padWords = require('./pad_words');

const maxDataWords = 1023;
const sizeWordCount = 2;

/** Encode the number of data words in a BOLT 11 tagged field

  <Data Word Count Number>

  @throws
  <Error>

  @returns
  [<Bech32 Word Number>]
*/
module.exports = wordCount => {
  if (wordCount > maxDataWords) {
    throw new Error('ExpectedTaggedFieldWithinLimitToEncodePaymentRequest');
  }

  const {words} = numberAsWords({number: wordCount});

  return padWords({word_count: sizeWordCount, words}).words;
};
