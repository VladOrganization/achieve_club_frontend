<template>
    <h1>{{id}}</h1>
    <p>{{userData.firstName}}</p>
</template>
<script setup>
import { useRoute } from 'vue-router';
import {ref,onMounted} from 'vue'
import axios from 'axios'
const route = useRoute();
let id = route.params.id;
let userData = ref('');
async function GetUserById(){
    await axios.get('https://byteschool.online:5001/api/users/'+Number(id))
    .then(function(res){
        return userData.value = res.data;
    })
}
onMounted(async()=>{
   await GetUserById();
})
</script>