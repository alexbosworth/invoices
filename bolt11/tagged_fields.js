const wordsAsNumber = require('./words_as_number');

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
    tagCode = withTags.shift();

    // Determine the tag's word length
    const len = wordsAsNumber({words: [withTags.shift(), withTags.shift()]});

    tagWords = withTags.slice(Number(), len);

    // Cut off the tag words
    withTags = withTags.slice(tagWords.length);

    fields.push({code: tagCode, words: tagWords});
  }

  return {fields};
};
