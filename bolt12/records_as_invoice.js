const {isPoint} = require('tiny-secp256k1');

const hexAsBlindedPaths = require('./hex_as_blinded_paths');
const hexAsChainAddresses = require('./hex_as_chain_addresses');
const hexAsFeatures = require('./hex_as_features');
const hexAsPayinfos = require('./hex_as_payinfos');
const recordRange = require('./record_range');
const truncatedAsNumber = require('./truncated_as_number');
const types = require('./conf/tlv_types');

const asDateString = ms => new Date(ms).toISOString();
const defaultExpirySeconds = 7200;
const findRecord = (records, type) => records.find(n => n.type === type);
const hashByteLength = 32;
const hexAsBuffer = hex => Buffer.from(hex, 'hex');
const hexByteLength = hex => hex.length / 2;
const {isArray} = Array;
const isEven = type => !(BigInt(type) % BigInt(2));
const isInvoiceType = type => recordRange({type}).range === 'invoice';
const isOptional = n => !n.is_required;
const isString = n => typeof n === 'string';
const knownFeatureBits = [16, 17];
const knownTypes = Object.values(types.invoice);
const maxDateSeconds = BigInt(8640000000000);
const msPerSec = 1e3;
const {now} = Date;
const pointByteLength = 33;
const relativeExpiryByteLength = 4;

/** Derive invoice details from the invoice records of a TLV stream

  Blinded paths with required features are not returned: no features are
  defined as allowed features for blinded paths, so they are all unknown

  {
    network: <Network Name String>
    records: [{
      type: <Record Type Number String>
      value: <Record Value Hex String>
    }]
  }

  @throws
  <Error>

  @returns
  {
    [chain_addresses]: [<Fallback Chain Address String>]
    created_at: <Invoice Creation Date ISO 8601 String>
    expires_at: <Invoice Expires At ISO 8601 Date String>
    features: [{
      bit: <BOLT 09 Feature Bit Number>
      is_required: <Feature Support is Required To Pay Bool>
      type: <Feature Type String>
    }]
    id: <Payment Hash Hex String>
    is_expired: <Invoice is Expired Bool>
    mtokens: <Invoice Amount Millitokens String>
    node_id: <Invoice Node Public Key Hex String>
    paths: [{
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
        relay_key: <Blinded Relaying Node Public Key Hex String>
      }]
      [introduction_edge]: <Introduction Node Edge Format Channel Id String>
      [introduction_node]: <Introduction Node Public Key Hex String>
      key: <First Hop Path Key Public Key Hex String>
      max_htlc_mtokens: <Maximum HTLC Millitokens String>
      min_htlc_mtokens: <Minimum HTLC Millitokens String>
    }]
  }
*/
module.exports = ({network, records}) => {
  if (!network || !isString(network)) {
    throw new Error('ExpectedNetworkNameToDeriveInvoiceDetails');
  }

  if (!isArray(records)) {
    throw new Error('ExpectedArrayOfRecordsToDeriveInvoiceDetails');
  }

  if (!records.every(n => !!n && isString(n.type) && isString(n.value))) {
    throw new Error('ExpectedRecordTypesAndValuesToDeriveInvoiceDetails');
  }

  const invoice = records.filter(n => isInvoiceType(n.type));

  // An unknown even record type means the invoice cannot be understood
  if (!invoice.every(n => !isEven(n.type) || knownTypes.includes(n.type))) {
    throw new Error('UnexpectedUnknownEvenRecordTypeInInvoice');
  }

  const amount = findRecord(invoice, types.invoice.amount);
  const createdAt = findRecord(invoice, types.invoice.created_at);
  const fallbacks = findRecord(invoice, types.invoice.fallbacks);
  const features = findRecord(invoice, types.invoice.features);
  const nodeId = findRecord(invoice, types.invoice.node_id);
  const paths = findRecord(invoice, types.invoice.paths);
  const payinfo = findRecord(invoice, types.invoice.blinded_payinfo);
  const paymentHash = findRecord(invoice, types.invoice.payment_hash);
  const relativeExpiry = findRecord(invoice, types.invoice.relative_expiry);

  if (!amount) {
    throw new Error('ExpectedAmountInInvoice');
  }

  if (!createdAt) {
    throw new Error('ExpectedCreatedAtInInvoice');
  }

  if (!paymentHash) {
    throw new Error('ExpectedPaymentHashInInvoice');
  }

  if (hexByteLength(paymentHash.value) !== hashByteLength) {
    throw new Error('ExpectedPaymentHashByteLengthInInvoice');
  }

  if (!nodeId) {
    throw new Error('ExpectedNodeIdInInvoice');
  }

  if (hexByteLength(nodeId.value) !== pointByteLength) {
    throw new Error('ExpectedPublicKeyNodeIdInInvoice');
  }

  if (!isPoint(hexAsBuffer(nodeId.value))) {
    throw new Error('ExpectedValidPublicKeyNodeIdInInvoice');
  }

  if (!paths) {
    throw new Error('ExpectedBlindedPathsInInvoice');
  }

  if (!payinfo) {
    throw new Error('ExpectedBlindedPayinfoInInvoice');
  }

  const decoded = {};

  try {
    decoded.amount = truncatedAsNumber({hex: amount.value}).number;
  } catch (err) {
    throw new Error('ExpectedValidAmountInInvoice');
  }

  try {
    decoded.createdAt = truncatedAsNumber({hex: createdAt.value}).number;
  } catch (err) {
    throw new Error('ExpectedValidCreatedAtInInvoice');
  }

  if (BigInt(decoded.createdAt) > maxDateSeconds) {
    throw new Error('ExpectedCreatedAtWithinDateRangeInInvoice');
  }

  if (!!relativeExpiry) {
    try {
      const {number} = truncatedAsNumber({
        hex: relativeExpiry.value,
        max: relativeExpiryByteLength,
      });

      decoded.expiry = number;
    } catch (err) {
      throw new Error('ExpectedValidRelativeExpiryInInvoice');
    }
  }

  if (!!features) {
    decoded.features = hexAsFeatures({hex: features.value}).features;
  }

  // Only the multi-part payment feature is a known invoice feature
  const isKnownOrOptional = n => {
    return isOptional(n) || knownFeatureBits.includes(n.bit);
  };

  if (!!features && !decoded.features.every(isKnownOrOptional)) {
    throw new Error('UnexpectedUnknownRequiredFeatureBitInInvoice');
  }

  try {
    decoded.paths = hexAsBlindedPaths({hex: paths.value}).paths;
  } catch (err) {
    throw new Error('ExpectedValidBlindedPathsInInvoice');
  }

  if (!decoded.paths.length) {
    throw new Error('ExpectedBlindedPathsInInvoicePaths');
  }

  try {
    decoded.payinfos = hexAsPayinfos({hex: payinfo.value}).payinfos;
  } catch (err) {
    throw new Error('ExpectedValidBlindedPayinfoInInvoice');
  }

  // Every path has its own corresponding payment info
  if (decoded.payinfos.length !== decoded.paths.length) {
    throw new Error('ExpectedBlindedPayinfoForEveryBlindedPathInInvoice');
  }

  if (!!fallbacks) {
    const addresses = hexAsChainAddresses({network, hex: fallbacks.value});

    decoded.addresses = addresses.chain_addresses;
  }

  const usablePaths = decoded.paths
    .map((path, i) => ({
      base_fee_mtokens: decoded.payinfos[i].base_fee_mtokens,
      cltv_delta: decoded.payinfos[i].cltv_delta,
      features: decoded.payinfos[i].features,
      fee_rate: decoded.payinfos[i].fee_rate,
      hops: path.hops,
      introduction_edge: path.introduction_edge,
      introduction_node: path.introduction_node,
      key: path.key,
      max_htlc_mtokens: decoded.payinfos[i].max_htlc_mtokens,
      min_htlc_mtokens: decoded.payinfos[i].min_htlc_mtokens,
    }))
    .filter(path => path.features.every(isOptional));

  // A path with unknown required features cannot be used to pay
  if (!usablePaths.length) {
    throw new Error('ExpectedUsableBlindedPathInInvoice');
  }

  const expirySeconds = BigInt(decoded.expiry || defaultExpirySeconds);

  // The expiry date must be a date that can be represented
  if (BigInt(decoded.createdAt) + expirySeconds > maxDateSeconds) {
    throw new Error('ExpectedExpiryWithinDateRangeInInvoice');
  }

  const createdAtMs = Number(decoded.createdAt) * msPerSec;

  const expiresAtMs = createdAtMs + (Number(expirySeconds) * msPerSec);

  const expiresAt = asDateString(expiresAtMs);

  return {
    chain_addresses: decoded.addresses,
    created_at: asDateString(createdAtMs),
    expires_at: expiresAt,
    features: decoded.features || [],
    id: paymentHash.value,
    is_expired: expiresAtMs < now(),
    mtokens: decoded.amount,
    node_id: nodeId.value,
    paths: usablePaths,
  };
};
