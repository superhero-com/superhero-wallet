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
          @click="swiper.slideTo(swiper.realIndex - 1)"
        >
          <Chevron />
        </ButtonPlain>
        <AccountCard
          :class="{ selected: account.i === activeIdx }"
          v-bind="account"
          :account-idx="account.i"
        />
        <ButtonPlain
          v-if="!IS_CORDOVA"
          class="swiper-button next"
          @click="swiper.slideTo(swiper.realIndex + 1)"
        >
          <Chevron />
        </ButtonPlain>
      </swiper-slide>
      <swiper-slide>
        <ButtonPlain
          v-if="!IS_CORDOVA"
          class="swiper-button prev"
          @click="swiper.slideTo(swiper.realIndex - 1)"
        >
          <Chevron />
        </ButtonPlain>
        <AddAccountCard />
      </swiper-slide>

      <div
        slot="pagination"
        class="swiper-pagination"
      />
    </swiper>
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import { Swiper, SwiperSlide } from 'vue-awesome-swiper';

import AccountCard from './AccountCard.vue';
import AddAccountCard from './AddAccountCard.vue';
import ButtonPlain from './ButtonPlain.vue';
import Chevron from '../../../icons/chevron.svg?vue-component';

export default {
  components: {
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
      swiperOptions: {
        slidesPerView: 1.1,
        centeredSlides: true,
        spaceBetween: 8,
        pagination: {
          el: '.swiper-pagination',
          clickable: true,
        },
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
      this.swiper.slideTo(this.activeIdx, 0);
    }
  },
  methods: {
    async selectAccount(idx) {
      await this.$watchUntilTruly(() => this.$store.state.middleware);
      this.$store.commit('accounts/setActiveIdx', idx);
    },
    onSlideChange() {
      if (this.swiper.realIndex < this.filteredAccounts.length
        && this.filteredAccounts[this.swiper.realIndex]) {
        this.selectAccount(this.filteredAccounts[this.swiper.realIndex].i);
      }
    },
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';

@import '../../../../node_modules/swiper/css/swiper.css';

.account-switcher {
  background-color: variables.$color-bg-3;
  padding-bottom: 10px;

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

  .swiper-pagination {
    position: initial;
    text-align: left;
    padding-left: 18px;
    padding-top: 8px;

    ::v-deep .swiper-pagination-bullet {
      background: variables.$color-white;
      opacity: 0.2;

      &.swiper-pagination-bullet-active {
        opacity: 1;
        background: variables.$color-purple;
      }
    }
  }
}
</style>
