const {isPoint} = require('tiny-secp256k1');

const chainAsNetwork = require('./chain_as_network');
const hexAsBlindedPaths = require('./hex_as_blinded_paths');
const hexAsFeatures = require('./hex_as_features');
const hexAsUtf8 = require('./hex_as_utf8');
const recordRange = require('./record_range');
const truncatedAsNumber = require('./truncated_as_number');
const types = require('./conf/tlv_types');

const asDateString = ms => new Date(ms).toISOString();
const chainByteLength = 32;
const defaultNetworks = ['bitcoin'];
const findRecord = (records, type) => records.find(n => n.type === type);
const hexAsBuffer = hex => Buffer.from(hex, 'hex');
const hexByteLength = hex => hex.length / 2;
const {isArray} = Array;
const isEven = type => !(BigInt(type) % BigInt(2));
const isOfferType = type => recordRange({type}).range === 'offer';
const isOptional = n => !n.is_required;
const isString = n => typeof n === 'string';
const isWithinSafeRange = n => BigInt(n) <= BigInt(MAX_SAFE_INTEGER);
const knownTypes = Object.values(types.offer);
const maxDateSeconds = BigInt(8640000000000);
const {MAX_SAFE_INTEGER} = Number;
const msPerSec = 1e3;
const {now} = Date;
const pointByteLength = 33;
const splitChains = hex => hex.match(/.{64}/g);

/** Derive offer details from the offer records of a TLV stream

  Offer records are found in offers, invoice requests, and invoices. An
  invoice request that is not for an offer has offer records but does not
  need an issuer id or paths.

  {
    [is_issuer_optional]: <Issuer Id or Paths Are Not Required Bool>
    records: [{
      type: <Record Type Number String>
      value: <Record Value Hex String>
    }]
  }

  @throws
  <Error>

  @returns
  {
    [amount]: <Amount in Currency Minor Units String>
    [currency]: <ISO 4217 Currency Code String>
    [description]: <Description String>
    [expires_at]: <Offer Expires At ISO 8601 Date String>
    features: [{
      bit: <BOLT 09 Feature Bit Number>
      is_required: <Feature Support is Required Bool>
      type: <Feature Type String>
    }]
    is_expired: <Offer is Expired Bool>
    [issuer]: <Issuer Identifier String>
    [issuer_id]: <Issuer Node Public Key Hex String>
    [max_quantity]: <Maximum Quantity Number> (zero for unlimited)
    [metadata]: <Metadata Hex String>
    [mtokens]: <Amount Millitokens String>
    networks: [<Known Network Name String>]
    [paths]: [{
      hops: [{
        encrypted_data: <Encrypted Recipient Data Hex String>
        relay_key: <Blinded Relaying Node Public Key Hex String>
      }]
      [introduction_edge]: <Introduction Node Edge Format Channel Id String>
      [introduction_node]: <Introduction Node Public Key Hex String>
      key: <First Hop Path Key Public Key Hex String>
    }]
  }
*/
module.exports = args => {
  const {records} = args;

  if (!isArray(records)) {
    throw new Error('ExpectedArrayOfRecordsToDeriveOfferDetails');
  }

  if (!records.every(n => !!n && isString(n.type) && isString(n.value))) {
    throw new Error('ExpectedRecordTypesAndValuesToDeriveOfferDetails');
  }

  const offer = records.filter(n => isOfferType(n.type));

  // An unknown even record type means the offer cannot be understood
  if (!offer.every(n => !isEven(n.type) || knownTypes.includes(n.type))) {
    throw new Error('UnexpectedUnknownEvenRecordTypeInOffer');
  }

  const absoluteExpiry = findRecord(offer, types.offer.absolute_expiry);
  const amount = findRecord(offer, types.offer.amount);
  const chains = findRecord(offer, types.offer.chains);
  const currency = findRecord(offer, types.offer.currency);
  const description = findRecord(offer, types.offer.description);
  const features = findRecord(offer, types.offer.features);
  const issuer = findRecord(offer, types.offer.issuer);
  const issuerId = findRecord(offer, types.offer.issuer_id);
  const metadata = findRecord(offer, types.offer.metadata);
  const paths = findRecord(offer, types.offer.paths);
  const quantityMax = findRecord(offer, types.offer.quantity_max);

  // Either the node key to request invoices from or paths to it is required
  if (!args.is_issuer_optional && !issuerId && !paths) {
    throw new Error('ExpectedIssuerIdOrPathsInOffer');
  }

  if (!!issuerId && hexByteLength(issuerId.value) !== pointByteLength) {
    throw new Error('ExpectedPublicKeyIssuerIdInOffer');
  }

  if (!!issuerId && !isPoint(hexAsBuffer(issuerId.value))) {
    throw new Error('ExpectedValidPublicKeyIssuerIdInOffer');
  }

  // When chains are specified there must be at least one chain
  if (!!chains && !chains.value) {
    throw new Error('ExpectedChainsInOfferChains');
  }

  if (!!chains && hexByteLength(chains.value) % chainByteLength) {
    throw new Error('ExpectedChainHashesInOfferChains');
  }

  // Chains that are not known are not networks that an invoice can be for
  const networks = !chains ? [...defaultNetworks] : splitChains(chains.value)
    .map(chain => {
      try {
        return chainAsNetwork({chain}).network;
      } catch (err) {
        return undefined;
      }
    })
    .filter((network, i, all) => !!network && all.indexOf(network) === i);

  // An offer is only usable when at least one of the chains is known
  if (!networks.length) {
    throw new Error('ExpectedKnownChainInOfferChains');
  }

  // An amount without a description is not allowed
  if (!!amount && !description) {
    throw new Error('ExpectedDescriptionInOfferWithAmount');
  }

  // A currency is only meaningful for an amount
  if (!!currency && !amount) {
    throw new Error('ExpectedAmountInOfferWithCurrency');
  }

  const decoded = {};

  if (!!amount) {
    try {
      decoded.amount = truncatedAsNumber({hex: amount.value}).number;
    } catch (err) {
      throw new Error('ExpectedValidAmountInOffer');
    }
  }

  if (!!amount && !BigInt(decoded.amount)) {
    throw new Error('ExpectedNonZeroAmountInOffer');
  }

  if (!!currency) {
    try {
      decoded.currency = hexAsUtf8({hex: currency.value}).string;
    } catch (err) {
      throw new Error('ExpectedValidUtf8CurrencyInOffer');
    }
  }

  if (!!description) {
    try {
      decoded.description = hexAsUtf8({hex: description.value}).string;
    } catch (err) {
      throw new Error('ExpectedValidUtf8DescriptionInOffer');
    }
  }

  if (!!issuer) {
    try {
      decoded.issuer = hexAsUtf8({hex: issuer.value}).string;
    } catch (err) {
      throw new Error('ExpectedValidUtf8IssuerInOffer');
    }
  }

  if (!!features) {
    decoded.features = hexAsFeatures({hex: features.value}).features;
  }

  // There are no defined offer features, so any required bit is unknown
  if (!!features && !decoded.features.every(isOptional)) {
    throw new Error('UnexpectedUnknownRequiredFeatureBitInOffer');
  }

  if (!!absoluteExpiry) {
    try {
      decoded.expiry = truncatedAsNumber({hex: absoluteExpiry.value}).number;
    } catch (err) {
      throw new Error('ExpectedValidAbsoluteExpiryInOffer');
    }
  }

  if (!!absoluteExpiry && BigInt(decoded.expiry) > maxDateSeconds) {
    throw new Error('ExpectedAbsoluteExpiryWithinDateRangeInOffer');
  }

  if (!!paths) {
    try {
      decoded.paths = hexAsBlindedPaths({hex: paths.value}).paths;
    } catch (err) {
      throw new Error('ExpectedValidBlindedPathsInOffer');
    }
  }

  if (!!paths && !decoded.paths.length) {
    throw new Error('ExpectedBlindedPathsInOfferPaths');
  }

  if (!!quantityMax) {
    try {
      decoded.quantity = truncatedAsNumber({hex: quantityMax.value}).number;
    } catch (err) {
      throw new Error('ExpectedValidQuantityMaxInOffer');
    }
  }

  if (!!quantityMax && !isWithinSafeRange(decoded.quantity)) {
    throw new Error('ExpectedQuantityMaxWithinSafeRangeInOffer');
  }

  // The expiry is in seconds and dates are in milliseconds
  const expiryMs = Number(decoded.expiry) * msPerSec;

  const expiresAt = !absoluteExpiry ? undefined : asDateString(expiryMs);

  return {
    networks,
    amount: !currency ? undefined : decoded.amount,
    currency: decoded.currency,
    description: decoded.description,
    expires_at: expiresAt,
    features: decoded.features || [],
    is_expired: !!absoluteExpiry && expiryMs < now(),
    issuer: decoded.issuer,
    issuer_id: !issuerId ? undefined : issuerId.value,
    max_quantity: !quantityMax ? undefined : Number(decoded.quantity),
    metadata: !metadata ? undefined : metadata.value,
    mtokens: !!currency || !amount ? undefined : decoded.amount,
    paths: decoded.paths,
  };
};
