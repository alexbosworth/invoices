const hexAsString = require('./hex_as_string');
const parseInvoiceRequest = require('./parse_invoice_request');
const signStream = require('./sign_stream');
const types = require('./conf/tlv_types');

const message = 'invoice_request';
const prefix = 'lnr';

/** Assemble a signed BOLT 12 invoice request for an offer

  Either a `secret` key to sign with or a `signature` is required

  The `signature` is a BIP 340 signature by the `payer_id` key over the `hash`
  from the unsigned request, such as from `signBytes` with the request `root`
  as the preimage, the request `tag` as the tag, and `schnorr` as the type.

  A request that is not for an offer is not signed

  {
    encoded: <Unsigned Invoice Request TLV Stream Hex String>
    [secret]: <Payer Id Private Key Hex String>
    [signature]: <Payer Id BIP 340 Signature Hex String>
  }

  @throws
  <Error>

  @returns
  {
    encoded: <Signed Invoice Request TLV Stream Hex String>
    request: <BOLT 12 Invoice Request String>
  }
*/
module.exports = ({encoded, secret, signature}) => {
  const signed = signStream({
    encoded,
    message,
    secret,
    signature,
    type: types.request.payer_id,
  });

  // Confirm that the signed request is a valid invoice request
  const request = parseInvoiceRequest({encoded: signed.encoded});

  // A signature is not allowed on a request that is not for an offer
  if (!request.offer) {
    throw new Error('UnexpectedSignatureForInvoiceRequestWithoutOffer');
  }

  return {
    encoded: signed.encoded,
    request: hexAsString({prefix, hex: signed.encoded}).string,
  };
};
