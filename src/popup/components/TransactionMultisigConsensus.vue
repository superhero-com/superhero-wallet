<template>
  <div class="transaction-multisig-consensus">
    <div class="label">
      <span>Consensus </span>
      <span class="confirmations-count">
        {{ confirmationsCount }}/{{ confirmationsRequired }} of {{ signersCount }}
      </span>
    </div>
    <div class="consensus-row">
      <div class="signers">
        <div
          v-for="signer of sortedSigners"
          :key="`signer-${signer}`"
          class="signer"
        >
          <LinkButton
            to="'explrerPath'"
            class="signer-link-btn"
          >
            <Avatar
              :address="signer"
              size="sm"
            />
            <AddressTruncated
              :address="signer"
              class="ae-address"
            />
            <ExternalLink class="icon" />
          </LinkButton>

          <CheckCircle
            class="signed-icon"
            :class="{'active': confirmedBy.includes(signer)}"
          />
        </div>
      </div>
      <div class="info">
        <div class="text">
          Pending consensus: <br />
          <span>{{ confirmationsRequired - confirmationsCount }}</span>
          more signatures are required.
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from '@vue/composition-api';
// import { ITransactionConsensus } from '../../types';
import Avatar from './Avatar.vue';
import AddressTruncated from './AddressTruncated.vue';
import LinkButton from './LinkButton.vue';
import ExternalLink from '../../icons/external-link.svg?vue-component';
import CheckCircle from '../../icons/check-circle.svg?vue-component';

export default defineComponent({
  name: 'TransactionMultisigConsensus',
  components: {
    Avatar,
    AddressTruncated,
    LinkButton,
    ExternalLink,
    CheckCircle,
  },
  props: {
    consensus: { type: Object, required: true },
    signers: { type: Array as PropType<string[]>, required: true },
  },
  setup(props) {
    const confirmedBy = computed<string[]>(() => props.consensus.confirmed_by);
    const confirmationsRequired = computed<number>(
      () => Number(props.consensus.confirmations_required),
    );
    const confirmationsCount = computed<number>(() => confirmedBy.value.length);
    const signersCount = computed<number>(() => props.signers.length);
    const sortedSigners = computed<string[]>(
      () => [...props.signers].sort((a) => confirmedBy.value.includes(a) ? -1 : 1),
    );

    return {
      confirmedBy,
      confirmationsRequired,
      confirmationsCount,
      signersCount,
      sortedSigners,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/variables';
@use '../../styles/typography';

.transaction-multisig-consensus {
  width: 100%;

  .label {
    @extend %face-sans-15-medium;

    display: flex;
    align-items: center;
    margin-bottom: 4px;
    line-height: 16px;
    color: rgba(variables.$color-white, 0.5);

    .confirmations-count {
      padding-left: 4px;
      color: rgba(variables.$color-white, 0.75);
    }
  }

  .consensus-row {
    display: inline-flex;
    align-items: center;

    .signers {
      flex: 0.6;

      .signer {
        display: inline-flex;
        align-items: center;

        .signer-link-btn {
          .ae-address {
            @extend %face-mono-12-medium;

            display: flex;
            align-items: center;
            gap: 2px;
            padding: 4px;
            letter-spacing: 0.07em;
          }

          .icon, .ae-address {
            color: variables.$color-white;
            opacity: 0.85;
          }

          &:hover {
            .icon, .ae-address {
              opacity: 1;
            }
          }
        }

        .signed-icon {
          width: 20px;
          height: 20px;

          &.active {
            color: variables.$color-success;
          }
        }
      }
    }

    .info {
      @extend %face-sans-14-regular;

      flex: 0.4;
      display: inline-flex;
      align-items: center;
      padding: 4px 4px 4px 8px;
      min-height: 90px;
      border-radius: 4px;
      background-color: rgba(variables.$color-white, 0.08);
      color: rgba(variables.$color-white, 0.75);
      line-height: 19px;

      span {
        color: variables.$color-white;
      }

      &:before {
        content:"\A";
        border-style: solid;
        border-width: 5px 6px 5px 0;
        border-color: transparent rgba(variables.$color-white, 0.08) transparent transparent;
        margin-left: -14px;
        margin-right: 8px;
      }
    }
  }
}
</style>
