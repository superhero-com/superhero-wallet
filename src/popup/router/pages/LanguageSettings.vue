<template>
  <div class="language-settings">
    <h4>{{ $t('pages.languageSettings.switchLanguage') }}</h4>
    <hr>
    <small>
      {{ $t('pages.languageSettings.currentLanguage') }}:
      {{ active.name || 'en' }}
    </small>
    <div class="settings">
      <div
        class="dropdown"
        :class="{ show: dropdown }"
      >
        <Button
          extend
          @click="dropdown = !dropdown"
        >
          <ae-icon name="globe" />
          {{ $t('pages.languageSettings.switchLanguage') }}
          <ae-icon name="left-more" />
        </Button>

        <ul class="sub-dropdown">
          <li
            v-for="{ code, name } in list"
            :key="code"
          >
            <div
              :class="{ active: active == name }"
              @click="switchLanguage(code)"
            >
              <img :src="flag(code)">
              <span>{{ name }}</span>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
/* eslint-disable import/no-dynamic-require */
/* eslint-disable global-require */
import { mapGetters } from 'vuex';
import Button from '../components/Button';

export default {
  components: { Button },
  data() {
    return {
      dropdown: false,
    };
  },
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
@import '../../../styles/variables';

.language-settings {
  h4 {
    text-align: left;
    margin: 0;
  }

  small {
    color: $color-light-grey;
    text-align: left;
    width: 100%;
    margin: 0 0 10px;
    display: block;
    word-break: break-word;
  }

  .settings {
    li {
      list-style-type: none;
      margin: 0;
    }

    .ae-icon {
      font-size: 1.2rem;
      margin-right: 10px;
    }

    button {
      font-size: 14px;
      width: 100%;
      color: $color-white;
      margin: 0;
      padding: 0 1rem;
      white-space: nowrap;
      background-color: $color-bg-2;
      border-radius: 4px;
      text-align: center;
      display: inline-flex;
      justify-content: center;
      align-items: center;
    }

    ul {
      min-width: 250px;
      box-shadow: none;
      visibility: hidden;
      max-height: 0;
      padding: 0;
      overflow: hidden;
      transition: all 0.3s ease-in-out;
      right: 0;

      li {
        width: 30%;
        text-align: center;
        margin: auto;
        color: $color-white;
        cursor: pointer;

        div {
          width: 100%;
          display: inline-flex;
          justify-content: center;
          align-items: center;
        }

        .active {
          text-decoration: underline;
        }

        span {
          margin-left: auto;
        }
      }
    }

    .dropdown.show {
      .sub-dropdown {
        visibility: visible;
        max-height: 210px;
      }

      .ae-icon-left-more {
        transform: rotate(90deg);
        -webkit-transform: rotate(90deg);
        -ms-transform: rotate(90deg);
      }
    }
  }
}
</style>
