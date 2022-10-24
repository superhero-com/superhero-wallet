<template>
  <div class="dashboard">
    <AccountSwitcher :notification="!backedUpSeed" />
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
        clickable
        dense
        @click="openTransferSendModal()"
      >
        <template #icon>
          <ArrowSendIcon />
        </template>
      </Card>
    </CardRow>
    <CardRow v-if="!backedUpSeed">
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
      <Card
        :title="$t('dashboard.buy-card.title')"
        :description="$t('dashboard.buy-card.description')"
        is-big
        :background="buyBackground"
        card-id="dashboard-buy-ae-card"
      >
        <template #icon>
          <CardIcon />
        </template>
        <BtnMain
          class="card-button"
          :text="$t('dashboard.buy-card.button')"
          :href="simplexLink"
          variant="danger"
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
        card-id="dashboard-claim-name-card"
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
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import { isEmpty } from 'lodash-es';
import AccountSwitcher from '../components/AccountSwitcher.vue';
import {
  MODAL_TRANSFER_RECEIVE,
  MODAL_TRANSFER_SEND,
} from '../utils/constants';
import Card from '../components/dashboard/Card.vue';
import CardRow from '../components/dashboard/CardRow.vue';
import BtnMain from '../components/buttons/BtnMain.vue';
import ArrowReceiveIcon from '../../icons/dashboard/arrow-receive.svg?vue-component';
import ArrowSendIcon from '../../icons/dashboard/arrow-send.svg?vue-component';
import SubtractIcon from '../../icons/subtract.svg?vue-component';
import CardIcon from '../../icons/creditcard.fill.svg?vue-component';
import MenuCardIcon from '../../icons/menucard.fill.svg?vue-component';

import buyBackground from '../../image/dashboard/buy-ae.jpg';
import chainNameBackground from '../../image/dashboard/chain-name.jpg';
import { buildSimplexLink } from '../utils';

export default {
  name: 'Dashboard',
  components: {
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
  data: () => ({
    buyBackground,
    chainNameBackground,
  }),
  computed: {
    ...mapState(['backedUpSeed', 'transactions']),
    ...mapGetters(['getAccountPendingTransactions', 'account']),
    ...mapState('accounts', ['activeIdx']),
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
  min-height: 100%;

  .first-card-wrapper {
    padding-top: 8px;
  }

  .card-button {
    margin-top: 12px;
  }
}
</style>
