
<template>
    <div class="card flex justify-center" id="position">
        <Dialog v-model:visible="visible" modal header="Edit Profile" :style="{ width: '25rem' }">
           <p>code:1234</p>
        </Dialog>
    </div>
</template>

<script setup>
const visible = defineModel('visible');
</script>


 