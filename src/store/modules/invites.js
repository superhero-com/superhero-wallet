import nacl from 'tweetnacl';
import { AeSdk, MemoryAccount, Node } from '@aeternity/aepp-sdk';
import { PROTOCOL_AETERNITY } from '@/constants';
import { useAccounts, useModals, useNetworks } from '@/composables';
import { tg } from '../plugins/languages';

const SEED_LENGTH = 32;

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
      const { activeNetwork } = useNetworks();
      const { getLastActiveProtocolAccount } = useAccounts({
        store: { state: rootState, getters: rootGetters },
      });
      const aeSdk = new AeSdk({
        nodes: [{
          name: activeNetwork.value.name,
          instance: new Node(activeNetwork.value.protocols.aeternity.nodeUrl),
        }],
        // `secretKey` variable can be either seed or seed + public key (legacy)
        accounts: [new MemoryAccount(secretKey.length === SEED_LENGTH
          ? nacl.sign.keyPair.fromSeed(secretKey).secretKey : secretKey)],
      });
      await aeSdk.transferFunds(
        1,
        getLastActiveProtocolAccount(PROTOCOL_AETERNITY).address,
        { verify: false },
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
