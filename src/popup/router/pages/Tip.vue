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
        <Input v-else size="m-0 sm" v-model="url" :placeholder="$t('pages.tipPage.enterUrl')" />
      </div>
    </div>
    <div class="popup" data-cy="tip-container">
      <template v-if="!confirmMode">
        <AmountSend v-model="amount" />
        <Textarea v-model="note" :placeholder="$t('pages.tipPage.titlePlaceholder')" size="sm" />
        <div class="validation-msg">
          {{ validationStatus.msg }}
        </div>
        <Button @click="toConfirm" :disabled="validationStatus.error" bold data-cy="send-tip">
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
          @click="sendTip"
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
import { pick } from 'lodash-es';
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
      loading: false,
      editUrl: true,
      IS_EXTENSION: process.env.IS_EXTENSION,
      tipFromPopup: false,
    };
  },
  subscriptions() {
    return pick(this.$store.state.observables, ['balance']);
  },
  computed: {
    ...mapGetters(['account']),
    ...mapState(['tourRunning', 'tip', 'sdk', 'tippingV1', 'tippingV2']),
    ...mapState('fungibleTokens', ['selectedToken', 'tokenBalances']),
    urlStatus() {
      return this.tourRunning ? 'verified' : this.$store.getters['tipUrl/status'](this.url);
    },
    validUrl() {
      return validateTipUrl(this.url);
    },
    tippingContract() {
      return this.tippingV2 || this.tippingV1;
    },
    ...mapState({
      validationStatus({ sdk }, { account, minTipAmount }) {
        if (!sdk || !this.tippingContract) {
          return { error: true };
        }
        if (!this.url || !this.validUrl) {
          return { error: true, msg: this.$t('pages.tipPage.enterUrl') };
        }
        if (this.urlStatus === 'blacklisted') {
          return { error: true, msg: this.$t('pages.tipPage.blacklistedUrl') };
        }
        if (this.selectedToken && !this.tippingV2) {
          return { error: true, msg: this.$t('pages.tipPage.v1FungibleTokenTipError') };
        }
        if (!+this.amount) {
          return { error: true, msg: this.$t('pages.tipPage.requiredAmountError') };
        }
        if (!this.selectedToken && this.amount < minTipAmount) {
          return { error: true, msg: this.$t('pages.tipPage.minAmountError') };
        }
        const fee = calculateFee(TX_TYPES.contractCall, {
          ...sdk.Ae.defaults,
          contractId: this.tippingContract.deployInfo.address,
          callerId: account.publicKey,
        });
        if (
          this.selectedToken
            ? this.selectedToken.balance.comparedTo(this.amount) === -1 ||
              this.balance.comparedTo(fee) === -1
            : this.balance.comparedTo(fee.plus(this.amount)) === -1
        ) {
          return { error: true, msg: this.$t('pages.tipPage.insufficientBalance') };
        }
        if (!this.note) {
          return { error: true, msg: this.$t('pages.tipPage.titlePlaceholder') };
        }
        if (this.note.length > 280) {
          return { error: true, msg: this.$t('pages.tipPage.maxNoteLengthError') };
        }
        return { error: false };
      },
    }),
  },
  watch: {
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
      this.confirmMode = !this.validationStatus.error;
      if (this.confirmMode) this.editUrl = false;
    },
    async sendTip() {
      const amount = aeToAettos(this.amount);
      this.loading = true;
      try {
        let txResult = null;

        if (this.selectedToken) {
          await this.$store.dispatch('fungibleTokens/createOrChangeAllowance', this.amount);
          txResult = await this.tippingV2.methods.tip_token(
            this.url,
            escapeSpecialChars(this.note),
            this.selectedToken.contract,
            convertToken(this.amount, this.selectedToken.decimals).toFixed(),
          );

          await this.$store.dispatch('fungibleTokens/loadTokenBalances', this.account.publicKey);
          this.$store.commit(
            'fungibleTokens/setSelectedToken',
            this.tokenBalances.find(({ value }) => value === this.selectedToken.value),
          );
        } else {
          txResult = await this.tippingContract.call(
            'tip',
            [this.url, escapeSpecialChars(this.note)],
            {
              amount,
              waitMined: false,
              modal: false,
            },
          );
        }

        this.$store.commit('addPendingTransaction', {
          hash: txResult.hash,
          amount: this.selectedToken ? this.amount : amount,
          tipUrl: this.url,
          type: 'tip',
        });
        this.openCallbackOrGoHome(true);
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
    min-width: auto;
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

.validation-msg {
  color: #ff8c2a;
  font-size: 15px;
  min-height: 45px;
}

@media screen and (min-width: 380px) {
  .tour__step3.v-tour__target--highlighted {
    margin: 10px auto 0 auto;
    min-width: auto;
    padding-bottom: 25px;
  }
}
</style>
