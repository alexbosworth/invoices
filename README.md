# Invoices

Utility methods for Lightning Network invoices: creating, signing and parsing
BOLT 11 payment requests and BOLT 12 offers, invoice requests and invoices.

## Methods

### byteDecodeRequest

Derive a payment request from request data.

    {
      encoded: <Payment Request Details Hex String>
      [mtokens]: <Millitokens Number String>
      network: <Network Name String>
      words: <Words Count Number>
    }

    @throws
    <Error>

    @returns
    {
      request: <BOLT 11 Encoded Payment Request String>
    }

Example:

```node
const {byteDecodeRequest} = require('invoices');

// Get a BOLT 11 payment request for this invoice data
const {request} = byteDecodeRequest({
  encoded: paymentRequestDetailsHexString,
  mtokens: '0',
  network: 'bitcoin',
});
```

### byteEncodeRequest

Derive bytes for payment request details

    {
      request: <BOLT 11 Encoded Payment Request String>
    }

    @throws
    <Error>

    @returns
    {
      encoded: <Payment Request Details Hex String>
      mtokens: <Millitokens Number String>
      network: <Network Name String>
      words: <Word Length Number>
    }

Example:

```node
const {byteEncodeRequest} = require('invoices');

// Get the bytes for a payment request
const {encoded, mtokens, network} = byteEncodeRequest({
  request: bolt11EncodedPaymentRequestString,
});
```

### createInvoiceError

Create a BOLT 12 invoice error

`suggested_value` requires `erroneous_field`

    {
      [erroneous_field]: <Erroneous Record Type Number String>
      message: <Error Message String>
      [suggested_value]: <Suggested Record Value Hex String>
    }

    @throws
    <Error>

    @returns
    {
      encoded: <Invoice Error TLV Stream Hex String>
    }

Example:

```node
const {createInvoiceError} = require('invoices');

// Explain that the requested amount was too low, suggesting an amount
const {encoded} = createInvoiceError({
  erroneous_field: '82',
  message: 'Amount too low',
  suggested_value: '2710',
});
```

### createOffer

Create a BOLT 12 offer

Either `issuer_id` or `paths` is required, `description` is required with an
amount, and `amount` requires `currency`

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
      offer: <BOLT 12 Offer String>
    }

Example:

```node
const {createOffer} = require('invoices');

// Offer to sell a coffee for 250 sats to anyone who requests an invoice
const {offer} = createOffer({
  description: 'A cup of coffee',
  issuer_id: nodePublicKey,
  mtokens: '250000',
});
```

### createSignedInvoice

Assemble a signed BOLT 12 invoice

Either a `secret` key to sign with or a `signature` over the unsigned invoice
`hash` is required

    {
      encoded: <Unsigned Invoice TLV Stream Hex String>
      [secret]: <Node Id Private Key Hex String>
      [signature]: <Node Id BIP 340 Signature Hex String>
    }

    @throws
    <Error>

    @returns
    {
      encoded: <Signed Invoice TLV Stream Hex String>
      invoice: <BOLT 12 Invoice String>
    }

Example:

```node
const {createSignedInvoice} = require('invoices');

// Get encoded, root and tag from createUnsignedInvoice
// Get signature via LND signBytes with type schnorr, or sign hash directly
const {encoded, invoice} = createSignedInvoice({
  encoded: unsignedInvoiceHex,
  signature: nodeIdSchnorrSignature,
});
```

### createSignedInvoiceRequest

Assemble a signed BOLT 12 invoice request for an offer

Either a `secret` key to sign with or a `signature` over the unsigned request
`hash` is required

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

Example:

```node
const {createSignedInvoiceRequest} = require('invoices');

// Get encoded from createUnsignedInvoiceRequest, sign with the payer key
const {encoded, request} = createSignedInvoiceRequest({
  encoded: unsignedRequestHex,
  secret: payerPrivateKey,
});
```

### createSignedRequest

Assemble a signed payment request

`signature` is not required when using blinded paths in the request

    {
      [destination]: <Destination Public Key Hex String>
      hrp: <Request Human Readable Part String>
      [signature]: <Request Hash Signature Hex String>
      tags: [<Request Tag Word Number>]
    }

    @throws
    <Error>

    @returns
    {
      request: <BOLT 11 Encoded Payment Request String>
    }

Example:

```node
const {createSignedRequest} = require('invoices');

// Get hrp and signature from createUnsignedRequest
// Get signature via standard private key signing, or LND signBytes
const {request} = createSignedRequest({
  destination: nodePublicKey,
  hrp: amountAndNetworkHrp,
  signature: signedPreimageHash,
  tags: paymentRequestTags,
});
```

### createUnsignedInvoice

Create an unsigned BOLT 12 invoice for an invoice request

Either `encoded` or `request` is required

`mtokens` defaults to the requested or offer amount

`node_id` is required when the request offer has no `issuer_id`, otherwise it
defaults to the offer `issuer_id`

`records` are experimental invoice records, with types from 3000000000 to
3999999999

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

Example:

```node
const {createUnsignedInvoice} = require('invoices');

// Get a blinded payment path from bolt04 paymentPathFromChannels
const {encoded, hash, root, tag} = createUnsignedInvoice({
  encoded: receivedInvoiceRequestHex,
  id: paymentHash,
  paths: [blindedPaymentPath],
});
// Use createSignedInvoice with a signature over hash to complete the invoice
```

### createUnsignedInvoiceRequest

Create an unsigned BOLT 12 invoice request

Without an `offer`, `description` and `mtokens` are required and `request` is
complete without a signature

`description`, `expires_at`, `issuer` and `paths` cannot be set with an `offer`

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

Example:

```node
const {createUnsignedInvoiceRequest} = require('invoices');

// Request an invoice for an offer with a transient payer key
const {encoded, hash, root, tag} = createUnsignedInvoiceRequest({
  offer: bolt12OfferString,
  payer_id: payerPublicKey,
});
// Use createSignedInvoiceRequest with a signature to complete the request
```

### createUnsignedRequest

Create an unsigned payment request

`paths` are bLIP 39 blinded paths. If using, omit `destination`, `payment`, and
`routes`

    {
      [chain_addresses]: [<Chain Address String>]
      [cltv_delta]: <CLTV Delta Number>
      [created_at]: <Invoice Creation Date ISO 8601 String>
      [description]: <Description String>
      [description_hash]: <Description Hash Hex String>
      [destination]: <Public Key String>
      [expires_at]: <ISO 8601 Date String>
      features: [{
        bit: <BOLT 09 Feature Bit Number>
      }]
      id: <Preimage SHA256 Hash Hex String>
      [mtokens]: <Requested Milli-Tokens Value String> (can exceed Number limit)
      network: <Network Name String>
      [paths]: [{
        base_fee_mtokens: <Accumulated Base Fee Millitokens String>
        cltv_delta: <Accumulated CLTV Expiry Delta Number>
        [features]: [{
          bit: <BOLT 09 Feature Bit Number>
        }]
        fee_rate: <Accumulated Fee Rate Millitokens Per Million Number>
        hops: [{
          encrypted_data: <Encrypted Recipient Data Hex String>
          relay_key: <Relaying Node Public Key Hex String>
        }]
        [introduction_node]: <Introduction Node Public Key Hex String>
        key: <First Hop Path Key Public Key Hex String>
        max_htlc_mtokens: <Maximum HTLC Millitokens String>
        min_htlc_mtokens: <Minimum HTLC Millitokens String>
      }]
      [payment]: <Payment Identifier Hex String>
      [routes]: [[{
        [base_fee_mtokens]: <Base Fee Millitokens String>
        [channel]: <Standard Format Channel Id String>
        [cltv_delta]: <Final CLTV Expiration Blocks Delta Number>
        [fee_rate]: <Fee Rate Millitokens Per Million Number>
        public_key: <Forward Edge Public Key Hex String>
      }]]
      [tokens]: <Requested Chain Tokens Number> (note: can differ from mtokens)
    }

    @returns
    {
      hash: <Payment Request Signature Hash Hex String>
      hrp: <Human Readable Part of Payment Request String>
      preimage: <Signature Hash Preimage Hex String>
      tags: [<Data Tag Number>]
    }

Example:

```node
const {createUnsignedRequest} = require('invoices');

const unsignedComponents = createUnsignedRequest({
  destination: nodePublicKey,
  id: rHashHexString,
  network: 'bitcoin',
});
// Use createSignedRequest and a signature to create a complete request
```

### parseInvoice

Parse a BOLT 12 invoice into its component data

Either `encoded` or `invoice` is required

`request` checks that the invoice is for the invoice request that was sent

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

Example:

```node
const {parseInvoice} = require('invoices');

// Decoded details of the invoice for the invoice request that was sent
const invoiceDetails = parseInvoice({
  encoded: receivedInvoiceHex,
  request: sentInvoiceRequestString,
});
```

### parseInvoiceError

Parse a BOLT 12 invoice error into its component data

    {
      encoded: <Invoice Error TLV Stream Hex String>
    }

    @throws
    <Error>

    @returns
    {
      [erroneous_field]: <Erroneous Record Type Number String>
      message: <Error Message String>
      [suggested_value]: <Suggested Record Value Hex String>
    }

Example:

```node
const {parseInvoiceError} = require('invoices');

// Decoded details of the invoice error
const {message} = parseInvoiceError({encoded: receivedInvoiceErrorHex});
```

### parseInvoiceRequest

Parse a BOLT 12 invoice request into its component data

Either `encoded` or `request` is required

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

Example:

```node
const {parseInvoiceRequest} = require('invoices');

// Decoded details of the invoice request
const requestDetails = parseInvoiceRequest({encoded: receivedRequestHex});
```

### parseOffer

Parse a BOLT 12 offer into its component data

Either `encoded` or `offer` is required

`paths` are blinded paths to send invoice requests to

    {
      [encoded]: <Offer TLV Stream Hex String>
      [offer]: <BOLT 12 Offer String>
    }

    @throws
    <Error>

    @returns
    {
      [amount]: <Amount in Currency Minor Units String>
      [currency]: <ISO 4217 Currency Code String>
      [description]: <Description String>
      encoded: <Offer TLV Stream Hex String>
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
      offer: <BOLT 12 Offer String>
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

Example:

```node
const {parseOffer} = require('invoices');

// Decoded details of the offer
const offerDetails = parseOffer({offer: 'lno1...'});
```

### parsePaymentRequest

Parse a BOLT 11 payment request into its component data

Note: either description or description_hash will be returned

`paths` are bLIP 39 blinded paths.

    {
      request: <BOLT 11 Payment Request String>
    }

    @throws
    <Error>

    @returns
    {
      [chain_addresses]: [<Chain Address String>]
      cltv_delta: <CLTV Delta Number>
      created_at: <Invoice Creation Date ISO 8601 String>
      [description]: <Description String>
      [description_hash]: <Description Hash Hex String>
      destination: <Public Key String>
      expires_at: <ISO 8601 Date String>
      features: [{
        bit: <BOLT 09 Feature Bit Number>
        is_required: <Feature Support is Required To Pay Bool>
        type: <Feature Type String>
      }]
      id: <Payment Request Hash String>
      is_expired: <Invoice is Expired Bool>
      [mtokens]: <Requested Milli-Tokens Value String> (can exceed Number limit)
      network: <Network Name String>
      [paths]: [{
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
          relay_key: <Relaying Node Public Key Hex String>
        }]
        introduction_node: <Introduction Node Public Key Hex String>
        key: <First Hop Path Key Public Key Hex String>
        max_htlc_mtokens: <Maximum HTLC Millitokens String>
        min_htlc_mtokens: <Minimum HTLC Millitokens String>
      }]
      [payment]: <Payment Identifier Hex Encoded String>
      [routes]: [[{
        [base_fee_mtokens]: <Base Fee Millitokens String>
        [channel]: <Standard Format Channel Id String>
        [cltv_delta]: <Final CLTV Expiration Blocks Delta Number>
        [fee_rate]: <Fee Rate Millitokens Per Million Number>
        public_key: <Forward Edge Public Key Hex String>
      }]]
      [safe_tokens]: <Requested Chain Tokens Rounded Up Number>
      [tokens]: <Requested Chain Tokens Number> (note: can differ from mtokens)
    }

```node
const {parsePaymentRequest} = require('invoices');

// Decoded details of the payment request
const requestDetails = parsePaymentRequest({request: 'paymentRequestString'});
```
