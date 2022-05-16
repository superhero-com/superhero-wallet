<template>
  <div class="tips-send">
    <i18n
      path="pages.tipPage.header"
      tag="div"
      class="header"
    >
      <a
        :href="AGGREGATOR_URL"
        target="_blank"
      >
        {{ $t('pages.notifications.superhero') }}
      </a>
    </i18n>
    <p>
      <template v-if="!confirmMode">
        {{ $t('pages.tipPage.url') }}
      </template>
      <template v-else>
        {{ $t('pages.tipPage.headingSending') }}
        <TokenAmount
          data-cy="tip-amount"
          :amount="+amount"
          v-bind="selectedToken ? { symbol: selectedToken.symbol, aex9: true } : {}"
        />
        {{ $t('pages.tipPage.to') }}
      </template>
    </p>

    <div
      class="url-bar"
      :class="editUrl ? 'url-bar--input' : 'url-bar--text'"
    >
      <template v-if="!editUrl">
        <a data-cy="tip-url">
          {{ url }}
        </a>
      </template>
      <InputField
        v-else
        v-model="url"
        :placeholder="$t('pages.tipPage.enterUrl')"
      >
        <UrlStatus
          slot="left"
          :status="urlStatus"
        />
      </InputField>
    </div>
    <div data-cy="tip-container">
      <template v-if="!confirmMode">
        <InputAmount
          v-model="amount"
          @error="(val) => error = val"
        />
        <Textarea
          v-model="note"
          :placeholder="$t('pages.tipPage.titlePlaceholder')"
          size="sm"
        />
        <div class="validation-msg">
          {{ validationStatus.msg }}
        </div>
        <Button
          :disabled="validationStatus.error || error"
          bold
          data-cy="send-tip"
          @click="toConfirm"
        >
          {{ $t('pages.tipPage.next') }}
        </Button>
        <Button
          bold
          @click="openCallbackOrGoHome(false)"
        >
          {{ $t('pages.tipPage.cancel') }}
        </Button>
      </template>
      <template v-else>
        <div
          class="tip-note-preview"
          data-cy="tip-note"
        >
          {{ note }}
        </div>
        <Button
          :disabled="selectedToken ? !tippingV2 : !tippingV1"
          data-cy="confirm-tip"
          @click="sendTip"
        >
          {{ $t('pages.tipPage.confirm') }}
        </Button>
        <Button
          data-cy="edit-tip"
          @click="toEdit"
        >
          {{ $t('pages.tipPage.edit') }}
        </Button>
      </template>

      <Loader v-if="loading" />
    </div>
  </div>
</template>

<script>
import { mapGetters, mapState } from 'vuex';
import { SCHEMA } from '@aeternity/aepp-sdk';
import {
  escapeSpecialChars, aeToAettos, validateTipUrl, convertToken,
} from '../../utils/helper';
import InputAmount from '../components/InputAmount.vue';
import Textarea from '../components/Textarea.vue';
import InputField from '../components/InputField.vue';
import UrlStatus from '../components/UrlStatus.vue';
import Button from '../components/Button.vue';
import TokenAmount from '../components/TokenAmount.vue';
import deeplinkApi from '../../../mixins/deeplinkApi';
import { AGGREGATOR_URL } from '../../utils/constants';

export default {
  components: {
    InputAmount,
    Textarea,
    InputField,
    UrlStatus,
    Button,
    TokenAmount,
  },
  mixins: [deeplinkApi],
  props: { tipUrl: { type: String, default: '' } },
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
      error: false,
      AGGREGATOR_URL,
    };
  },
  computed: {
    ...mapGetters(['account']),
    ...mapState(['tip', 'sdk', 'tippingV1', 'tippingV2']),
    ...mapGetters('fungibleTokens', ['selectedToken', 'tokenBalances']),
    urlStatus() {
      return this.$store.getters['tipUrl/status'](this.url);
    },
    validUrl() {
      return validateTipUrl(this.url);
    },
    tippingContract() {
      return this.tippingV2 || this.tippingV1;
    },
    ...mapState({
      validationStatus({ sdk }, { minTipAmount }) {
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
        if (!this.selectedToken && this.amount < minTipAmount) {
          return { error: true, msg: this.$t('pages.tipPage.minAmountError') };
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
  async mounted() {
    await this.persistTipDetails();
    if (process.env.IS_EXTENSION) {
      const [{ url }] = await browser.tabs.query({ active: true, currentWindow: true });
      this.tipFromPopup = url.includes(browser.runtime.getURL('index.html'));
      if (url && !this.tipFromPopup) {
        this.url = url;
      } else if (this.tipFromPopup) {
        await browser.storage.local.remove('last-path');
      }
    }
    if (this.$props.tipUrl) this.url = this.$props.tipUrl;
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

          await this.$store.dispatch('fungibleTokens/loadTokenBalances');
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
          tx: {
            senderId: this.account.address,
            contractId: this.tippingContract.deployInfo.address,
            type: SCHEMA.TX_TYPE.contractCall,
          },
        });
        this.openCallbackOrGoHome(true);
      } catch (e) {
        await this.$store.dispatch('modals/open', {
          name: 'default',
          title: this.$t('modals.transaction-failed.msg'),
          icon: 'critical',
        });
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
@use '../../../styles/variables';
@use '../../../styles/typography';

.tips-send {
  padding: 16px;
  margin: 0 auto;
  min-width: auto;

  .header {
    margin: 8px 0 24px 0;
    text-align: center;
    color: variables.$color-light-grey;

    @extend %face-sans-15-medium;

    a {
      color: variables.$color-white;
      text-decoration: none;
      transition: all 0.08s ease-out;

      &:hover {
        text-decoration: underline;
      }
    }
  }

  p {
    color: variables.$color-white;
    margin: 0 0 8px 0;
    text-align: left;

    @extend %face-sans-16-regular;

    &.title-holder {
      display: flex;
      align-items: center;
    }
  }

  .url-bar {
    position: relative;

    &.url-bar--text {
      display: flex;
      align-items: center;
    }

    a {
      margin: 8px 0;
      color: variables.$color-white;
      text-decoration: none;
      margin-left: 10px;
      width: 90%;

      @extend %face-sans-11-regular;
    }
  }

  .input-amount {
    margin-bottom: 24px;
  }

  .validation-msg {
    color: variables.$color-error;
    font-size: 15px;
    min-height: 45px;
  }
}
</style>
