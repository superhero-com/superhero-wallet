<template>
  <div
    class="recipient-details"
    data-cy="recipient-details"
  >
    <!-- Where the coins go, so not behind the toggle -->
    <dl
      v-if="nameAddress"
      class="rows"
    >
      <div
        class="row stacked"
        data-cy="recipient-name-address"
      >
        <dt>{{ $t('pages.send.recipientDetails.nameAddress') }}</dt>
        <dd>
          <AddressFormatted
            :address="nameAddress"
            class="address"
          />
        </dd>
      </div>
    </dl>

    <p
      v-if="details === null"
      class="message warning"
      data-cy="recipient-no-account"
    >
      {{ $t('pages.send.recipientDetails.noAccount') }}
    </p>
    <p
      v-else-if="details?.isUnused"
      class="message"
      :class="{ warning: details.type === 'contract' }"
      data-cy="recipient-unused"
    >
      {{ details.type === 'contract'
        ? $t('pages.send.recipientDetails.noContract')
        : $t('pages.send.recipientDetails.unused') }}
    </p>
    <template v-else>
      <button
        type="button"
        class="toggle"
        data-cy="recipient-details-toggle"
        :aria-expanded="isExpanded"
        :aria-controls="isExpanded ? contentId : undefined"
        @click="isExpanded = !isExpanded"
      >
        {{ $t('pages.send.recipientDetails.title') }}
        <ChevronDownIcon
          class="chevron"
          :class="{ rotated: isExpanded }"
        />
      </button>

      <div
        v-if="isExpanded"
        :id="contentId"
        class="content"
      >
        <AnimatedSpinner
          v-if="!details && !hasError"
          class="spinner"
          data-cy="recipient-details-loading"
        />
        <p
          v-else-if="!details"
          class="message"
          data-cy="recipient-details-error"
        >
          {{ $t('pages.send.recipientDetails.error') }}
        </p>
        <dl
          v-else
          class="rows"
        >
          <div
            v-if="typeLabel"
            class="row"
            data-cy="recipient-type"
          >
            <dt>{{ $t('pages.send.recipientDetails.type') }}</dt>
            <dd>{{ typeLabel }}</dd>
          </div>
          <div
            v-if="details.confirmationsRequired != null"
            class="row"
            data-cy="recipient-consensus"
          >
            <dt>{{ $t('multisig.consensus') }}</dt>
            <dd>
              {{ $t('pages.send.recipientDetails.consensus', {
                required: details.confirmationsRequired,
                total: details.signersCount,
              }) }}
            </dd>
          </div>
          <div
            v-if="details.balance != null"
            class="row"
            data-cy="recipient-balance"
          >
            <dt>{{ $t('pages.send.recipientDetails.balance') }}</dt>
            <dd>
              <TokenAmount
                :amount="+details.balance"
                :protocol="protocol"
                vertical
                class="balance"
              />
            </dd>
          </div>
          <div
            v-if="details.createdAt"
            class="row"
            data-cy="recipient-created-at"
          >
            <dt>{{ $t('pages.send.recipientDetails.createdAt') }}</dt>
            <dd>
              {{ formatDate(details.createdAt) }}
              <span class="secondary">{{ formatTime(details.createdAt) }}</span>
            </dd>
          </div>
          <div
            v-if="details.lastSentAt !== undefined"
            class="row"
            data-cy="recipient-last-sent-at"
          >
            <dt>{{ $t('pages.send.recipientDetails.lastSentAt') }}</dt>
            <dd v-if="details.lastSentAt">
              {{ formatDate(details.lastSentAt) }}
              <span class="secondary">{{ formatTime(details.lastSentAt) }}</span>
            </dd>
            <dd v-else>
              {{ $t('pages.send.recipientDetails.never') }}
            </dd>
          </div>
          <div class="row">
            <dt>{{ $t('pages.send.recipientDetails.moreDetails') }}</dt>
            <dd>
              <LinkButton
                :href="explorerUrl"
                :text="$t('pages.send.recipientDetails.viewInExplorer')"
                variant="muted"
                is-external
                data-cy="recipient-explorer"
              />
            </dd>
          </div>
        </dl>
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  PropType,
  ref,
  useId,
  watch,
} from 'vue';
import { useI18n } from 'vue-i18n';
import type { IRecipientDetails, Protocol } from '@/types';
import { formatDate, formatTime } from '@/utils';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';

import AddressFormatted from '../AddressFormatted.vue';
import LinkButton from '../LinkButton.vue';
import TokenAmount from '../TokenAmount.vue';

import AnimatedSpinner from '../../../icons/animated-spinner.svg?vue-component';
import ChevronDownIcon from '../../../icons/chevron-down.svg?vue-component';

export default defineComponent({
  name: 'RecipientDetails',
  components: {
    AddressFormatted,
    AnimatedSpinner,
    ChevronDownIcon,
    LinkButton,
    TokenAmount,
  },
  props: {
    /** An address, a name, or a name's id */
    address: { type: String, required: true },
    protocol: { type: String as PropType<Protocol>, required: true },
    /** The address the recipient card already shows */
    shownAddress: { type: String, default: undefined },
  },
  setup(props) {
    const { t } = useI18n();
    const contentId = useId();
    const isExpanded = ref(false);
    /** `undefined` while loading, `null` for a name without an account */
    const details = ref<IRecipientDetails | null>();
    const hasError = ref(false);

    const typeLabel = computed(() => {
      switch (details.value?.type) {
        case 'basic': return t('pages.send.recipientDetails.basic');
        case 'generalized': return t('pages.send.recipientDetails.generalized');
        case 'multisig': return t('multisig.multisigVault');
        case 'contract': return t('pages.send.recipientDetails.contract');
        default: return undefined;
      }
    });
    /** The account the recipient name points to, unless the card shows it already */
    const nameAddress = computed(() => {
      const resolved = details.value?.address;
      return resolved !== props.address && resolved !== props.shownAddress ? resolved : undefined;
    });
    const adapter = computed(() => ProtocolAdapterFactory.getAdapter(props.protocol));
    const explorerUrl = computed(() => adapter.value.getExplorer().prepareUrlForAccount(
      details.value?.address || props.address,
    ));

    let request = 0;
    watch(
      () => props.address,
      async (address) => {
        request += 1;
        const current = request;
        details.value = undefined;
        hasError.value = false;
        try {
          const result = await adapter.value.fetchRecipientDetails!(address);
          if (current === request) details.value = result;
        } catch {
          if (current === request) hasError.value = true;
        }
      },
      { immediate: true },
    );

    return {
      contentId,
      details,
      explorerUrl,
      hasError,
      isExpanded,
      nameAddress,
      typeLabel,
      formatDate,
      formatTime,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
@use '@/styles/mixins';
@use '@/styles/typography';

.recipient-details {
  width: 100%;

  .toggle {
    @extend %face-sans-15-medium;
    @include mixins.focus-ring;

    display: inline-flex;
    align-items: center;
    gap: 4px;
    margin: 0 8px 8px;
    padding: 0;
    border: 0;
    background: none;
    line-height: 20px;
    color: rgba($color-white, 0.75);
    cursor: pointer;

    &:hover {
      color: $color-white;
    }

    .chevron {
      width: 16px;
      height: 16px;
      transition: transform 0.3s;

      &.rotated {
        transform: rotate(180deg);
      }
    }
  }

  .message {
    @extend %face-sans-14-regular;

    margin: 0;
    padding: 0 8px 8px;
    color: rgba($color-white, 0.75);

    &.warning {
      color: $color-warning;
    }
  }

  // Below the address a name points to
  .rows + .toggle {
    margin-top: 8px;
  }

  .rows + .message {
    padding-top: 8px;
  }

  .content {
    .spinner {
      display: block;
      width: 24px;
      height: 24px;
      margin: 8px auto 12px;
    }

    .message {
      padding-top: 4px;
    }
  }

  .rows {
    margin: 0;

    .row {
      @extend %face-sans-15-medium;

      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      padding: 10px 12px;
      line-height: 20px;
      // Darkens the card, also when it has an own account's color
      background-color: rgba($color-black, 0.15);

      &:nth-child(even) {
        background-color: rgba($color-black, 0.25);
      }

      &.stacked {
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;

        dd {
          align-items: flex-start;
          text-align: left;
        }
      }

      dt {
        color: rgba($color-white, 0.75);
      }

      dd {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        margin: 0;
        text-align: right;
        color: $color-white;
      }

      .secondary {
        @extend %face-sans-14-regular;

        color: rgba($color-white, 0.75);
      }

      .balance {
        align-items: flex-end;
      }

      .address {
        @extend %face-mono-14-medium;

        line-height: 24px;
      }
    }
  }
}
</style>
