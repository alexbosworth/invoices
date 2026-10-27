const {bech32} = require('bech32');
const {isPoint} = require('tiny-secp256k1');
const {recover} = require('tiny-secp256k1');
const {verify} = require('tiny-secp256k1');

const decodePrefix = require('./decode_prefix');
const fieldAsDetails = require('./field_as_details');
const hrpAsMtokens = require('./hrp_as_mtokens');
const requestDetails = require('./request_details');
const signatureFromWords = require('./signature_from_words');
const signatureHashFromWords = require('./signature_hash_from_words');
const singleUseFields = require('./conf/single_use_fields');
const taggedFields = require('./tagged_fields');
const wordsAsNumber = require('./words_as_number');

const asHex = arr => Buffer.from(arr).toString('hex');
const {decode} = bech32;
const hasBlindedPath = n => n.blinded_path !== undefined;
const hasDescription = n => n.description !== undefined;
const hasDescriptionHash = n => n.description_hash !== undefined;
const hasLnPrefix = n => n.slice(Number(), 'ln'.length).toLowerCase() === 'ln';
const hasPaymentHash = n => n.id !== undefined;
const hasRouteHints = n => n.path !== undefined;
const hexAsBuffer = hex => Buffer.from(hex, 'hex');
const isAscii = n => /^[\x21-\x7e]+$/.test(n);
const isLowSRequired = true;
const {keys} = Object;
const maxRequestLength = 7089;
const msPerSec = 1e3;
const sigWordsCount = 104;
const singleField = 1;
const timestampWordLength = 7;

/** Parse a BOLT 11 payment request into its component data

  Note: either description or description_hash will be returned

  `paths` are bLIP 39 blinded paths.

  {
    request: <BOLT 11 Payment Request String>
  }

  @throws
  <Error>

  @returns
  {
    [chain_addresses]: [<Chain Address String>]
    cltv_delta: <CLTV Delta Number>
    created_at: <Invoice Creation Date ISO 8601 String>
    [description]: <Description String>
    [description_hash]: <Description Hash Hex String>
    destination: <Public Key String>
    expires_at: <ISO 8601 Date String>
    features: [{
      bit: <BOLT 09 Feature Bit Number>
      is_required: <Feature Support is Required To Pay Bool>
      type: <Feature Type String>
    }]
    id: <Payment Request Hash String>
    is_expired: <Invoice is Expired Bool>
    [metadata]: <Payment Metadata Hex String>
    mtokens: <Requested Milli-Tokens Value String> (can exceed Number limit)
    network: <Network Name String>
    [paths]: [{
      base_fee_mtokens: <Accumulated Base Fee Millitokens String>
      cltv_delta: <Accumulated CLTV Expiry Delta Number>
      features: [{
        bit: <BOLT 09 Feature Bit Number>
        is_required: <Feature Support is Required To Pay Bool>
        type: <Feature Type String>
      }]
      fee_rate: <Accumulated Fee Rate Millitokens Per Million Number>
      hops: [{
        encrypted_data: <Encrypted Recipient Data Hex String>
        relay_key: <Relaying Node Public Key Hex String>
      }]
      introduction_node: <Introduction Node Public Key Hex String>
      key: <First Hop Path Key Public Key Hex String>
      max_htlc_mtokens: <Maximum HTLC Millitokens String>
      min_htlc_mtokens: <Minimum HTLC Millitokens String>
    }]
    [payment]: <Payment Identifier Hex Encoded String>
    [routes]: [[{
      [base_fee_mtokens]: <Base Fee Millitokens String>
      [channel]: <Standard Format Channel Id String>
      [cltv_delta]: <Final CLTV Expiration Blocks Delta Number>
      [fee_rate]: <Fee Rate Millitokens Per Million Number>
      public_key: <Forward Edge Public Key Hex String>
    }]]
    safe_tokens: <Requested Chain Tokens Rounded Up Number>
    tokens: <Requested Chain Tokens Number> (note: can differ from mtokens)
  }
*/
module.exports = ({request}) => {
  if (!request) {
    throw new Error('ExpectedPaymentRequest');
  }

  if (!hasLnPrefix(request)) {
    throw new Error('ExpectedLnPrefix');
  }

  // A QR code constrains the maximum length of a payment request
  if (request.length > maxRequestLength) {
    throw new Error('ExpectedPaymentRequestWithinMaximumLength');
  }

  // Non-ASCII characters like the Kelvin sign can lowercase into bech32 chars
  if (!isAscii(request)) {
    throw new Error('ExpectedAsciiCharactersInPaymentRequest');
  }

  const {prefix, words} = decode(request, maxRequestLength);

  const signatureWords = words.slice(-sigWordsCount);
  const wordsWithoutSig = words.slice(Number(), -sigWordsCount);

  const {amount, network, units} = decodePrefix({prefix});
  const {hash} = signatureHashFromWords({prefix, words: wordsWithoutSig});
  const {recovery, signature} = signatureFromWords({words: signatureWords});
  const timestampWords = wordsWithoutSig.slice(Number(), timestampWordLength);
  const wordsWithTags = wordsWithoutSig.slice(timestampWordLength);

  const {fields} = taggedFields({words: wordsWithTags.slice()});

  const elements = fields.map(n => fieldAsDetails({
    network,
    code: n.code,
    words: n.words,
  }));

  // A description and a description hash are mutually exclusive
  if (elements.some(hasDescription) && elements.some(hasDescriptionHash)) {
    throw new Error('UnexpectedDescriptionAndDescriptionHashInRequest');
  }

  // Either a description or a description hash is required
  if (!elements.some(hasDescription) && !elements.some(hasDescriptionHash)) {
    throw new Error('ExpectedDescriptionOrDescriptionHashInPaymentRequest');
  }

  // Legacy requests predate `s` fields so only a payment hash is mandatory
  if (!elements.some(hasPaymentHash)) {
    throw new Error('ExpectedPaymentHashInPaymentRequest');
  }

  // Only fallback addresses, route hints and blinded paths may be repeated
  const duplicate = keys(singleUseFields).find(key => {
    return elements.filter(n => n[key] !== undefined).length > singleField;
  });

  if (!!duplicate) {
    throw new Error(singleUseFields[duplicate]);
  }

  // Blinded paths replace route hints, an invoice cannot have both
  if (elements.some(hasBlindedPath) && elements.some(hasRouteHints)) {
    throw new Error('UnexpectedRouteHintsAndBlindedPathsInRequest');
  }

  // The destination public key may be specified in a tagged field
  const [key] = elements.map(n => n.destination).filter(n => !!n);

  // A specified destination key must be a valid public key
  if (!!key && !isPoint(hexAsBuffer(key))) {
    throw new Error('InvalidDestinationPublicKeyInPaymentRequest');
  }

  // A specified destination key is used to check the signature directly
  if (!!key && !verify(hash, hexAsBuffer(key), signature, isLowSRequired)) {
    throw new Error('InvalidSignatureForDestinationPublicKey');
  }

  // Without a destination key the public key is recovered from the signature
  const recovered = key || recover(hash, signature, recovery, true);

  // Recovery fails when the signature does not correspond to a curve point
  if (!recovered) {
    throw new Error('ExpectedRecoverableSignatureInPaymentRequest');
  }

  const details = requestDetails({
    network,
    destination: key || asHex(recovered),
    details: elements,
    mtokens: hrpAsMtokens({amount, units}).mtokens,
    timestamp: wordsAsNumber({words: timestampWords}) * msPerSec,
  });

  details.is_expired = Date.parse(details.expires_at) < Date.now();

  if (!details.description && !details.description_hash) {
    details.description = String();
  }

  return details;
};
