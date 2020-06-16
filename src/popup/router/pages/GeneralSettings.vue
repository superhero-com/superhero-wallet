<template>
  <div class="popup">
    <h4>{{ $t('pages.generalSettings.switchLanguage') }}</h4>
    <hr />
    <small>
      <!--eslint-disable-next-line vue-i18n/no-raw-text-->
      {{ $t('pages.generalSettings.currentLanguage') }}:
      {{ current.language || 'en' }}
    </small>
    <div class="language-settings">
      <div class="dropdown" :class="{ show: dropdown }">
        <Button extend @click="dropdown = !dropdown">
          <ae-icon name="globe" />
          {{ $t('pages.generalSettings.switchLanguage') }}
          <ae-icon name="left-more" />
        </Button>

        <ul class="sub-dropdown">
          <li v-for="(value, name) in locales" :key="name">
            <div @click="switchLanguage(name)" :class="{ current: current.language == name }">
              <img :src="flag(name)" />
              <span>{{ languageFullName(name) }}</span>
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
import { mapState } from 'vuex';
import { langs, fetchAndSetLocale } from '../../utils/i18nHelper';
import Button from '../components/Button';

export default {
  components: { Button },
  data() {
    return {
      locales: langs,
      dropdown: false,
    };
  },
  computed: mapState(['current']),
  methods: {
    async switchLanguage(languageChoose) {
      fetchAndSetLocale(languageChoose);
      this.dropdown = false;
      this.$store.state.current.language = languageChoose;
    },
    languageFullName(name) {
      switch (name) {
        case 'en':
          return 'English';
        case 'es':
          return 'Spanish';
        case 'de':
          return 'German';
        case 'fr':
          return 'French';
        case 'cn':
          return '中文';
        case 'it':
          return 'Italian';
        default:
          return 'English';
      }
    },
    flag(lang) {
      return require(`../../../icons/flag_${lang}.png`);
    },
  },
};
</script>

<style lang="scss" scoped>
@import '../../../common/variables';

h4 {
  text-align: left;
  margin: 0 !important;
}

small {
  color: #9c9c9c;
  text-align: left;
  width: 100%;
  margin: 0 0 10px;
  display: block;
  word-break: break-word;
}

.language-settings {
  li {
    list-style-type: none;
    color: #717c87;
    margin: 0;
  }

  .ae-icon {
    font-size: 1.2rem;
    margin-right: 10px;
  }

  button {
    font-size: 14px;
    width: 100%;
    color: $button-text-color;
    margin: 0;
    padding: 0 1rem;
    white-space: nowrap;
    background-color: #505058 !important;
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
      color: #fff;
      cursor: pointer;

      div {
        width: 100%;
        display: inline-flex;
        justify-content: center;
        align-items: center;
      }

      .current {
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
</style>
