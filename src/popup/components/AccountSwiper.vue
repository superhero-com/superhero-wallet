<template>
  <div class="account-swiper">
    <Swiper
      ref="customSwiper"
      class="swiper"
      :slides-per-view="1.1"
      :space-between="8"
      :centered-slides="true"
      virtual
      @slideChange="onSlideChange"
    >
      <SwiperSlide
        v-for="(address, index) in addressList"
        :key="address"
        :swiper-ref="customSwiper"
        :virtual-index="index"
        class="account-swiper-slide"
      >
        <AccountSwiperSlide
          :idx="index"
          :active="index === activeIdx"
          :to="to"
          :address="address"
          @slide="(newIndex) => setCurrentSlide(newIndex)"
        >
          <slot
            name="slide"
            :index="index"
          />
        </AccountSwiperSlide>
      </SwiperSlide>

      <SwiperSlide
        class="account-swiper-slide"
        :virtual-index="addressList.length"
        :swiper-ref="customSwiper"
      >
        <AccountSwiperSlide
          hide-next
          :idx="addressList.length"
          @slide="(newIndex) => setCurrentSlide(newIndex)"
        >
          <AccountCardAdd :is-multisig="isMultisig" />
        </AccountSwiperSlide>
      </SwiperSlide>
    </Swiper>

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
import { RouteLocation } from 'vue-router';
import { Swiper, SwiperSlide } from 'swiper/vue';
import SwiperCore from 'swiper';
import { Virtual } from 'swiper/modules';
import { getAddressColor } from '@/utils';
import { IS_MOBILE_APP, PROTOCOL_AETERNITY } from '@/constants';

import AccountCardAdd from './AccountCardAdd.vue';
import AccountSwiperSlide from './AccountSwiperSlide.vue';
import BulletSwitcher from './BulletSwitcher.vue';
import ToggleMultisigButton from './ToggleMultisigButton.vue';

SwiperCore.use([Virtual]);

export default defineComponent({
  components: {
    ToggleMultisigButton,
    BulletSwitcher,
    AccountSwiperSlide,
    Swiper,
    SwiperSlide,
    AccountCardAdd,
  },
  props: {
    activeIdx: { type: Number, required: true },
    to: { type: Object as PropType<RouteLocation>, required: true },
    addressList: { type: Array as PropType<string[]>, required: true },
    isMultisig: Boolean,
  },
  setup(props, { emit }) {
    const customSwiper = ref();
    const currentIdx = ref(0);

    const swiper = computed(() => customSwiper.value?.$el.swiper);

    function setCurrentSlide(idx: number, slideParams?: number) {
      if (currentIdx.value !== idx) {
        swiper.value.slideTo(idx, slideParams);
      }
    }

    function onSlideChange() {
      const { activeIndex } = swiper.value;
      if (activeIndex < props.addressList.length && activeIndex >= 0) {
        emit('selectAccount', activeIndex);
      }
      if (currentIdx.value !== activeIndex) {
        currentIdx.value = activeIndex;
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
      IS_MOBILE_APP,
      PROTOCOL_AETERNITY,
      currentIdx,
      customSwiper,
      getAccountColor,
      onSlideChange,
      setCurrentSlide,
    };
  },
});
</script>

<style lang="scss">
@use 'swiper/css';
</style>

<style lang="scss" scoped>
@use '../../styles/mixins';

.account-swiper {
  .account-swiper-bottom {
    @include mixins.flex(space-between, center, row);

    padding-inline: var(--screen-padding-x);
  }
}
</style>
