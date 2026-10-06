const {isPoint} = require('tiny-secp256k1');

const blindedPathsAsHex = require('./blinded_paths_as_hex');
const featuresAsHex = require('./features_as_hex');
const networkAsChain = require('./network_as_chain');
const numberAsTruncated = require('./number_as_truncated');
const types = require('./conf/tlv_types');

const bitcoinNetwork = 'bitcoin';
const {floor} = Math;
const hexAsBuffer = hex => Buffer.from(hex, 'hex');
const hexByteLength = hex => hex.length / 2;
const {isArray} = Array;
const isCurrency = n => /^[A-Z]{3}$/.test(n);
const isHex = n => !(n.length % 2) && /^[0-9A-F]*$/i.test(n);
const {isNaN} = Number;
const isNumber = n => typeof n === 'string' && /^\d+$/.test(n);
const isOptional = n => !!(n.bit % 2);
const {isSafeInteger} = Number;
const isString = n => typeof n === 'string';
const msPerSec = 1e3;
const {parse} = Date;
const pointByteLength = 33;
const utf8AsHex = utf8 => Buffer.from(utf8, 'utf8').toString('hex');

/** Derive offer TLV records from offer details

  Either an `issuer_id` or `paths` is required. A `description` is required
  when there is an `mtokens` or `amount`. An `amount` requires a `currency`.

  {
    [amount]: <Amount in Currency Minor Units String>
    [currency]: <ISO 4217 Currency Code String>
    [description]: <Description String>
    [expires_at]: <Offer Expires At ISO 8601 Date String>
    [features]: [{
      bit: <BOLT 09 Feature Bit Number>
    }]
    [issuer]: <Issuer Identifier String>
    [issuer_id]: <Issuer Node Public Key Hex String>
    [max_quantity]: <Maximum Quantity Number> (zero for unlimited)
    [metadata]: <Metadata Hex String>
    [mtokens]: <Amount Millitokens String>
    [networks]: [<Network Name String>]
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
  if (args.amount !== undefined && !isNumber(args.amount)) {
    throw new Error('ExpectedCurrencyAmountNumberStringToCreateOffer');
  }

  if (args.amount !== undefined && !args.currency) {
    throw new Error('ExpectedCurrencyForCurrencyAmountToCreateOffer');
  }

  if (args.currency !== undefined && !isCurrency(args.currency)) {
    throw new Error('ExpectedIso4217CurrencyCodeToCreateOffer');
  }

  if (!!args.currency && args.amount === undefined) {
    throw new Error('ExpectedCurrencyAmountForCurrencyToCreateOffer');
  }

  if (args.mtokens !== undefined && !isNumber(args.mtokens)) {
    throw new Error('ExpectedMillitokensNumberStringToCreateOffer');
  }

  // An amount is either in millitokens or in a currency, not both
  if (args.mtokens !== undefined && args.amount !== undefined) {
    throw new Error('UnexpectedMillitokensAndCurrencyAmountToCreateOffer');
  }

  const amount = args.mtokens !== undefined ? args.mtokens : args.amount;

  if (amount !== undefined && !BigInt(amount)) {
    throw new Error('ExpectedNonZeroAmountToCreateOffer');
  }

  if (args.description !== undefined && !isString(args.description)) {
    throw new Error('ExpectedDescriptionStringToCreateOffer');
  }

  // A description is required to describe what the amount is paying for
  if (amount !== undefined && args.description === undefined) {
    throw new Error('ExpectedDescriptionForAmountToCreateOffer');
  }

  if (args.expires_at !== undefined && isNaN(parse(args.expires_at))) {
    throw new Error('ExpectedValidExpiresAtDateToCreateOffer');
  }

  if (args.features !== undefined && !isArray(args.features)) {
    throw new Error('ExpectedArrayOfFeaturesToCreateOffer');
  }

  if (args.issuer !== undefined && !isString(args.issuer)) {
    throw new Error('ExpectedIssuerStringToCreateOffer');
  }

  if (!args.issuer_id && !args.paths) {
    throw new Error('ExpectedIssuerIdOrPathsToCreateOffer');
  }

  if (!!args.issuer_id && !isString(args.issuer_id)) {
    throw new Error('ExpectedIssuerIdPublicKeyHexStringToCreateOffer');
  }

  const isIdOk = n => isHex(n) && hexByteLength(n) === pointByteLength;

  if (!!args.issuer_id && !isIdOk(args.issuer_id)) {
    throw new Error('ExpectedIssuerIdPublicKeyToCreateOffer');
  }

  if (!!args.issuer_id && !isPoint(hexAsBuffer(args.issuer_id))) {
    throw new Error('ExpectedValidIssuerIdPublicKeyToCreateOffer');
  }

  const isQuantityOk = n => isSafeInteger(n) && n >= Number();

  if (args.max_quantity !== undefined && !isQuantityOk(args.max_quantity)) {
    throw new Error('ExpectedMaxQuantityNumberToCreateOffer');
  }

  if (args.metadata !== undefined && !isString(args.metadata)) {
    throw new Error('ExpectedMetadataHexStringToCreateOffer');
  }

  if (args.metadata !== undefined && !isHex(args.metadata)) {
    throw new Error('ExpectedHexEncodedMetadataToCreateOffer');
  }

  if (args.networks !== undefined && !isArray(args.networks)) {
    throw new Error('ExpectedArrayOfNetworksToCreateOffer');
  }

  if (!!args.networks && !args.networks.length) {
    throw new Error('ExpectedNetworkNamesToCreateOffer');
  }

  if (args.paths !== undefined && !isArray(args.paths)) {
    throw new Error('ExpectedArrayOfBlindedPathsToCreateOffer');
  }

  const chains = (args.networks || []).map(network => {
    try {
      return networkAsChain({network}).chain;
    } catch (err) {
      throw new Error('ExpectedKnownNetworkNameToCreateOffer');
    }
  });

  // Bitcoin is the implied network when no chains are specified
  const isBitcoinOnly = !chains.length || (
    args.networks.length === [bitcoinNetwork].length &&
    args.networks.includes(bitcoinNetwork)
  );

  const encoded = {
    features: featuresAsHex({features: args.features || []}).hex,
  };

  // There are no defined offer features, so even bits cannot be understood
  if (!(args.features || []).every(isOptional)) {
    throw new Error('ExpectedOptionalFeatureBitsToCreateOffer');
  }

  // Bitcoin is the implied network when no chains are specified
  if (!isBitcoinOnly) {
    encoded.chains = chains.join(String());
  }

  if (!!args.currency) {
    encoded.currency = utf8AsHex(args.currency);
  }

  if (amount !== undefined) {
    encoded.amount = numberAsTruncated({number: amount}).hex;
  }

  if (args.description !== undefined) {
    encoded.description = utf8AsHex(args.description);
  }

  if (!!args.expires_at) {
    const expiry = floor(parse(args.expires_at) / msPerSec).toString();

    encoded.expiry = numberAsTruncated({number: expiry}).hex;
  }

  if (!!args.paths) {
    encoded.paths = blindedPathsAsHex({paths: args.paths}).hex;
  }

  if (args.issuer !== undefined) {
    encoded.issuer = utf8AsHex(args.issuer);
  }

  if (args.max_quantity !== undefined) {
    const number = args.max_quantity.toString();

    encoded.quantity = numberAsTruncated({number}).hex;
  }

  const records = [
    {type: types.offer.chains, value: encoded.chains},
    {type: types.offer.metadata, value: args.metadata},
    {type: types.offer.currency, value: encoded.currency},
    {type: types.offer.amount, value: encoded.amount},
    {type: types.offer.description, value: encoded.description},
    {type: types.offer.features, value: encoded.features || undefined},
    {type: types.offer.absolute_expiry, value: encoded.expiry},
    {type: types.offer.paths, value: encoded.paths},
    {type: types.offer.issuer, value: encoded.issuer},
    {type: types.offer.quantity_max, value: encoded.quantity},
    {type: types.offer.issuer_id, value: args.issuer_id},
  ];

  return {records: records.filter(n => n.value !== undefined)};
};
