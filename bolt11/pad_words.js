const {max} = Math;

/** Left-pad Bech32 words with zeros

  {
    word_count: <Minimum Word Count Number>
    words: [<Bech32 Word Number>]
  }

  @returns
  {
    words: [<Bech32 Word Number>]
  }
*/
module.exports = args => {
  const padding = Array(max(0, args.word_count - args.words.length)).fill(0);

  return {words: padding.concat(args.words)};
};
