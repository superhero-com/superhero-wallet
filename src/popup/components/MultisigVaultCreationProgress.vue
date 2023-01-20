<template>
  <div class="multisig-vault-creation-progress">
    <h2 class="title">
      {{ $t('modals.creatingMultisigAccount.title') }}
    </h2>
    <ProgressBar :progress="creatingVaultProgress" />
    <div class="steps-list">
      <div
        v-for="step in steps"
        :key="step.id"
        class="step-item"
        :class="{
          active: currentProgressStepId >= step.id,
          completed: currentProgressStepId > step.id,
        }"
      >
        <CheckSuccessCircleIcon
          v-if="currentProgressStepId > step.id || !!multisigAccount"
          class="step-success-icon"
        />
        <div
          v-else
          class="step-item-id"
        >
          {{ step.id }}
        </div>

        <div class="step-item-name">
          {{ getStepText(step) }}
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
      <transition
        name="fade-transition"
        mode="out-in"
      >
        <AvatarWithChainName
          :address="multisigAccount.multisigAccountId"
          class="ae-address"
          show-address
          :column-count="9"
        />
      </transition>
    </div>
  </div>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  PropType,
} from '@vue/composition-api';
import {
  MULTISIG_CREATION_STEPS,
} from '../utils';
import { IMultisigAccountBase, IMultisigCreationStep } from '../../types';

import AvatarWithChainName from './AvatarWithChainName.vue';
import ProgressBar from './ProgressBar.vue';
import PlusCircle from '../../icons/plus-circle-fill.svg?vue-component';
import CheckSuccessCircleIcon from '../../icons/check-success-circle.svg?vue-component';

export default defineComponent({
  name: 'MultisigVaultCreationProgress',
  components: {
    ProgressBar,
    AvatarWithChainName,
    CheckSuccessCircleIcon,
  },
  props: {
    multisigAccount: { type: Object as PropType<IMultisigAccountBase>, default: null },
    progress: { type: String as PropType<IMultisigCreationStep>, required: true },
  },
  setup(props, { root }) {
    const steps = [
      {
        id: 1,
        key: MULTISIG_CREATION_STEPS.preparing,
        text: {
          pending: root.$t('modals.creatingMultisigAccount.step1.pending'),
          inProgress: root.$t('modals.creatingMultisigAccount.step1.inProgress'),
          done: root.$t('modals.creatingMultisigAccount.step1.done'),
        },
      },
      {
        id: 2,
        key: MULTISIG_CREATION_STEPS.compiled,
        text: {
          pending: root.$t('modals.creatingMultisigAccount.step2.pending'),
          inProgress: root.$t('modals.creatingMultisigAccount.step2.inProgress'),
          done: root.$t('modals.creatingMultisigAccount.step2.done'),
        },
      },
      {
        id: 3,
        key: MULTISIG_CREATION_STEPS.deployed,
        text: {
          pending: root.$t('modals.creatingMultisigAccount.step3.pending'),
          inProgress: root.$t('modals.creatingMultisigAccount.step3.inProgress'),
          done: root.$t('modals.creatingMultisigAccount.step3.done'),
        },
      },
      {
        id: 4,
        key: MULTISIG_CREATION_STEPS.created,
        text: {
          pending: root.$t('modals.creatingMultisigAccount.step4.pending'),
          inProgress: root.$t('modals.creatingMultisigAccount.step4.inProgress'),
          done: root.$t('modals.creatingMultisigAccount.step4.done'),
        },
      },
    ];

    const currentProgressStepId = computed<number>(
      () => steps.find((step) => step.key === props.progress)?.id ?? 1,
    );
    const stepProgress = 100 / steps.length;
    const creatingVaultProgress = computed<number>(() => (
      stepProgress * currentProgressStepId.value
    ));

    function getStepText(step: any) {
      if (currentProgressStepId.value === step) {
        return step.text.inProgress;
      }
      if (currentProgressStepId.value > step || !!props.multisigAccount) {
        return step.text.done;
      }

      return step.text.pending;
    }

    return {
      steps,
      getStepText,
      currentProgressStepId,
      creatingVaultProgress,
      PlusCircle,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/variables';
@use '../../styles/typography';
@use '../../styles/mixins';

.multisig-vault-creation-progress {
  padding-top: env(safe-area-inset-top);

  .title {
    @extend %face-sans-18-medium;

    margin-bottom: 20px;
    line-height: 24px;
    text-align: center;
    color: variables.$color-white;
  }

  .steps-list {
    padding-top: 24px;

    .step-item {
      @extend %face-sans-14-medium;

      display: inline-flex;
      align-items: center;
      padding: 8px 0;
      opacity: 0.5;

      &-id {
        display: flex;
        flex-direction: row;
        justify-content: center;
        align-items: center;
        padding: 2px;
        width: 24px;
        height: 24px;
        border: 2px solid rgba(variables.$color-white, 0.15);
        border-radius: 28px;
        margin-right: 12px;
      }

      &.active {
        opacity: 1;
      }

      .step-success-icon {
        width: 24px;
        height: 24px;
        color: variables.$color-success-dark;
        background-color: rgba(variables.$color-success-dark, 0.15);
        margin-right: 12px;
        border-radius: 12px;
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
