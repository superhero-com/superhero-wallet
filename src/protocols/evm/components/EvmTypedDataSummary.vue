<template>
  <div
    v-if="intent"
    class="evm-typed-data-summary"
    :aria-busy="isLoading"
    data-cy="evm-sign-summary"
  >
    <DetailsItem
      :label="$t('modals.evmCallSummary.action')"
      :value="action"
      data-cy="evm-sign-action"
    />
    <DetailsItem
      v-for="(row, idx) in rows"
      :key="idx"
      :label="row.label"
      :value="row.value"
      :class="{ address: row.isAddress }"
      :data-cy="row.dataCy"
    />
    <InfoBox
      v-if="intent.kind === 'permit2Transfer' && intent.hasWitness"
      :text="$t('modals.evmCallSummary.orderIncluded')"
      data-cy="evm-sign-order"
    />
    <InfoBox
      v-for="warning in warnings"
      :key="warning"
      type="warning"
      :text="warning"
      data-cy="evm-sign-warning"
    />
  </div>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  onMounted,
  PropType,
  ref,
} from 'vue';
import { useI18n } from 'vue-i18n';

import type { IEvmTypedData, Protocol } from '@/types';
import { useEvmTokenMeta } from '@/protocols/evm/composables/evmTokenMeta';
import { getActiveEvmNetworkSettings } from '@/protocols/evm/helpers/activeEvmNetworkSettings';
import { isUnlimitedAmount } from '@/protocols/evm/helpers/decodeEvmCallIntent';
import { decodeTypedDataIntent } from '@/protocols/evm/helpers/decodeTypedDataIntent';
import { fetchIsEvmContract, type IEvmTokenMeta } from '@/protocols/evm/helpers/evmAddressInfo';
import {
  formatEvmTime,
  formatEvmTokenAmount,
  getEvmAssetLabel,
} from '@/protocols/evm/helpers/formatEvmAsset';

import DetailsItem from '@/popup/components/DetailsItem.vue';
import InfoBox from '@/popup/components/InfoBox.vue';

interface IRow {
  label: string;
  value: string;
  isAddress?: boolean;
  dataCy?: string;
}

const LOADING = '…';

/** What a permit signature allows; the message itself is shown as it is */
export default defineComponent({
  components: {
    DetailsItem,
    InfoBox,
  },
  props: {
    protocol: { type: String as PropType<Protocol>, required: true },
    typedData: { type: Object as PropType<IEvmTypedData>, required: true },
  },
  setup(props) {
    const { t } = useI18n();
    const { getTokenMeta } = useEvmTokenMeta(props.protocol);

    const intent = decodeTypedDataIntent(props.typedData);
    const tokenMetas = ref<Record<string, IEvmTokenMeta>>({});
    const isSpenderContract = ref<boolean>();
    const isLoading = ref(!!intent);
    const isTransfer = intent?.kind === 'transferAuthorization';

    /** Each with the amount it allows; `undefined` for DAI's all or nothing */
    const tokens = ((): { token: string; amount?: string; expiration?: string }[] => {
      switch (intent?.kind) {
        case 'permit':
        case 'transferAuthorization': return [{ token: intent.token, amount: intent.amount }];
        case 'daiPermit': return [{ token: intent.token }];
        case 'permit2Allowance':
        case 'permit2Transfer': return intent.tokens;
        default: return [];
      }
    })();

    /** Takes the right back: DAI's permit that allows nothing, or an EIP-2612 permit of 0 */
    const isRevoke = (intent?.kind === 'daiPermit' && !intent.allowed)
      || (intent?.kind === 'permit' && intent.amount === '0');

    const action = computed((): string => {
      if (isRevoke) return t('modals.evmCallSummary.actions.revoke');
      switch (intent?.kind) {
        case 'permit':
        case 'daiPermit': return t('modals.evmCallSummary.actions.approve');
        case 'permit2Allowance': return t('modals.evmCallSummary.actions.permit2Approve');
        case 'permit2Transfer': return t('modals.evmCallSummary.actions.permit2Transfer');
        case 'transferAuthorization': return t('modals.evmCallSummary.actions.transfer');
        default: return '';
      }
    });

    function formatAmount(token: string, amount?: string) {
      if (isLoading.value) return LOADING;
      // A transfer moves exactly its amount
      return (amount === undefined)
        ? t('modals.evmCallSummary.unlimited', {
          symbol: getEvmAssetLabel(token, tokenMetas.value[token]),
        })
        : formatEvmTokenAmount(amount, token, tokenMetas.value[token], !isTransfer);
    }

    /** Of the signature: 0 is never for DAI, the rest is checked against the block time */
    const validUntil = (() => {
      switch (intent?.kind) {
        case 'permit':
        case 'permit2Transfer': return intent.deadline;
        case 'daiPermit': return intent.expiry;
        case 'permit2Allowance': return intent.sigDeadline;
        case 'transferAuthorization': return intent.validBefore;
        default: return undefined;
      }
    })();

    const rows = computed((): IRow[] => {
      if (!intent) return [];
      // DAI's revoke has no amount to tell, a permit of 0 names the token with its amount
      const isAmountless = isRevoke && intent.kind === 'daiPermit';
      const list: IRow[] = isAmountless ? [] : tokens.flatMap(({ token, amount, expiration }) => [
        {
          label: t('modals.evmCallSummary.amount'),
          value: formatAmount(token, amount),
          dataCy: 'evm-sign-amount',
        },
        ...(expiration === undefined ? [] : [{
          label: t('modals.evmCallSummary.expires'),
          // Permit2 counts 0 from the block the spender submits it in
          value: (expiration === '0')
            ? t('modals.evmCallSummary.blockOfUse')
            : formatEvmTime(expiration),
        }]),
      ]);
      list.push((intent.kind === 'transferAuthorization')
        ? {
          label: t('modals.evmCallSummary.recipient'),
          value: intent.recipient,
          isAddress: true,
          dataCy: 'evm-sign-recipient',
        }
        : {
          label: t('modals.evmCallSummary.spender'),
          value: intent.spender,
          isAddress: true,
          dataCy: 'evm-sign-spender',
        });
      if (validUntil !== undefined) {
        list.push({
          label: t('modals.evmCallSummary.signatureValidUntil'),
          value: (intent.kind === 'daiPermit' && validUntil === '0')
            ? t('modals.evmCallSummary.never')
            : formatEvmTime(validUntil),
        });
      }
      return list;
    });

    /**
     * The amounts need no lookup: each of these permits allows only ERC-20 tokens.
     * A transfer moves an exact amount, often to an account.
     */
    const warnings = computed((): string[] => {
      if (!intent || isRevoke || isTransfer) return [];
      const list = tokens
        .filter(({ amount }) => amount === undefined || isUnlimitedAmount(amount))
        .map(({ token }) => {
          const symbol = getEvmAssetLabel(token, tokenMetas.value[token]);
          switch (intent.kind) {
            case 'permit2Transfer':
              return t('modals.evmCallSummary.warnings.unlimitedTransfer', { symbol });
            case 'permit2Allowance':
              return t('modals.evmCallSummary.warnings.unlimitedUntilExpiry', { symbol });
            default:
              return t('modals.evmCallSummary.warnings.unlimitedApproval', { symbol });
          }
        });
      if (isSpenderContract.value === false) {
        list.push(t('modals.evmCallSummary.warnings.spenderNotContract'));
      }
      // A batch can name a token twice, the same warning twice tells nothing more
      return [...new Set(list)];
    });

    onMounted(async () => {
      if (!intent) return;
      try {
        const { chainId, nodeUrl } = getActiveEvmNetworkSettings(props.protocol);
        const domainChainId = props.typedData.domain?.chainId;
        // The node of the active chain knows nothing of the tokens of another one
        if (domainChainId != null && String(BigInt(domainChainId as any)) !== String(chainId)) {
          return;
        }
        const uniqueTokens = [...new Set(tokens.map(({ token }) => token))];
        const [metas, isContract] = await Promise.all([
          Promise.all(uniqueTokens.map((token) => getTokenMeta(nodeUrl, token))),
          (intent.kind === 'transferAuthorization') ? undefined : fetchIsEvmContract(nodeUrl, intent.spender),
        ]);
        tokenMetas.value = Object.fromEntries(
          uniqueTokens.map((token, idx) => [token, metas[idx]]),
        );
        isSpenderContract.value = isContract;
      } catch {
        // Shown without the token details
      } finally {
        isLoading.value = false;
      }
    });

    return {
      intent,
      isLoading,
      action,
      rows,
      warnings,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/mixins';

.evm-typed-data-summary {
  @include mixins.flex(flex-start, flex-start, column);

  gap: 8px;
  padding: 8px 0;

  .address:deep(.value) {
    word-break: break-all;
  }

  .info-box {
    margin-top: 0;
  }
}
</style>
