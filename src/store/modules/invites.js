import {
  AeSdk,
  encode,
  Encoding,
  MemoryAccount,
  Node,
} from '@aeternity/aepp-sdk';
import { useAccounts, useModals } from '../../composables';
import { tg } from '../plugins/languages';

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
    async claim({ rootGetters, rootState }, secretKey) {
      const { activeAccount } = useAccounts({
        store: { state: rootState, getters: rootGetters },
      });
      const aeSdk = new AeSdk({
        nodes: [{
          name: rootGetters.activeNetwork.name,
          instance: new Node(rootGetters.activeNetwork.url),
        }],
        accounts: [new MemoryAccount(secretKey)],
      });
      await aeSdk.transferFunds(
        1,
        activeAccount.value.address,
        {
          payload: encode(Buffer.from('referral'), Encoding.Bytearray),
          verify: false,
        },
      );
    },
    async handleNotEnoughFoundsError(_, { error: { message }, isInviteError = false }) {
      if (!isInviteError && !message.includes('is not enough to execute')) return false;
      if (isInviteError && !message.includes('Transaction build error')) return false;

      const { openDefaultModal } = useModals();
      await openDefaultModal({
        msg: isInviteError
          ? tg('pages.invite.insufficient-invite-balance')
          : tg('pages.invite.insufficient-balance'),
      });
      return true;
    },
  },
};
