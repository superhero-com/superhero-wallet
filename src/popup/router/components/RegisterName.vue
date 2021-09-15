<template>
  <div class="register-name">
    <p>
      {{ msg }}
    </p>
    <Button :to="{ name: 'name-claim' }">
      {{ $t('pages.names.list.register-name') }}
    </Button>
  </div>
</template>

<script>
import Button from './Button';

export default {
  components: { Button },
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

  .button {
    text-align: center;
  }
}
</style>
