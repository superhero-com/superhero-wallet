<template>
  <div class="account">
    <Plate>
      <AccountSwitcher :notification="!backedUpSeed" />
      <CardRow class="first-card-wrapper">
        <Card
          :title="$t('dashboard.receive-card.title')"
          :description="$t('dashboard.receive-card.description')"
          clickable
          @click="$router.push('#')"
        >
          <template #icon>
            <ArrowReceiveIcon />
          </template>
        </Card>
        <Card
          :title="$t('dashboard.send-card.title')"
          :description="$t('dashboard.send-card.description')"
          clickable
          @click="$router.push('#')"
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
          <Button
            class="card-button"
            :text="$t('dashboard.back-up-card.button')"
            new-ui
            inline
            no-margin
            :to="{ name: 'settings-seed-phrase' }"
            fill="red"
          />
        </Card>
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
          <Button
            class="card-button"
            :text="$t('dashboard.buy-card.button')"
            new-ui
            inline
            no-margin
            to="#"
            fill="red-2"
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
          <Button
            class="card-button"
            :text="$t('dashboard.name-card.button')"
            new-ui
            inline
            no-margin
            to="#"
            fill="purple"
          />
        </Card>
      </CardRow>
    </Plate>
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import Plate from '../components/Plate.vue';
import AccountSwitcher from '../components/AccountSwitcher.vue';
import { MODAL_TRANSFER_SEND } from '../../utils/constants';
import Card from '../components/dashboard/Card.vue';
import CardRow from '../components/dashboard/CardRow.vue';
import Button from '../components/Button.vue';
import ArrowReceiveIcon from '../../../icons/dashboard/arrow-receive.svg?vue-component';
import ArrowSendIcon from '../../../icons/dashboard/arrow-send.svg?vue-component';
import SubtractIcon from '../../../icons/subtract.svg?vue-component';
import CardIcon from '../../../icons/creditcard.fill.svg?vue-component';
import MenuCardIcon from '../../../icons/menucard.fill.svg?vue-component';

import buyBackground from '../../../image/dashboard/buy-ae.jpg';
import chainNameBackground from '../../../image/dashboard/chain-name.jpg';

export default {
  name: 'Account',
  components: {
    CardRow,
    Card,
    Plate,
    AccountSwitcher,
    ArrowReceiveIcon,
    ArrowSendIcon,
    SubtractIcon,
    CardIcon,
    MenuCardIcon,
    Button,
  },
  data: () => ({
    buyBackground,
    chainNameBackground,
  }),
  computed: {
    ...mapState(['backedUpSeed', 'transactions']),
    ...mapGetters(['getAccountPendingTransactions']),
  },
  watch: {
    $route: {
      immediate: true,
      handler({ query }) {
        if (query.url) {
          this.$store.dispatch('modals/open', { name: MODAL_TRANSFER_SEND });
        }
      },
    },
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/typography';
@use '../../../styles/mixins';

.account {
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
