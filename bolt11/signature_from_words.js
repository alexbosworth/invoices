const wordsAsBuffer = require('./words_as_buffer');

const asBuffer = words => wordsAsBuffer({words, trim: true});
const recoveryFlagByteLength = 1;
const recoveryFlags = [0, 1, 2, 3];
const sigLength = 64;

/** Derive the raw signature buffer from invoice words

  {
    words: [<Word Number>]
  }

  @returns
  {
    recovery: <Recovery Flag Number>
    signature: <Signature Buffer Object>
  }
*/
module.exports = ({words}) => {
  try {
    asBuffer(words);
  } catch (err) {
    throw new Error('ExpectedValidSignatureBuffer');
  }

  // There is a recovery flag at the end of the signature buffer
  const [recovery] = asBuffer(words).slice(-recoveryFlagByteLength);

  // Eliminate the recovery flag from the signature buffer
  const signature = asBuffer(words).slice(Number(), -recoveryFlagByteLength);

  if (!(recovery in recoveryFlags) || signature.length !== sigLength) {
    throw new Error('InvalidOrMissingSignatureInPaymentRequest');
  }

  return {recovery, signature};
};
