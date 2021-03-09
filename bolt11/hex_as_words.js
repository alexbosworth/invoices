const {bech32} = require('bech32');

const encoding = 'hex';
const {toWords} = bech32;

/** Hex data as bech32 words

  {
    [hex]: <Data Hex String>
  }

  @returns
  {
    words: [<Bech32 Word Number>]
  }
*/
module.exports = ({hex}) => {
  if (!hex) {
    return {};
  }

  return {words: toWords(Buffer.from(hex, encoding))};
};
