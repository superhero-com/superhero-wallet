<template>
  <div class="popup">
    <p class="section-title">
      {{ $t('pages.invite.generate-link') }}
    </p>
    <AmountSend @changeAmount="val => (amount = val)" :value="amount" />
    <Button @click="generate" extend>{{ $t('pages.invite.generate') }}</Button>
    <p class="section-title">
      {{ $t('pages.invite.created-links') }}
    </p>
    <div v-for="referral in referrals" :key="referral.link" class="invite-row">
      <div class="invite-info">
        <span class="primary">{{ referral.balance }} {{ $t('pages.appVUE.aeid') }}</span>
        <!--eslint-disable-line vue-i18n/no-raw-text-->
        ({{ (referral.balance * current.currencyRate).toFixed(2) }}
        <!--eslint-disable-next-line vue-i18n/no-raw-text-->
        {{ current.currency.toUpperCase() }})
        <span class="date">{{ referral.date | formatDate }}</span>
      </div>
      <div class="invite-link">
        <span>{{ referral.link }}</span>
        <button class="invite-link-copy" v-clipboard:copy="referral.link"><CopyIcon /></button>
      </div>
      <template v-if="!referral.topUp">
        <Button half dark @click="referral.topUp = true">{{ $t('pages.invite.top-up') }}</Button>
        <Button half @click="claim(referral.link)">{{ $t('pages.invite.claim') }}</Button>
      </template>
      <template v-else>
        <AmountSend
          @changeAmount="val => (referral.topUpAmount = val)"
          :value="referral.topUpAmount"
        />
        <Button half dark @click="referral.topUp = false">{{ $t('pages.invite.close') }}</Button>
        <Button half @click="topUp(referral)">{{ $t('pages.invite.top-up') }}</Button>
      </template>
    </div>
    <Loader v-if="loading" />
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import { Crypto } from '@aeternity/aepp-sdk/es';
import Button from '../components/Button';
import AmountSend from '../components/AmountSend';
import CopyIcon from '../../../icons/copy.svg?vue-component';
import { aeToAettos } from '../../utils/helper';
import { formatDate } from '../../utils';

export default {
  components: { Button, AmountSend, CopyIcon },
  data: () => ({ amount: 0, referrals: [], loading: false }),
  filters: { formatDate },
  computed: {
    ...mapState(['sdk', 'current']),
    ...mapGetters('invites', ['allReferrals']),
  },
  created() {
    this.$watch(
      'allReferrals',
      val => {
        this.referrals = [...val];
      },
      { immediate: true },
    );
    this.$store.dispatch('invites/getBalances');
  },
  methods: {
    async generate() {
      this.loading = true;
      await this.$watchUntilTruly(() => this.sdk);
      const { publicKey, secretKey } = Crypto.generateKeyPair();
      if (this.amount) {
        try {
          await this.sdk.spend(+aeToAettos(this.amount), publicKey, {
            payload: 'referral',
          });
        } catch (e) {
          this.$store.dispatch('modals/open', { name: 'default', msg: e.message });
          this.loading = false;
          return;
        }
      }
      const link = `https://superhero.com/i/${Crypto.encodeBase58Check(
        Buffer.from(secretKey, 'hex'),
      )}`;

      this.$store.commit('invites/add', {
        link,
        publicKey,
        secretKey,
        balance: 0,
        date: Date.now(),
        networkId: this.sdk.getNetworkId(),
      });
      this.loading = false;
      this.$store.dispatch('invites/getBalances');
    },
    async claim(referral) {
      this.loading = true;
      await this.$store.dispatch('invites/claim', referral);
      this.loading = false;
      this.$store.dispatch('invites/getBalances');
    },
    async topUp({ link, topUpAmount, publicKey }) {
      this.loading = true;
      const address = publicKey || this.$store.getters['invites/keypair'](link);
      try {
        await this.sdk.spend(+aeToAettos(topUpAmount), address, {
          payload: 'referral',
        });
        this.$store.dispatch('invites/getBalances');
      } catch (e) {
        this.$store.dispatch('modals/open', { name: 'default', msg: e.message });
      }
      this.loading = false;
    },
  },
};
</script>

<style lang="scss" scoped>
@import '../../../common/variables';

.section-title {
  font-size: 16px;
  text-align: left;
  margin-bottom: 0;
}

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
