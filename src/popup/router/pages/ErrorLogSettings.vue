<template>
  <div class="errors-log-settings">
    <div class="description">
      {{ $t('pages.errors-log-settings.description') }}
    </div>
    <div>
      <SwitchButton
        :label="$t('pages.titles.save-errors-log')"
        :value="saveErrorLog"
        @input="setSaveErrorLog"
      />
    </div>
  </div>
</template>

<script>
import { mapState, mapMutations } from 'vuex';
import SwitchButton from '../components/SwitchButton.vue';

export default {
  components: { SwitchButton },
  computed: mapState(['saveErrorLog']),
  methods: mapMutations(['setSaveErrorLog']),
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/typography';

.errors-log-settings {
  padding: 16px;

  .description {
    color: rgba(variables.$color-white, 0.75);
    padding: 6px 0 24px;
    line-height: 20px;
    text-align: left;

    @extend %face-sans-14-light;
  }
}
</style>
