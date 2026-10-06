const {encodeTlvStream} = require('bolt01');

const hexAsBlindedPaths = require('./hex_as_blinded_paths');
const hexAsRecords = require('./hex_as_records');
const hexAsString = require('./hex_as_string');
const recordRange = require('./record_range');
const recordsAsInvoice = require('./records_as_invoice');
const requestDetails = require('./request_details');
const {safeTokens} = require('./../bolt00');
const stringAsHex = require('./string_as_hex');
const types = require('./conf/tlv_types');
const unsignedDetails = require('./unsigned_details');
const verifySignature = require('./verify_signature');

const allowedRanges = ['invoice', 'offer', 'request', 'signature'];
const findRecord = (records, type) => records.find(n => n.type === type);
const isEven = type => !(BigInt(type) % BigInt(2));
const isHex = n => !(n.length % 2) && /^[0-9A-F]*$/i.test(n);
const isSignatureType = type => recordRange({type}).range === 'signature';
const isString = n => typeof n === 'string';
const last = arr => arr[arr.length - [arr].length];
const message = 'invoice';
const prefix = 'lni';
const requestPrefix = 'lnr';
const requestRanges = ['offer', 'request'];

/** Parse a BOLT 12 invoice into its component data

  Either `encoded` or `invoice` is required

  An invoice for an offer has `offer`, an invoice for a request that is not
  for an offer has a `description` and optionally an `issuer` instead.

  `paths` are blinded paths to pay, with their accumulated payment info

  `request` is the invoice request that was sent for the invoice. When it is
  specified, the invoice is checked to have exactly the same request fields.

  BOLT 12 does not define a string encoding for invoices, which are sent as
  `encoded` bytes in onion messages. `invoice` uses the Core Lightning `lni`.

  {
    [encoded]: <Invoice TLV Stream Hex String>
    [invoice]: <BOLT 12 Invoice String>
    [request]: <Sent BOLT 12 Invoice Request String>
  }

  @throws
  <Error>

  @returns
  {
    [bip353_name]: <BIP 353 Human Readable Name String>
    [chain_addresses]: [<Fallback Chain Address String>]
    created_at: <Invoice Creation Date ISO 8601 String>
    [description]: <Request Description String>
    encoded: <Invoice TLV Stream Hex String>
    expires_at: <Invoice Expires At ISO 8601 Date String>
    features: [{
      bit: <BOLT 09 Feature Bit Number>
      is_required: <Feature Support is Required To Pay Bool>
      type: <Feature Type String>
    }]
    id: <Payment Hash Hex String>
    invoice: <BOLT 12 Invoice String>
    is_expired: <Invoice is Expired Bool>
    [issuer]: <Request Issuer Identifier String>
    metadata: <Payer Metadata Hex String>
    mtokens: <Invoice Amount Millitokens String>
    network: <Network Name String>
    node_id: <Invoice Node Public Key Hex String>
    [offer]: <BOLT 12 Offer String>
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
    payer_id: <Payer Public Key Hex String>
    [payer_note]: <Payer Note String>
    [quantity]: <Requested Quantity Number>
    safe_tokens: <Invoice Amount Tokens Rounded Up Number>
    signature: <Node Id BIP 340 Signature Hex String>
    tokens: <Invoice Amount Tokens Rounded Down Number>
  }
*/
module.exports = args => {
  const {encoded, invoice} = args;

  if (!encoded && !invoice) {
    throw new Error('ExpectedEncodedInvoiceOrInvoiceToParseInvoice');
  }

  if (!!encoded && !!invoice) {
    throw new Error('UnexpectedEncodedInvoiceAndInvoiceToParseInvoice');
  }

  if (!!encoded && (!isString(encoded) || !isHex(encoded))) {
    throw new Error('ExpectedHexEncodedInvoiceToParseInvoice');
  }

  if (!!invoice && !isString(invoice)) {
    throw new Error('ExpectedInvoiceStringToParseInvoice');
  }

  if (args.request !== undefined && !isString(args.request)) {
    throw new Error('ExpectedInvoiceRequestStringToParseInvoice');
  }

  // A string is decoded to hex, and hex is normalized to lower case
  const decoded = encoded || stringAsHex({prefix, string: invoice}).hex;

  const hex = decoded.toLowerCase();

  const {records} = hexAsRecords({hex});

  const ranges = records.map(n => recordRange({type: n.type}).range);

  // Invoices allow offer, request, invoice and signature record types
  if (!ranges.every(range => allowedRanges.includes(range))) {
    throw new Error('UnexpectedRecordTypeOutsideInvoiceRangeInInvoice');
  }

  const signatures = records.filter(n => isSignatureType(n.type));

  const isKnownSignature = n => n.type === types.signature;

  if (!signatures.every(n => !isEven(n.type) || isKnownSignature(n))) {
    throw new Error('UnexpectedUnknownEvenSignatureTypeInInvoice');
  }

  const signature = signatures.find(isKnownSignature);

  if (!signature) {
    throw new Error('ExpectedSignatureInInvoice');
  }

  const request = requestDetails({records});

  const details = recordsAsInvoice({records, network: request.network});

  const issuerId = findRecord(records, types.offer.issuer_id);

  // An invoice for an offer with an issuer id must be from the issuer
  if (!!issuerId && issuerId.value !== details.node_id) {
    throw new Error('ExpectedInvoiceNodeIdToBeOfferIssuerId');
  }

  const offerPaths = findRecord(records, types.offer.paths);

  // An invoice for an offer with only paths is from the final node of a path
  if (!issuerId && !!offerPaths) {
    const {paths} = hexAsBlindedPaths({hex: offerPaths.value});

    const nodeIds = paths.map(path => last(path.hops).relay_key);

    if (!nodeIds.includes(details.node_id)) {
      throw new Error('ExpectedInvoiceNodeIdToBeOfferPathNodeId');
    }
  }

  const hasRequestedAmount = request.mtokens !== undefined;

  // An invoice for a specific requested amount must be for that amount
  if (hasRequestedAmount && request.mtokens !== details.mtokens) {
    throw new Error('ExpectedInvoiceAmountToBeRequestedAmount');
  }

  const {hash} = unsignedDetails({message, records});

  const verified = {};

  try {
    verified.signature = verifySignature({
      hash,
      public_key: details.node_id,
      signature: signature.value,
    });
  } catch (err) {
    throw new Error('ExpectedValidSignatureEncodingInInvoice');
  }

  if (!verified.signature.is_valid) {
    throw new Error('ExpectedValidNodeIdSignatureInInvoice');
  }

  // The invoice has to be for the invoice request that was sent
  if (args.request !== undefined) {
    const isRequestField = n => {
      return requestRanges.includes(recordRange({type: n.type}).range);
    };

    const sent = hexAsRecords({
      hex: stringAsHex({prefix: requestPrefix, string: args.request}).hex,
    });

    const expected = encodeTlvStream({
      records: sent.records.filter(isRequestField),
    });

    const copied = encodeTlvStream({
      records: records.filter(isRequestField),
    });

    if (copied.encoded !== expected.encoded) {
      throw new Error('ExpectedInvoiceFieldsToMatchInvoiceRequestFields');
    }
  }

  const amounts = safeTokens({mtokens: details.mtokens});

  return {
    bip353_name: request.bip353_name,
    chain_addresses: details.chain_addresses,
    created_at: details.created_at,
    description: request.description,
    encoded: hex,
    expires_at: details.expires_at,
    features: details.features,
    id: details.id,
    invoice: hexAsString({hex, prefix}).string,
    is_expired: details.is_expired,
    issuer: request.issuer,
    metadata: request.metadata,
    mtokens: details.mtokens,
    network: request.network,
    node_id: details.node_id,
    offer: request.offer,
    paths: details.paths,
    payer_id: request.payer_id,
    payer_note: request.payer_note,
    quantity: request.quantity,
    safe_tokens: amounts.safe,
    signature: signature.value,
    tokens: amounts.tokens,
  };
};
