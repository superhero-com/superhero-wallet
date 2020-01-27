<template>
    <div class="popup">
        <div class="actions">
            <button class="backbutton toAccount" @click="navigateToIndex"><ae-icon name="back" /> {{ $t('pages.privacyPolicy.backButton') }}</button>
        </div>
        <h2> {{ $t('pages.privacyPolicy.heading') }} </h2>
            Your privacy is important to us. It is Waellet's policy to respect your privacy regarding any information we may collect from you across our website, https://waellet.com, and other sites we own and operate.

            We don't ask for personal information to provide a service to you.

            We don't collect and retain any information for providing your requested service.

            We don’t share any personally identifying information publicly or with third-parties.

            Our website, app and browser extension may link to external sites that are not operated by us. Please be aware that we have no control over the content and practices of these sites, and cannot accept responsibility or liability for their respective privacy policies.

            Your continued use of our website will be regarded as acceptance of our practices around privacy and personal information. If you have any questions about how we handle user data and personal information, feel free to contact us.

            This policy is effective as of 27 August 2019.
    </div>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
    data(){
        return {
        }
    },
    created() {
    },
    methods: {
        navigateToIndex() {
            this.$router.push('/');
        },
    },
    computed: {
    }
}
</script>

<style lang="scss" scoped>
@import '../../../common/base';



</style>
