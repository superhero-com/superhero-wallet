<template>
  <ion-page>
    <ion-content
      class="ion-padding"
    >
      <TransactionList
        :token-contract-id="contractId"
        :is-multisig="isMultisig"
      />
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import {
  IonContent,
  IonPage,
} from '@ionic/vue';
import { defineComponent } from 'vue';
import TransactionList from '../../components/TransactionList.vue';

export default defineComponent({
  name: 'TokenTransactions',
  components: {
    TransactionList,
    IonPage,
    IonContent,
  },
  props: {
    contractId: { type: String, default: null },
    isMultisig: Boolean,
  },
});
</script>
