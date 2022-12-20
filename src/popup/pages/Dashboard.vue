<template>
  <div class="dashboard">
    <AccountSwitcher :notification="!backedUpSeed" />

    <div class="dashboard-cards">
      <div class="buttons-row">
        <BtnBox
          :text="$t('dashboard.receive-card.title')"
          :subtitle="$t('dashboard.receive-card.description')"
          :icon="ArrowReceiveIcon"
          is-big
          @click="openTransferReceiveModal()"
        />
        <BtnBox
          :text="$t('dashboard.send-card.title')"
          :subtitle="$t('dashboard.send-card.description')"
          :icon="ArrowSendIcon"
          :disabled="!isConnected"
          data-cy="send"
          is-big
          @click="openTransferSendModal()"
        />
      </div>

      <Card
        v-if="!backedUpSeed"
        :text="$t('dashboard.back-up-card.title')"
        :description="$t('dashboard.back-up-card.description')"
        :icon="SubtractIcon"
        data-cy="backup-seed-phrase"
      >
        <BtnMain
          class="card-button"
          variant="danger"
          inline
          :text="$t('dashboard.back-up-card.button')"
          :to="{ name: 'settings-seed-phrase' }"
        />
      </Card>

      <Card
        :text="$t('dashboard.buy-card.title')"
        :description="$t('dashboard.buy-card.description')"
        :background="buyBackground"
        :icon="CardIcon"
      >
        <BtnMain
          class="card-button"
          :text="$t('dashboard.buy-card.button')"
          :href="simplexLink"
          variant="secondary"
          inline
        />
      </Card>

      <Card
        :text="$t('dashboard.name-card.title')"
        :description="$t('dashboard.name-card.description')"
        :background="chainNameBackground"
        :icon="MenuCardIcon"
      >
        <BtnMain
          class="card-button"
          variant="purple"
          inline
          :text="$t('dashboard.name-card.button')"
          :to="{ name: 'account-details-names-claim' }"
        />
      </Card>
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import { isEmpty } from 'lodash-es';
import {
  MODAL_TRANSFER_RECEIVE,
  MODAL_TRANSFER_SEND,
  buildSimplexLink,
} from '../utils';

import Card from '../components/Card.vue';
import BtnMain from '../components/buttons/BtnMain.vue';
import AccountSwitcher from '../components/AccountSwitcher.vue';

import ArrowReceiveIcon from '../../icons/arrow-receive.svg?vue-component';
import ArrowSendIcon from '../../icons/arrow-send.svg?vue-component';
import SubtractIcon from '../../icons/subtract.svg?vue-component';
import CardIcon from '../../icons/credit-card.svg?vue-component';
import MenuCardIcon from '../../icons/menucard.fill.svg?vue-component';

import buyBackground from '../../image/dashboard/buy-ae.jpg';
import chainNameBackground from '../../image/dashboard/chain-name.jpg';
import BtnBox from '../components/buttons/BtnBox.vue';

export default {
  name: 'Dashboard',
  components: {
    Card,
    AccountSwitcher,
    BtnMain,
    BtnBox,
  },
  data: () => ({
    SubtractIcon,
    CardIcon,
    MenuCardIcon,
    ArrowReceiveIcon,
    ArrowSendIcon,
    buyBackground,
    chainNameBackground,
  }),
  computed: {
    ...mapState(['backedUpSeed', 'transactions']),
    ...mapState('accounts', ['activeIdx']),
    ...mapGetters(['getAccountPendingTransactions', 'account', 'isConnected']),
    simplexLink() {
      return buildSimplexLink(this.account.address);
    },
  },
  watch: {
    activeIdx() { // TODO: remove it, maybe by extracting transactions entity
      this.$store.commit('initTransactions');
    },
    $route: {
      immediate: true,
      handler({ query }) {
        if (!isEmpty(query)) {
          this.$store.dispatch('modals/open', { name: MODAL_TRANSFER_SEND });
        }
      },
    },
  },
  methods: {
    openTransferReceiveModal() {
      this.$store.dispatch('modals/open', {
        name: MODAL_TRANSFER_RECEIVE,
      });
    },
    openTransferSendModal() {
      this.$store.dispatch('modals/open', {
        name: MODAL_TRANSFER_SEND,
      });
    },
  },
};
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
