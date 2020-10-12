<template>
  <div class="platforms">
    <div class="text">
      <slot />
    </div>
    <div class="div-icons">
      <div class="extension">
        {{ $t('pages.index.platforms.browser-extension') }}
        <div>
          <a
            @click="
              openUrl('https://addons.mozilla.org/en-US/firefox/addon/superhero-wallet/', true)
            "
          >
            <img
              :class="{ disabled: !isFirefox() || IS_MOBILE_DEVICE }"
              src="../../../icons/platforms/firefox.svg"
              alt="Firefox"
            />
          </a>
          <a
            @click="
              openUrl(
                'https://chrome.google.com/webstore/detail/superhero/mnhmmkepfddpifjkamaligfeemcbhdne',
                true,
              )
            "
          >
            <img
              :class="{ disabled: isFirefox() || IS_MOBILE_DEVICE }"
              src="../../../icons/platforms/chrome.svg"
              alt="Chrome"
            />
          </a>
        </div>
      </div>
      <div class="mobile-app">
        {{ $t('pages.index.platforms.mobile-app') }}
        <div>
          <a @click="openUrl('https://testflight.apple.com/join/3o5r4dQQ', true)">
            <img
              :class="{ disabled: !IS_IOS || !IS_MOBILE_DEVICE }"
              src="../../../icons/platforms/app-store.svg"
              alt="App Store"
            />
          </a>
          <a
            @click="
              openUrl('https://play.google.com/store/apps/details?id=com.superhero.cordova', true)
            "
          >
            <img
              :class="{ disabled: IS_IOS || !IS_MOBILE_DEVICE }"
              src="../../../icons/platforms/google-play.svg"
              alt="Google Play"
            />
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { detect } from 'detect-browser';
import openUrl from '../../utils/openUrl';

export default {
  data: () => ({
    IS_IOS: /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream,
    IS_MOBILE_DEVICE: navigator.userAgent.includes('Mobi'),
    openUrl,
  }),
  methods: {
    isFirefox() {
      return detect().name === 'firefox';
    },
  },
};
</script>

<style lang="scss" scoped>
@import '../../../common/variables';

.platforms {
  background-color: #21222c;
  padding: 0 10px;
  word-break: break-word;

  .text,
  .div-icons {
    padding: 10px;
  }

  .div-icons {
    border-top: 2px solid $nav-bg-color;
    display: flex;
    text-align: center;
    padding-top: 0;
    padding-bottom: 0;

    .extension {
      width: 50%;
      border-right: 1px solid $nav-bg-color;
    }

    .mobile-app {
      flex-grow: 1;
      border-left: 1px solid $nav-bg-color;
    }

    .mobile-app,
    .extension {
      div {
        display: flex;
        justify-content: space-around;
        padding: 10px 0;

        a img {
          height: 45px;
          width: 45px;
          padding: 5px;

          &:hover {
            background-color: #32333c;
          }
        }
      }
    }
  }
}
</style>
