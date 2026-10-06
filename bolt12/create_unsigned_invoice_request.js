const hexAsRecords = require('./hex_as_records');
const hexAsString = require('./hex_as_string');
const numberAsTruncated = require('./number_as_truncated');
const parseOffer = require('./parse_offer');
const requestAsRecords = require('./request_as_records');
const requestDetails = require('./request_details');
const stringAsHex = require('./string_as_hex');
const types = require('./conf/tlv_types');
const unsignedDetails = require('./unsigned_details');

const bitcoinNetwork = 'bitcoin';
const {floor} = Math;
const {isNaN} = Number;
const isString = n => typeof n === 'string';
const message = 'invoice_request';
const msPerSec = 1e3;
const offerPrefix = 'lno';
const {parse} = Date;
const prefix = 'lnr';
const utf8AsHex = utf8 => Buffer.from(utf8, 'utf8').toString('hex');

/** Create an unsigned BOLT 12 invoice request

  Requesting an invoice for an `offer` copies the offer fields into the
  request, so `description`, `expires_at`, `issuer` and `paths` cannot be
  supplied with an `offer`. Without an `offer`, a `description` and `mtokens`
  are required and `expires_at`, `issuer` and `paths` may be set.

  A request for an `offer` is sent to the offer node and needs a signature:
  sign `hash` directly with a BIP 340 signature or sign `root` with `tag` as
  the tagged hash tag using the `payer_id` key, then use
  `createSignedInvoiceRequest`.

  A request without an `offer` is published, like an offer, and is not
  signed: `request` is the complete BOLT 12 invoice request.

  For a request for an `offer`, `payer_id` should be a transient public key.
  Remember its secret key to sign the request and to prove the request was
  made. Without an `offer`, `payer_id` is the node key to send the invoice to.

  `metadata` should be unpredictable, random bytes are used by default

  `network` defaults to the offer network when the offer is not for bitcoin

  `paths` are blinded paths for a request without an `offer`, to send the
  invoice to. The invoice for a request for an `offer` is sent over the reply
  path of the onion message that carried the request.

  {
    [bip353_name]: <BIP 353 Human Readable Name String>
    [description]: <Description String>
    [expires_at]: <Request Expires At ISO 8601 Date String>
    [features]: [{
      bit: <BOLT 09 Feature Bit Number>
    }]
    [issuer]: <Issuer Identifier String>
    [metadata]: <Payer Metadata Hex String>
    [mtokens]: <Requested Amount Millitokens String>
    [network]: <Network Name String>
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

  @throws
  <Error>

  @returns
  {
    encoded: <Unsigned Invoice Request TLV Stream Hex String>
    [hash]: <Tagged Merkle Root Hash To Sign Hex String>
    [request]: <BOLT 12 Invoice Request Without Offer String>
    [root]: <Merkle Root Hash Hex String>
    [tag]: <Signature Tag String>
  }
*/
module.exports = args => {
  if (!!args.offer && !isString(args.offer)) {
    throw new Error('ExpectedOfferStringToCreateInvoiceRequest');
  }

  if (!!args.offer && args.description !== undefined) {
    throw new Error('UnexpectedDescriptionForOfferToCreateInvoiceRequest');
  }

  if (!!args.offer && args.expires_at !== undefined) {
    throw new Error('UnexpectedExpiresAtForOfferToCreateInvoiceRequest');
  }

  if (!!args.offer && args.issuer !== undefined) {
    throw new Error('UnexpectedIssuerForOfferToCreateInvoiceRequest');
  }

  // The invoice for an offer is sent back over the onion message reply path
  if (!!args.offer && args.paths !== undefined) {
    throw new Error('UnexpectedPathsForOfferToCreateInvoiceRequest');
  }

  if (!args.offer && !isString(args.description)) {
    throw new Error('ExpectedDescriptionToCreateInvoiceRequestWithoutOffer');
  }

  if (!args.offer && args.mtokens === undefined) {
    throw new Error('ExpectedMillitokensToCreateInvoiceRequestWithoutOffer');
  }

  if (args.expires_at !== undefined && isNaN(parse(args.expires_at))) {
    throw new Error('ExpectedValidExpiresAtDateToCreateInvoiceRequest');
  }

  if (args.issuer !== undefined && !isString(args.issuer)) {
    throw new Error('ExpectedIssuerStringToCreateInvoiceRequest');
  }

  const offer = !args.offer ? undefined : parseOffer({offer: args.offer});

  if (!!offer && offer.is_expired) {
    throw new Error('ExpectedUnexpiredOfferToCreateInvoiceRequest');
  }

  // The request chain is set to an offer chain when bitcoin is not an option
  const [offerNetwork] = !offer ? [] : offer.networks;

  const isBitcoinOffer = !offer || offer.networks.includes(bitcoinNetwork);

  // An invoice request for an offer copies all of the offer records
  const copyOfferRecords = () => {
    const {hex} = stringAsHex({prefix: offerPrefix, string: args.offer});

    return hexAsRecords({hex}).records;
  };

  // A request without an offer has its own description, expiry and issuer
  const ownRecords = () => {
    const encoded = {description: utf8AsHex(args.description)};

    if (args.expires_at !== undefined) {
      const expiry = floor(parse(args.expires_at) / msPerSec).toString();

      encoded.expiry = numberAsTruncated({number: expiry}).hex;
    }

    if (args.issuer !== undefined) {
      encoded.issuer = utf8AsHex(args.issuer);
    }

    return [
      {type: types.offer.description, value: encoded.description},
      {type: types.offer.absolute_expiry, value: encoded.expiry},
      {type: types.offer.issuer, value: encoded.issuer},
    ];
  };

  const offerRecords = !!args.offer ? copyOfferRecords() : ownRecords();

  const requestRecords = requestAsRecords({
    bip353_name: args.bip353_name,
    features: args.features,
    metadata: args.metadata,
    mtokens: args.mtokens,
    network: args.network || (isBitcoinOffer ? undefined : offerNetwork),
    payer_id: args.payer_id,
    payer_note: args.payer_note,
    paths: args.paths,
    quantity: args.quantity,
  });

  const records = offerRecords
    .filter(n => n.value !== undefined)
    .concat(requestRecords.records);

  // Confirm that the request would be valid from a reader's perspective
  requestDetails({records});

  const unsigned = unsignedDetails({message, records});

  // A request that is not for an offer must not have a signature
  if (!offer) {
    return {
      encoded: unsigned.encoded,
      request: hexAsString({prefix, hex: unsigned.encoded}).string,
    };
  }

  return unsigned;
};
