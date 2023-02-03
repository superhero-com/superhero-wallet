<template>
  <div class="dashboard">
    <DashboardHeader />

    <div class="dashboard-cards">
      <div class="buttons-row">
        <BtnBox
          :text="$t('dashboard.receiveCard.title')"
          :subtitle="$t('dashboard.receiveCard.description')"
          :icon="ArrowReceiveIcon"
          is-big
          @click="openTransferReceiveModal()"
        />
        <BtnBox
          :text="isMultisigDashboard
            ? $t('dashboard.proposeCard.title')
            : $t('dashboard.sendCard.title')"
          :subtitle="isMultisigDashboard
            ? $t('dashboard.proposeCard.description')
            : $t('dashboard.sendCard.description')"
          :icon="ArrowSendIcon"
          :disabled="!isConnected || (isMultisigDashboard && !!pendingMultisigTransaction)"
          data-cy="send"
          is-big
          @click="openTransferSendModal()"
        />
      </div>

      <PendingMultisigTransactionCard v-if="isMultisigDashboard" />

      <Card
        v-if="!backedUpSeed"
        :text="$t('dashboard.backUpCard.title')"
        :description="$t('dashboard.backUpCard.description')"
        :icon="SubtractIcon"
        data-cy="backup-seed-phrase"
      >
        <BtnMain
          class="card-button"
          variant="danger"
          inline
          :text="$t('dashboard.backUpCard.button')"
          :to="{ name: 'settings-seed-phrase' }"
        />
      </Card>

      <Card
        v-if="!isMultisigDashboard"
        :text="$t('dashboard.buyCard.title')"
        :description="$t('dashboard.buyCard.description')"
        :background="buyBackground"
        :icon="CardIcon"
      >
        <BtnMain
          class="card-button"
          :text="$t('dashboard.buyCard.button')"
          :href="simplexLink"
          variant="secondary"
          inline
        />
      </Card>

      <Card
        v-if="!isMultisigDashboard"
        :text="$t('dashboard.nameCard.title')"
        :description="$t('dashboard.nameCard.description')"
        :background="chainNameBackground"
        :icon="MenuCardIcon"
      >
        <BtnMain
          class="card-button"
          variant="purple"
          inline
          :text="$t('dashboard.nameCard.button')"
          :to="{ name: 'account-details-names-claim' }"
        />
      </Card>
    </div>
  </div>
</template>

<script lang="ts">
import { isEmpty } from 'lodash-es';
import {
  computed,
  defineComponent,
  watch,
} from '@vue/composition-api';

import {
  MODAL_TRANSFER_RECEIVE,
  MODAL_TRANSFER_SEND,
  buildSimplexLink,
} from '../utils';
import { useGetter, useState } from '../../composables/vuex';
import { useMultisigAccounts, usePendingMultisigTransaction } from '../../composables';

import Card from '../components/Card.vue';
import BtnMain from '../components/buttons/BtnMain.vue';
import DashboardHeader from '../components/DashboardHeader.vue';
import PendingMultisigTransactionCard from '../components/PendingMultisigTransactionCard.vue';

import ArrowReceiveIcon from '../../icons/arrow-receive.svg?vue-component';
import ArrowSendIcon from '../../icons/arrow-send.svg?vue-component';
import SubtractIcon from '../../icons/subtract.svg?vue-component';
import CardIcon from '../../icons/credit-card.svg?vue-component';
import MenuCardIcon from '../../icons/menucard.fill.svg?vue-component';

import buyBackground from '../../image/dashboard/buy-ae.jpg';
import chainNameBackground from '../../image/dashboard/chain-name.jpg';
import BtnBox from '../components/buttons/BtnBox.vue';
import { ITransaction } from '../../types';

export default defineComponent({
  name: 'Dashboard',
  components: {
    PendingMultisigTransactionCard,
    DashboardHeader,
    Card,
    BtnMain,
    BtnBox,
  },
  setup(props, { root }) {
    const { isMultisigDashboard } = useMultisigAccounts({ store: root.$store });
    const { pendingMultisigTransaction } = usePendingMultisigTransaction({ store: root.$store });

    const backedUpSeed = useState('backedUpSeed');
    const transactions = useState<ITransaction>('transactions');
    const activeIdx = useState('accounts', 'activeIdx');

    const getAccountPendingTransactions = useGetter('getAccountPendingTransactions');
    const account = useGetter('account');
    const isConnected = useGetter('isConnected');

    const simplexLink = computed(() => buildSimplexLink(account.value.address));
    const query = computed(() => root.$route.query);

    function openTransferReceiveModal() {
      root.$store.dispatch('modals/open', {
        name: MODAL_TRANSFER_RECEIVE,
      });
    }
    function openTransferSendModal() {
      root.$store.dispatch('modals/open', {
        name: MODAL_TRANSFER_SEND,
        isMultisig: isMultisigDashboard.value,
      });
    }

    watch(() => activeIdx.value, () => root.$store.commit('initTransactions'));
    watch(() => isMultisigDashboard.value, () => root.$store.commit('initTransactions'));

    watch(query, (value) => {
      if (!isEmpty(value)) {
        root.$store.dispatch('modals/open', { name: MODAL_TRANSFER_SEND });
      }
    });

    return {
      pendingMultisigTransaction,
      ArrowReceiveIcon,
      ArrowSendIcon,
      SubtractIcon,
      CardIcon,
      MenuCardIcon,
      isMultisigDashboard,
      backedUpSeed,
      transactions,
      activeIdx,
      getAccountPendingTransactions,
      isConnected,
      simplexLink,
      buyBackground,
      chainNameBackground,
      openTransferReceiveModal,
      openTransferSendModal,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/variables';
@use '../../styles/typography';
@use '../../styles/mixins';

.dashboard {
  display: flex;
  flex-direction: column;

  .dashboard-cards {
    display: flex;
    flex-direction: column;
    gap: var(--gap);
    margin-top: 8px;
    padding-inline: var(--screen-padding-x);
    padding-bottom: var(--screen-padding-x);

    .buttons-row {
      display: flex;
      gap: var(--gap);
    }
  }

  .card-button {
    margin-top: 12px;
  }
}
</style>
