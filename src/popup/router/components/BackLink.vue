<template>
    <div>
        <div class="actions">
            <button class="back-button" @click="redirect"><ae-icon name="back" /> <slot></slot></button>
        </div>
    </div>
</template>

<script>
export default {
    props: {
        to: String
    },
    methods: {
        redirect() {
            this.$router.push(this.to)
        }
    }
}
</script>