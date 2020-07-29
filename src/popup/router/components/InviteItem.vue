<template>
  <div class="invite-row">
    <div class="invite-info">
      <span class="primary">{{ invite.balance }} {{ $t('pages.appVUE.aeid') }}</span>
      <!--eslint-disable-line vue-i18n/no-raw-text-->
      ({{ (invite.balance * current.currencyRate).toFixed(2) }}
      <!--eslint-disable-next-line vue-i18n/no-raw-text-->
      {{ current.currency.toUpperCase() }})
      <span class="date">{{ invite.date | formatDate }}</span>
    </div>
    <div class="invite-link">
      <span>{{ invite.link }}</span>
      <button class="invite-link-copy" v-clipboard:copy="invite.link"><CopyIcon /></button>
    </div>
    <template v-if="!topUp">
      <Button half dark @click="topUp = true">{{ $t('pages.invite.top-up') }}</Button>
      <Button half @click="claim">{{ $t('pages.invite.claim') }}</Button>
    </template>
    <template v-else>
      <AmountSend v-model="topUpAmount" />
      <Button half dark @click="topUp = false">{{ $t('pages.invite.close') }}</Button>
      <Button half @click="sendTopUp">{{ $t('pages.invite.top-up') }}</Button>
    </template>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import { AE_AMOUNT_FORMATS } from '@aeternity/aepp-sdk/es/utils/amount-formatter';
import AmountSend from './AmountSend';
import Button from './Button';
import CopyIcon from '../../../icons/copy.svg?vue-component';
import { formatDate } from '../../utils';

export default {
  props: {
    invite: { type: Object, required: true },
  },
  components: { Button, AmountSend, CopyIcon },
  filters: { formatDate },
  data: () => ({ topUp: false, topUpAmount: 0 }),
  computed: {
    ...mapState(['sdk', 'current']),
  },
  methods: {
    async claim() {
      this.$emit('loading', true);
      await this.$store.dispatch('invites/claim', this.invite.idx);
      this.$emit('loading', false);
      this.$store.dispatch('invites/updateBalances');
    },
    async sendTopUp() {
      this.$emit('loading', true);
      const address = this.invite.publicKey;
      try {
        await this.sdk.spend(this.topUpAmount, address, {
          payload: 'referral',
          denomination: AE_AMOUNT_FORMATS.AE,
        });
        this.$store.dispatch('invites/updateBalances');
      } catch (e) {
        if (e.message.includes('is not enough to execute')) {
          this.$store.dispatch('modals/open', {
            name: 'default',
            msg: this.$t('pages.invite.insufficient-balance'),
          });
          return;
        }
        throw e;
      } finally {
        this.$emit('loading', false);
      }
      this.topUpAmount = 0;
      this.topUp = false;
    },
  },
};
</script>

<style lang="scss" scoped>
@import '../../../common/variables';

.invite-row {
  padding: 1rem;
  width: 100%;
  border-bottom: 1px solid #12121b;
  text-align: left;
  color: #bcbcc4;
  background: #21222a;
  position: relative;

  .invite-link {
    margin-bottom: 5px;
    font-size: 12px;
    color: $text-color;

    span {
      width: 260px;
      display: inline-block;
      text-overflow: ellipsis;
      overflow: hidden;
      white-space: nowrap;
    }
  }

  .invite-link-copy {
    padding: 0;
  }

  .invite-info {
    font-size: 14px;
    font-weight: bold;
    color: $white-color;
    display: flex;
    align-items: center;
    margin-bottom: 10px;

    .primary {
      color: $secondary-color;
      margin-right: 5px;
    }

    .date {
      font-size: 12px;
      font-weight: normal;
      margin-left: auto;
      color: $text-color;
    }
  }
}
</style>
