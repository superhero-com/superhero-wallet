<template>
  <div class="errors-log-settings">
    <p class="text-description">
      {{ $t('pages.errors-log-settings.description') }}
    </p>

    <div class="options">
      <SwitchButton
        :label="$t('pages.titles.saveErrorsLog')"
        :model-value="saveErrorLog"
        @update:modelValue="setSaveErrorLog"
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
@use '../../styles/variables';
@use '../../styles/typography';

.errors-log-settings {
  padding: var(--screen-padding-x);

  .options {
    margin-top: 20px;
  }
}
</style>
