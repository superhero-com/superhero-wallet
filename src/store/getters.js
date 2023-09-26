import { mnemonicToSeed } from '@aeternity/bip39';
import {
  ACCOUNT_HD_WALLET,
  PROTOCOL_AETERNITY,
} from '@/constants';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';

export default {
  wallet({ mnemonic }) {
    if (!mnemonic) return null;
    return mnemonicToSeed(mnemonic);
  },
  accounts({ accounts: { list } }, getters) {
    if (!getters.wallet) {
      return [];
    }

    return list
      .map(({
        idx, type, protocol = PROTOCOL_AETERNITY, ...acc
      }, index) => ({
        globalIdx: index,
        idx,
        type,
        protocol,
        ...acc,
        ...(type === ACCOUNT_HD_WALLET
          ? ProtocolAdapterFactory
            .getAdapter(protocol)
            .getHdWalletAccountFromMnemonicSeed(
              getters.wallet,
              idx,
            )
          : {}
        ),
      }))
      .map(({ ...account }) => ({
        ...account,
        name: getters['names/getDefault'](account.address),
      }));
  },
};
