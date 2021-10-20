<template>
  <div class="buy">
    <iframe :src="SIMPLEX_URL" />
  </div>
</template>

<script>
import { SIMPLEX_URL } from '../../utils/constants';

export default {
  data: () => ({
    SIMPLEX_URL,
  }),
};
</script>

<style lang="scss" scoped>
.buy {
  display: flex;
  height: 100%;

  iframe {
    flex-grow: 1;
    border: none;
  }
}
</style>
