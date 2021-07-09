import { decodeEvents, SOPHIA_TYPES } from '@aeternity/aepp-sdk/es/contract/aci/transformation';

export default {
  namespaced: true,
  state: {
    transactions: [],
  },
  mutations: {
    add: (state, tx) => {
      state.transactions.unshift(tx);
    },
    delete(state, hash) {
      state.transactions = state.transactions.filter((tx) => tx.hash !== hash);
    },
  },
  getters: {
    chainTransactions: (state) => state.transactions,
  },
  actions: {
    async decode({ dispatch, rootState: { sdk } }, payload) {
      const tx = await sdk.getTxInfo(payload.hash);
      const eventsSchema = [
        {
          name: 'Transfer',
          types: [SOPHIA_TYPES.address, SOPHIA_TYPES.address, SOPHIA_TYPES.int],
        },
        {
          name: 'Allowance',
          types: [SOPHIA_TYPES.address, SOPHIA_TYPES.address, SOPHIA_TYPES.int],
        },
        {
          name: 'Burn',
          types: [SOPHIA_TYPES.address, SOPHIA_TYPES.int],
        },
      ];
      const events = (tx.log ? decodeEvents(tx.log, { schema: eventsSchema }) : [])
        .map((decodedEvent) => {
          const event = {
            name: decodedEvent.name,
          };
          switch (decodedEvent.name) {
            // AEX9
            case 'Transfer':
              event.from = `ak_${decodedEvent.decoded[0]}`;
              event.to = `ak_${decodedEvent.decoded[1]}`;
              event.amount = decodedEvent.decoded[2] || null;
              break;
            case 'Allowance':
              event.from = `ak_${decodedEvent.decoded[0]}`;
              event.for = `ak_${decodedEvent.decoded[1]}`;
              event.amount = decodedEvent.decoded[2] || null;
              break;
            case 'Burn':
              event.from = `ak_${decodedEvent.decoded[0]}`;
              event.amount = decodedEvent.decoded[1] || null;
              break;
            default:
              break;
          }
          return event;
        });

      dispatch('filterTransfer', {
        ...payload,
        tx,
        microTime: Date.now(),
        events,
      });
    },
    async filterTransfer({ dispatch, rootGetters: { account } }, tx) {
      const { address } = account;
      // catch any other events
      if (tx.events.length === 0) return;
      // filter any events not relevant for the user
      if (tx.events[0].from === address || tx.events[0].to === address) {
        dispatch('adjustToMiddlewareInterface', {
          ...tx,
          event: tx.events[0],
          events: undefined,
        });
      }
    },
    async adjustToMiddlewareInterface({ commit }, tx) {
      commit('add', {
        ...tx,
        recipient: tx.event.to,
        sender: tx.event.from,
        tx: {
          ...tx.tx,
          type: 'ContractCallTx',
          function: tx.event.name.toLowerCase(),
          arguments: [
            {
              type: 'address',
              value: tx.event.to,
            },
            {
              type: 'int',
              value: tx.event.amount,
            },
          ],
        },
      });
    },
    async removeOldTxFromCache({ commit, state, rootState: { transactions } }) {
      const allTxHashes = transactions.latest.map((tx) => tx.hash);
      state.transactions.forEach((tx) => {
        if (allTxHashes.includes(tx.hash)) {
          commit('delete', tx.hash);
        }
      });
    },
  },
};
