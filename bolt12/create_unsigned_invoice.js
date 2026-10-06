const hexAsRecords = require('./hex_as_records');
const invoiceAsRecords = require('./invoice_as_records');
const parseInvoiceRequest = require('./parse_invoice_request');
const parseOffer = require('./parse_offer');
const recordRange = require('./record_range');
const recordsAsInvoice = require('./records_as_invoice');
const unsignedDetails = require('./unsigned_details');

const asLowerCase = n => isString(n) ? n.toLowerCase() : n;
const defaultExpiryMs = 1e3 * 60 * 60 * 2;
const defaultQuantity = 1;
const firstExperimental = '3000000000';
const {isArray} = Array;
const isExperimental = type => BigInt(type) >= BigInt(firstExperimental);
const isHexString = n => isString(n) && /^([0-9a-f]{2})*$/i.test(n);
const isInvoiceType = type => recordRange({type}).range === 'invoice';
const {isNaN} = Number;
const isNumber = n => isString(n) && /^\d+$/.test(n);
const isRecord = n => !!n && isNumber(n.type) && isHexString(n.value);
const isSignatureType = type => recordRange({type}).range === 'signature';
const isString = n => typeof n === 'string';
const last = arr => arr[arr.length - [arr].length];
const message = 'invoice';
const {now} = Date;
const {parse} = Date;

/** Create an unsigned BOLT 12 invoice for an invoice request

  Either `encoded` or `request` is required

  `mtokens` defaults to the requested amount, or to the offer amount times the
  quantity. When there is a requested or offer amount, it must be that amount.

  `node_id` is required when the request offer has no issuer id, otherwise it
  defaults to the offer issuer id. For an offer without an issuer id,
  `node_id` is the final blinded node id of the offer path that received the
  request. For a request without an offer, `node_id` is the signing key.

  Sign `hash` directly with a BIP 340 signature or sign `root` with `tag` as
  the tagged hash tag using the `node_id` key

  `records` are added to the invoice, and have to be in the experimental
  range of invoice records, from 3000000000 to 3999999999

  {
    [chain_addresses]: [<Fallback Chain Address String>]
    [created_at]: <Invoice Creation Date ISO 8601 String>
    [encoded]: <Invoice Request TLV Stream Hex String>
    [expires_at]: <Invoice Expires At ISO 8601 Date String>
    [features]: [{
      bit: <BOLT 09 Feature Bit Number>
    }]
    id: <Payment Hash Hex String>
    [mtokens]: <Invoice Amount Millitokens String>
    [node_id]: <Invoice Node Public Key Hex String>
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
    [records]: [{
      type: <Experimental Invoice Record Type Number String>
      value: <Experimental Invoice Record Value Hex String>
    }]
    [request]: <BOLT 12 Invoice Request String>
  }

  @throws
  <Error>

  @returns
  {
    encoded: <Unsigned Invoice TLV Stream Hex String>
    hash: <Tagged Merkle Root Hash To Sign Hex String>
    root: <Merkle Root Hash Hex String>
    tag: <Signature Tag String>
  }
*/
module.exports = args => {
  const request = parseInvoiceRequest({
    encoded: args.encoded,
    request: args.request,
  });

  if (args.created_at !== undefined && isNaN(parse(args.created_at))) {
    throw new Error('ExpectedValidCreatedAtDateToCreateInvoice');
  }

  if (args.mtokens !== undefined && !isNumber(args.mtokens)) {
    throw new Error('ExpectedMillitokensNumberStringToCreateInvoice');
  }

  const extra = args.records || [];

  if (!isArray(extra) || !extra.every(isRecord)) {
    throw new Error('ExpectedArrayOfRecordsToCreateInvoice');
  }

  // Added records are experimental invoice records
  if (!extra.every(n => isInvoiceType(n.type) && isExperimental(n.type))) {
    throw new Error('ExpectedExperimentalInvoiceRecordsToCreateInvoice');
  }

  if (new Set(extra.map(n => BigInt(n.type))).size !== extra.length) {
    throw new Error('ExpectedUniqueRecordTypesToCreateInvoice');
  }

  const offer = !request.offer ? {} : parseOffer({offer: request.offer});

  // An invoice cannot be created for an offer that is expired
  if (!!offer.is_expired) {
    throw new Error('ExpectedUnexpiredOfferToCreateInvoice');
  }

  // A request without an offer is also not responded to after it expires
  if (!!request.expires_at && parse(request.expires_at) < now()) {
    throw new Error('ExpectedUnexpiredInvoiceRequestToCreateInvoice');
  }

  // The amount of the invoice is the amount that was requested for the offer
  const requestedAmount = () => {
    if (request.mtokens !== undefined) {
      return request.mtokens;
    }

    // A currency offer does not have an amount in millitokens
    if (offer.mtokens === undefined) {
      return undefined;
    }

    // Otherwise the amount is the offer amount times the quantity
    const quantity = BigInt(request.quantity || defaultQuantity);

    return (BigInt(offer.mtokens) * quantity).toString();
  };

  const requested = requestedAmount();

  // Only a currency offer without a requested amount needs an amount
  if (args.mtokens === undefined && requested === undefined) {
    throw new Error('ExpectedMillitokensToCreateInvoiceForRequest');
  }

  // The amounts are compared as numbers since strings can have leading zeros
  if (args.mtokens !== undefined && requested !== undefined) {
    if (BigInt(args.mtokens) !== BigInt(requested)) {
      throw new Error('ExpectedInvoiceMillitokensToMatchRequestMillitokens');
    }
  }

  const nodeId = asLowerCase(args.node_id);

  // An invoice for an offer with an issuer id is signed by the issuer id
  if (!!offer.issuer_id && !!nodeId && nodeId !== offer.issuer_id) {
    throw new Error('ExpectedInvoiceNodeIdToMatchOfferIssuerId');
  }

  if (!offer.issuer_id && !nodeId) {
    throw new Error('ExpectedNodeIdToCreateInvoiceForRequest');
  }

  // An offer without an issuer id is signed by the final node of a path
  const pathNodeIds = (offer.paths || []).map(n => last(n.hops).relay_key);

  if (!offer.issuer_id && !!offer.paths && !pathNodeIds.includes(nodeId)) {
    throw new Error('ExpectedNodeIdFromOfferPathsToCreateInvoice');
  }

  const createdAt = args.created_at || new Date(now()).toISOString();

  const defaultExpiresAt = new Date(parse(createdAt) + defaultExpiryMs);

  // A created at date near the maximum date leaves no room for the expiry
  if (isNaN(defaultExpiresAt.getTime())) {
    throw new Error('ExpectedCreatedAtDateWithinRangeToCreateInvoice');
  }

  const {records} = invoiceAsRecords({
    chain_addresses: args.chain_addresses,
    created_at: createdAt,
    expires_at: args.expires_at || defaultExpiresAt.toISOString(),
    features: args.features,
    id: args.id,
    mtokens: args.mtokens !== undefined ? args.mtokens : requested,
    network: request.network,
    node_id: nodeId || offer.issuer_id,
    paths: args.paths,
  });

  // The invoice copies all of the non-signature records from the request
  const requestRecords = hexAsRecords({hex: request.encoded}).records
    .filter(n => !isSignatureType(n.type));

  const invoiceRecords = [].concat(requestRecords).concat(records).concat(
    extra.map(n => ({type: n.type, value: n.value.toLowerCase()}))
  );

  // Confirm that the invoice would be valid from a reader's perspective
  recordsAsInvoice({records: invoiceRecords, network: request.network});

  return unsignedDetails({message, records: invoiceRecords});
};
