const {safeTokens} = require('./../bolt00');

const asDateString = ms => new Date(ms).toISOString();
const defaultCltvDelta = 9;
const defaultExpireSeconds = 3600;
const defaultMtokens = '0';
const msPerSec = 1e3;

/** Get consolidated payment request details from field elements

  {
    destination: <Public Key Hex String>
    details: [{
      [chain_address]: <Chain Address String>
      [cltv_delta]: <CLTV Delta Number>
      [description]: <Description String>
      [description_hash]: <Description Hash Hex String>
      [expiry_seconds]: <Seconds After Creation Until Soft Expiration Number>
      [features]: [{
        bit: <BOLT 09 Feature Bit Number>
        is_required: <Feature Support is Required To Pay Bool>
        type: <Feature Type String>
      }]
      [id]: <Payment Request Hash String>
      [path]: [{
        [base_fee_mtokens]: <Base Fee Millitokens String>
        [channel]: <Standard Format Channel Id String>
        [cltv_delta]: <Final CLTV Expiration Blocks Delta Number>
        [fee_rate]: <Fee Rate Millitokens Per Million Number>
        public_key: <Forward Edge Public Key Hex String>
      }]
      [payment]: <Payment Identifier Hex Encoded String>
    }]
    mtokens: <Requested Millitokens String>
    network: <Network Name String>
    timestamp: <Creation Timestamp Epoch Milliseconds Number>
  }

  @returns
  {
    [chain_addresses]: [<Chain Address String>]
    cltv_delta: <CLTV Delta Number>
    created_at: <Invoice Creation Date ISO 8601 String>
    [description]: <Description String>
    [description_hash]: <Description Hash Hex String>
    destination: <Public Key Hex String>
    expires_at: <ISO 8601 Date String>
    features: [{
      bit: <BOLT 09 Feature Bit Number>
      is_required: <Feature Support is Required To Pay Bool>
      type: <Feature Type String>
    }]
    id: <Payment Request Hash String>
    [metadata]: <Payment Metadata Hex String>
    [mtokens]: <Requested Milli-Tokens Value String> (can exceed Number limit)
    network: <Network Name String>
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
*/
module.exports = ({destination, details, mtokens, network, timestamp}) => {
  const amounts = safeTokens({mtokens: mtokens || defaultMtokens});

  return details.reduce((sum, n) => {
    if (!!n.chain_address) {
      sum.chain_addresses.push(n.chain_address);
    }

    if (!!n.cltv_delta) {
      sum.cltv_delta = n.cltv_delta;
    }

    if (!!n.description) {
      sum.description = n.description;
    }

    if (!!n.description_hash) {
      sum.description_hash = n.description_hash;
    }

    if (!!n.expiry_seconds) {
      sum.expires_at = asDateString((n.expiry_seconds * msPerSec) + timestamp);
    }

    if (!!n.features) {
      sum.features = n.features;
    }

    if (!!n.id) {
      sum.id = n.id;
    }

    if (!!n.metadata) {
      sum.metadata = n.metadata;
    }

    if (!!n.payment) {
      sum.payment = n.payment;
    }

    if (!!n.path) {
      const [first] = n.path;
      const lastHop = {public_key: destination};

      const path = n.path.map((hop, i) => ({
        base_fee_mtokens: hop.base_fee_mtokens,
        channel: hop.channel,
        cltv_delta: hop.cltv_delta,
        fee_rate: hop.fee_rate,
        public_key: (n.path[(i + [hop].length)] || lastHop).public_key,
      }));

      const route = [].concat([{public_key: first.public_key}]).concat(path);

      sum.routes.push(route);
    }

    return sum;
  },
  {
    destination,
    network,
    chain_addresses: !!details.find(n => !!n.chain_address) ? [] : undefined,
    cltv_delta: defaultCltvDelta,
    created_at: asDateString(timestamp),
    expires_at: asDateString((defaultExpireSeconds * msPerSec) + timestamp),
    features: [],
    mtokens: mtokens || Number().toString(),
    routes: !!details.find(n => !!n.path) ? [] : undefined,
    safe_tokens: !!mtokens ? amounts.safe : Number(),
    tokens: !!mtokens ? amounts.tokens : Number(),
  });
};
