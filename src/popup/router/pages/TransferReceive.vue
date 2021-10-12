<template>
  <div
    class="transfer-receive"
    data-cy="top-up-container"
  >
    <InputAmount
      v-model="amount"
      v-validate="'min_value:0'"
      name="amount"
      :placeholder="$t('pages.receive.requestAmount')"
      :error="errors.has('amount')"
      :error-message="errors.first('amount')"
    />
    <InputWrapper
      v-for="(value, field) in shareInfo"
      :key="field"
      :class="{ copied: valueCopied(value) }"
      readonly
      :label="$t(`pages.receive.share${field}`)"
    >
      <div
        v-if="valueCopied(value)"
        class="copied-msg"
      >
        {{ $t('copied') }}
      </div>
      <div
        v-clipboard:copy="getLink(value)"
        v-clipboard:success="distinctCopy"
      >
        <TemplateRenderer
          :class="{ address: !value.endsWith('.chain') }"
          :str="getShareStr(value)"
        />
      </div>
      <template slot="buttons">
        <button
          v-if="!IS_MOBILE_DEVICE"
          v-clipboard:copy="getLink(value)"
          v-clipboard:success="distinctCopy"
        >
          <Copy />
        </button>
        <button
          v-else
          @click="share(value)"
        >
          <Share />
        </button>
        <button
          data-cy="qr-button"
          @click="showQr(value)"
        >
          <QrShow />
        </button>
      </template>
    </InputWrapper>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import CopyMixin from '../../../mixins/copy';
import InputAmount from '../components/InputAmount.vue';
import InputWrapper from '../components/InputWrapper.vue';
import TemplateRenderer from '../components/TemplateRenderer.vue';
import QrShow from '../../../icons/qr-show.svg?vue-component';
import Copy from '../../../icons/copy.svg?vue-component';
import Share from '../../../icons/share.svg?vue-component';
import { APP_LINK_WEB } from '../../utils/constants';

export default {
  components: {
    InputAmount,
    InputWrapper,
    TemplateRenderer,
    QrShow,
    Copy,
    Share,
  },
  mixins: [CopyMixin],
  data: () => ({
    amount: '',
    IS_MOBILE_DEVICE: window.IS_MOBILE_DEVICE,
  }),
  computed: {
    ...mapGetters(['account']),
    ...mapGetters('fungibleTokens', ['selectedToken']),
    shareInfo() {
      return {
        ...this.account.name ? { Name: this.account.name } : {},
        Address: this.account.address,
      };
    },
  },
  methods: {
    distinctCopy(value) {
      return this.copy(value, true);
    },
    valueCopied(value) {
      return this.copied === this.getLink(value);
    },
    getTokenInfo(link = false) {
      if (this.amount <= 0) return '';
      const token = this.selectedToken ? this.selectedToken[(link && 'value') || 'symbol'] : 'AE';
      const firstChar = link ? '&' : '?';
      const separator = link ? '&' : '&amp;';
      return `${firstChar}token=${token}${separator}amount=${this.amount}`;
    },
    getShareStr(value) {
      return `<strong>${value}</strong>${this.getTokenInfo()}`;
    },
    getLink(value) {
      return `${APP_LINK_WEB}/transfer?account=${value}${this.getTokenInfo(true)}`;
    },
    async showQr(value) {
      await this.$store.dispatch('modals/open', {
        name: 'share-qr',
        qrStr: this.getLink(value),
        msgStr: this.getShareStr(value),
      });
    },
    async share(value) {
      await this.$store.dispatch('share', { text: this.getLink(value) });
    },
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables.scss';
@use '../../../styles/typography.scss';
@use '../../../styles/share-info.scss';

.transfer-receive {
  .input-wrapper {
    ::v-deep main,
    div {
      width: 100%;
    }

    ::v-deep main {
      overflow: hidden;
      height: auto;
      cursor: pointer;

      div {
        text-align: left;
      }
    }

    &.copied ::v-deep main {
      position: relative;
      border: 1px dashed variables.$color-blue;

      .copied-msg {
        position: absolute;
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        margin-left: -16px;

        @extend %face-sans-14-medium;

        color: variables.$color-blue;
        background-color: variables.$color-blue-bg;
      }
    }
  }
}
</style>
