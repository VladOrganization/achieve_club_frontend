<template>
   <div class="wrapper">
     <Card @click="open(visible)" id="card">
        <template #content>
            <p class="m-0">email:{{email}}</p>
            <codeModal v-model:visible="visible" v-if="visible == true" id="position"></codeModal>
        </template>
    </Card>
   </div>
</template>


<script setup>
import { ref } from 'vue';
import codeModal from '@/components/codeModal.vue';
let email = 'k@gmail.com'
let visible = ref(false);

function open(){
    visible.value = true;
}

</script>


<style scoped>
#position{
    display: none;
}
.wrapper{
    width: 100%;
    display: flex;
    align-items: center;
    flex-direction: column;
}
#card{
    width:80%;
    margin-top: 5%;
    border: 1px solid;
    background-color: var(--p-emerald-300) !important;
    border-color: var(--color-green-500) !important;
}
</style>