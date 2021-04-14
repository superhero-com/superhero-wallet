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
            href="https://addons.mozilla.org/en-US/firefox/addon/superhero-wallet/"
            target="_blank"
          >
            <img
              :class="{ grey: !isFirefox() || IS_MOBILE_DEVICE }"
              src="../../../icons/platforms/firefox.svg"
              alt="Firefox"
            >
          </a>
          <a
            href="https://chrome.google.com/webstore/detail/superhero/mnhmmkepfddpifjkamaligfeemcbhdne"
            target="_blank"
          >
            <img
              :class="{ grey: isFirefox() || IS_MOBILE_DEVICE }"
              src="../../../icons/platforms/chrome.svg"
              alt="Chrome"
            >
          </a>
        </div>
      </div>
      <div class="mobile-app">
        <div>
          {{ $t('pages.index.platforms.mobile-app') }}
        </div>
        <div>
          <a
            href="https://testflight.apple.com/join/3o5r4dQQ"
            target="_blank"
          >
            <img
              :class="{ grey: !IS_IOS || !IS_MOBILE_DEVICE }"
              src="../../../icons/platforms/app-store.svg"
              alt="App Store"
            >
          </a>
          <a
            href="https://play.google.com/store/apps/details?id=com.superhero.cordova"
            target="_blank"
          >
            <img
              :class="{ grey: IS_IOS || !IS_MOBILE_DEVICE }"
              src="../../../icons/platforms/google-play.svg"
              alt="Google Play"
            >
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { detect } from 'detect-browser';

export default {
  data: () => ({
    IS_MOBILE_DEVICE: window.IS_MOBILE_DEVICE,
    IS_IOS: window.IS_IOS,
  }),
  methods: {
    isFirefox() {
      return detect().name === 'firefox';
    },
  },
};
</script>

<style lang="scss" scoped>
@import '../../../styles/typography';

.platforms {
  font-size: 15px;
  background-color: $color-black;
  word-break: break-word;

  @extend %face-sans-15-regular;

  &:hover {
    background-color: $color-bg-3;
  }

  .text {
    margin: 8px auto;
    width: 248px;
    padding: 4px 8px;
    color: $color-light-grey;
  }

  .div-icons {
    border-top: 1px solid $color-border-hover;
    display: flex;
    text-align: center;
    padding-top: 0;
    padding-bottom: 0;

    .extension {
      width: 50%;
      border-right: 1px solid $color-border-hover;
    }

    .mobile-app {
      flex-grow: 1;
    }

    .mobile-app,
    .extension {
      padding-top: 15px;

      div {
        display: flex;
        justify-content: center;

        + div {
          padding-top: 15px;
          padding-bottom: 12px;
        }

        a {
          &:first-of-type {
            margin-right: 32px;
          }

          img {
            height: 40px;
            width: 40px;

            &.grey {
              filter: grayscale(1);
              opacity: 0.8;

              &:hover {
                filter: none;
                opacity: 1;
              }
            }
          }
        }
      }
    }
  }
}
</style>
