<template>
    <div>
        <ae-card :fill="fill" v-if="show" class="alert-card">
            <ae-icon name="close" v-if="fill == 'primary'"/>
            <slot name="content"></slot>
        </ae-card>
    </div>
</template>

<script>
export default {
    props:['fill','show']
}
</script>

<style lang="scss" scoped>
@import '../../../common/base';
.ae-card.primary, .ae-card.alternative {
    color:#fff !important;
}
.ae-card {
    opacity:0.7;
    margin-top:1rem;
}
.ae-icon {
    margin-right:1rem;
    background: #fff;
    color: $primary-color;
    border-radius: 50%;
    padding: 0.2rem;
}
</style>
