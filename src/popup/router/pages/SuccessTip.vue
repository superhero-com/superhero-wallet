<template>
  <div class="popup" data-cy="success-tip">
    <h3 class="heading-1 mb-25 mt-15 center">
      <div class="flex flex-align-center flex-justify-content-center">
        <Heart />
        <span class="ml-5">{{ $t('pages.successTip.completedHeading') }}</span>
      </div>
    </h3>
    <p class="primary-title text-left mb-8 f-16">
      {{ $t('pages.successTip.successfullySent') }} <span class="secondary-text" data-cy="tip-amount">{{ amountTip }} {{ $t('pages.appVUE.aeid') }} </span> ({{
        getCurrencyAmount
      }}
      {{ currentCurrency }})
      {{ $t('pages.successTip.to') }}
    </p>
    <a class="link-sm text-left block" data-cy="tip-url">{{ domain }}</a>
    <br />
    <div>
      <span style="word-break: break-word;font-size: 14px;float: left;">{{ $t('pages.successTip.notify') }}</span>
      <Textarea v-model="note" :value="note" size="h-50" />
    </div>
    <p class="f-14 sub-heading text-left">
      {{ $t('pages.successTip.note') }}
    </p>
    <p class="f-18 my-35">{{ $t('pages.successTip.letThemKnow') }}</p>
    <div>
      <div class="flex flex-align-center flex-justify-between">
        <Button half @click="$router.push('/tip')" data-cy="to-tips">
          {{ $t('pages.successTip.sendMore') }}
        </Button>
        <Button half @click="$router.push('/account')" data-cy="to-dashboard">
          {{ $t('pages.successTip.home') }}
        </Button>
      </div>
      <br />
      <Button @click="redirectOnFeed" extend>
        {{ $t('pages.successTip.feed') }}
      </Button>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import axios from 'axios';
import Heart from '../../../icons/heart.svg?vue-component';
import Textarea from '../components/Textarea';
import openUrl from '../../utils/openUrl';
import { TIP_SERVICE } from '../../utils/constants';

export default {
  components: {
    Heart,
    Textarea,
  },
  props: ['amount', 'domain'],
  data() {
    return {
      feed: 'https://youdonotneedacapetobeahero.com',
      note: this.$t('pages.successTip.notifyMessage'),
    };
  },
  computed: {
    ...mapGetters(['current', 'currentCurrency', 'account']),
    amountTip() {
      return this.amount;
    },
    getCurrencyAmount() {
      return (this.amountTip * this.current.currencyRate).toFixed(3);
    },
  },
  async created() {
    const { addresses } = await this.$store.dispatch('getWebPageAddresses');
    const address = addresses.length ? addresses[0] : this.account.publicKey;
    const url = this.domain;
    if (addresses.length || !process.env.IS_EXTENSION) {
      await axios.post(`${TIP_SERVICE}`, { url, address });
    }
  },
  methods: {
    redirectOnFeed() {
      openUrl(this.feed);
    },
  },
};
</script>
