const {isPoint} = require('tiny-secp256k1');

const chainAsNetwork = require('./chain_as_network');
const hexAsBip353Name = require('./hex_as_bip353_name');
const hexAsBlindedPaths = require('./hex_as_blinded_paths');
const hexAsFeatures = require('./hex_as_features');
const hexAsUtf8 = require('./hex_as_utf8');
const recordRange = require('./record_range');
const truncatedAsNumber = require('./truncated_as_number');
const types = require('./conf/tlv_types');

const chainByteLength = 32;
const defaultNetwork = 'bitcoin';
const findRecord = (records, type) => records.find(n => n.type === type);
const hexAsBuffer = hex => Buffer.from(hex, 'hex');
const hexByteLength = hex => hex.length / 2;
const {isArray} = Array;
const isEven = type => !(BigInt(type) % BigInt(2));
const isOptional = n => !n.is_required;
const isRequestType = type => recordRange({type}).range === 'request';
const isString = n => typeof n === 'string';
const isWithinSafeRange = n => BigInt(n) <= BigInt(MAX_SAFE_INTEGER);
const knownTypes = Object.values(types.request);
const {MAX_SAFE_INTEGER} = Number;
const pointByteLength = 33;

/** Derive invoice request details from the request records of a TLV stream

  Invoice request records are found in invoice requests and in invoices

  {
    records: [{
      type: <Record Type Number String>
      value: <Record Value Hex String>
    }]
  }

  @throws
  <Error>

  @returns
  {
    [bip353_name]: <BIP 353 Human Readable Name String>
    features: [{
      bit: <BOLT 09 Feature Bit Number>
      is_required: <Feature Support is Required Bool>
      type: <Feature Type String>
    }]
    metadata: <Payer Metadata Hex String>
    [mtokens]: <Requested Amount Millitokens String>
    network: <Network Name String>
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
*/
module.exports = ({records}) => {
  if (!isArray(records)) {
    throw new Error('ExpectedArrayOfRecordsToDeriveInvoiceRequestDetails');
  }

  if (!records.every(n => !!n && isString(n.type) && isString(n.value))) {
    throw new Error('ExpectedRecordTypesAndValuesToDeriveRequestDetails');
  }

  const request = records.filter(n => isRequestType(n.type));

  // An unknown even record type means the request cannot be understood
  if (!request.every(n => !isEven(n.type) || knownTypes.includes(n.type))) {
    throw new Error('UnexpectedUnknownEvenRecordTypeInInvoiceRequest');
  }

  const amount = findRecord(request, types.request.amount);
  const bip353Name = findRecord(request, types.request.bip_353_name);
  const chain = findRecord(request, types.request.chain);
  const features = findRecord(request, types.request.features);
  const metadata = findRecord(request, types.request.metadata);
  const payerId = findRecord(request, types.request.payer_id);
  const payerNote = findRecord(request, types.request.payer_note);
  const paths = findRecord(request, types.request.paths);
  const quantity = findRecord(request, types.request.quantity);

  if (!metadata) {
    throw new Error('ExpectedMetadataInInvoiceRequest');
  }

  if (!payerId) {
    throw new Error('ExpectedPayerIdInInvoiceRequest');
  }

  if (hexByteLength(payerId.value) !== pointByteLength) {
    throw new Error('ExpectedPublicKeyPayerIdInInvoiceRequest');
  }

  if (!isPoint(hexAsBuffer(payerId.value))) {
    throw new Error('ExpectedValidPublicKeyPayerIdInInvoiceRequest');
  }

  if (!!chain && hexByteLength(chain.value) !== chainByteLength) {
    throw new Error('ExpectedChainHashInInvoiceRequestChain');
  }

  const decoded = {};

  if (!!chain) {
    try {
      decoded.network = chainAsNetwork({chain: chain.value}).network;
    } catch (err) {
      throw new Error('UnknownChainInInvoiceRequestChain');
    }
  }

  if (!!amount) {
    try {
      decoded.amount = truncatedAsNumber({hex: amount.value}).number;
    } catch (err) {
      throw new Error('ExpectedValidAmountInInvoiceRequest');
    }
  }

  if (!!features) {
    decoded.features = hexAsFeatures({hex: features.value}).features;
  }

  // There are no defined request features, so any required bit is unknown
  if (!!features && !decoded.features.every(isOptional)) {
    throw new Error('UnexpectedUnknownRequiredFeatureBitInInvoiceRequest');
  }

  if (!!quantity) {
    try {
      decoded.quantity = truncatedAsNumber({hex: quantity.value}).number;
    } catch (err) {
      throw new Error('ExpectedValidQuantityInInvoiceRequest');
    }
  }

  if (!!quantity && !isWithinSafeRange(decoded.quantity)) {
    throw new Error('ExpectedQuantityWithinSafeRangeInInvoiceRequest');
  }

  if (!!payerNote) {
    try {
      decoded.note = hexAsUtf8({hex: payerNote.value}).string;
    } catch (err) {
      throw new Error('ExpectedValidUtf8PayerNoteInInvoiceRequest');
    }
  }

  if (!!paths) {
    try {
      decoded.paths = hexAsBlindedPaths({hex: paths.value}).paths;
    } catch (err) {
      throw new Error('ExpectedValidBlindedPathsInInvoiceRequest');
    }
  }

  if (!!paths && !decoded.paths.length) {
    throw new Error('ExpectedBlindedPathsInInvoiceRequestPaths');
  }

  if (!!bip353Name) {
    try {
      const {value} = bip353Name;

      decoded.bip353_name = hexAsBip353Name({hex: value}).bip353_name;
    } catch (err) {
      throw new Error('ExpectedValidBip353NameInInvoiceRequest');
    }
  }

  return {
    bip353_name: decoded.bip353_name,
    features: decoded.features || [],
    metadata: metadata.value,
    mtokens: decoded.amount,
    network: decoded.network || defaultNetwork,
    payer_id: payerId.value,
    payer_note: decoded.note,
    paths: decoded.paths,
    quantity: !quantity ? undefined : Number(decoded.quantity),
  };
};
