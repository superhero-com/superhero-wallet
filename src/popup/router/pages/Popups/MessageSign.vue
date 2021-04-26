<template>
  <div
    class="message-sign popup-aex2"
    data-cy="popup-aex2"
  >
    <h2 class="identity">
      <div class="flex flex-align-center flex-justify-content-center">
        <img
          v-if="!imageError"
          :src="faviconUrl"
          @error="imageError = true"
        >
        <div>
          <span
            class="secondary-text"
            data-cy="host"
          >
            {{ app.host }} {{ app.name ? `(${app.name})` : '' }}
          </span>
          {{ $t('pages.popupMessageSign.heading') }}
        </div>
      </div>
    </h2>
    <ul>
      <ae-list-item
        fill="neutral"
        class="permission-set"
      >
        <h4>{{ $t('pages.popupMessageSign.message') }}</h4>
        <p
          v-if="message"
          data-cy="message"
        >
          {{ message }}
        </p>
      </ae-list-item>
    </ul>
    <div class="button-fixed">
      <Button
        half
        dark
        data-cy="deny"
        @click="cancel()"
      >
        {{ $t('pages.signTransaction.reject') }}
      </Button>
      <Button
        half
        data-cy="accept"
        @click="resolve()"
      >
        {{ $t('pages.signTransaction.confirm') }}
      </Button>
    </div>
  </div>
</template>

<script>
import Button from '../../components/Button';
import mixin from './mixin';

export default {
  components: { Button },
  mixins: [mixin],
  props: {
    message: { type: String, required: true },
  },
  data: () => ({ imageError: false }),
};
</script>

<style lang="scss" scoped>
@use '../../../../styles/variables';

.message-sign .identity img {
  width: 32px;
}
</style>
<style lang="scss" src="./AexPopup.scss" scoped />
