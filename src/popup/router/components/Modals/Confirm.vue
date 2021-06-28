<template>
  <Default
    v-bind="{ ...$attrs, resolve }"
    :close="cancel"
  >
    <template slot="footer">
      <Button
        fill="secondary"
        @click="cancel"
      >
        {{ $t('modals.cancel') }}
      </Button>
      <Button
        data-cy="to-confirm"
        @click="resolve"
      >
        {{ $t('modals.confirm') }}
      </Button>
    </template>
  </Default>
</template>

<script>
import Default from './Default';
import Button from '../Button';

export default {
  components: { Default, Button },
  props: {
    resolve: { type: Function, required: true },
    reject: { type: Function, required: true },
  },
  methods: {
    cancel() {
      this.reject(new Error('Rejected by user'));
    },
  },
};
</script>
