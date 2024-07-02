<template>
  <div class="register-name">
    <p class="message">
      {{ msg }}
    </p>
    <BtnMain
      class="btn"
      :text="$t('pages.names.list.register-name')"
      :to="{ name: 'account-details-names-claim' }"
    />
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
@use '@/styles/variables' as *;
@use '@/styles/typography';

.register-name {
  .message {
    @extend %face-sans-15-medium;

    margin: 32px;
    text-align: center;
    color: $color-grey-light;
  }

  .btn {
    margin-inline: auto;
  }
}
</style>
