<template>
  <div class="register-name">
    <p class="message">
      {{ msg }}
    </p>
    <BtnMain
      class="btn"
      :to="{ name: 'account-details-names-claim' }"
    >
      {{ $t('pages.names.list.register-name') }}
    </BtnMain>
  </div>
</template>

<script>
import BtnMain from './buttons/BtnMain.vue';

export default {
  components: { BtnMain },
  props: {
    msg: { type: String, required: true },
  },
};
</script>

<style lang="scss" scoped>
@use '../../styles/variables';
@use '../../styles/typography';

.register-name {
  .message {
    @extend %face-sans-15-medium;

    margin: 32px;
    text-align: center;
    color: variables.$color-light-grey;
  }

  .btn {
    margin-inline: auto;
  }
}
</style>
