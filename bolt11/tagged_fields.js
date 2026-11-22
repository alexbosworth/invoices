const wordsAsNumber = require('./words_as_number');

const headerWordsCount = 3;

/** Derive tagged fields from words

  {
    words: [<Word Number>]
  }

  @returns
  {
    fields: [{
      code: <Payment Request Element Code Number>
      words: [<Element Word Number>]
    }]
  }
*/
module.exports = ({words}) => {
  const fields = [];
  let tagCode;
  let tagWords;
  let withTags = words.slice();

  while (!!withTags.length) {
    // A field starts with a type word and two words of data length
    if (withTags.length < headerWordsCount) {
      throw new Error('ExpectedCompleteTaggedFieldInPaymentRequest');
    }

    tagCode = withTags.shift();

    // Determine the tag's word length
    const len = wordsAsNumber({words: [withTags.shift(), withTags.shift()]});

    tagWords = withTags.slice(Number(), len);

    // The data length cannot run past the end of the words
    if (tagWords.length !== len) {
      throw new Error('ExpectedCompleteTaggedFieldInPaymentRequest');
    }

    // Cut off the tag words
    withTags = withTags.slice(tagWords.length);

    fields.push({code: tagCode, words: tagWords});
  }

  return {fields};
};
