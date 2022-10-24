<template>
  <transition name="fade">
    <div
      v-if="isVisible"
      class="card"
      :class="{ 'is-big': isBig, clickable, dense }"
      :style="styleComponent"
      @click="$emit('click', $event)"
    >
      <div class="card-icon">
        <slot
          name="icon"
          class="icon-svg"
        />
      </div>
      <div>
        <div class="title">
          {{ title }}
        </div>
        <div class="description">
          {{ description }}
        </div>
        <slot />
      </div>
      <div
        v-if="cardId"
        class="card-close"
      >
        <BtnIcon
          variant="light"
          @click="$store.commit('hideCard', cardId)"
        >
          <CloseIcon class="close-icon" />
        </BtnIcon>
      </div>
    </div>
  </transition>
</template>

<script>
import { mapState } from 'vuex';
import BtnIcon from '../buttons/BtnIcon.vue';
import CloseIcon from '../../../icons/times-circle.svg?vue-component';

export default {
  name: 'Card',
  components: {
    BtnIcon,
    CloseIcon,
  },
  props: {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    background: {
      type: String,
      default: null,
    },
    isBig: Boolean,
    clickable: Boolean,
    dense: Boolean,
    cardId: { type: String, default: null },
  },
  computed: {
    ...mapState(['hiddenCards']),
    styleComponent() {
      return {
        backgroundImage: (this.background)
          ? `url("${this.background}")`
          : null,
      };
    },
    isVisible() {
      return !this.cardId || !this.hiddenCards || !this.hiddenCards.includes(this.cardId);
    },
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/typography';
@use '../../../styles/mixins';

.card {
  position: relative;
  width: 100%;
  background-color: variables.$color-bg-6;
  min-height: 116px;
  border-radius: variables.$border-radius-interactive;
  padding: 16px;
  gap: 8px;
  background-repeat: no-repeat;
  background-size: cover;
  text-align: center;
  transition: background-color 0.2s;

  @include mixins.flex(center, center, column);

  &.dense {
    .description {
      margin-top: 0;
    }
  }

  &.clickable {
    cursor: pointer;
    user-select: none;

    &:hover {
      background-color: variables.$color-disabled;

      .card-icon {
        background-color: rgba(variables.$color-white, 0.2);
      }
    }

    &:active {
      .card-icon {
        background-color: rgba(variables.$color-white, 0.4);
      }
    }
  }

  .card-icon {
    height: 36px;
    width: 36px;
    min-width: 36px;
    background-color: rgba(variables.$color-white, 0.15);
    border-radius: 14px;
    transition: background-color 0.2s;

    @include mixins.flex(center, center);

    .icon-svg {
      height: 20px;
    }
  }

  .card-close {
    position: absolute;
    top: 4px;
    right: 4px;

    .close-icon {
      width: 24px;
      height: 24px;
    }
  }

  .title {
    @extend %face-sans-16-bold;
  }

  .description {
    opacity: 0.7;
    margin-top: 4px;

    @extend %face-sans-13-medium;
  }

  &.is-big {
    flex-direction: row;
    align-items: start;
    gap: 16px;
    padding: 20px 16px;
    text-align: left;

    .card-icon {
      margin-top: 2px;
    }
  }
}
</style>
