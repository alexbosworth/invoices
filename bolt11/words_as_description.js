const wordsAsBuffer = require('./words_as_buffer');

const decoder = new TextDecoder('utf-8', {fatal: true, ignoreBOM: true});
const {isArray} = Array;
const trim = true;

/** Words as a description string

  {
    words: [<Bech32 Word Number>]
  }

  @throws
  <Error>

  @returns
  {
    description: <Payment Request Description String>
  }
*/
module.exports = ({words}) => {
  if (!isArray(words)) {
    throw new Error('ExpectedWordsToInterpretAsDescription');
  }

  // A fatal decoder rejects malformed UTF-8 byte sequences
  try {
    return {description: decoder.decode(wordsAsBuffer({trim, words}))};
  } catch (err) {
    throw new Error('ExpectedValidUtf8WordsToInterpretAsDescription');
  }
};
