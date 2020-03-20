<template>
    <div>
        <img :src="avatarUrl" />
    </div>
</template>

<script>
import { mapGetters } from 'vuex';
import { BACKEND_URL } from '../../utils/constants';

export default {
  components: {
  },
  data() {
    return {
    };
  },
  computed: {
    ...mapGetters(['account']),
    avatarUrl() {
      return `${BACKEND_URL}/profile/image/${this.account.publicKey}`
    }
  },
  methods: {

  },
};
</script>
