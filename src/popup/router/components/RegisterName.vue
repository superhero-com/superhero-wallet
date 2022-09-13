<template>
  <div class="register-name">
    <p>
      {{ msg }}
    </p>
    <BtnMain
      :to="{ name: 'account-details-names-claim' }"
      new-ui
    >
      {{ $t('pages.names.list.register-name') }}
    </BtnMain>
  </div>
</template>

<script>
import BtnMain from './buttons/BtnMain.vue';

export default {
  components: { BtnMain },
  props: { msg: { type: String, required: true } },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/typography';

.register-name {
  p {
    text-align: center;
    margin: 32px;
    color: variables.$color-light-grey;

    @extend %face-sans-15-medium;
  }
}
</style>
