const {randomBytes} = require('crypto');

const {isPoint} = require('tiny-secp256k1');

const bip353NameAsHex = require('./bip353_name_as_hex');
const blindedPathsAsHex = require('./blinded_paths_as_hex');
const featuresAsHex = require('./features_as_hex');
const networkAsChain = require('./network_as_chain');
const numberAsTruncated = require('./number_as_truncated');
const types = require('./conf/tlv_types');

const bitcoinNetwork = 'bitcoin';
const bufferAsHex = buffer => buffer.toString('hex');
const defaultMetadataByteLength = 16;
const hexAsBuffer = hex => Buffer.from(hex, 'hex');
const hexByteLength = hex => hex.length / 2;
const {isArray} = Array;
const isHex = n => !(n.length % 2) && /^[0-9A-F]*$/i.test(n);
const {isSafeInteger} = Number;
const isNumber = n => typeof n === 'string' && /^\d+$/.test(n);
const isString = n => typeof n === 'string';
const pointByteLength = 33;
const utf8AsHex = utf8 => Buffer.from(utf8, 'utf8').toString('hex');

/** Derive invoice request TLV records from invoice request details

  The `metadata` should be unpredictable, random bytes are used by default

  {
    [bip353_name]: <BIP 353 Human Readable Name String>
    [features]: [{
      bit: <BOLT 09 Feature Bit Number>
    }]
    [metadata]: <Payer Metadata Hex String>
    [mtokens]: <Requested Amount Millitokens String>
    [network]: <Network Name String>
    payer_id: <Payer Public Key Hex String>
    [payer_note]: <Payer Note String>
    [paths]: [{
      hops: [{
        encrypted_data: <Encrypted Recipient Data Hex String>
        relay_key: <Blinded Relaying Node Public Key Hex String>
      }]
      [introduction_edge]: <Introduction Node Edge Format Channel Id String>
      [introduction_node]: <Introduction Node Public Key Hex String>
      key: <First Hop Path Key Public Key Hex String>
    }]
    [quantity]: <Requested Quantity Number>
  }

  @throws
  <Error>

  @returns
  {
    records: [{
      type: <Record Type Number String>
      value: <Record Value Hex String>
    }]
  }
*/
module.exports = args => {
  if (args.bip353_name !== undefined && !isString(args.bip353_name)) {
    throw new Error('ExpectedBip353NameStringToCreateInvoiceRequest');
  }

  if (args.features !== undefined && !isArray(args.features)) {
    throw new Error('ExpectedArrayOfFeaturesToCreateInvoiceRequest');
  }

  if (args.metadata !== undefined && !isString(args.metadata)) {
    throw new Error('ExpectedMetadataHexStringToCreateInvoiceRequest');
  }

  if (args.metadata !== undefined && !isHex(args.metadata)) {
    throw new Error('ExpectedHexEncodedMetadataToCreateInvoiceRequest');
  }

  // Metadata is required to be an unpredictable series of bytes
  if (args.metadata === String()) {
    throw new Error('ExpectedNonEmptyMetadataToCreateInvoiceRequest');
  }

  if (args.mtokens !== undefined && !isNumber(args.mtokens)) {
    throw new Error('ExpectedMillitokensNumberStringToCreateInvoiceRequest');
  }

  if (args.network !== undefined && !isString(args.network)) {
    throw new Error('ExpectedNetworkNameStringToCreateInvoiceRequest');
  }

  if (!args.payer_id || !isString(args.payer_id)) {
    throw new Error('ExpectedPayerIdPublicKeyToCreateInvoiceRequest');
  }

  const isIdOk = n => isHex(n) && hexByteLength(n) === pointByteLength;

  if (!isIdOk(args.payer_id)) {
    throw new Error('ExpectedPayerIdPublicKeyHexStringToCreateInvoiceRequest');
  }

  if (!isPoint(hexAsBuffer(args.payer_id))) {
    throw new Error('ExpectedValidPayerIdPublicKeyToCreateInvoiceRequest');
  }

  if (args.payer_note !== undefined && !isString(args.payer_note)) {
    throw new Error('ExpectedPayerNoteStringToCreateInvoiceRequest');
  }

  if (args.paths !== undefined && !isArray(args.paths)) {
    throw new Error('ExpectedArrayOfBlindedPathsToCreateInvoiceRequest');
  }

  const isQuantityOk = n => isSafeInteger(n) && n > Number();

  if (args.quantity !== undefined && !isQuantityOk(args.quantity)) {
    throw new Error('ExpectedPositiveQuantityNumberToCreateInvoiceRequest');
  }

  const chain = {};

  if (!!args.network) {
    try {
      chain.hash = networkAsChain({network: args.network}).chain;
    } catch (err) {
      throw new Error('ExpectedKnownNetworkNameToCreateInvoiceRequest');
    }
  }

  // Bitcoin is the implied chain when there is no chain specified
  const isBitcoin = !args.network || args.network === bitcoinNetwork;

  const encoded = {
    features: featuresAsHex({features: args.features || []}).hex,
    metadata: args.metadata,
  };

  // Random metadata is used when no metadata is specified
  if (encoded.metadata === undefined) {
    encoded.metadata = bufferAsHex(randomBytes(defaultMetadataByteLength));
  }

  if (args.mtokens !== undefined) {
    encoded.amount = numberAsTruncated({number: args.mtokens}).hex;
  }

  if (args.quantity !== undefined) {
    const number = args.quantity.toString();

    encoded.quantity = numberAsTruncated({number}).hex;
  }

  if (args.payer_note !== undefined) {
    encoded.note = utf8AsHex(args.payer_note);
  }

  if (!!args.paths) {
    encoded.paths = blindedPathsAsHex({paths: args.paths}).hex;
  }

  if (args.bip353_name !== undefined) {
    const {hex} = bip353NameAsHex({bip353_name: args.bip353_name});

    encoded.bip353Name = hex;
  }

  const records = [
    {type: types.request.metadata, value: encoded.metadata},
    {type: types.request.chain, value: isBitcoin ? undefined : chain.hash},
    {type: types.request.amount, value: encoded.amount},
    {type: types.request.features, value: encoded.features || undefined},
    {type: types.request.quantity, value: encoded.quantity},
    {type: types.request.payer_id, value: args.payer_id},
    {type: types.request.payer_note, value: encoded.note},
    {type: types.request.paths, value: encoded.paths},
    {type: types.request.bip_353_name, value: encoded.bip353Name},
  ];

  return {records: records.filter(n => n.value !== undefined)};
};
