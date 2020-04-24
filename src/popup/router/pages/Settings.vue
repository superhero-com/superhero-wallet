<template>
  <div class="popup">
    <ul class="settings-list">
      <router-link to="/generalSettings">
        <span class="settings-li">{{ $t('pages.settings.tabGeneral') }}</span>
        <i class="arrow-right"></i>
        <p class="tab-info">{{ $t('pages.settings.tabGeneralsmall') }}</p>
      </router-link>
      <router-link to="/securitySettings">
        <span class="settings-li">{{ $t('pages.settings.tabSecurity') }}</span>
        <i class="arrow-right"></i>
        <p class="tab-info">{{ $t('pages.settings.tabSecuritysmall') }}</p>
      </router-link>
      <router-link to="/networks">
        <span class="settings-li">{{ $t('pages.appVUE.networks') }}</span>
        <i class="arrow-right"></i>
        <p class="tab-info">{{ $t('pages.settings.tabNetworksSmall') }}</p>
      </router-link>
      <button @click="removeAccount">
        <span class="settings-li">{{ $t('pages.settings.tabRemoveAccount') }}</span>
        <i class="arrow-right"></i>
        <p class="tab-info">{{ $t('pages.settings.tabRemoveAccountSmall') }}</p>
      </button>
    </ul>
  </div>
</template>

<script>
import removeAccountMixin from '../../../mixins/removeAccount';

export default {
  mixins: [removeAccountMixin],
};
</script>

<style lang="scss">
.settings-list {
  padding: 0 !important;
  background: #21222a !important;
  box-shadow: 0 0 8px rgba(0, 33, 87, 0.15);
  border-radius: 4px;
  margin-top: 30px;

  a,
  button {
    text-decoration: none;
    transition: 0.4s;
    position: relative;
    padding: 1rem 1.5rem;
    width: 100%;
    display: block;
    font-size: 14px;
    border-bottom: 1px solid #ccc;
    text-align: left;

    &:last-child {
      border-bottom: 0;
    }

    &:hover {
      border-left: 2px solid #2a9cff;
      background: rgba(226, 226, 226, 0.5);
      .arrow-right {
        right: 20px;
      }
    }
  }
}

.settings-li {
  color: white;
  font-size: 18px;
}
.arrow-right {
  transition: 0.4s;
  border: solid white;
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
.tab-info {
  color: #ccc;
  font-weight: normal;
  margin: 5px 0;
  width: 90%;
  word-break: break-word;
}
</style>
