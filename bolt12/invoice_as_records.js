const {isPoint} = require('tiny-secp256k1');

const blindedPathsAsHex = require('./blinded_paths_as_hex');
const chainAddressesAsHex = require('./chain_addresses_as_hex');
const featuresAsHex = require('./features_as_hex');
const numberAsTruncated = require('./number_as_truncated');
const payinfosAsHex = require('./payinfos_as_hex');
const types = require('./conf/tlv_types');

const defaultExpirySeconds = 7200;
const {floor} = Math;
const hashByteLength = 32;
const hexAsBuffer = hex => Buffer.from(hex, 'hex');
const hexByteLength = hex => hex.length / 2;
const {isArray} = Array;
const isHex = n => !(n.length % 2) && /^[0-9A-F]*$/i.test(n);
const {isNaN} = Number;
const isNumber = n => typeof n === 'string' && /^\d+$/.test(n);
const isString = n => typeof n === 'string';
const maxRelativeExpirySeconds = 4294967295;
const msPerSec = 1e3;
const {parse} = Date;
const pointByteLength = 33;

/** Derive invoice TLV records from invoice details

  {
    [chain_addresses]: [<Fallback Chain Address String>]
    created_at: <Invoice Creation Date ISO 8601 String>
    expires_at: <Invoice Expires At ISO 8601 Date String>
    [features]: [{
      bit: <BOLT 09 Feature Bit Number>
    }]
    id: <Payment Hash Hex String>
    mtokens: <Invoice Amount Millitokens String>
    network: <Network Name String>
    node_id: <Invoice Node Public Key Hex String>
    paths: [{
      base_fee_mtokens: <Accumulated Base Fee Millitokens String>
      cltv_delta: <Accumulated CLTV Expiry Delta Number>
      [features]: [{
        bit: <BOLT 09 Feature Bit Number>
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
  const hasAddresses = args.chain_addresses !== undefined;

  if (hasAddresses && !isArray(args.chain_addresses)) {
    throw new Error('ExpectedArrayOfChainAddressesToCreateInvoice');
  }

  if (!args.created_at || isNaN(parse(args.created_at))) {
    throw new Error('ExpectedValidCreatedAtDateToCreateInvoice');
  }

  if (!args.expires_at || isNaN(parse(args.expires_at))) {
    throw new Error('ExpectedValidExpiresAtDateToCreateInvoice');
  }

  if (args.features !== undefined && !isArray(args.features)) {
    throw new Error('ExpectedArrayOfFeaturesToCreateInvoice');
  }

  if (!args.id || !isString(args.id) || !isHex(args.id)) {
    throw new Error('ExpectedPaymentHashHexStringToCreateInvoice');
  }

  if (hexByteLength(args.id) !== hashByteLength) {
    throw new Error('ExpectedPaymentHashByteLengthToCreateInvoice');
  }

  if (!isNumber(args.mtokens)) {
    throw new Error('ExpectedMillitokensNumberStringToCreateInvoice');
  }

  if (!args.network || !isString(args.network)) {
    throw new Error('ExpectedNetworkNameToCreateInvoice');
  }

  if (!args.node_id || !isString(args.node_id) || !isHex(args.node_id)) {
    throw new Error('ExpectedNodeIdPublicKeyHexStringToCreateInvoice');
  }

  if (hexByteLength(args.node_id) !== pointByteLength) {
    throw new Error('ExpectedNodeIdPublicKeyToCreateInvoice');
  }

  if (!isPoint(hexAsBuffer(args.node_id))) {
    throw new Error('ExpectedValidNodeIdPublicKeyToCreateInvoice');
  }

  if (!isArray(args.paths) || !args.paths.length) {
    throw new Error('ExpectedArrayOfBlindedPathsToCreateInvoice');
  }

  if (!args.paths.every(n => !!n)) {
    throw new Error('ExpectedBlindedPathDetailsToCreateInvoice');
  }

  const createdAt = floor(parse(args.created_at) / msPerSec);
  const expiresAt = floor(parse(args.expires_at) / msPerSec);

  const relativeExpiry = expiresAt - createdAt;

  const isNegativeExpiry = relativeExpiry < Number();
  const isExpiryTooLong = relativeExpiry > maxRelativeExpirySeconds;

  if (isNegativeExpiry || isExpiryTooLong) {
    throw new Error('ExpectedExpiresAtWithinRelativeExpiryRangeForInvoice');
  }

  const features = featuresAsHex({features: args.features || []}).hex;

  const paths = blindedPathsAsHex({
    paths: args.paths.map(path => ({
      hops: path.hops,
      introduction_edge: path.introduction_edge,
      introduction_node: path.introduction_node,
      key: path.key,
    })),
  });

  const payinfos = payinfosAsHex({
    payinfos: args.paths.map(path => ({
      base_fee_mtokens: path.base_fee_mtokens,
      cltv_delta: path.cltv_delta,
      features: path.features,
      fee_rate: path.fee_rate,
      max_htlc_mtokens: path.max_htlc_mtokens,
      min_htlc_mtokens: path.min_htlc_mtokens,
    })),
  });

  const encoded = {};

  // The default relative expiry is implied when there is no expiry record
  if (relativeExpiry !== defaultExpirySeconds) {
    const number = relativeExpiry.toString();

    encoded.expiry = numberAsTruncated({number}).hex;
  }

  if (!!args.chain_addresses) {
    const {hex} = chainAddressesAsHex({
      chain_addresses: args.chain_addresses,
      network: args.network,
    });

    encoded.fallbacks = hex;
  }

  const records = [
    {type: types.invoice.paths, value: paths.hex},
    {type: types.invoice.blinded_payinfo, value: payinfos.hex},
    {
      type: types.invoice.created_at,
      value: numberAsTruncated({number: createdAt.toString()}).hex,
    },
    {type: types.invoice.relative_expiry, value: encoded.expiry},
    {type: types.invoice.payment_hash, value: args.id},
    {
      type: types.invoice.amount,
      value: numberAsTruncated({number: args.mtokens}).hex,
    },
    {type: types.invoice.fallbacks, value: encoded.fallbacks},
    {type: types.invoice.features, value: features || undefined},
    {type: types.invoice.node_id, value: args.node_id},
  ];

  return {records: records.filter(n => n.value !== undefined)};
};
