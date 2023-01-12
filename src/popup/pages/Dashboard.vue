<template>
  <div class="dashboard">
    <AccountSwitcher :notification="!backedUpSeed" />

    <div class="dashboard-cards">
      <CardRow class="first-card-wrapper">
        <Card
          :title="$t('dashboard.receive-card.title')"
          :description="$t('dashboard.receive-card.description')"
          clickable
          dense
          @click="openTransferReceiveModal()"
        >
          <template #icon>
            <ArrowReceiveIcon />
          </template>
        </Card>

        <Card
          :title="$t('dashboard.send-card.title')"
          :description="$t('dashboard.send-card.description')"
          :disabled="!isConnected"
          clickable
          dense
          @click="openTransferSendModal()"
        >
          <template #icon>
            <ArrowSendIcon />
          </template>
        </Card>
      </CardRow>

      <CardRow
        v-if="!backedUpSeed"
        data-cy="backup-seed-phrase"
      >
        <Card
          :title="$t('dashboard.back-up-card.title')"
          :description="$t('dashboard.back-up-card.description')"
          is-big
        >
          <template #icon>
            <SubtractIcon />
          </template>
          <BtnMain
            class="card-button"
            variant="danger"
            inline
            :text="$t('dashboard.back-up-card.button')"
            :to="{ name: 'settings-seed-phrase' }"
          />
        </Card>
      </CardRow>

      <CardRow>
        <LatestTransactionsCard />
      </CardRow>

      <CardRow>
        <Card
          :title="$t('dashboard.buy-card.title')"
          :description="$t('dashboard.buy-card.description')"
          is-big
          :background="buyBackground"
        >
          <template #icon>
            <CardIcon />
          </template>
          <BtnMain
            class="card-button"
            :text="$t('dashboard.buy-card.button')"
            :href="simplexLink"
            variant="secondary"
            inline
          />
        </Card>
      </CardRow>

      <CardRow>
        <Card
          :title="$t('dashboard.name-card.title')"
          :description="$t('dashboard.name-card.description')"
          is-big
          :background="chainNameBackground"
        >
          <template #icon>
            <MenuCardIcon />
          </template>
          <BtnMain
            class="card-button"
            variant="purple"
            inline
            :text="$t('dashboard.name-card.button')"
            :to="{ name: 'account-details-names-claim' }"
          />
        </Card>
      </CardRow>
    </div>
  </div>
</template>

<script>
import { isEmpty } from 'lodash-es';
import {
  computed,
  watch,
  defineComponent,
} from '@vue/composition-api';
import {
  MODAL_TRANSFER_RECEIVE,
  MODAL_TRANSFER_SEND,
  buildSimplexLink,
} from '../utils';

import Card from '../components/dashboard/Card.vue';
import CardRow from '../components/dashboard/CardRow.vue';
import BtnMain from '../components/buttons/BtnMain.vue';
import LatestTransactionsCard from '../components/dashboard/LatestTransactionsCard.vue';
import AccountSwitcher from '../components/AccountSwitcher.vue';

import ArrowReceiveIcon from '../../icons/dashboard/arrow-receive.svg?vue-component';
import ArrowSendIcon from '../../icons/dashboard/arrow-send.svg?vue-component';
import SubtractIcon from '../../icons/subtract.svg?vue-component';
import CardIcon from '../../icons/creditcard.fill.svg?vue-component';

import MenuCardIcon from '../../icons/menucard.fill.svg?vue-component';
import buyBackground from '../../image/dashboard/buy-ae.jpg';
import chainNameBackground from '../../image/dashboard/chain-name.jpg';
import { useGetter, useState } from '../../composables/vuex';

export default defineComponent(
  {
    name: 'Dashboard',
    components: {
      LatestTransactionsCard,
      CardRow,
      Card,
      AccountSwitcher,
      ArrowReceiveIcon,
      ArrowSendIcon,
      SubtractIcon,
      CardIcon,
      MenuCardIcon,
      BtnMain,
    },
    setup(_, { root }) {
      const backedUpSeed = useState('backedUpSeed');
      const activeIdx = useState('transactions', 'activeIdx');

      const account = useGetter('account');
      const isConnected = useGetter('isConnected');

      const simplexLink = computed(() => buildSimplexLink(account.value.address));

      watch(
        () => activeIdx.value,
        () => root.$store.commit('initTransactions'),
      );

      watch(
        () => root.$route,
        ({ query }) => {
          if (!isEmpty(query)) {
            root.$store.dispatch('modals/open', { name: MODAL_TRANSFER_SEND });
          }
        },
      );

      function openTransferReceiveModal() {
        root.$store.dispatch('modals/open', {
          name: MODAL_TRANSFER_RECEIVE,
        });
      }

      function openTransferSendModal() {
        root.$store.dispatch('modals/open', {
          name: MODAL_TRANSFER_SEND,
        });
      }

      return {
        buyBackground,
        chainNameBackground,
        backedUpSeed,
        isConnected,
        simplexLink,
        openTransferReceiveModal,
        openTransferSendModal,
      };
    },
  },
);
</script>

<style lang="scss" scoped>
@use '../../styles/variables';
@use '../../styles/typography';
@use '../../styles/mixins';

.dashboard {
  display: flex;
  flex-direction: column;

  .dashboard-cards {
    padding: var(--screen-padding-x);
    padding-top: 0;
  }

  .first-card-wrapper {
    padding-top: 8px;
  }

  .card-button {
    margin-top: 12px;
  }
}
</style>
