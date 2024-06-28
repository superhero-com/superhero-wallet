<template>
  <div class="platforms">
    <div class="heading">
      {{ $t('pages.index.platforms.heading') }}
    </div>
    <div
      v-if="IS_MOBILE_DEVICE"
      class="mobile-web-icons"
    >
      <LinkButton
        :to="APP_LINK_IOS"
      >
        <img
          :class="{ grey: !IS_IOS || !IS_MOBILE_DEVICE }"
          src="../../icons/platforms/app-store-mobile.svg"
          alt="App Store"
        >
      </LinkButton>
      <LinkButton
        :to="APP_LINK_ANDROID"
      >
        <img
          :class="{ grey: IS_IOS || !IS_MOBILE_DEVICE }"
          src="../../icons/platforms/google-play-mobile.svg"
          alt="Google Play"
        >
      </LinkButton>
    </div>
    <div
      v-else
      class="web-icons-wrapper"
    >
      <div class="web-icons">
        <div class="web-icons-title">
          {{ $t('pages.index.platforms.browser-extension') }}
        </div>
        <div class="web-icons-platforms">
          <PlatformIcon
            :to="APP_LINK_FIREFOX"
            :disabled="!IS_FIREFOX || IS_MOBILE_DEVICE"
            :src="require('../../icons/platforms/firefox.svg')"
            alt="Firefox"
          />
          <PlatformIcon
            :to="APP_LINK_CHROME"
            :disabled="IS_FIREFOX || IS_MOBILE_DEVICE"
            :src="require('../../icons/platforms/chrome.svg')"
            alt="Chrome"
          />
        </div>
      </div>
      <div class="web-icons">
        <div class="web-icons-title">
          {{ $t('pages.index.platforms.mobile-app') }}
        </div>
        <div class="web-icons-platforms">
          <PlatformIcon
            :to="APP_LINK_IOS"
            :disabled="!IS_IOS || !IS_MOBILE_DEVICE"
            :src="require('../../icons/platforms/app-store.svg')"
            alt="App Store"
          />
          <PlatformIcon
            :to="APP_LINK_ANDROID"
            :disabled="IS_IOS || !IS_MOBILE_DEVICE"
            :src="require('../../icons/platforms/google-play.svg')"
            alt="Google Play"
          />
        </div>
      </div>
    </div>
    <div class="footer">
      {{ $t('pages.index.webVersion') }}
    </div>
  </div>
</template>

<script lang="ts">
import {
  APP_LINK_CHROME,
  APP_LINK_FIREFOX,
  APP_LINK_ANDROID,
  APP_LINK_IOS,
  IS_FIREFOX,
  IS_IOS,
  IS_MOBILE_DEVICE,
} from '@/constants';
import LinkButton from '@/popup/components/LinkButton.vue';
import PlatformIcon from './PlatformIcon.vue';

export default {
  components: { PlatformIcon, LinkButton },
  data: () => ({
    IS_MOBILE_DEVICE,
    IS_IOS,
    IS_FIREFOX,
    APP_LINK_CHROME,
    APP_LINK_FIREFOX,
    APP_LINK_ANDROID,
    APP_LINK_IOS,
  }),
};
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
@use '@/styles/typography';
@use '@/styles/mixins';

.platforms {
  @extend %face-sans-15-regular;

  font-size: 15px;
  background-color: var(--screen-bg-color);
  word-break: break-word;

  .heading {
    @extend %face-sans-16-semi-bold;

    margin-bottom: 8px;
  }

  .footer {
    @extend %face-sans-16-semi-bold;

    margin-top: 28px;
    margin-bottom: 12px;
  }

  .mobile-web-icons {
    @include mixins.flex(center, center);

    gap: 17px;
    padding-top: 8px;
  }

  .web-icons-wrapper {
    @include mixins.flex(center, center);

    text-align: center;
    color: $color-grey-light;
  }

  .web-icons {
    &-title {
      padding-top: 4px;
    }

    &:first-child {
      border-right: 1px solid rgba($color-white, 0.2);
    }

    .web-icons-platforms {
      @include mixins.flex(center);

      gap: 32px;
      padding-right: 30px;
      padding-left: 30px;
      padding-top: 12px;
    }
  }
}
</style>
