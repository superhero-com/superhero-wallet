<template>
  <Modal
    class="confirm"
    has-close-button
    from-bottom
    no-padding
    @close="reject"
  >
    <div class="content">
      <div class="icon-wrapper">
        <IconBoxed>
          <IconWrapper
            :icon="ExportIcon"
            icon-size="xl"
            class="icon"
          />
        </IconBoxed>
      </div>
      <h2
        class="text-heading-4 text-center"
        v-text="$t('pages.errors-log-settings.disableDialog.title')"
      />
      <div
        class="subtitle text-center"
        v-text="$t('pages.errors-log-settings.disableDialog.subtitle')"
      />
      <div
        class="msg"
        v-text="$t('pages.errors-log-settings.disableDialog.msg')"
      />
      <div
        class="question"
        v-text="$t('pages.errors-log-settings.disableDialog.question')"
      />
    </div>

    <template #footer>
      <div class="footer">
        <BtnMain
          variant="muted"
          :text="$t('common.cancel')"
          @click="reject"
        />
        <BtnMain
          variant="primary"
          extra-padded
          :text="$t('pages.errors-log-settings.disableDialog.btnText')"
          @click="resolve"
        />
      </div>
    </template>
  </Modal>
</template>

<script lang="ts">
import {
  defineComponent,
  PropType,
} from 'vue';
import type {
  RejectCallback,
  ResolveCallback,
} from '@/types';

import IconBoxed from '@/popup/components/IconBoxed.vue';
import IconWrapper from '@/popup/components/IconWrapper.vue';
import Modal from '@/popup/components/Modal.vue';
import BtnMain from '@/popup/components/buttons/BtnMain.vue';

import ExportIcon from '@/icons/export-address-book.svg?vue-component';

export default defineComponent({
  components: {
    IconWrapper,
    Modal,
    BtnMain,
    IconBoxed,
  },
  props: {
    resolve: {
      type: Function as PropType<ResolveCallback<boolean>>,
      required: true,
    },
    reject: { type: Function as PropType<RejectCallback>, required: true },
  },
  setup() {
    return {
      ExportIcon,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
@use '@/styles/typography';

.confirm {
  text-align: center;

  .content {
    padding: 8px 24px;
  }

  .text-heading-4 {
    margin-bottom: 4px;
  }

  .subtitle {
    @extend %face-sans-16-medium;

    margin-bottom: 20px;
  }

  .msg {
    @extend %face-sans-15-regular;

    color: rgba($color-white, 0.85);
    margin-bottom: 10px;
  }

  .question {
    @extend %face-sans-15-semi-bold;

    color: rgba($color-white, 0.85);
    margin-bottom: 20px;
  }

  .icon-wrapper {
    margin-bottom: 20px;

    .icon {
      background-color: rgba($color-primary, 0.4);
      color: $color-primary;
    }
  }

  .footer {
    display: flex;
    justify-content: center;
    gap: 8px;
    width: 100%;
    padding-bottom: 24px;
    padding-inline: 24px;
  }
}
</style>
