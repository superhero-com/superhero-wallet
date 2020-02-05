import { Crypto } from '@aeternity/aepp-sdk/es';

const AIR_GAP_VERSION = '1';
const AIR_GAP_TYPE = '0';
const AIR_GAP_PROTOCOL = 'ae';
const AIR_GAP_CALLBACK = 'aepp-base://?d=';
const AIR_GAP_PAYLOAD_IDX = 3;
const AIR_GAP_PUBLIC_KEY_IDX = 0;
const AIR_GAP_SIGNED_TRANSACTION_IDX = 0;

const urlToPayload = url => Crypto.decode(Crypto.decodeBase58Check(new URL(url).searchParams.get('d')))[AIR_GAP_PAYLOAD_IDX];

export const getPublicKeyByResponseUrl = url => {
  const publicKey = urlToPayload(url)[AIR_GAP_PUBLIC_KEY_IDX];
  if (publicKey.length !== 64) throw new Error('Invalid public key length');
  return publicKey.toString();
};

export const getSignedTransactionByResponseUrl = url => urlToPayload(url)[AIR_GAP_SIGNED_TRANSACTION_IDX].toString();

export const generateSignRequestUrl = (networkId, transaction, publicKey) => {
  const rlp = [AIR_GAP_VERSION, AIR_GAP_TYPE, AIR_GAP_PROTOCOL, [[networkId, transaction], publicKey, AIR_GAP_CALLBACK]];
  const url = new URL('airgap-vault://');
  url.searchParams.set('d', Crypto.encodeBase58Check(Crypto.encode(rlp)));
  return url.toString();
};
