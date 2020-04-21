<template>
  <div>
    <div class="tour__step3 popup" :class="{ tour__step3_mobile: !IS_EXTENSION }">
      <p class="primary-title text-left mb-8 f-16" :class="{ 'title-holder': !confirmMode }">
        <template v-if="!confirmMode">
          <div>
            {{ $t('pages.tipPage.url') }}
          </div>
          <UrlBadge v-if="url" @click.native="showBadgeModal" :type="verifiedStatus" />
        </template>
        <template v-else>
          {{ $t('pages.tipPage.headingSending') }}
          <span class="secondary-text" data-cy="tip-amount"
            >{{ amount }} {{ $t('pages.appVUE.aeid') }}</span
          >
          ({{ currencyAmount }} {{ currentCurrency }}) {{ $t('pages.tipPage.to') }}
        </template>
      </p>

      <div class="url-bar">
        <template v-if="!editUrl">
          <a class="link-sm text-left" :class="verifiedStatus" data-cy="tip-url">
            {{ url }}
          </a>
        </template>
        <Input
          v-else
          size="m-0 xsm"
          v-model="url"
          :error="url && !validUrl"
          :placeholder="$t('pages.tipPage.enterUrl')"
        />
        <button v-if="!confirmMode && !editUrl" @click="editUrl = !editUrl" data-cy="edit-url">
          <EditIcon v-if="!editUrl" data-cy="confirm-url" />
        </button>
      </div>
    </div>
    <div class="popup" data-cy="tip-container">
      <template v-if="!confirmMode">
        <AmountSend
          :amountError="amountError"
          @changeAmount="val => (amount = val)"
          :value="amount"
        />
        <Textarea v-model="note" :placeholder="$t('pages.tipPage.titlePlaceholder')" size="sm" />
        <Button
          class="send-tip-button"
          @click="toConfirm"
          :disabled="!note || amountError || noteError || !minCallFee || !validUrl || !url"
          data-cy="send-tip"
        >
          {{ $t('pages.tipPage.next') }}
        </Button>
      </template>
      <template v-else>
        <div class="tip-note-preview mt-15" data-cy="tip-note">
          {{ note }}
        </div>
        <Button @click="sendTip" :disabled="!tipping" data-cy="confirm-tip">
          {{ $t('pages.tipPage.confirm') }}
        </Button>
        <Button @click="confirmMode = false" data-cy="edit-tip">
          {{ $t('pages.tipPage.edit') }}
        </Button>
      </template>

      <Loader size="big" :loading="loading" type="transparent" content="" />
    </div>
  </div>
</template>

<script>
import { mapGetters, mapState } from 'vuex';
import axios from 'axios';
import { calculateFee, TX_TYPES, BACKEND_URL } from '../../utils/constants';
import {
  escapeSpecialChars,
  aeToAettos,
  getTwitterAccountUrl,
  validateUrl,
} from '../../utils/helper';
import EditIcon from '../../../icons/edit-icon.svg?vue-component';
import AmountSend from '../components/AmountSend';
import Textarea from '../components/Textarea';
import Input from '../components/Input';
import UrlBadge from '../components/UrlBadge';

export default {
  components: {
    AmountSend,
    Textarea,
    EditIcon,
    Input,
    UrlBadge,
  },
  data() {
    return {
      url: '',
      amount: null,
      note: null,
      confirmMode: false,
      amountError: false,
      noteError: false,
      loading: false,
      minCallFee: null,
      editUrl: false,
      verifiedUrls: [],
      IS_EXTENSION: process.env.IS_EXTENSION,
      RUNNING_IN_TESTS: process.env.RUNNING_IN_TESTS,
    };
  },
  computed: {
    ...mapGetters([
      'balance',
      'popup',
      'tipping',
      'current',
      'sdk',
      'account',
      'network',
      'currentCurrency',
      'tip',
    ]),
    ...mapState(['tourRunning', 'tippingAddress']),
    maxValue() {
      const calculatedMaxValue = this.balance - this.minCallFee;
      return calculatedMaxValue > 0 ? calculatedMaxValue.toString() : 0;
    },
    currencyAmount() {
      return (this.amount * this.current.currencyRate).toFixed(3);
    },
    urlVerified() {
      const twitterProfile = getTwitterAccountUrl(this.url);
      return (
        this.url &&
        (this.verifiedUrls.includes(this.url) ||
          (twitterProfile && this.verifiedUrls.includes(twitterProfile)))
      );
    },
    verifiedStatus() {
      return this.urlVerified || this.tourRunning ? 'verified' : 'not-verified';
    },
    validUrl() {
      return validateUrl(this.url);
    },
  },
  watch: {
    amount() {
      this.amountError = !+this.amount || this.amount <= 0;
    },
    $route: {
      immediate: true,
      handler({ fullPath }) {
        const urlParam = new URL(fullPath, window.location).searchParams.get('url');
        const path = urlParam && decodeURIComponent(urlParam);
        if (!path) return;
        const url = new URL(/^\w+:\D+/.test(path) ? path : `https://${path}`);
        this.url = url.toString();
      },
    },
  },
  async created() {
    await this.persistTipDetails();
    if (process.env.IS_EXTENSION) {
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
      if (tab) {
        this.url = tab.url;
      }
    }
    // if mobile
    if (!this.IS_EXTENSION && !this.RUNNING_IN_TESTS) {
      this.url = '';
      this.editUrl = true;
    }
    try {
      this.verifiedUrls = (await axios.get(`${BACKEND_URL}/verified`)).data;
    } catch (e) {
      console.error(`Can't fetch /verified: ${e}`);
    }
    await this.$watchUntilTruly(() => this.sdk);
    await this.$watchUntilTruly(() => this.tippingAddress);
    this.minCallFee = calculateFee(TX_TYPES.contractCall, {
      ...this.sdk.Ae.defaults,
      contractId: this.tippingAddress,
      callerId: this.account.publicKey,
    }).min;
  },
  methods: {
    showBadgeModal() {
      this.$store.dispatch('modals/open', {
        name: 'tip-badge',
        verifiedStatus: this.verifiedStatus,
      });
    },
    async persistTipDetails() {
      if (this.tip) {
        const { amount, note, exp } = this.tip;
        if (exp > Date.now()) {
          this.amount = parseFloat(amount);
          this.note = note;
        } else {
          this.$store.commit('SET_TIP_DETAILS', null);
        }
      }
      this.$watch(
        ({ amount, note }) => [amount, note],
        ([amount, note]) => {
          const exp = new Date().setMinutes(new Date().getMinutes() + 20);
          this.$store.commit('SET_TIP_DETAILS', { note, amount, exp });
        },
      );
    },
    async toConfirm() {
      // TODO: check if url cannot be claimed through backend and only then show confirm modal
      // if (!this.urlVerified) {
      //   const allowToConfirm = await this.$store
      //     .dispatch('modals/open', { name: 'confirm-tip' })
      //     .catch(() => false);
      //   if (!allowToConfirm) return;
      // }
      this.amountError = !this.amount || !this.minCallFee || this.maxValue - this.amount <= 0;
      this.amountError = this.amountError || !+this.amount || this.amount <= 0;
      this.noteError = !this.note || !this.url;
      this.confirmMode = !this.amountError && !this.noteError && this.validUrl && this.url;
    },
    async sendTip() {
      const amount = aeToAettos(this.amount);
      this.loading = true;
      try {
        const { hash } = await this.tipping.call('tip', [this.url, escapeSpecialChars(this.note)], {
          amount,
          waitMined: false,
        });
        if (hash) {
          await this.$store.dispatch('setPendingTx', {
            hash,
            amount,
            tipUrl: this.url,
            time: Date.now(),
            type: 'tip',
          });
          this.$router.push('/account');
        }
      } catch (e) {
        this.$store.dispatch('modals/open', { name: 'default', type: 'transaction-failed' });
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style lang="scss" scoped>
@import '../../../common/variables';
.send-tip-button {
  font-weight: bold !important;
  font-size: 15px !important;
}
.tour__step3 {
  margin: 0 10px;
  padding: 12px 10px 4px;
  margin-top: 10px;
  min-width: auto;
  p {
    margin-top: 0;
    &.title-holder {
      display: flex;
      align-items: center;
    }
  }
}
.tour__step3_mobile.v-tour__target--highlighted {
  padding-bottom: 25px;
}
.url-bar {
  display: flex;
  align-items: center;
  :first-child {
    flex-grow: 1;
    color: $text-color;
    text-decoration: none;
    &.not-verified {
      color: $not-verified-badge-bg;
    }
  }
}
.ae-icon-check {
  font-size: 24px;
  color: #fff !important;
}
@media screen and (min-width: 380px) {
  .tour__step3 {
    margin: 0 auto;
    padding: 12px 20px 4px;
  }
}
</style>
