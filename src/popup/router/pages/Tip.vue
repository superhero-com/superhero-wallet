<template>
  <div>
    <BalanceInfo />
    <div class="tour__step3 popup">
      <p class="primary-title text-left mb-8 f-16">
        <template v-if="!confirmMode">
          {{ $t('pages.tipPage.url') }}
        </template>
        <template v-else>
          {{ $t('pages.tipPage.headingSending') }}
          <TokenAmount
            data-cy="tip-amount"
            :amount="+amount"
            v-bind="selectedToken ? { symbol: selectedToken.symbol } : {}"
          />
          {{ $t('pages.tipPage.to') }}
        </template>
      </p>

      <div class="url-bar" :class="editUrl ? 'url-bar--input' : 'url-bar--text'">
        <UrlStatus :status="urlStatus" info />
        <template v-if="!editUrl">
          <a class="link-sm text-left" data-cy="tip-url">
            {{ url }}
          </a>
        </template>
        <Input
          v-else
          size="m-0 sm"
          v-model="url"
          :error="url && !validUrl"
          :placeholder="$t('pages.tipPage.enterUrl')"
        />
      </div>
    </div>
    <div class="popup" data-cy="tip-container">
      <template v-if="!confirmMode">
        <AmountSend
          :amountError="amountError"
          v-model="amount"
          :errorMsg="
            amount && !selectedToken && amount < minTipAmount
              ? $t('pages.tipPage.minAmountError')
              : ''
          "
        />
        <Textarea
          v-model="note"
          :placeholder="$t('pages.tipPage.titlePlaceholder')"
          :error="note.length > 280"
          size="sm"
        />
        <Button
          @click="toConfirm"
          :disabled="
            !note ||
            amountError ||
            noteError ||
            !fee ||
            !validUrl ||
            !url ||
            urlStatus === 'blacklisted' ||
            note.length > 280
          "
          bold
          data-cy="send-tip"
        >
          {{ $t('pages.tipPage.next') }}
        </Button>
        <Button bold @click="openCallbackOrGoHome(false)">
          {{ $t('pages.tipPage.cancel') }}
        </Button>
      </template>
      <template v-else>
        <div class="tip-note-preview mt-15" data-cy="tip-note">
          {{ note }}
        </div>
        <Button
          @click="selectedToken ? sendFungibleTokenTip() : sendTip()"
          :disabled="selectedToken ? !tippingV2 : !tippingV1"
          data-cy="confirm-tip"
        >
          {{ $t('pages.tipPage.confirm') }}
        </Button>
        <Button @click="toEdit" data-cy="edit-tip">
          {{ $t('pages.tipPage.edit') }}
        </Button>
      </template>

      <Loader v-if="loading" />
    </div>
  </div>
</template>

<script>
import { mapGetters, mapState } from 'vuex';
import { calculateFee, TX_TYPES } from '../../utils/constants';
import { escapeSpecialChars, aeToAettos, validateTipUrl, convertToken } from '../../utils/helper';
import AmountSend from '../components/AmountSend';
import Textarea from '../components/Textarea';
import Input from '../components/Input';
import UrlStatus from '../components/UrlStatus';
import Button from '../components/Button';
import TokenAmount from '../components/TokenAmount';
import BalanceInfo from '../components/BalanceInfo';
import deeplinkApi from '../../../mixins/deeplinkApi';

export default {
  mixins: [deeplinkApi],
  components: {
    AmountSend,
    Textarea,
    Input,
    UrlStatus,
    Button,
    TokenAmount,
    BalanceInfo,
  },
  data() {
    return {
      url: null,
      amount: null,
      note: '',
      confirmMode: false,
      amountError: false,
      noteError: false,
      loading: false,
      fee: null,
      editUrl: true,
      IS_EXTENSION: process.env.IS_EXTENSION,
      tipFromPopup: false,
    };
  },
  computed: {
    ...mapGetters(['account', 'minTipAmount', 'activeNetwork']),
    ...mapState(['tourRunning', 'balance', 'tip', 'sdk', 'tippingV1', 'tippingV2']),
    ...mapState('fungibleTokens', ['selectedToken', 'tokenBalances']),
    urlStatus() {
      return this.tourRunning ? 'verified' : this.$store.getters['tipUrl/status'](this.url);
    },
    validUrl() {
      return validateTipUrl(this.url);
    },
  },
  watch: {
    amount() {
      this.amountError = !+this.amount || (!this.selectedToken && this.amount < this.minTipAmount);
    },
    $route: {
      immediate: true,
      handler({ query }) {
        const tipUrlEncoded = query.url;
        if (tipUrlEncoded) {
          const tipUrl = decodeURIComponent(tipUrlEncoded);
          const tipUrlNormalised = new URL(/^\w+:\D+/.test(tipUrl) ? tipUrl : `https://${tipUrl}`);
          this.url = tipUrlNormalised.toString();
        }

        const tipMessageEncoded = query.message;
        if (tipMessageEncoded) this.note = decodeURIComponent(tipMessageEncoded);

        const tipAmount = +query.amount;
        if (tipAmount) this.amount = tipAmount.toString();
      },
    },
  },
  async created() {
    await this.persistTipDetails();
    if (process.env.IS_EXTENSION) {
      const [{ url }] = await browser.tabs.query({ active: true, currentWindow: true });
      this.tipFromPopup = url.includes(browser.runtime.getURL('popup/popup.html'));
      if (url && !this.tipFromPopup) {
        this.url = url;
      } else if (this.tipFromPopup) {
        await browser.storage.local.remove('last-path');
      }
    }
    await this.$watchUntilTruly(() => this.sdk);
    this.fee = calculateFee(TX_TYPES.contractCall, {
      ...this.sdk.Ae.defaults,
      contractId: this.activeNetwork.tipContractV1,
      callerId: this.account.publicKey,
    });
  },
  methods: {
    async persistTipDetails() {
      if (this.tip) {
        const { amount, note, exp } = this.tip;
        if (exp > Date.now()) {
          this.amount = parseFloat(amount);
          this.note = note;
        } else {
          this.$store.commit('setTipDetails', null);
        }
      }
      this.$watch(
        ({ amount, note }) => [amount, note],
        ([amount, note]) => {
          const exp = new Date().setMinutes(new Date().getMinutes() + 20);
          this.$store.commit('setTipDetails', { note, amount, exp });
        },
      );
    },
    async toConfirm() {
      if (this.urlStatus === 'not-verified') {
        const allowToConfirm = await this.$store
          .dispatch('modals/open', { name: 'confirm-tip' })
          .catch(() => false);
        if (!allowToConfirm) return;
      }
      const calculatedMaxValue = this.balance > this.fee ? this.balance - this.fee : 0;
      this.amountError =
        !this.amount || !this.fee || (!this.selectedToken && calculatedMaxValue - this.amount <= 0);
      this.amountError =
        this.amountError ||
        !+this.amount ||
        (!this.selectedToken && this.amount < this.minTipAmount);
      this.noteError = !this.note || !this.url || this.note.length > 280;
      this.confirmMode =
        !this.amountError &&
        !this.noteError &&
        this.validUrl &&
        this.url &&
        this.urlStatus !== 'blacklisted';
      if (this.confirmMode) this.editUrl = false;
    },
    async sendTip() {
      const amount = aeToAettos(this.amount);
      this.loading = true;
      try {
        const { hash } = await this.tippingV1.call(
          'tip',
          [this.url, escapeSpecialChars(this.note)],
          {
            amount,
            waitMined: false,
            modal: false,
          },
        );
        if (hash) {
          this.$store.commit('addPendingTransaction', {
            hash,
            amount,
            tipUrl: this.url,
            type: 'tip',
          });
          this.openCallbackOrGoHome(true);
        }
      } catch (e) {
        await this.$store.dispatch('modals/open', { name: 'default', type: 'transaction-failed' });
        e.payload = { url: this.url };
        throw e;
      } finally {
        this.loading = false;
        if (this.tipFromPopup) window.close();
      }
    },
    async sendFungibleTokenTip() {
      this.loading = true;
      await this.$store.dispatch('fungibleTokens/createOrChangeAllowance', this.amount);
      try {
        const { hash } = await this.tippingV2.methods.tip_token(
          this.url,
          escapeSpecialChars(this.note),
          this.selectedToken.contract,
          convertToken(this.amount, this.selectedToken.decimals).toFixed(),
        );
        if (hash) {
          this.$store.commit('addPendingTransaction', {
            hash,
            amount: this.amount,
            tipUrl: this.url,
            type: 'tip',
          });
          await this.$store.dispatch('fungibleTokens/loadTokenBalances', this.account.publicKey);
          this.$store.commit(
            'fungibleTokens/setSelectedToken',
            this.tokenBalances.find(({ value }) => value === this.selectedToken.value),
          );
          this.openCallbackOrGoHome(true);
        }
      } catch (e) {
        await this.$store.dispatch('modals/open', { name: 'default', type: 'transaction-failed' });
        e.payload = { url: this.url };
        throw e;
      } finally {
        this.loading = false;
        if (this.tipFromPopup) window.close();
      }
    },
    toEdit() {
      this.confirmMode = false;
      this.editUrl = true;
    },
  },
};
</script>

<style lang="scss" scoped>
@import '../../../styles/variables';

.tour__step3 {
  margin: 0 auto;
  padding: 12px 20px 5px;
  margin-top: 22px;
  min-width: auto;

  &.v-tour__target--highlighted {
    margin: 10px;
    min-width: auto !important;
    padding-bottom: 25px;
  }

  p {
    margin-top: 0;

    &.title-holder {
      display: flex;
      align-items: center;
    }
  }
}

.url-bar {
  position: relative;

  &.url-bar--input {
    ::v-deep .url-status {
      position: absolute;
      left: 10px;
      top: 48%;
      transform: translateY(-50%);
      -ms-transform: translateY(-50%);
      -webkit-transform: translateY(-50%);
    }

    ::v-deep input {
      padding-left: 35px;
    }
  }

  &.url-bar--text {
    display: flex;
    align-items: center;
  }

  a {
    color: $text-color;
    text-decoration: none;
    margin-left: 10px;
    width: 90%;
  }
}

@media screen and (min-width: 380px) {
  .tour__step3.v-tour__target--highlighted {
    margin: 10px auto 0 auto;
    min-width: auto !important;
    padding-bottom: 25px;
  }
}
</style>
