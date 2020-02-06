<template>
    <div>
        <div class="connect-error" v-if="nodeStatus == 'error' && account.publicKey && isLoggedIn" >Unable to connect to choosen node</div>
        <div class="connect-node" v-if="nodeStatus == 'connecting' && account.publicKey && isLoggedIn">Connecting to node...</div>
        <div class="connect-node" v-if="nodeStatus == 'connected' && account.publicKey && isLoggedIn">Connected to node</div>
        <div class="connect-node" v-if="nodeStatus == 'initServices' && account.publicKey && isLoggedIn">Initializing services...</div>
    </div>  
</template>


<script>
import { mapGetters } from 'vuex';
export default {
    data() {
        return {}
    },
    computed: {
         ...mapGetters (['nodeStatus','account','isLoggedIn'])
    }
}
</script>

<style lang="scss" scoped>
@import '../../../common/variables';
.connect-error, .connect-node { position:fixed; bottom: 0; left:0; right:0; background:$primary-color; color:#fff; padding: .3rem; text-align:center; font-weight:bold; }
.connect-node { background: $color-secondary; }
</style>