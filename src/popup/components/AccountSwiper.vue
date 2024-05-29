<template>
  <div class="account-swiper">
    <div
      class="swiper-wrapper"
      :class="{ 'is-swiping': isSwiping }"
    >
      <Swiper
        ref="customSwiper"
        class="swiper"
        :slides-per-view="1.1"
        :space-between="8"
        :centered-slides="true"
        virtual
        @slide-change="onSlideChange"
        @slider-first-move="isSwiping = true"
        @touch-end="isSwiping = false"
      >
        <SwiperSlide
          v-for="(address, index) in addressList"
          :key="address"
          :swiper-ref="customSwiper"
          :virtual-index="index"
          class="account-swiper-slide"
        >
          <slot
            name="slide"
            :index="index"
            :selected="index === activeIdx"
          />
        </SwiperSlide>

        <SwiperSlide
          class="account-swiper-slide"
          :virtual-index="addressList.length"
          :swiper-ref="customSwiper"
        >
          <AccountCardAdd
            :is-multisig="isMultisig"
            :idx="addressList.length"
            selected
          />
        </SwiperSlide>
      </Swiper>

      <template v-if="!IS_MOBILE_APP">
        <Transition name="fade-transition-slow">
          <BtnPlain
            v-if="!isSwiping && currentIdx !== 0"
            class="nav-btn prev"
            data-cy="account-card-btn-prev"
            @click.prevent="setCurrentSlide(currentIdx - 1)"
          >
            <ChevronIcon />
          </BtnPlain>
        </Transition>

        <Transition name="fade-transition-slow">
          <BtnPlain
            v-if="!isSwiping && currentIdx < addressList.length"
            class="nav-btn next"
            data-cy="account-card-btn-next"
            @click.prevent="setCurrentSlide(currentIdx + 1)"
          >
            <ChevronIcon />
          </BtnPlain>
        </Transition>
      </template>
    </div>

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
  nextTick,
  ref,
  watch,
} from 'vue';
import { Swiper, SwiperSlide } from 'swiper/vue';
import SwiperCore from 'swiper';
import { Virtual } from 'swiper/modules';
import { getAddressColor, watchUntilTruthy } from '@/utils';
import { IS_MOBILE_APP, PROTOCOLS } from '@/constants';

import AccountCardAdd from './AccountCardAdd.vue';
import BulletSwitcher from './BulletSwitcher.vue';
import ToggleMultisigButton from './ToggleMultisigButton.vue';
import BtnPlain from './buttons/BtnPlain.vue';

import ChevronIcon from '../../icons/chevron.svg?vue-component';

SwiperCore.use([Virtual]);

export default defineComponent({
  components: {
    ToggleMultisigButton,
    BulletSwitcher,
    BtnPlain,
    Swiper,
    SwiperSlide,
    AccountCardAdd,
    ChevronIcon,
  },
  props: {
    activeIdx: { type: Number, required: true },
    addressList: { type: Array as PropType<string[]>, required: true },
    isMultisig: Boolean,
  },
  emits: {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    'select-account': (idx: number) => true,
  },
  setup(props, { emit }) {
    const customSwiper = ref();
    const currentIdx = ref(0);
    const isSwiping = ref(false);

    const swiper = computed(() => customSwiper.value?.$el.swiper);

    async function setCurrentSlide(idx: number, slideSpeed?: number) {
      if (idx > -1 && currentIdx.value !== idx) {
        await nextTick();
        await watchUntilTruthy(swiper);
        const didSwipe = await swiper.value.slideTo(idx, slideSpeed);
        if (!didSwipe) {
          // Retry if slideTo fails
          setTimeout(() => setCurrentSlide(idx, 0), 100);
        }
      }
    }

    function onSlideChange() {
      const { activeIndex } = swiper.value;
      if (activeIndex < props.addressList.length && activeIndex >= 0) {
        emit('select-account', activeIndex);
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
    });

    watch(
      () => props.activeIdx,
      (activeIdxValue) => {
        setCurrentSlide(activeIdxValue, 0);
      },
    );

    return {
      IS_MOBILE_APP,
      PROTOCOLS,
      currentIdx,
      customSwiper,
      isSwiping,
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
@use '../../styles/variables' as *;
@use '../../styles/mixins';

.account-swiper {
  .account-swiper-bottom {
    @include mixins.flex(space-between, center, row);

    padding-inline: var(--screen-padding-x);
  }

  .swiper-wrapper {
    position: relative;

    .nav-btn {
      --scale: 1; // Rotate or not
      --translate-x: 0; // Move to the edge or not

      position: absolute;
      z-index: 1;
      top: 50%;
      height: 60px;
      padding-right: 24px;
      color: $color-white;
      opacity: 0.5;
      transition: $transition-interactive;
      transform: scaleX(var(--scale)) translateX(var(--translate-x)) translateY(-50%);

      .icon {
        width: 14px;
        height: 22px;
      }

      &.prev {
        --scale: -1;
        left: 0;
      }

      &.next {
        right: 0;
      }

      &:hover {
        opacity: 1;
      }
    }

    &.is-swiping {
      .nav-btn {
        --translate-x: 30px;

        opacity: 0;
        visibility: hidden;
      }
    }
  }
}
</style>
