<template>
  <div class="popup">
    <br />
    <ae-list class="settingslist" face="primary">
      <button class="generalsett" @click="GeneralSettings">
        <span class="settings-li">{{ $t('pages.settings.tabGeneral') }}</span>
        <i class="arrowright"></i>
        <p class="tabinfo">{{ $t('pages.settings.tabGeneralsmall') }}</p>
      </button>
      <button class="securitysett" @click="SecuritySettings">
        <span class="settings-li">{{ $t('pages.settings.tabSecurity') }}</span>
        <i class="arrowright"></i>
        <p class="tabinfo">{{ $t('pages.settings.tabSecuritysmall') }}</p>
      </button>
      <button class="aboutsett" @click="AboutSettings">
        <span class="settings-li">{{ $t('pages.settings.tabAbout') }}</span>
        <i class="arrowright"></i>
        <p class="tabinfo">{{ $t('pages.settings.tabAboutsmall') }}</p>
      </button>
    </ae-list>
    <div v-if="loading" class="loading">
      <ae-loader />
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
  data() {
    return {
      loading: false,
    };
  },
  computed: {
    ...mapGetters(['account', 'balance', 'network', 'current', 'transactions', 'subaccounts', 'wallet', 'activeAccountName', 'activeAccount']),
  },
  methods: {
    GeneralSettings() {
      this.$router.push('/generalSettings');
    },
    AdvancedSettings() {
      this.$router.push('/advancedSettings');
    },
    SecuritySettings() {
      this.$router.push('/securitySettings');
    },
    AboutSettings() {
      this.$router.push('/aboutSettings');
    },
    navigateAccount() {
      this.$router.push('/account');
    },
  },
};
</script>

<style lang="scss">
.settingslist {
  padding: 0 !important;
}
.settingslist button {
  transition: 0.4s;
  position: relative;
  padding: 1rem 1.5rem;
  width: 100%;
  display: block;
  font-size: 14px;
  border-bottom: 1px solid #ccc;
}
.settingslist button:hover {
  border-left: 2px solid #ff0d6a;
  background: rgba(226, 226, 226, 0.5);
  .arrowright {
    right: 20px;
  }
}
.settings-li {
  color: #555;
  float: left;
  font-size: 18px;
}
.arrowright {
  transition: 0.4s;
  border: solid #565656;
  border-width: 0 4px 4px 0;
  display: inline-block;
  padding: 10px;
  transform: rotate(-45deg);
  -webkit-transform: rotate(-45deg);
  position: absolute;
  right: 1rem;
  top: 50%;
  margin-top: -15px;
  border-radius: 4px;
}
.tabinfo {
  text-align: left;
  color: #ccc;
  font-weight: normal;
  margin: 5px 0;
  float: left;
  width: 90%;
  word-break: break-word;
}
.backbtn {
  width: 50%;
  margin-top: 5px;
}
</style>
