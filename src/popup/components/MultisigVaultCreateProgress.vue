<template>
  <div class="multisig-vault-creation-progress">
    <h2 class="text-heading-1">
      {{ $t('modals.creatingMultisigAccount.title') }}
    </h2>
    <ProgressBar :progress="progressPercentage" />
    <div class="steps-list">
      <div
        v-for="(step, index) in steps"
        :key="index"
        :class="{
          completed: isStepCompleted(index) || isStepCurrent(index),
        }"
        class="step-item"
      >
        <PendingIcon
          v-if="isStepCurrent(index)"
          class="step-pending-icon"
        />
        <CheckSuccessCircleIcon
          v-else-if="isStepCompleted(index)"
          class="step-success-icon"
        />
        <div
          v-else
          class="step-number"
        >
          {{ index + 1 }}
        </div>

        <div class="step-item-name">
          {{ step.text }}<span v-if="isStepCurrent(index)">&hellip;</span>
        </div>
      </div>
    </div>
    <div
      v-if="!!multisigAccount"
      class="multisig-account-created"
    >
      <div class="message">
        {{ $t('modals.creatingMultisigAccount.vaultCreatedMessage') }}
      </div>
      <Transition
        name="fade-transition"
        mode="out-in"
      >
        <AvatarWithChainName
          :address="multisigAccount.multisigAccountId"
          class="ae-address"
          show-address
          :column-count="9"
        />
      </Transition>
    </div>
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
  MULTISIG_CREATION_STEPS,
} from '../utils';
import { IMultisigAccountBase, IMultisigCreationStep } from '../../types';

import AvatarWithChainName from './AvatarWithChainName.vue';
import ProgressBar from './ProgressBar.vue';
import PlusCircle from '../../icons/plus-circle-fill.svg?vue-component';
import CheckSuccessCircleIcon from '../../icons/check-success-circle.svg?vue-component';
import PendingIcon from '../../icons/animated-pending.svg?vue-component';

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
    progress: { type: String as PropType<IMultisigCreationStep>, default: null },
  },
  setup(props, { root }) {
    const steps: { key: IMultisigCreationStep, text: TranslateResult }[] = [
      {
        key: MULTISIG_CREATION_STEPS.prepared,
        text: root.$t('modals.creatingMultisigAccount.preparingMultisigVault'),
      },
      {
        key: MULTISIG_CREATION_STEPS.deployed,
        text: root.$t('modals.creatingMultisigAccount.deployingSmartContract'),
      },
      {
        key: MULTISIG_CREATION_STEPS.created,
        text: root.$t('modals.creatingMultisigAccount.creatingMultisigVault'),
      },
    ];

    const currentProgressStepIndex = computed(
      () => steps.findIndex(({ key }) => key === props.progress),
    );
    const progressPercentage = computed(
      (): number => (100 / steps.length) * (currentProgressStepIndex.value + 1),
    );

    function isStepCurrent(index: number) {
      return index === currentProgressStepIndex.value + 1;
    }

    function isStepCompleted(index: number) {
      return !!props.multisigAccount || index <= currentProgressStepIndex.value;
    }

    return {
      PlusCircle,
      steps,
      progressPercentage,
      isStepCurrent,
      isStepCompleted,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/variables';
@use '../../styles/typography';
@use '../../styles/mixins';

.multisig-vault-creation-progress {
  $step-icon-size: 24px;

  padding-top: env(safe-area-inset-top);

  .steps-list {
    padding-top: 24px;

    .step-item {
      @extend %face-sans-14-medium;

      display: inline-flex;
      align-items: center;
      gap: 12px;
      padding: 8px 0;
      opacity: 0.5;

      &.completed {
        opacity: 1;
      }

      .step-number,
      .step-pending-icon,
      .step-success-icon {
        width: $step-icon-size;
        height: $step-icon-size;
      }

      .step-number {
        display: flex;
        flex-direction: row;
        justify-content: center;
        align-items: center;
        padding: 2px;
        border: 2px solid rgba(variables.$color-white, 0.15);
        border-radius: 100%;
      }

      .step-success-icon {
        color: variables.$color-success-dark;
        background-color: rgba(variables.$color-success-dark, 0.15);
        border-radius: 100%;
      }
    }
  }

  .multisig-account-created {
    padding-top: 30px;
    text-align: center;

    .message {
      @extend %face-sans-16-regular;

      color: variables.$color-white;
      padding-bottom: 16px;
    }

    .ae-address {
      @extend %face-sans-11-regular;

      align-items: flex-end;
      color: variables.$color-white;
    }
  }
}
</style>
