<template>
  <div
    class="account-switcher"
    :class="{ 'notification-above': notification }"
  >
    <swiper
      ref="customSwiper"
      class="swiper"
      :options="swiperOptions"
      @slideChange="onSlideChange"
    >
      <swiper-slide
        v-for="(account, idx) in filteredAccounts"
        :key="account.i"
      >
        <ButtonPlain
          v-if="idx !== 0 && !IS_CORDOVA"
          class="swiper-button prev"
          @click="setCurrentSlide(swiper.realIndex - 1)"
        >
          <Chevron />
        </ButtonPlain>
        <AccountCard
          :class="{ selected: account.i === activeIdx }"
          v-bind="account"
          :color="getAccountColor(account.i)"
        />
        <ButtonPlain
          v-if="!IS_CORDOVA"
          class="swiper-button next"
          @click="setCurrentSlide(swiper.realIndex + 1)"
        >
          <Chevron />
        </ButtonPlain>
      </swiper-slide>
      <swiper-slide>
        <ButtonPlain
          v-if="!IS_CORDOVA"
          class="swiper-button prev"
          @click="setCurrentSlide(swiper.realIndex - 1)"
        >
          <Chevron />
        </ButtonPlain>
        <AddAccountCard />
      </swiper-slide>
    </swiper>
    <BulletSwitcher
      v-if="filteredAccounts && filteredAccounts.length"
      :active-color="getAccountColor(currentIdx)"
      :current-idx="currentIdx"
      :options-size="filteredAccounts.length"
      @change="setCurrentSlide"
    />
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import { Swiper, SwiperSlide } from 'vue-awesome-swiper';

import AccountCard from './AccountCard.vue';
import AddAccountCard from './AddAccountCard.vue';
import ButtonPlain from './ButtonPlain.vue';
import Chevron from '../../../icons/chevron.svg?vue-component';
import { getAddressColor } from '../../utils/avatar';
import BulletSwitcher from './BulletSwitcher.vue';

export default {
  components: {
    BulletSwitcher,
    AccountCard,
    AddAccountCard,
    Swiper,
    SwiperSlide,
    ButtonPlain,
    Chevron,
  },
  props: { notification: Boolean },
  data() {
    return {
      IS_CORDOVA: process.env.IS_CORDOVA,
      currentIdx: 0,
      swiperOptions: {
        slidesPerView: 1.1,
        centeredSlides: true,
        spaceBetween: 8,
      },
    };
  },
  computed: {
    ...mapState('accounts', ['activeIdx']),
    ...mapGetters(['accounts']),
    swiper() {
      return this.$refs.customSwiper.$swiper;
    },
    filteredAccounts() {
      return this.accounts.map(
        (account, index) => ({ ...account, i: index }),
      ).filter((account) => account.showed);
    },
  },
  mounted() {
    if (this.activeIdx) {
      this.setCurrentSlide(this.activeIdx, 0);
    }
  },
  methods: {
    async selectAccount(idx) {
      await this.$watchUntilTruly(() => this.$store.state.middleware);
      this.$store.commit('accounts/setActiveIdx', idx);
    },
    onSlideChange() {
      const { realIndex } = this.swiper;
      if (this.swiper.realIndex < this.filteredAccounts.length
        && this.filteredAccounts[realIndex]) {
        this.selectAccount(this.filteredAccounts[realIndex].i);
      }
      if (this.currentIdx !== realIndex) this.currentIdx = realIndex;
    },
    getAccountColor(idx) {
      return getAddressColor(this.filteredAccounts[idx]?.address);
    },
    setCurrentSlide(idx, slideParams) {
      this.currentIdx = idx;
      this.swiper.slideTo(idx, slideParams);
    },
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/mixins';

@import '../../../../node_modules/swiper/css/swiper.css';

.account-switcher {
  background-color: variables.$color-bg-3;

  ::v-deep .account-card,
  ::v-deep .add-account-card {
    width: 100%;
    height: 192px;
    margin: 0;
  }

  .swiper-button {
    position: absolute;
    opacity: 0.5;
    top: 81px;
    color: variables.$color-white;
    z-index: 1;

    &.prev {
      left: 12px;
      transform: rotate(180deg);
    }

    &.next {
      right: 12px;
    }

    &:hover {
      opacity: 1;
    }
  }
}
</style>
