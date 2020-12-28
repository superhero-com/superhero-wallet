<template>
  <div class="platforms">
    <div class="text">
      <slot />
    </div>
    <div class="div-icons">
      <div class="extension">
        <div>
          {{ $t('pages.index.platforms.browser-extension') }}
        </div>
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
        <div>
          {{ $t('pages.index.platforms.mobile-app') }}
        </div>
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
@import '../../../styles/variables';

.platforms {
  font-size: 15px;
  background-color: #21222c;
  word-break: break-word;

  .text {
    padding: 15px;
  }

  .div-icons {
    border-top: 1px solid $bg-color;
    display: flex;
    text-align: center;
    padding-top: 0;
    padding-bottom: 0;

    .extension {
      width: 50%;
      border-right: 1px solid $bg-color;
    }

    .mobile-app {
      flex-grow: 1;
    }

    .mobile-app,
    .extension {
      padding: 15px 0;

      div {
        display: flex;
        justify-content: space-around;

        + div {
          padding-top: 15px;
        }

        a {
          padding: 5px;
          border-radius: 10px;
          height: 52px;
          width: 52px;

          img {
            height: 40px;
            width: 40px;
          }

          &:hover {
            background-color: #32333c;

            img {
              opacity: 1;
            }
          }
        }
      }
    }
  }
}
</style>
