<template>
  <div class="language-settings">
    <div class="description">
      {{ $t('pages.languageSettings.chooseLanguage') }}
    </div>
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
/* eslint-disable import/no-dynamic-require */
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
    flag(code) {
      return require(`../../../icons/flag_${code}.png`);
    },
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/typography';

.language-settings {
  padding: 16px;

  .description {
    padding-top: 8px;
    text-align: left;
    line-height: 20px;
    color: rgba(variables.$color-white, 0.65);

    @extend %face-sans-14-light;
  }

  .languages {
    padding: 14px 0;

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
