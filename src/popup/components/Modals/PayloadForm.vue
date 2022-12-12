<template>
  <Modal
    from-bottom
    no-padding
    has-close-button
    class="payload-form"
    @close="resolve"
  >
    <div class="header">
      {{ $t('modals.payload-form.title') }}
    </div>
    <div class="desc">
      {{ $t('modals.payload-form.desc') }}
    </div>
    <div class="wrapper">
      <div class="label-wrapper">
        <label class="label">
          {{ $t('modals.payload-form.label') }}
        </label>
        <span class="counter">
          {{ availableCharacter }}
        </span>
      </div>
      <FormTextarea
        v-model="value"
        :message="message"
      />
    </div>
    <template #footer>
      <BtnMain
        class="btn-cancel"
        variant="secondary"
        @click="resolve()"
      >
        {{ $t('modals.payload-form.cancel-btn') }}
      </BtnMain>
      <BtnMain
        @click="onDone()"
      >
        {{ $t('modals.payload-form.done-btn') }}
      </BtnMain>
    </template>
  </Modal>
</template>

<script>
import { computed, ref, defineComponent } from '@vue/composition-api';
import Modal from '../Modal.vue';
import FormTextarea from '../FormTextarea.vue';
import BtnMain from '../buttons/BtnMain.vue';

const MAX_PAYLOAD_LENGTH = 280;

export default defineComponent({
  name: 'PayloadForm',
  components: { BtnMain, FormTextarea, Modal },
  props: {
    resolve: { type: Function, required: true },
    reject: { type: Function, required: true },
    onChange: { type: Function, required: true },
    payload: { type: String, required: true },
  },
  setup(props, { root }) {
    const value = ref(props.payload);

    const onDone = () => {
      props.onChange(value.value);
      props.resolve();
    };

    const availableCharacter = computed(() => MAX_PAYLOAD_LENGTH - value.value.length);

    const error = computed(() => availableCharacter.value <= 0);

    const message = computed(() => {
      if (error.value) {
        return {
          status: 'error',
          text: root.$t('modals.payload-form.error-message'),
        };
      }

      return undefined;
    });

    return {
      value,
      onDone,
      availableCharacter,
      message,
    };
  },
});
</script>

<style scoped lang="scss">
@use '../../../styles/typography';
@use '../../../styles/variables';

.payload-form {

  .wrapper {
    padding: 0 24px;
  }

  .header {
    @extend %face-sans-18-bold;

    text-align: center;
    padding: 8px 16px 4px;
  }

  .desc {
    @extend %face-sans-16-medium;

    text-align: center;
    padding: 0 16px;
    opacity: 0.75;
  }

  .label-wrapper {
    display: flex;
    justify-content: space-between;
    margin-top: 16px;
  }

  .label {
    @extend %face-sans-15-medium;

    opacity: 0.5;
  }

  .counter {
    @extend  %face-sans-15-regular;

    opacity: 0.75;
  }

  .error-message {
    @extend %face-sans-14-regular;
    color: variables.$color-danger;
  }

  .input-field::v-deep .message {
    @extend %face-sans-14-regular;

    margin-top: 4px;
    min-height: 24px;
  }

  .btn-cancel {
    max-width: 114px;
  }

  .error {
    .counter {
      color: variables.$color-danger;
      opacity: 1;
    }
  }
}
</style>
