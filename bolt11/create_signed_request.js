const {createHash} = require('crypto');

const {bech32} = require('bech32');
const {recover} = require('tiny-secp256k1');

const ephemeralSignature = require('./ephemeral_signature');
const fieldTypes = require('./conf/tagged_fields');
const hexAsWords = require('./hex_as_words');
const taggedFields = require('./tagged_fields');
const wordsAsBuffer = require('./words_as_buffer');

const blindedPathLabel = 'blinded_path';
const {encode} = bech32;
const hexAsBuffer = hex => Buffer.from(hex, 'hex');
const {isArray} = Array;
const {keys} = Object;
const {MAX_SAFE_INTEGER} = Number;
const padding = '0';
const recoveryFlags = [0, 1, 2, 3];
const timestampWordLength = 7;

/** Assemble a signed payment request

  `signature` is not required when using blinded paths in the request

  {
    [destination]: <Destination Public Key Hex String>
    hrp: <Request Human Readable Part String>
    [signature]: <Request Hash Signature Hex String>
    tags: [<Request Tag Word Number>]
  }

  @throws
  <Error>

  @returns
  {
    request: <BOLT 11 Encoded Payment Request String>
  }
*/
module.exports = ({destination, hrp, signature, tags}) => {
  // A request without a destination or signature is signed with a random key
  const isSelfSigned = !destination && !signature;

  if (!isSelfSigned && !destination) {
    throw new Error('ExpectedDestinationForSignedPaymentRequest');
  }

  if (!hrp) {
    throw new Error('ExpectedHrpForSignedPaymentRequest');
  }

  if (!isSelfSigned && !signature) {
    throw new Error('ExpectedRequestSignatureForSignedPaymentRequest');
  }

  try {
    hexAsWords({hex: signature});
  } catch (err) {
    throw new Error('ExpectedValidSignatureHexForSignedPaymentRequest');
  }

  if (!isArray(tags)) {
    throw new Error('ExpectedRequestTagsForSignedPaymentRequest');
  }

  const {fields} = taggedFields({words: tags.slice(timestampWordLength)});

  const blindedPathType = keys(fieldTypes).find(type => {
    return fieldTypes[type].label === blindedPathLabel;
  });

  const hasBlindedPath = fields.some(n => n.code === Number(blindedPathType));

  // Only a request with blinded paths can be signed with an ephemeral key
  if (isSelfSigned && !hasBlindedPath) {
    throw new Error('ExpectedSignatureForPaymentRequestWithoutBlindedPaths');
  }

  const preimage = Buffer.concat([
    Buffer.from(hrp, 'ascii'),
    wordsAsBuffer({words: tags}),
  ]);

  const hash = createHash('sha256').update(preimage).digest();

  const signing = isSelfSigned ? ephemeralSignature({hash}) : {
    signature,
    public_key: destination,
  };

  const destinationKey = hexAsBuffer(signing.public_key);
  const sig = hexAsBuffer(signing.signature);

  // Find the recovery flag that works for this signature
  const recoveryFlag = recoveryFlags.find(flag => {
    try {
      const key = Buffer.from(recover(hash, sig, flag, true));

      return key.equals(destinationKey);
    } catch (err) {
      return false;
    }
  });

  if (recoveryFlag === undefined) {
    throw new Error('ExpectedValidSignatureForSignedPaymentRequest');
  }

  const sigWords = hexAsWords({
    hex: signing.signature + padding + recoveryFlag,
  });

  const words = [].concat(tags).concat(sigWords.words);

  return {request: encode(hrp, words, MAX_SAFE_INTEGER)};
};
