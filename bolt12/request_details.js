const {encodeTlvStream} = require('bolt01');

const hexAsString = require('./hex_as_string');
const recordRange = require('./record_range');
const recordsAsOffer = require('./records_as_offer');
const recordsAsRequest = require('./records_as_request');
const types = require('./conf/tlv_types');

const defaultQuantity = 1;
const hasRecord = (records, type) => !!records.find(n => n.type === type);
const {isArray} = Array;
const isIssuerOptional = true;
const isOfferType = type => recordRange({type}).range === 'offer';
const isString = n => typeof n === 'string';
const offerPrefix = 'lno';

/** Derive invoice request details from the records of a TLV stream

  A request for an offer has the offer's records, otherwise the request has
  a description and optionally an issuer and expiry set by the requester.

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
    [description]: <Request Description String>
    [expires_at]: <Request Expires At ISO 8601 Date String>
    features: [{
      bit: <BOLT 09 Feature Bit Number>
      is_required: <Feature Support is Required Bool>
      type: <Feature Type String>
    }]
    [issuer]: <Request Issuer Identifier String>
    metadata: <Payer Metadata Hex String>
    [mtokens]: <Requested Amount Millitokens String>
    network: <Network Name String>
    [offer]: <BOLT 12 Offer String>
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
    throw new Error('ExpectedArrayOfRecordsToDeriveRequestDetails');
  }

  if (!records.every(n => !!n && isString(n.type) && isString(n.value))) {
    throw new Error('ExpectedRecordTypesAndValuesToDeriveRequestDetails');
  }

  const request = recordsAsRequest({records});

  const offerRecords = records.filter(n => isOfferType(n.type));

  const hasIssuerId = hasRecord(offerRecords, types.offer.issuer_id);
  const hasPaths = hasRecord(offerRecords, types.offer.paths);

  // A request that has no issuer id or paths is not a request for an offer
  if (!hasIssuerId && !hasPaths) {
    const details = recordsAsOffer({
      records: offerRecords,
      is_issuer_optional: isIssuerOptional,
    });

    if (hasRecord(offerRecords, types.offer.chains)) {
      throw new Error('UnexpectedOfferChainsInInvoiceRequestWithoutOffer');
    }

    if (hasRecord(offerRecords, types.offer.features)) {
      throw new Error('UnexpectedOfferFeaturesInInvoiceRequestWithoutOffer');
    }

    if (hasRecord(offerRecords, types.offer.quantity_max)) {
      throw new Error('UnexpectedQuantityMaxInInvoiceRequestWithoutOffer');
    }

    if (request.mtokens === undefined) {
      throw new Error('ExpectedAmountInInvoiceRequestWithoutOffer');
    }

    return {
      bip353_name: request.bip353_name,
      description: details.description,
      expires_at: details.expires_at,
      features: request.features,
      issuer: details.issuer,
      metadata: request.metadata,
      mtokens: request.mtokens,
      network: request.network,
      offer: undefined,
      payer_id: request.payer_id,
      payer_note: request.payer_note,
      paths: request.paths,
      quantity: request.quantity,
    };
  }

  const offer = recordsAsOffer({records: offerRecords});

  if (!offer.networks.includes(request.network)) {
    throw new Error('ExpectedInvoiceRequestChainToBeOfferChain');
  }

  // A quantity is required when the offer allows for a quantity
  if (offer.max_quantity !== undefined && request.quantity === undefined) {
    throw new Error('ExpectedQuantityInInvoiceRequestForOfferWithQuantity');
  }

  if (offer.max_quantity !== undefined && !request.quantity) {
    throw new Error('ExpectedNonZeroQuantityInInvoiceRequest');
  }

  // A non-zero maximum quantity means the quantity is limited to the maximum
  if (!!offer.max_quantity && request.quantity > offer.max_quantity) {
    throw new Error('ExpectedQuantityWithinOfferMaximumInInvoiceRequest');
  }

  if (offer.max_quantity === undefined && request.quantity !== undefined) {
    throw new Error('UnexpectedQuantityInInvoiceRequestForOffer');
  }

  // When the offer has no amount, the request has to specify the amount
  if (offer.mtokens === undefined && !offer.currency) {
    if (request.mtokens === undefined) {
      throw new Error('ExpectedAmountInInvoiceRequestForOfferWithoutAmount');
    }
  }

  // A requested amount cannot be less than the expected amount for the offer
  if (offer.mtokens !== undefined && request.mtokens !== undefined) {
    const quantity = BigInt(request.quantity || defaultQuantity);

    if (BigInt(request.mtokens) < BigInt(offer.mtokens) * quantity) {
      throw new Error('ExpectedInvoiceRequestAmountAtLeastOfferAmount');
    }
  }

  // The request is for the offer that its offer records encode
  const {encoded} = encodeTlvStream({records: offerRecords});

  return {
    bip353_name: request.bip353_name,
    description: undefined,
    expires_at: undefined,
    features: request.features,
    issuer: undefined,
    metadata: request.metadata,
    mtokens: request.mtokens,
    network: request.network,
    offer: hexAsString({hex: encoded, prefix: offerPrefix}).string,
    payer_id: request.payer_id,
    payer_note: request.payer_note,
    paths: request.paths,
    quantity: request.quantity,
  };
};
