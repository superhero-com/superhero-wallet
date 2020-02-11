<template>
  <div v-if="open" class="menu-holder">
    <ul class="dropdown-holder">
      <li class="menu-close">
        <Close class="icon" @click="closeMenu" />
      </li>
      <li class="account-icon-holder">
        <div class="flex flex-align-center flex-justify-between">
          <ae-identicon class="account-icon" :address="account.publicKey" size="base" />
          <div class="ml-8 mr-auto">
            <div class="f-14">Main Account</div>
            <div class="f-12" v-if="activeAccountName.includes('.chain')">{{ activeAccountName }}</div>
          </div>
        </div>
      </li>
      <li>
        <ae-button @click="topUp">
          {{ $t('pages.appVUE.topUp') }}
        </ae-button>
      </li>
      <li>
        <ae-button @click="withdraw">
          {{ $t('pages.appVUE.withdraw') }}
        </ae-button>
      </li>
      <li>
        <ae-button @click="transactions">
          {{ $t('pages.appVUE.activity') }}
        </ae-button>
      </li>
      <li id="settings" class="have-subDropdown" :class="dropdown.settings ? 'show' : ''">
        <ae-button class="flex flex-justify-between" @click="$emit('toggleMenu', $event, '.have-subDropdown')">
          <span>{{ $t('pages.appVUE.settings') }}</span>
          <ArrowDown class="arrow-down arrow" v-if="dropdown.settings" />
          <ArrowRight class="arrow-right arrow" v-else />
        </ae-button>
        <ul class="sub-dropdown">
          <li>
            <ae-button @click="general">
              {{ $t('pages.appVUE.general') }}
            </ae-button>
          </li>
          <li>
            <ae-button @click="security">
              {{ $t('pages.appVUE.security') }}
            </ae-button>
          </li>
          <li>
            <ae-button @click="seedPhrase">
              {{ $t('pages.appVUE.seedPhrase') }}
            </ae-button>
          </li>
          <li>
            <ae-button @click="language">
              {{ $t('pages.appVUE.language') }}
            </ae-button>
          </li>
        </ul>
      </li>
      <li>
        <ae-button @click="advanced">
          {{ $t('pages.appVUE.advanced') }}
        </ae-button>
      </li>
      <!-- <li>
                    <ae-button >
                    <ae-icon name="settings" />
                    {{ $t('pages.appVUE.advanced') }}
                    </ae-button>
                </li> -->
      <li>
        <ae-button @click="about">
          {{ $t('pages.appVUE.help') }}
        </ae-button>
      </li>
    </ul>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import Close from '../../../icons/close.svg';
import ArrowRight from '../../../icons/arrow-right.svg';
import ArrowDown from '../../../icons/arrow-down-white.svg';

export default {
  props: {
    open: Boolean,
    dropdown: Object,
  },
  components: {
    Close,
    ArrowRight,
    ArrowDown,
  },
  computed: {
    ...mapGetters(['account', 'activeAccountName']),
  },
  methods: {
    closeMenu() {
      this.$emit('closeMenu');
    },
    profile() {
      this.$emit('closeMenu');
      this.$router.push('/account');
    },
    settings() {
      this.$emit('closeMenu');
      this.$router.push('/settings');
    },
    about() {
      this.$emit('closeMenu');
      this.$router.push('/aboutSettings');
    },
    transactions() {
      this.$emit('closeMenu');
      this.$router.push('/transactions');
    },
    topUp() {
      this.$emit('closeMenu');
      this.$router.push('/receive');
    },
    withdraw() {
      this.$emit('closeMenu');
      this.$router.push('/send');
    },
    general() {},
    security() {},
    seedPhrase() {
      this.$emit('closeMenu');
      this.$router.push('/securitySettings');
    },
    language() {
      this.$emit('closeMenu');
      this.$router.push('/generalSettings');
    },
    advanced() {},
  },
};
</script>

<style lang="scss">
@import '../../../common/variables';
.menu-close {
  padding: 10px;
  text-align: right;
  border: none !important;
  .icon {
    color: $white-color;
    font-weight: normal;
    cursor: pointer;
  }
}
.account-icon {
  width: 38px !important;
  height: 38px !important;
  border: 0.125rem solid transparent;
  -webkit-box-shadow: 0 0 0 2px $secondary-color;
  box-shadow: 0 0 0 2px $secondary-color;
}
.account-icon-holder {
  padding: 0.5rem 1rem;
  padding-bottom: 20px;
}
.dropdown {
  display: inline-block;
  position: relative;
  vertical-align: top;
}
.dropdown[direction='left'] ul {
  left: 0;
}
.dropdown[direction='right'] ul {
  right: 0;
}
.dropdown[direction='center'] ul {
  width: 200px;
  left: 50%;
  margin-left: -100px;
}
.dropdown div > ul {
  min-width: 120px;
  position: fixed;
  top: 0;
  right: 0;
  padding: 0;
  background-color: #20202a;
  z-index: 12;
  height: 100%;
  //   min-height: 100%;
  min-height: 1500px;
}
.dropdown ul {
  transition: all 0.2s;
  margin: 0;
  padding: 5px 0;
  overflow: hidden;
  border-radius: 4px;
  box-shadow: 0 0 16px rgba(0, 33, 87, 0.15);
  list-style: none;
}
.dropdown ul.sub-dropdown {
  box-shadow: none;
  visibility: hidden;
  max-height: 0;
  padding: 0;
  overflow: hidden;
  transition: all 0.3s ease-in-out;
}
.dropdown .have-subDropdown.show ul.sub-dropdown {
  visibility: visible;
  max-height: 300px;
  overflow-y: scroll;
}
.dropdown ul.sub-dropdown .ae-button {
  padding: 6px 1rem;
  padding-left: 25px;
}
.dropdown ul li .ae-button {
  font-size: 15px;
  width: 100%;
  color: $accent-color;
  text-align: left;
  margin: 0;
  padding: 8px 1rem;
  white-space: nowrap;
  justify-content: unset;
  border-radius: 0 !important;
  height: auto;
  display: flex;
  justify-content: space-between;
}
.dropdown ul li .ae-button span {
  color: $accent-color;
}
.dropdown ul li .ae-button .arrow {
  margin-top: 3px;
  transition: all 0.3s;
  color: #fff;
}
.dropdown li {
  color: #717c87;
  margin: 0;
  border-bottom: 1px solid #16161d;
}
.dropdown li > .ae-button:hover,
.sub-dropdown li:not(.backBtn) > .ae-button:hover,
#network li:hover {
  background-color: $accent-color;
  color: $white-color;
}
.dropdown li > .ae-button:hover span {
  color: $white-color;
}
.dropdown li > .ae-button {
  width: 100%;
}
.dropdown > .ae-button {
  text-align: center;
}
.dropdown > .ae-button,
.dropdown .ae-dropdown-button {
  color: #717c87;
  vertical-align: top;
  height: 50px;
  width: 50px;
  display: inline-block !important;
}
.dropdown .dropdown-button-icon {
  font-size: 2.5rem;
  height: 100%;
}
.dropdown .dropdown-button-name {
  display: block;
  margin: 0 auto;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.dropdown > button:hover,
.dropdown > .ae-dropdown-button:hover {
  color: #fff;
}
.slide-fade-enter-active {
  transition: all 0.3s ease;
}
.slide-fade-leave-active {
  transition: all 0.2s ease;
}
.slide-fade-enter {
  transform: translateY(-50px);
}
.slide-fade-leave-to {
  transform: translateY(-50px);
  opacity: 0;
}

.slide-enter-active {
  transition: all 0.3s ease;
  min-height: 1500px;
  z-index: 12;
  position: fixed;
  right: 0;
  top: 0;
}
.slide-leave-active {
  transition: all 0.2s ease;
  min-height: 1500px;
  z-index: 12;
  position: fixed;
  right: 0;
}
.slide-enter {
  transform: translateX(100%);
  height: 100%;
  min-height: 1500px;
  z-index: 12;
  position: fixed;
  right: 0;
  top: 0;
}
.slide-leave-to {
  transform: translateX(100%);
  opacity: 0;
  height: 100%;
  min-height: 1500px;
  z-index: 12;
  position: fixed;
  right: 0;
}

#account .ae-dropdown-button .dropdown-button-name {
  max-width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.acc-dropdown {
  height: 38px;
  padding: 0;
  margin-top: 6px;
  margin-bottom: 6px;
}
#account.dropdown ul li .ae-button > * {
  display: inline-block;
  vertical-align: middle;
}
header .have-subDropdown ul {
  background: $submenu-bg;
  border-radius: 0 !important;
}
header .have-subDropdown.show > button {
  background: $accent-color;
  color: $white-color !important;
}
header .have-subDropdown.show > button span {
  color: $white-color !important;
}
.dropdown ul.sub-dropdown li {
  color: $accent-color;
}
</style>
