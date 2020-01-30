<template>
    <div class="popup">
        Your wallet has been created

    </div>
</template>

<script>
import { generateMnemonic, mnemonicToSeed, validateMnemonic } from '@aeternity/bip39';

export default {
    data () {
        return {
            mnemonic: null
        }
    },
    async created(){
        this.mnemonic = generateMnemonic();
        const seed = mnemonicToSeed(this.mnemonic).toString('hex')
        const address = await this.$store.dispatch('generateWallet', { seed })
        await browser.storage.local.set({ mnemonic: this.mnemonic })
        const keypair = {
            publicKey: address,
            privateKey: seed
        }
        this.$store.dispatch('setLogin', { keypair })
    },
    methods: {
        
    }
}
</script>
