<template>
  <div class="account-swiper">
    <swiper
      ref="customSwiper"
      class="swiper"
      :options="swiperOptions"
      @slideChange="onSlideChange"
    >
      <AccountSwiperSlide
        v-for="(address, index) in addressList"
        :key="address"
        :idx="index"
        :selected="index === activeIdx"
        :to="to"
        :address="address"
        @slide="(newIndex) => setCurrentSlide(newIndex)"
      >
        <slot
          name="slide"
          :index="index"
        />
      </AccountSwiperSlide>
      <AccountSwiperSlide
        hide-next
        @slide="() => setCurrentSlide(addressList.length - 1)"
      >
        <AccountCardAdd :is-multisig="isMultisig" />
      </AccountSwiperSlide>
    </swiper>

    <div class="account-swiper-bottom">
      <BulletSwitcher
        v-if="addressList"
        :active-color="getAccountColor(currentIdx)"
        :current-idx="currentIdx"
        :options-size="addressList.length"
        @change="setCurrentSlide"
      />

      <ToggleMultisigButton :is-multisig="isMultisig" />
    </div>
  </div>
</template>

<script lang="ts">
import {
  PropType,
  computed,
  defineComponent,
  onMounted,
  ref,
  watch,
} from 'vue';
// import { Swiper } from 'vue-awesome-swiper';
import { RouteLocation } from 'vue-router';
import { useStore } from 'vuex';

import AccountCardAdd from './AccountCardAdd.vue';
import AccountSwiperSlide from './AccountSwiperSlide.vue';
import BulletSwitcher from './BulletSwitcher.vue';
import ToggleMultisigButton from './ToggleMultisigButton.vue';

import { getAddressColor } from '../utils/avatar';

export default defineComponent({
  components: {
    ToggleMultisigButton,
    BulletSwitcher,
    AccountSwiperSlide,
    // Swiper,
    AccountCardAdd,
  },
  props: {
    activeIdx: { type: Number, required: true },
    to: { type: Object as PropType<RouteLocation>, required: true },
    addressList: { type: Array as PropType<string[]>, required: true },
    isMultisig: Boolean,
  },
  setup(props, { emit }) {
    const store = useStore();

    const swiperOptions = {
      slidesPerView: 1.1,
      centeredSlides: true,
      spaceBetween: 8,
    };

    const customSwiper = ref();
    const currentIdx = ref(0);

    const swiper = computed(() => customSwiper.value?.$swiper);

    function setCurrentSlide(idx: number, slideParams?: number) {
      if (currentIdx.value !== idx) {
        swiper.value.slideTo(idx, slideParams);
      }
    }

    function onSlideChange() {
      store.commit('initTransactions');
      const { realIndex } = swiper.value;
      if (realIndex < props.addressList.length && realIndex >= 0) {
        emit('selectAccount', realIndex);
      }
      if (currentIdx.value !== realIndex) {
        currentIdx.value = realIndex;
      }
    }
    function getAccountColor(idx: number) {
      return getAddressColor(props.addressList[idx]);
    }

    onMounted(() => {
      if (props.activeIdx) {
        setCurrentSlide(props.activeIdx, 0);
      }
      watch(
        () => props.activeIdx,
        (activeIdxValue) => {
          setCurrentSlide(activeIdxValue, 0);
        },
      );
    });

    return {
      IS_CORDOVA: process.env.IS_CORDOVA,
      currentIdx,
      swiperOptions,
      customSwiper,
      swiper,
      getAccountColor,
      onSlideChange,
      setCurrentSlide,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/mixins';

@import '../../../node_modules/swiper/css/swiper.css';

.account-swiper {
  .account-swiper-bottom {
    @include mixins.flex(space-between, center, row);

    padding-inline: var(--screen-padding-x);
  }
}
</style>
