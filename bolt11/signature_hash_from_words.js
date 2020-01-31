const {createHash} = require('crypto');

const wordsAsBuffer = require('./words_as_buffer');

const hashAlgorithm = 'sha256';
const prefixEncoding = 'ascii';

/** Derive signature hash from human readable prefix and non-signature words

  {
    prefix: <Prefix String>
    words: [<Word Number>]
  }

  @returns
  {
    hash: <Payment Request Hash to Sign Buffer>
  }
*/
module.exports = ({prefix, words}) => {
  const rawPrefix = Buffer.from(prefix, prefixEncoding);

  const preimage = Buffer.concat([rawPrefix, wordsAsBuffer({words})]);

  return {hash: createHash(hashAlgorithm).update(preimage).digest()};
};
