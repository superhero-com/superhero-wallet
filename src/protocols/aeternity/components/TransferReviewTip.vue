<template>
  <div class="review-tip-wrapper">
    <ModalHeader :title="$t('pages.send.sendingCryptoToUrl')">
      <template #subtitle>
        <i18n-t
          keypath="pages.send.tipInfo"
          tag="span"
          class="subtitle"
          scope="global"
        >
          <LinkButton
            :href="AGGREGATOR_URL"
            class="link"
          >
            {{ $t('pages.notifications.superhero') }}
          </LinkButton>
        </i18n-t>
      </template>
    </ModalHeader>

    <div class="account-info">
      <Avatar
        :address="activeAccount.address"
        size="lg"
      />
      <div class="name-address-wrapper">
        <Truncate
          v-if="activeAccount.name"
          :str="activeAccount.name"
        />
        <div v-else>
          {{ getDefaultAccountLabel({ protocolIdx: activeAccount.idx }) }}
        </div>
        <AddressTruncated
          show-explorer-link
          :address="activeAccount.address"
        />
      </div>
    </div>

    <span class="token-amount-wrapper">
      {{ $t('pages.send.sending') }}
      <TokenAmount
        :amount="+transferData.amount"
        :symbol="tokenSymbol"
        :hide-fiat="isAex9"
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
      :message="noteError"
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
import { useStore } from 'vuex';
import { AGGREGATOR_URL } from '@/constants';

import { AE_CONTRACT_ID } from '@/protocols/aeternity/config';
import { useAccounts } from '@/composables';
import { getDefaultAccountLabel } from '@/utils';

import LinkButton from '@/popup/components/LinkButton.vue';
import ModalHeader from '@/popup/components/ModalHeader.vue';
import TokenAmount from '@/popup/components/TokenAmount.vue';
import FormTextarea from '@/popup/components/form/FormTextarea.vue';
import Avatar from '@/popup/components/Avatar.vue';
import Truncate from '@/popup/components/Truncate.vue';
import AddressTruncated from '@/popup/components/AddressTruncated.vue';

export default {
  name: 'TransferReviewTip',
  components: {
    AddressTruncated,
    LinkButton,
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
  },
  setup() {
    const store = useStore();
    const { activeAccount } = useAccounts({ store });

    return {
      activeAccount,
    };
  },
  data() {
    return {
      AGGREGATOR_URL,
      AE_CONTRACT_ID,
      note: '',
      noteMaxLength: 280,
    };
  },
  computed: {
    isAex9() {
      return this.transferData?.selectedAsset?.contractId !== AE_CONTRACT_ID;
    },
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
    getDefaultAccountLabel,
    submit() {
      if (!this.noteError) {
        this.$emit('success');
      }
    },
  },
};
</script>

<style lang="scss" scoped>
@use '@/styles/variables';
@use '@/styles/typography';
@use '@/styles/mixins';

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

    :deep(.token-amount) {
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
      color: variables.$color-danger;
    }
  }

  .textarea {
    margin-bottom: 6px;
  }
}
</style>
