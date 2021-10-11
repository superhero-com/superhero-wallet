<template>
  <div class="overview">
    <span
      class="title"
      data-cy="title"
    >
      {{ title }}
    </span>

    <div class="parties">
      <Avatar v-bind="sender" />
      <div class="mid">
        <TriangleRight />
        <div class="line" />
      </div>
      <Avatar
        v-if="recipient.address"
        v-bind="recipient"
      />
      <div
        v-else
        class="avatar"
      >
        <AensIcon
          v-if="recipient.aens"
          class="icon"
        />
        <ActionIcon
          v-else
          class="icon"
        />
      </div>
    </div>

    <div class="details">
      <div
        class="sender"
        data-cy="sender"
      >
        <a
          :href="sender.url"
          target="_blank"
          class="name"
        >
          <Truncate :str="sender.name || sender.label" />
        </a>
        <CopyAddress :value="sender.address" />
      </div>
      <div
        class="recipient"
        data-cy="recipient"
      >
        <a
          v-if="recipient.url"
          :href="recipient.url"
          target="_blank"
          class="name"
        >
          <Truncate :str="recipient.name || recipient.label" />
        </a>
        <span
          v-else
          class="name"
          :class="{ aens: recipient.aens }"
        >
          {{ recipient.label }}
        </span>
        <CopyAddress
          v-if="recipient.address"
          :value="recipient.address"
        />
      </div>
    </div>
  </div>
</template>

<script>
import Truncate from './Truncate.vue';
import CopyAddress from './CopyAddress.vue';
import TriangleRight from '../../../icons/triangle-right.svg?vue-component';
import ActionIcon from '../../../icons/action.svg?vue-component';
import AensIcon from '../../../icons/aens.svg?vue-component';
import Avatar from './Avatar.vue';

export default {
  components: {
    Truncate,
    CopyAddress,
    TriangleRight,
    ActionIcon,
    AensIcon,
    Avatar,
  },
  props: {
    title: { type: String, required: true },
    sender: { type: Object, required: true },
    recipient: { type: Object, required: true },
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/typography';

.overview {
  .title {
    @extend %face-sans-15-regular;

    color: variables.$color-white;
    text-align: center;
    display: block;
    margin-bottom: -8px;
  }

  .parties {
    display: flex;
    padding-bottom: 8px;

    .avatar {
      width: 56px;
      height: 56px;
      padding: 8px;
      border: 2px solid variables.$color-blue;
      border-radius: 100px;
    }

    .icon {
      width: 36px;
      height: 36px;
      color: variables.$color-white;
    }

    .mid {
      position: relative;
      width: 100%;

      svg {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 15px;
        height: 17px;
        color: variables.$color-blue;
      }

      .line {
        height: calc(50% + 1px);
        border-bottom: 2px solid variables.$color-blue;
      }
    }
  }

  .details {
    display: flex;
    justify-content: space-between;

    .sender {
      width: 148px;
      text-align: left;
    }

    .recipient {
      width: 148px;
      text-align: right;

      .truncate {
        justify-content: flex-end;
      }

      .name.aens {
        padding-right: 8px;
      }
    }

    .name {
      display: block;
      margin-bottom: 4px;
      font-size: 15px;
      line-height: 16px;
      color: variables.$color-white;
      text-decoration: none;
      white-space: nowrap;

      &:hover {
        text-decoration: underline;
      }
    }

    .copy-address {
      height: 48px;
    }
  }
}
</style>
