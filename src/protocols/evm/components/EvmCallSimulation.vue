<template>
  <div
    class="evm-call-simulation"
    :aria-busy="!simulation"
    data-cy="evm-call-simulation"
  >
    <!-- A call that would fail changes nothing but the fee, as the warning tells -->
    <DetailsItem
      v-if="!warnsOfFailure"
      :label="$t('modals.evmCallSummary.balanceChanges')"
    >
      <span
        v-if="!simulation"
        data-cy="evm-call-simulation-note"
      >…</span>
      <template v-else-if="simulation.status === 'ok'">
        <div
          v-for="change in changes"
          :key="change.key"
          class="change"
          :class="{ incoming: change.isIncoming }"
          data-cy="evm-call-change"
          v-text="change.text"
        />
        <span
          v-if="!changes.length"
          data-cy="evm-call-simulation-note"
          v-text="$t('modals.evmCallSummary.noBalanceChanges')"
        />
      </template>
      <span
        v-else
        data-cy="evm-call-simulation-note"
        v-text="note"
      />
    </DetailsItem>
    <DetailsItem
      v-if="approvals.length"
      :label="$t('modals.evmCallSummary.approvalsGiven')"
    >
      <div
        v-for="approval in approvals"
        :key="approval"
        class="approval"
        data-cy="evm-call-approval"
        v-text="approval"
      />
    </DetailsItem>
    <InfoBox
      v-for="warning in warnings"
      :key="warning"
      type="warning"
      :text="warning"
      data-cy="evm-call-warning"
    />
    <InfoBox
      v-if="simulation?.status === 'ok' && simulation.hasUnreadEvents"
      type="warning"
      :text="$t('modals.evmCallSummary.simulationUnreadEvents')"
      data-cy="evm-call-unread"
    />
    <p
      v-if="simulation?.status === 'ok'"
      class="disclaimer"
      v-text="$t('modals.evmCallSummary.simulationDisclaimer')"
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
import BigNumber from 'bignumber.js';

import type { IEvmCall, Protocol } from '@/types';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';
import { useEvmTokenMeta } from '@/protocols/evm/composables/evmTokenMeta';
import { getActiveEvmNetworkSettings } from '@/protocols/evm/helpers/activeEvmNetworkSettings';
import { decodeEvmCallIntent, isUnlimitedAmount } from '@/protocols/evm/helpers/decodeEvmCallIntent';
import type { IEvmTokenMeta } from '@/protocols/evm/helpers/evmAddressInfo';
import {
  formatEvmTokenAmount,
  getEvmAssetLabel,
  getEvmSymbol,
} from '@/protocols/evm/helpers/formatEvmAsset';
import {
  addWraps,
  simulateEvmCall,
  type EvmSimulation,
  type IEvmApprovalChange,
} from '@/protocols/evm/libs/simulateEvmCall';

import DetailsItem from '@/popup/components/DetailsItem.vue';
import InfoBox from '@/popup/components/InfoBox.vue';

/** How a dapp's call would change the user's assets, run on the chain's node */
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
    const { coinSymbol, coinPrecision } = ProtocolAdapterFactory.getAdapter(props.protocol);

    const simulation = ref<EvmSimulation>();
    const tokenMetas = ref<Record<string, IEvmTokenMeta>>({});
    const intent = decodeEvmCallIntent(props.evmCall.to, props.evmCall.data);

    /** The summary of the call data tells this approval already */
    function isToldBySummary({
      asset, spender, isAll, isPermit2,
    }: IEvmApprovalChange) {
      const isSame = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();
      switch (intent?.kind) {
        case 'approve':
        case 'increaseAllowance':
          return !isPermit2 && !isAll
            && isSame(asset, intent.token) && isSame(spender, intent.spender);
        case 'approveAll':
          return !!isAll && isSame(asset, intent.collection) && isSame(spender, intent.operator);
        case 'permit2Approve':
          return !!isPermit2 && isSame(asset, intent.token) && isSame(spender, intent.spender);
        default:
          return false;
      }
    }

    /** A decoded approve the summary can't call unlimited: the answer both got has no decimals */
    const isUnwarnedBySummary = (approval: IEvmApprovalChange) => isToldBySummary(approval)
      && approval.amount !== undefined
      && !approval.isPermit2
      && tokenMetas.value[approval.asset]?.decimals === undefined;

    const assetLabel = (asset: string) => getEvmAssetLabel(asset, tokenMetas.value[asset]);

    const changes = computed(() => {
      if (simulation.value?.status !== 'ok') return [];
      return simulation.value.changes.map(({ asset, tokenId, amount }) => {
        const isIncoming = !amount.startsWith('-');
        const absolute = isIncoming ? amount : amount.slice(1);
        let text: string;
        if (!asset) {
          text = `${new BigNumber(absolute).shiftedBy(-coinPrecision).toFormat()} ${coinSymbol}`;
        } else {
          const meta = tokenMetas.value[asset];
          const symbol = getEvmSymbol(meta);
          // A fake can take the symbol or the short address of a real token, not its whole address
          const label = (isIncoming && !symbol) ? asset : getEvmAssetLabel(asset, meta);
          if (tokenId !== undefined) {
            const nft = `${label} #${tokenId}`;
            text = (absolute === '1')
              ? nft
              : t('modals.evmCallSummary.nftItems', { amount: absolute, nft });
          } else {
            text = formatEvmTokenAmount(absolute, asset, meta, false, label);
          }
          if (isIncoming && symbol) text = `${text} (${asset})`;
        }
        return {
          key: `${asset}#${tokenId}`,
          isIncoming,
          text: `${isIncoming ? '+' : '−'}${text}`,
        };
      })
        // A call can't push what leaves out of sight with what it gives
        .sort((a, b) => Number(a.isIncoming) - Number(b.isIncoming));
    });

    const approvalsGiven = computed(() => (
      (simulation.value?.status === 'ok')
        ? simulation.value.approvals.filter((approval) => !isToldBySummary(approval))
        : []
    ));

    const approvals = computed(() => [...new Set(approvalsGiven.value.map(({
      asset, spender, amount, tokenId, isAll,
    }) => {
      let assetText: string;
      if (isAll) {
        assetText = t('modals.evmCallSummary.allNfts', { symbol: assetLabel(asset) });
      } else if (tokenId !== undefined) {
        assetText = `${assetLabel(asset)} #${tokenId}`;
      } else {
        assetText = formatEvmTokenAmount(amount!, asset, tokenMetas.value[asset]);
      }
      return t('modals.evmCallSummary.approvalTo', { asset: assetText, spender });
    }))]);

    const warnsOfFailure = computed(() => (
      simulation.value?.status === 'reverted' || simulation.value?.status === 'insufficientFunds'
    ));

    const note = computed((): string => (simulation.value?.status === 'unsupported')
      ? t('modals.evmCallSummary.simulationUnsupported')
      : t('modals.evmCallSummary.simulationFailed'));

    const warnings = computed((): string[] => {
      const result = simulation.value;
      if (result?.status === 'reverted') {
        return [result.reason
          ? t('modals.evmCallSummary.simulationReverted', { reason: result.reason })
          : t('modals.evmCallSummary.simulationRevertedNoReason')];
      }
      if (result?.status === 'insufficientFunds') {
        return [t('modals.evmCallSummary.simulationInsufficientFunds', { symbol: coinSymbol })];
      }
      const warned = (result?.status === 'ok')
        ? [...approvalsGiven.value, ...result.approvals.filter(isUnwarnedBySummary)]
        : [];
      // The approvals above name each spender, the same warning twice tells nothing more
      return [...new Set(warned.flatMap(({
        asset, amount, isAll, isPermit2,
      }) => {
        if (isAll) return [t('modals.evmCallSummary.warnings.approveAll')];
        if (amount === undefined || !isUnlimitedAmount(amount)) return [];
        const symbol = assetLabel(asset);
        return [isPermit2
          ? t('modals.evmCallSummary.warnings.unlimitedUntilExpiry', { symbol })
          : t('modals.evmCallSummary.warnings.unlimitedApproval', { symbol })];
      }))];
    });

    onMounted(async () => {
      try {
        const { chainId, nodeUrl } = getActiveEvmNetworkSettings(props.protocol);
        // Not on the chain of the request anymore, its node would run it on another one
        if (String(chainId) !== props.evmCall.chainId) {
          simulation.value = { status: 'failed' };
          return;
        }
        const result = await simulateEvmCall(nodeUrl, props.evmCall, props.protocol);
        if (result.status !== 'ok') {
          simulation.value = result;
          return;
        }
        const assets = [...new Set([
          ...result.changes.map(({ asset }) => asset),
          ...result.wraps.map(({ asset }) => asset),
          ...result.approvals.map(({ asset }) => asset),
        ].filter((asset): asset is string => !!asset))];
        const metas = await Promise.all(
          assets.map((asset) => getTokenMeta(nodeUrl, asset).catch(() => ({}))),
        );
        tokenMetas.value = Object.fromEntries(assets.map((asset, idx) => [asset, metas[idx]]));
        // Not those of e.g. a multisig, which tells every coin it takes with the same event
        const wraps = result.wraps
          .filter(({ asset }) => tokenMetas.value[asset!]?.decimals !== undefined);
        simulation.value = { ...result, changes: addWraps(result.changes, wraps) };
      } catch {
        simulation.value = { status: 'failed' };
      }
    });

    return {
      simulation,
      changes,
      approvals,
      note,
      warnings,
      warnsOfFailure,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
@use '@/styles/typography';
@use '@/styles/mixins';

.evm-call-simulation {
  @include mixins.flex(flex-start, flex-start, column);

  gap: 8px;
  padding: 8px 0;

  // One per line in the row's value, which lays its children out side by side
  .change,
  .approval {
    width: 100%;
    word-break: break-all;
  }

  .change {
    color: $color-danger;

    &.incoming {
      color: $color-success-dark;
    }
  }

  .info-box {
    margin-top: 0;
  }

  .disclaimer {
    @extend %face-sans-12-regular;

    margin: 0;
    color: rgba($color-white, 0.5);
  }
}
</style>
