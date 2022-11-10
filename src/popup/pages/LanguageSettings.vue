<template>
  <div class="language-settings">
    <p class="text-description">
      {{ $t('pages.languageSettings.chooseLanguage') }}
    </p>

    <div class="languages">
      <RadioButton
        v-for="{ code, name } in list"
        :key="code"
        :value="active && active.name == name"
        :disabled="false"
        :class="['language', {active: active && active.name == name}]"
        @input="switchLanguage(code)"
      >
        <div
          class="row"
          @click="switchLanguage(code)"
        >
          <div>
            {{ name }}
            <span>({{ code }})</span>
          </div>
        </div>
      </RadioButton>
    </div>
  </div>
</template>

<script>
/* eslint-disable global-require */
import { mapGetters } from 'vuex';
import RadioButton from '../components/RadioButton.vue';

export default {
  components: { RadioButton },
  computed: mapGetters('languages', ['list', 'active']),
  methods: {
    async switchLanguage(code) {
      this.dropdown = false;
      this.$store.commit('languages/setActiveCode', code);
    },
  },
};
</script>

<style lang="scss" scoped>
@use '../../styles/variables';
@use '../../styles/typography';

.language-settings {
  padding: var(--screen-padding-x);

  .languages {
    margin-top: 16px;

    .language {
      padding: 6px 0;
      font-weight: 500;
      font-size: 14px;
      line-height: 24px;
      opacity: 0.5;

      &.active {
        opacity: 1;
      }

      span {
        text-transform: uppercase;
      }

      .row {
        width: 100%;
        display: inline-flex;
        justify-content: space-between;
        align-items: center;
      }
    }
  }
}
</style>
