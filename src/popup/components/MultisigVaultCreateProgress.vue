<template>
  <div class="multisig-vault-creation-progress">
    <h2 class="text-heading-1">
      {{ $t('modals.creatingMultisigAccount.title') }}
    </h2>

    <ProgressBar :progress="progressPercentage" />

    <div class="phase-list">
      <div
        v-for="(localPhase, index) in localPhases"
        :key="index"
        :class="{
          highlighted: isPhaseCompleted(index) || isPhaseCurrent(index),
        }"
        class="phase-item"
      >
        <PendingIcon
          v-if="isPhaseCurrent(index)"
          class="phase-pending-icon"
        />
        <CheckSuccessCircleIcon
          v-else-if="isPhaseCompleted(index)"
          class="phase-success-icon"
        />
        <div
          v-else
          class="phase-number"
        >
          {{ index + 1 }}
        </div>

        <div class="phase-item-name">
          <div>
            {{ localPhase.text }}<span v-if="isPhaseCurrent(index)">&hellip;</span>
          </div>
          <div
            v-if="localPhase.caption && !isAccessible && isPhaseCurrent(index)"
            class="phase-item-caption"
          >
            {{ localPhase.caption }}
          </div>
        </div>
      </div>
    </div>

    <Transition name="fade-transition">
      <div
        v-if="isAccessible"
        class="multisig-account-created"
      >
        <div class="message">
          {{ $t('modals.creatingMultisigAccount.vaultCreatedMessage') }}
        </div>
        <AvatarWithChainName
          :address="multisigAccount.multisigAccountId"
          class="ae-address"
          show-address
          :column-count="9"
        />
      </div>
    </Transition>
  </div>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  PropType,
} from '@vue/composition-api';
import { TranslateResult } from 'vue-i18n';
import {
  MULTISIG_CREATION_PHASES,
} from '../utils';
import { IMultisigAccountBase, IMultisigCreationPhase } from '../../types';

import AvatarWithChainName from './AvatarWithChainName.vue';
import ProgressBar from './ProgressBar.vue';
import PlusCircle from '../../icons/plus-circle-fill.svg?vue-component';
import CheckSuccessCircleIcon from '../../icons/check-success-circle.svg?vue-component';
import PendingIcon from '../../icons/animated-pending.svg?vue-component';

interface PhaseLabel {
  key: IMultisigCreationPhase;
  text: TranslateResult;
  caption?: TranslateResult;
}

export default defineComponent({
  name: 'MultisigVaultCreateProgress',
  components: {
    ProgressBar,
    AvatarWithChainName,
    CheckSuccessCircleIcon,
    PendingIcon,
  },
  props: {
    multisigAccount: { type: Object as PropType<IMultisigAccountBase>, default: null },
    phase: { type: String as PropType<IMultisigCreationPhase>, default: null },
    isAccessible: Boolean,
  },
  setup(props, { root }) {
    const localPhases: PhaseLabel[] = [
      {
        key: MULTISIG_CREATION_PHASES.prepared,
        text: root.$t('modals.creatingMultisigAccount.preparingMultisigVault'),
      },
      {
        key: MULTISIG_CREATION_PHASES.deployed,
        text: root.$t('modals.creatingMultisigAccount.deployingSmartContract'),
      },
      {
        key: MULTISIG_CREATION_PHASES.created,
        text: root.$t('modals.creatingMultisigAccount.creatingMultisigVault'),
      },
      {
        key: MULTISIG_CREATION_PHASES.accessible,
        text: root.$t('modals.creatingMultisigAccount.addingToWallet'),
        caption: root.$t('modals.creatingMultisigAccount.takingLong'),
      },
    ];

    const currentPhaseIndex = computed(
      () => localPhases.findIndex(({ key }) => key === props.phase),
    );
    const progressPercentage = computed(
      (): number => (100 / localPhases.length) * (currentPhaseIndex.value + 1),
    );

    function isPhaseCurrent(index: number) {
      return index === currentPhaseIndex.value + 1;
    }

    function isPhaseCompleted(index: number) {
      return !!props.multisigAccount || index <= currentPhaseIndex.value;
    }

    return {
      PlusCircle,
      localPhases,
      progressPercentage,
      isPhaseCurrent,
      isPhaseCompleted,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/variables';
@use '../../styles/typography';
@use '../../styles/mixins';

.multisig-vault-creation-progress {
  $phase-icon-size: 24px;

  padding-top: env(safe-area-inset-top);

  .phase-list {
    padding-top: 24px;

    .phase-item {
      @extend %face-sans-14-medium;

      display: inline-flex;
      align-items: center;
      gap: 12px;
      padding: 8px 0;
      opacity: 0.5;

      &.highlighted {
        opacity: 1;
      }

      .phase-number,
      .phase-pending-icon,
      .phase-success-icon {
        width: $phase-icon-size;
        height: $phase-icon-size;
      }

      .phase-number {
        display: flex;
        flex-direction: row;
        justify-content: center;
        align-items: center;
        padding: 2px;
        border: 2px solid rgba(variables.$color-white, 0.15);
        border-radius: 100%;
      }

      .phase-success-icon {
        color: variables.$color-success-dark;
        background-color: rgba(variables.$color-success-dark, 0.15);
        border-radius: 100%;
      }

      .phase-item-caption {
        font-weight: 400;
        color: rgba(variables.$color-white, 0.5);
      }
    }
  }

  .multisig-account-created {
    padding-top: 30px;
    text-align: center;

    .message {
      @extend %face-sans-16-regular;

      max-width: 250px;
      margin-inline: auto;
      padding-bottom: 16px;
      color: variables.$color-white;
      line-height: 22px;
    }

    .ae-address {
      @extend %face-sans-11-regular;

      align-items: flex-end;
      color: variables.$color-white;
    }
  }
}
</style>
