<template>
  <div class="container" v-for="item in studentsData" :key="item">
    <div class="card" @click="GoToUserPage(item.id)">
      <img :src="`https://byteschool.online:5001/${item.avatar}`" id="logo" alt="not foto"/>
      <div id="cont">
        <p id="title">{{ item.firstName }}</p>
        <p id="title">{{ item.lastName }}</p>
        <p id="title">xp:{{ item.xpSum }}</p>
      </div>
    </div>
  </div>
</template>
<script setup>
import axios from "axios";
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
let studentsData = ref("");


const router = useRouter();
async function GetStudents() {
  await axios
    .get("https://byteschool.online:5001/api/users")
    .then(function (res) {
      return (studentsData.value = res.data);
    });
}
function GoToUserPage(id){
    router.push('/student-home/'+id);
}
onMounted(async () => {
  await GetStudents();
});
</script>
<style scoped>
    .card{
        width:80%;
        height:20vh;
        padding:3%;
        background-color: azure;
        display:flex;
        align-items: center;
        font-size: 15px;
    }
    .container{
        width:100%;
        display:flex;
        flex-direction: column;
        align-items: center;
    }
    #logo{
        width:25%;
        height:10vh;
        border-radius: 50%;
    
    }
    #title{
        margin-left: 10%;
    }
    #cont{
        margin-bottom: 3%;
    }
</style>
