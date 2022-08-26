<template>
  <div class="review-tip-wrapper">
    <div class="review-tip">
      <ModalHeader :title="$t('pages.send.sendingCryptoToUrl')" />
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
      <div class="account-info">
        <Avatar
          :address="account.address"
          size="big"
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
          :amount="+amount"
          :symbol="tokenSymbol"
          :hide-fiat="!!selectedToken"
          data-cy="review-total"
        />
        <span class="lowercase">{{ $t('pages.send.to') }}</span>
      </span>
      <div class="tip-url">
        {{ tipUrl }}
      </div>
      <!--    TODO - insert textarea into fieldwrapper-->
      <div>
        {{ $t('pages.send.messageUrlOwner') }}
        <span
          class="counter"
          :class="{ 'below-zero': charactersLeft < 0 }"
        >{{ charactersLeft }}</span>
      </div>
      <Textarea
        v-model="note"
        size="sm"
      />
      <div class="error-container">
        {{ noteError }}
      </div>
    </div>

    <ReviewFooterWrapper>
      <Button
        fill="secondary"
        inline
        nowrap
        new-ui
        @click="handleEdit"
      >
        {{ $t('pages.tipPage.edit') }}
      </Button>
      <Button
        :disabled="charactersLeft < 0"
        extend
        new-ui
        @click="handleSubmit"
      >
        {{ $t('pages.tipPage.next') }}
      </Button>
    </ReviewFooterWrapper>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import ModalHeader from './ModalHeader.vue';
import TokenAmount from './TokenAmount.vue';
import Textarea from './Textarea.vue';
import Button from './Button.vue';
import Avatar from './Avatar.vue';
import Truncate from './Truncate.vue';
import { AGGREGATOR_URL } from '../../utils/constants';
import ReviewFooterWrapper from './ReviewFooterWrapper.vue';
import AddressShortening from './AddressShortening.vue';

const defaultValidationStatus = { error: false, msg: '' };

export default {
  components: {
    AddressShortening,
    ReviewFooterWrapper,
    ModalHeader,
    TokenAmount,
    Textarea,
    Button,
    Avatar,
    Truncate,
  },
  props: {
    amount: { type: String, required: true },
    tokenSymbol: { type: String, required: true },
    selectedToken: { type: Object, default: null },
    tipUrl: { type: String, default: null },
  },
  data() {
    return {
      AGGREGATOR_URL,
      note: '',
      noteMaxLength: 5,
      validationStatus: { ...defaultValidationStatus },
    };
  },
  computed: {
    ...mapGetters(['account']),
    noteError() {
      return this.note.length > this.noteMaxLength ? this.$t('pages.tipPage.maxNoteLengthError') : '';
    },
    charactersLeft() {
      return this.noteMaxLength - this.note.length;
    },
  },
  methods: {
    handleEdit() {
      this.$emit('edit');
    },
    handleSubmit() {
      this.$emit('submit', {
        amount: this.amount,
        selectedToken: this.selectedToken,
        tipUrl: this.tipUrl,
        note: this.note,
      });
    },
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/typography';
@use '../../../styles/mixins';

.review-tip-wrapper {
  margin-bottom: variables.$modal-footer-height;

  .review-tip {

    .subtitle {
      @extend %face-sans-16-regular;

      color: variables.$color-white;
      margin-bottom: 24px;

      a {
        font-weight: 500;
        color: variables.$color-blue;
        text-decoration: none;

        &:hover {
          text-decoration: underline;
        }
      }
    }

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
      color: variables.$color-white;
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

    .error-container {
      @extend %face-sans-14-regular;

      color: variables.$color-error;
    }
  }
}
</style>
