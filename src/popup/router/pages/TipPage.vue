<template>
  <div class="popup" data-cy="tip-container">
    <p class="primary-title text-left mb-8 f-16">
      <template v-if="!confirmMode">
        {{ $t('pages.tipPage.heading') }}
        <span class="secondary-text">{{ $t('pages.appVUE.aeid') }}</span>
        {{ $t('pages.tipPage.to') }}
      </template>
      <template v-else>
        {{ $t('pages.tipPage.headingSending') }}
        <span class="secondary-text" data-cy="tip-amount">{{ amount }} {{ $t('pages.appVUE.aeid') }}</span>
        ({{ currencyAmount }} {{ currentCurrency }}) {{ $t('pages.tipPage.to') }}
      </template>
    </p>

    <div class="url-bar">
      <template v-if="!editUrl">
        <a class="link-sm text-left" data-cy="tip-url">{{ url }}</a>
        <CheckIcon v-if="urlVerified" />
      </template>
      <Input v-else size="m-0 xsm" v-model="url" />
      <button v-if="!confirmMode" @click="editUrl = !editUrl" data-cy="edit-url">
        <ae-icon :name="editUrl ? 'check' : 'vote'" data-cy="confirm-url" />
      </button>
    </div>

    <template v-if="!confirmMode">
      <AmountSend :amountError="amountError" @changeAmount="val => (amount = val)" :value="amount" />
      <Textarea v-model="note" :placeholder="$t('pages.tipPage.titlePlaceholder')" size="sm" />
      <Button @click="toConfirm" :disabled="!note || amountError || noteError || !minCallFee || editUrl" data-cy="send-tip">
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

    <popup :popupSecondBtnClick="popup.secondBtnClick" />
    <Loader size="big" :loading="loading" type="transparent" content="" />
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import axios from 'axios';
import { calculateFee, TX_TYPES, BACKEND_URL } from '../../utils/constants';
import { escapeSpecialChars, pollGetter, aeToAettos } from '../../utils/helper';
import { setPendingTx } from '../../utils';
import CheckIcon from '../../../icons/check-icon.svg?vue-component';
import AmountSend from '../components/AmountSend';
import Textarea from '../components/Textarea';
import Input from '../components/Input';

export default {
  components: {
    AmountSend,
    Textarea,
    CheckIcon,
    Input,
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
    ...mapGetters(['balance', 'popup', 'tipping', 'current', 'sdk', 'account', 'network', 'currentCurrency']),
    maxValue() {
      const calculatedMaxValue = this.balance - this.minCallFee;
      return calculatedMaxValue > 0 ? calculatedMaxValue.toString() : 0;
    },
    currencyAmount() {
      return (this.amount * this.current.currencyRate).toFixed(3);
    },
    urlVerified() {
      return this.url && this.verifiedUrls.includes(new URL(this.url).hostname);
    },
  },
  watch: {
    amount() {
      if (isNaN(this.amount) || parseFloat(this.amount) === 0) {
        this.amountError = true;
      } else {
        this.amountError = false;
      }
    },
    urlVerified(val) {
      if (val) this.$store.dispatch('popupAlert', { name: 'account', type: 'tip_url_verified' });
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
    } catch (e) {}

    await pollGetter(() => this.sdk);
    this.minCallFee = calculateFee(TX_TYPES.contractCall, {
      ...this.sdk.Ae.defaults,
      contractId: this.network[this.current.network].tipContract,
      callerId: this.account.publicKey,
    }).min;
  },
  methods: {
    async persistTipDetails() {
      const { tipDetails } = await browser.storage.local.get('tipDetails');
      if (tipDetails) {
        const { amount, note, exp } = tipDetails;
        if (exp > Date.now()) {
          this.amount = parseFloat(amount);
          this.note = note;
        } else {
          await browser.storage.local.remove('tipDetails');
        }
      }
      this.$watch(
        ({ amount, note }) => [amount, note],
        ([amount, note]) => {
          const exp = new Date().setMinutes(new Date().getMinutes() + 20);
          browser.storage.local.set({ tipDetails: { note, amount, exp } });
        }
      );
    },
    toConfirm() {
      this.amountError = !this.amount || !this.minCallFee || this.maxValue - this.amount <= 0;
      this.amountError = this.amountError || isNaN(this.amount) || this.amount <= 0 || isNaN(this.amount);
      this.noteError = !this.note || !this.url;
      this.confirmMode = !this.amountError && !this.noteError;
    },
    async sendTip() {
      const amount = aeToAettos(this.amount);
      this.loading = true;
      try {
        const res = await this.tipping.call('tip', [this.url, escapeSpecialChars(this.note)], { amount, waitMined: false });
        if (res.hash) {
          await setPendingTx({ hash: res.hash, amount: this.amount, domain: this.url, time: Date.now(), type: 'tip' });
          this.$router.push('/account');
        }
      } catch (e) {
        this.$store.dispatch('popupAlert', { name: 'spend', type: 'transaction_failed' });
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.url-bar {
  display: flex;
  align-items: center;

  :first-child {
    flex-grow: 1;
  }
}
</style>
