<template>
   <div class="wrapper">
    <div class="card" @click="open(visible)">
        <p>email:{{email}}</p>
        <codeModal v-model:visible="visible" v-if="visible == true" id="position"></codeModal>
    </div>
    
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
.card{
    width:50%;
    padding:3%;
    background-color: rgb(185, 237, 237);
    border: 1px solid aqua;
    border-radius: 15px;
    margin-top: 5%;
    
}
</style>