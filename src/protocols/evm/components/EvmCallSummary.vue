<template>
  <div
    v-if="intent"
    class="evm-call-summary"
    :aria-busy="isLoading"
    data-cy="evm-call-summary"
  >
    <DetailsItem
      :label="$t('modals.evmCallSummary.action')"
      :value="action"
      data-cy="evm-call-action"
    />
    <DetailsItem
      v-for="row in rows"
      :key="row.label"
      :label="row.label"
      :value="row.value"
      :class="{ address: row.isAddress }"
      :data-cy="row.dataCy"
    />
    <InfoBox
      v-for="warning in warnings"
      :key="warning"
      type="warning"
      :text="warning"
      data-cy="evm-call-warning"
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

import type { IEvmCall, Protocol } from '@/types';
import { useEvmTokenMeta } from '@/protocols/evm/composables/evmTokenMeta';
import { getActiveEvmNetworkSettings } from '@/protocols/evm/helpers/activeEvmNetworkSettings';
import { decodeEvmCallIntent, isUnlimitedAmount } from '@/protocols/evm/helpers/decodeEvmCallIntent';
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

const isZeroAddress = (address: string) => BigInt(address) === BigInt(0);

/** What a dapp's call to a token or NFT contract does, from its call data */
export default defineComponent({
  components: {
    DetailsItem,
    InfoBox,
  },
  props: {
    protocol: { type: String as PropType<Protocol>, required: true },
    evmCall: { type: Object as PropType<IEvmCall>, required: true },
  },
  setup(props) {
    const { t } = useI18n();
    const { getTokenMeta } = useEvmTokenMeta(props.protocol, props.evmCall);

    const intent = decodeEvmCallIntent(props.evmCall.to, props.evmCall.data);
    const tokenMeta = ref<IEvmTokenMeta>();
    const isGranteeContract = ref<boolean>();
    const isLoading = ref(!!intent);

    /** The token or collection whose amount or item the call names */
    const assetAddress = (() => {
      switch (intent?.kind) {
        case 'approveAll':
        case 'nftTransfer': return intent.collection;
        default: return intent?.token;
      }
    })();

    /** Who gets the right to move the assets; the zero address gets none */
    const grantee = (() => {
      switch (intent?.kind) {
        case 'approve':
        case 'increaseAllowance':
        case 'permit2Approve': return isZeroAddress(intent.spender) ? undefined : intent.spender;
        case 'approveAll': return (intent.approved && !isZeroAddress(intent.operator))
          ? intent.operator
          : undefined;
        default: return undefined;
      }
    })();

    const symbol = computed(() => getEvmAssetLabel(assetAddress ?? '', tokenMeta.value));

    function formatAmount(amount: string, canBeUnlimited = true) {
      return isLoading.value
        ? LOADING
        : formatEvmTokenAmount(amount, assetAddress!, tokenMeta.value, canBeUnlimited);
    }

    function formatNft(tokenId: string) {
      return isLoading.value ? LOADING : `${symbol.value} #${tokenId}`;
    }

    /** Permit2 takes 0 for the time of the block the approval is in */
    function formatExpiration(seconds: string) {
      return (seconds === '0')
        ? t('modals.evmCallSummary.thisBlockOnly')
        : formatEvmTime(seconds);
    }

    /** An ERC-721 shares the selectors of `approve` and `transferFrom` with ERC-20 */
    const isNftItem = computed(() => !!tokenMeta.value?.isNft);

    /**
     * Takes a right back, as revoke tools and USDT-style resets do. The amount of an approve
     * is an NFT's id, 0 included, unless the token has decimals; an NFT may answer 0 decimals.
     */
    const isRevoke = computed((): boolean => {
      switch (intent?.kind) {
        case 'approve': return isNftItem.value
          ? isZeroAddress(intent.spender)
          : ((tokenMeta.value?.decimals ?? 0) > 0 && intent.amount === '0');
        case 'permit2Approve': return intent.amount === '0';
        default: return false;
      }
    });

    const action = computed((): string => {
      if (isRevoke.value) return t('modals.evmCallSummary.actions.revoke');
      switch (intent?.kind) {
        case 'transfer': return t('modals.evmCallSummary.actions.transfer');
        case 'approve': return isNftItem.value
          ? t('modals.evmCallSummary.actions.approveNft')
          : t('modals.evmCallSummary.actions.approve');
        case 'increaseAllowance': return t('modals.evmCallSummary.actions.increaseAllowance');
        case 'transferFrom': return isNftItem.value
          ? t('modals.evmCallSummary.actions.transferFromNft')
          : t('modals.evmCallSummary.actions.transferFrom');
        case 'approveAll': return intent.approved
          ? t('modals.evmCallSummary.actions.approveAll')
          : t('modals.evmCallSummary.actions.revokeAll');
        case 'nftTransfer': return t('modals.evmCallSummary.actions.nftTransfer');
        case 'permit2Approve': return t('modals.evmCallSummary.actions.permit2Approve');
        default: return '';
      }
    });

    const rows = computed((): IRow[] => {
      const labels = {
        recipient: t('modals.evmCallSummary.recipient'),
        spender: t('modals.evmCallSummary.spender'),
        operator: t('modals.evmCallSummary.operator'),
        from: t('modals.evmCallSummary.from'),
      };
      const address = (label: keyof typeof labels, value: string, dataCy?: string): IRow => ({
        label: labels[label], value, isAddress: true, dataCy,
      });
      const amount = (value: string): IRow => ({
        label: t('modals.evmCallSummary.amount'), value, dataCy: 'evm-call-amount',
      });
      const nft = (value: string): IRow => ({
        label: t('modals.evmCallSummary.nft'), value, dataCy: 'evm-call-nft',
      });

      switch (intent?.kind) {
        case 'transfer': return [
          amount(formatAmount(intent.amount, false)),
          address('recipient', intent.recipient),
        ];
        case 'approve':
        case 'increaseAllowance': return [
          isNftItem.value ? nft(formatNft(intent.amount)) : amount(formatAmount(intent.amount)),
          address('spender', intent.spender, 'evm-call-spender'),
        ];
        case 'transferFrom': return [
          isNftItem.value
            ? nft(formatNft(intent.amount))
            : amount(formatAmount(intent.amount, false)),
          address('from', intent.from),
          address('recipient', intent.recipient),
        ];
        case 'approveAll': return [
          {
            label: t('modals.evmCallSummary.collection'),
            value: isLoading.value ? LOADING : symbol.value,
          },
          address('operator', intent.operator, 'evm-call-spender'),
        ];
        case 'nftTransfer': return [
          nft(intent.amount
            ? t('modals.evmCallSummary.nftItems', {
              amount: intent.amount,
              nft: formatNft(intent.tokenId),
            })
            : formatNft(intent.tokenId)),
          address('from', intent.from),
          address('recipient', intent.recipient),
        ];
        case 'permit2Approve': return [
          amount(formatAmount(intent.amount)),
          address('spender', intent.spender, 'evm-call-spender'),
          {
            label: t('modals.evmCallSummary.expires'),
            value: formatExpiration(intent.expiration),
          },
        ];
        default: return [];
      }
    });

    /** Those that need no lookup at once, the rest once the token and the spender are known */
    const warnings = computed((): string[] => {
      if (!intent) return [];
      const list: string[] = [];
      const isApproval = ['approve', 'increaseAllowance', 'permit2Approve'].includes(intent.kind);
      // Permit2 allows only ERC-20 tokens, an approve may name an NFT until the decimals tell
      if (
        isApproval
        && (intent.kind === 'permit2Approve' || tokenMeta.value?.decimals !== undefined)
        && isUnlimitedAmount((intent as { amount: string }).amount)
      ) {
        list.push((intent.kind === 'permit2Approve')
          ? t('modals.evmCallSummary.warnings.unlimitedUntilExpiry', { symbol: symbol.value })
          : t('modals.evmCallSummary.warnings.unlimitedApproval', { symbol: symbol.value }));
      }
      if (intent.kind === 'approveAll' && intent.approved) {
        list.push(t('modals.evmCallSummary.warnings.approveAll'));
      }
      if (isGranteeContract.value === false && !isRevoke.value) {
        list.push((intent.kind === 'approveAll')
          ? t('modals.evmCallSummary.warnings.operatorNotContract')
          : t('modals.evmCallSummary.warnings.spenderNotContract'));
      }
      if (
        intent.kind === 'transfer'
        && intent.recipient.toLowerCase() === intent.token.toLowerCase()
      ) {
        list.push(t('modals.evmCallSummary.warnings.sendToTokenContract'));
      }
      return list;
    });

    onMounted(async () => {
      if (!intent) return;
      try {
        const { chainId, nodeUrl } = getActiveEvmNetworkSettings(props.protocol);
        // Not on the chain of the request anymore, its node would answer for another one
        if (String(chainId) !== props.evmCall.chainId || !assetAddress) return;
        // Set together: whether an approve gives a right depends on the token
        const [meta, isContract] = await Promise.all([
          getTokenMeta(nodeUrl, assetAddress),
          grantee ? fetchIsEvmContract(nodeUrl, grantee) : undefined,
        ]);
        tokenMeta.value = meta;
        isGranteeContract.value = isContract;
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

.evm-call-summary {
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
