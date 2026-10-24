import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';
import { useNetworks } from '@/composables/networks';
import {
  ACCOUNT_TYPES,
  NETWORK_NAME_MAINNET,
  NETWORK_NAME_TESTNET,
  PROTOCOLS,
} from '@/constants';
import type { Protocol } from '@/types';
import {
  PRIVATE_KEY_VECTORS,
  RFC8032_TEST1_PUBLIC_KEY,
  SECP256K1_SECRET_1_PUBLIC_KEY,
} from '../../fixtures/privateKeyVectors';

function importPrivateKey(protocol: Protocol, privateKeyHex: string) {
  return ProtocolAdapterFactory.getAdapter(protocol).resolveAccountRaw(
    {
      type: ACCOUNT_TYPES.privateKey,
      isRestored: false,
      protocol,
      privateKey: Buffer.from(privateKeyHex, 'hex'),
    },
    0,
    0,
  );
}

describe('imported private key addresses', () => {
  describe('on mainnet', () => {
    beforeAll(() => {
      useNetworks().switchNetwork(NETWORK_NAME_MAINNET);
    });

    it.each(PRIVATE_KEY_VECTORS)('%s', (protocol, privateKeyHex, address) => {
      const account = importPrivateKey(protocol, privateKeyHex);

      expect(account?.address).toBe(address);
      // Solana signs with the 64-byte form: the secret followed by its public key.
      expect(Buffer.from(account!.secretKey).toString('hex')).toBe(
        protocol === PROTOCOLS.solana ? privateKeyHex + RFC8032_TEST1_PUBLIC_KEY : privateKeyHex,
      );
    });

    it.each([
      [PROTOCOLS.bitcoin, SECP256K1_SECRET_1_PUBLIC_KEY],
      [PROTOCOLS.dogecoin, SECP256K1_SECRET_1_PUBLIC_KEY],
      [PROTOCOLS.solana, RFC8032_TEST1_PUBLIC_KEY],
      [PROTOCOLS.aeternity, RFC8032_TEST1_PUBLIC_KEY],
    ])('%s public key', (protocol, publicKeyHex) => {
      const [, privateKeyHex] = PRIVATE_KEY_VECTORS.find(([vectorProtocol]) => (
        vectorProtocol === protocol
      ))!;

      const account = importPrivateKey(protocol, privateKeyHex);

      expect(Buffer.from(account!.publicKey).toString('hex')).toBe(publicKeyHex);
    });
  });

  describe('on testnet', () => {
    beforeAll(() => {
      useNetworks().switchNetwork(NETWORK_NAME_TESTNET);
    });

    afterAll(() => {
      useNetworks().switchNetwork(NETWORK_NAME_MAINNET);
    });

    it('bitcoin', () => {
      // BIP173 P2WPKH testnet vector for the same hash160.
      const account = importPrivateKey(
        PROTOCOLS.bitcoin,
        '0000000000000000000000000000000000000000000000000000000000000001',
      );

      expect(account?.address).toBe('tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx');
    });
  });
});
