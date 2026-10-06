const hexAsRecords = require('./hex_as_records');
const hexAsString = require('./hex_as_string');
const recordRange = require('./record_range');
const requestDetails = require('./request_details');
const stringAsHex = require('./string_as_hex');
const types = require('./conf/tlv_types');
const unsignedDetails = require('./unsigned_details');
const verifySignature = require('./verify_signature');

const allowedRanges = ['offer', 'request', 'signature'];
const isEven = type => !(BigInt(type) % BigInt(2));
const isHex = n => !(n.length % 2) && /^[0-9A-F]*$/i.test(n);
const isSignatureType = type => recordRange({type}).range === 'signature';
const isString = n => typeof n === 'string';
const message = 'invoice_request';
const prefix = 'lnr';

/** Parse a BOLT 12 invoice request into its component data

  Either `encoded` or `request` is required

  A request for an offer has `offer`, a request that is not for an offer has
  a `description` and optionally an `issuer` and `expires_at` instead.

  A request for an offer is signed by the payer id. A request that is not for
  an offer is published without a signature, a signature is checked if present.

  `paths` are blinded paths to send the invoice to

  {
    [encoded]: <Invoice Request TLV Stream Hex String>
    [request]: <BOLT 12 Invoice Request String>
  }

  @throws
  <Error>

  @returns
  {
    [bip353_name]: <BIP 353 Human Readable Name String>
    [description]: <Request Description String>
    encoded: <Invoice Request TLV Stream Hex String>
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
    request: <BOLT 12 Invoice Request String>
    [signature]: <Payer Id BIP 340 Signature Hex String>
  }
*/
module.exports = ({encoded, request}) => {
  if (!encoded && !request) {
    throw new Error('ExpectedEncodedRequestOrRequestToParseInvoiceRequest');
  }

  if (!!encoded && !!request) {
    throw new Error('UnexpectedEncodedRequestAndRequestToParseInvoiceRequest');
  }

  if (!!encoded && (!isString(encoded) || !isHex(encoded))) {
    throw new Error('ExpectedHexEncodedInvoiceRequestToParseInvoiceRequest');
  }

  if (!!request && !isString(request)) {
    throw new Error('ExpectedInvoiceRequestStringToParseInvoiceRequest');
  }

  // A string is decoded to hex, and hex is normalized to lower case
  const decoded = encoded || stringAsHex({prefix, string: request}).hex;

  const hex = decoded.toLowerCase();

  const {records} = hexAsRecords({hex});

  const ranges = records.map(n => recordRange({type: n.type}).range);

  // Invoice requests only allow offer, request, and signature record types
  if (!ranges.every(range => allowedRanges.includes(range))) {
    throw new Error('UnexpectedRecordTypeOutsideRequestRangeInInvoiceRequest');
  }

  const signatures = records.filter(n => isSignatureType(n.type));

  const isKnownSignature = n => n.type === types.signature;

  if (!signatures.every(n => !isEven(n.type) || isKnownSignature(n))) {
    throw new Error('UnexpectedUnknownEvenSignatureTypeInInvoiceRequest');
  }

  const signature = signatures.find(isKnownSignature);

  const details = requestDetails({records});

  // A request for an offer is signed, a request without an offer is not
  if (!!details.offer && !signature) {
    throw new Error('ExpectedSignatureInInvoiceRequest');
  }

  // A signature that is present must be a valid signature by the payer id
  if (!!signature) {
    const {hash} = unsignedDetails({message, records});

    const verified = {};

    try {
      verified.signature = verifySignature({
        hash,
        public_key: details.payer_id,
        signature: signature.value,
      });
    } catch (err) {
      throw new Error('ExpectedValidSignatureEncodingInInvoiceRequest');
    }

    if (!verified.signature.is_valid) {
      throw new Error('ExpectedValidPayerIdSignatureInInvoiceRequest');
    }
  }

  return {
    bip353_name: details.bip353_name,
    description: details.description,
    encoded: hex,
    expires_at: details.expires_at,
    features: details.features,
    issuer: details.issuer,
    metadata: details.metadata,
    mtokens: details.mtokens,
    network: details.network,
    offer: details.offer,
    payer_id: details.payer_id,
    payer_note: details.payer_note,
    paths: details.paths,
    quantity: details.quantity,
    request: hexAsString({hex, prefix}).string,
    signature: !signature ? undefined : signature.value,
  };
};
