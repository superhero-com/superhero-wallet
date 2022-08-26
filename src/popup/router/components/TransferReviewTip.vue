<template>
  <div class="review-tip-wrapper">
    <ModalHeader :title="$t('pages.send.sendingCryptoToUrl')">
      <template #subtitle>
        <i18n
          path="pages.send.tipInfo"
          tag="span"
          class="subtitle"
        >
          <a
            :href="AGGREGATOR_URL"
            target="_blank"
            class="link"
          >
            {{ $t('pages.notifications.superhero') }}
          </a>
        </i18n>
      </template>
    </ModalHeader>

    <div class="account-info">
      <Avatar
        :address="account.address"
        size="lg"
      />
      <div class="name-address-wrapper">
        <Truncate
          v-if="account.name"
          :str="account.name"
        />
        <div v-else>
          {{ $t('pages.account.heading') }} {{ account.idx + 1 }}
        </div>
        <AddressShortening :address="account.address" />
      </div>
    </div>

    <span class="token-amount-wrapper">
      {{ $t('pages.send.sending') }}
      <TokenAmount
        slot="value"
        :amount="+transferData.amount"
        :symbol="tokenSymbol"
        :hide-fiat="!!selectedToken"
        data-cy="review-total"
      />
      <span class="lowercase">{{ $t('pages.send.to') }}</span>
    </span>

    <div class="tip-url">
      {{ transferData.address }}
    </div>

    <FormTextarea
      v-model="note"
      size="sm"
      :label="$t('pages.send.messageUrlOwner')"
      :error-message="noteError"
    >
      <template #label-after>
        <span
          class="counter"
          :class="{ 'below-zero': charactersLeft < 0 }"
        >{{ charactersLeft }}</span>
      </template>
    </FormTextarea>
    <span class="subtitle">
      {{ $t('pages.tipPage.claimingExplanation') }}
    </span>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import ModalHeader from './ModalHeader.vue';
import TokenAmount from './TokenAmount.vue';
import FormTextarea from './FormTextarea.vue';
import Avatar from './Avatar.vue';
import Truncate from './Truncate.vue';
import { AGGREGATOR_URL } from '../../utils/constants';
import AddressShortening from './AddressShortening.vue';

export default {
  name: 'TransferReviewTip',
  components: {
    AddressShortening,
    ModalHeader,
    TokenAmount,
    FormTextarea,
    Avatar,
    Truncate,
  },
  model: {
    prop: 'transferData',
  },
  props: {
    transferData: { type: Object, required: true },
    selectedToken: { type: Object, default: null },
  },
  data() {
    return {
      AGGREGATOR_URL,
      note: '',
      noteMaxLength: 280,
    };
  },
  computed: {
    ...mapGetters(['account']),
    noteError() {
      return (this.note.length > this.noteMaxLength)
        ? this.$t('pages.tipPage.maxNoteLengthError')
        : null;
    },
    charactersLeft() {
      return this.noteMaxLength - this.note.length;
    },
    tokenSymbol() {
      return this.transferData.selectedAsset?.symbol || '-';
    },
  },
  watch: {
    noteError(value) {
      this.$emit('error', !!value);
    },
    note(val) {
      this.$emit('input', {
        ...this.transferData,
        note: val,
      });
    },
  },
  methods: {
    submit() {
      if (!this.noteError) {
        this.$emit('success');
      }
    },
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/typography';
@use '../../../styles/mixins';

.review-tip-wrapper {
  .account-info {
    @include mixins.flex(flex-start, center);

    margin-top: 24px;
    gap: 8px;

    .name-address-wrapper {
      @include mixins.flex(flex-start, flex-start, column);

      @extend %face-sans-16-bold;

      line-height: 16px;

      .truncate {
        color: variables.$color-white;
        margin-bottom: 5px;
      }

      .address-shortening {
        color: variables.$color-white;
      }
    }
  }

  .lowercase {
    text-transform: lowercase;
  }

  .token-amount-wrapper {
    @include mixins.flex(flex-start, center);

    @extend %face-sans-15-regular;

    margin-block: 16px;
    gap: 4px;
    color: rgba(variables.$color-white, 0.75);

    ::v-deep .token-amount {
      .symbol {
        font-weight: 500;
      }

      .fiat {
        color: rgba(variables.$color-white, 0.75);
      }
    }
  }

  .tip-url {
    @extend %face-sans-14-regular;

    align-self: start;
    line-height: 20px;
    margin-bottom: 16px;
    text-align: start;
  }

  .counter {
    @extend %face-sans-15-medium;

    color: variables.$color-white;
    opacity: 1;

    &.below-zero {
      color: variables.$color-error;
    }
  }

  .textarea {
    margin-bottom: 6px;
  }
}
</style>
