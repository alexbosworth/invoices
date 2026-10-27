# Versions

## 6.3.2

- `parsePaymentRequest`: Fail on `p`, `h`, `s`, `n` fields of unexpected length
- `parsePaymentRequest`: Fail on a missing `p` or duplicated single-use fields
- `parsePaymentRequest`: Fail on non-minimal `x`, `c` and `9` field encodings
- `parsePaymentRequest`: Fail on empty or truncated `r` route hints
- `parsePaymentRequest`: Fail on non-ASCII characters in the request
- `parsePaymentRequest`: Fix error for an expiry beyond the `Date` range

## 6.3.1

- `parsePaymentRequest`: Fix error for signatures that cannot recover a key

## 6.3.0

- `createInvoiceError`: Add method to create a BOLT 12 invoice error
- `createOffer`: Add method to create a BOLT 12 offer
- `createSignedInvoice`: Add method to sign a BOLT 12 invoice
- `createSignedInvoiceRequest`: Add method to sign a BOLT 12 invoice request
- `createUnsignedInvoice`: Add method to create a BOLT 12 invoice for a request
- `createUnsignedInvoiceRequest`: Add method to create a BOLT 12 invoice request
- `parseInvoice`: Add method to parse a BOLT 12 invoice
- `parseInvoiceError`: Add method to parse a BOLT 12 invoice error
- `parseInvoiceRequest`: Add method to parse a BOLT 12 invoice request
- `parseOffer`: Add method to parse a BOLT 12 offer

## 6.2.0

- `createSignedRequest`: Add ephemeral key signing for blinded path requests
- `createUnsignedRequest`: Add support for bLIP 39 blinded paths in `paths`
- `parsePaymentRequest`: Add support for bLIP 39 blinded paths in `paths`

## 6.1.4

- `parsePaymentRequest`: Add support for `signet` payment requests

## 6.0.5

### Breaking Changes

- Node.js version 22 or higher is now required

## 5.0.2

- `parsePaymentRequest`: Add support for fallback P2TR addresses

### Breaking Changes

- Node.js version 20 or higher is now required

## 4.0.0

- Node.js version 18 or higher is now required

## 3.0.0

- Node.js version 16 or higher is now required

## 2.2.3

- `createUnsignedRequest`: Fix support for empty description requests

## 2.1.1

- `parsePaymentRequest`: Change default CLTV delta from 9 to 18

## 2.1.0

- Add support for the signet currency code

## 2.0.7

- `createUnsignedRequest`: Include specified pubkey in unsigned request

## 2.0.5

### Breaking Change

- `parsePaymentRequest`: Change undefined to zero for `mtokens`, `safe_tokens`, `tokens`

## 1.2.1

Fix issues with millitoken value invoices and add additional test coverage for sub-token requests.

- `byteDecodeRequest`: Fix decoding issue, add required word count argument
- `byteEncodeRequest`: Return word count with encoding

## 1.2.0

- `byteDecodeRequest`: Add method to derive a payment request from request bytes
- `byteEncodeRequest`: Add method to derive bytes from a payment request

## 1.1.7

- `createUnsignedRequest`: Allow empty descriptions

## 1.1.2

- Add simnet support

## 1.0.3

Bump dependencies

## 1.0.0

Initial release
