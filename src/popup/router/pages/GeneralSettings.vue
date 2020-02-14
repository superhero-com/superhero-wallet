<template>
  <div class="popup">
    <div class="maindiv_input-group-addon">
      <h4>{{ $t('pages.generalSettings.switchLanguage') }}</h4>
      <hr />
      <small class="sett_info">{{ $t('pages.generalSettings.currentLanguage') }}: {{ this.current.language ? this.current.language : 'en' }}</small>
      <div class="language-settings">
        <li id="languages" class="have-subDropdown" :class="dropdown.languages ? 'show' : ''">
          <ae-button class="switchlanguageBtn color-grey" extend @click="toggleDropdown($event, '.have-subDropdown')">
            <ae-icon name="globe" />
            {{ $t('pages.generalSettings.switchLanguage') }}
            <ae-icon name="left-more" />
          </ae-button>

          <!-- Language sub dropdown -->
          <ul class="sub-dropdown">
            <li style="width: 30%;text-align: center;margin: auto;" v-for="(value, name) in locales" v-bind:key="name">
              <ae-button v-on:click="switchLanguage(name)" class="" :class="current.language == name ? 'current' : ''">
                <img :src="'../icons/flag_' + name + '.png'" />
                <span style="margin-left: auto;">{{ languageFullName(name) }}</span>
              </ae-button>
            </li>
          </ul>
        </li>
      </div>
    </div>
    <popup :popupSecondBtnClick="popup.secondBtnClick"></popup>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import { langs, fetchAndSetLocale } from '../../utils/i18nHelper';

export default {
  data() {
    return {
      locales: langs,
      loading: false,
      dropdown: {
        languages: false,
      },
    };
  },
  computed: {
    ...mapGetters(['current', 'popup', 'names', 'sdk']),
  },
  created() {
    if (this.current.language == undefined) {
      this.current.language = 'en';
    }
  },
  methods: {
    toggleDropdown(event, parentClass) {
      if (typeof parentClass === 'undefined') {
        parentClass = '.language-settings';
      }
      const dropdownParent = event.target.closest(parentClass);
      this.dropdown[dropdownParent.id] = !this.dropdown[dropdownParent.id];
    },
    async switchLanguage(languageChoose) {
      fetchAndSetLocale(languageChoose);
      browser.storage.local.set({ language: languageChoose }).then(() => {
        this.current.language = languageChoose;
        this.dropdown.languages = false;
        this.$store.state.current.language = languageChoose;
      });
    },
    navigateToSettings() {
      this.$router.push('/settings');
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
  },
};
</script>

<style lang="scss">
.color-grey {
  background-color: #505058 !important;
  border-radius: 4px;
}
.backbtn {
  width: 50%;
  margin-top: 5px;
}
.regbtn {
  background: #e2e2e2;
  color: #ffffff;
  float: right;
  width: 19%;
  border-radius: 0 !important;
}
.maindiv_input-group-addon {
  text-align: center;
}
.maindiv_input-group-addon h4 {
  text-align: left;
  margin: 0 !important;
}
.sett_info {
  color: #9c9c9c;
  text-align: left;
  width: 100%;
  margin: 0 0px 10px;
  display: block;
  word-break: break-word;
}

.language-settings li {
  list-style-type: none;
  color: #717c87;
  margin: 0;
}
.language-settings li .ae-icon {
  font-size: 1.2rem;
  margin-right: 10px;
}
.language-settings button {
  font-size: 14px;
  width: 100%;
  color: #000;
  text-align: left;
  margin: 0;
  padding: 0 1rem;
  white-space: nowrap;
  justify-content: unset;
}
.language-settings ul {
  min-width: 250px;
  box-shadow: none;
  visibility: hidden;
  max-height: 0;
  padding: 0;
  overflow: hidden;
  transition: all 0.3s ease-in-out;
  right: 0;
}
.language-settings .have-subDropdown.show ul.sub-dropdown {
  visibility: visible;
  max-height: 210px;
}
.language-settings .have-subDropdown.show .ae-button .ae-icon-left-more {
  transform: rotate(90deg);
}
.notround {
  border-radius: 0 !important;
}
</style>
