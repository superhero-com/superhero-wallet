import {
  AeSdk,
  encode,
  Encoding,
  MemoryAccount,
  Node,
} from '@aeternity/aepp-sdk';
import { useModals } from '../../composables';
import { i18n } from '../plugins/languages';

export default {
  namespaced: true,
  state: {
    invites: [],
  },
  mutations: {
    add: ({ invites }, secretKey) => invites.unshift({ secretKey, createdAt: Date.now() }),
    delete(state, secretKey) {
      state.invites = state.invites.filter((invite) => invite.secretKey !== secretKey);
    },
  },
  actions: {
    async claim({ rootGetters: { account, activeNetwork } }, secretKey) {
      const sdk = new AeSdk({
        nodes: [{ name: activeNetwork.name, instance: new Node(activeNetwork.url) }],
        accounts: [new MemoryAccount(secretKey)],
      });
      await sdk.transferFunds(1, account.address, { payload: encode(Buffer.from('referral'), Encoding.Bytearray), verify: false });
    },
    async handleNotEnoughFoundsError(_, { error: { message }, isInviteError = false }) {
      if (!isInviteError && !message.includes('is not enough to execute')) return false;
      if (isInviteError && !message.includes('Transaction build error')) return false;

      const { openDefaultModal } = useModals();
      await openDefaultModal({
        msg: isInviteError
          ? i18n.global.t('pages.invite.insufficient-invite-balance')
          : i18n.global.t('pages.invite.insufficient-balance'),
      });
      return true;
    },
  },
};
