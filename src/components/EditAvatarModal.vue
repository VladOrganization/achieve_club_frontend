<template>
  <Dialog
      v-model:visible="model"
      header="Смена аватарки"
      :modal="true"
      :draggable="false"
      class="w-full max-w-md"
      @hide="resetForm"
  >
    <div class="space-y-4">
      <AvatarPicker
          v-model="avatarSelection"
          :rounded="false"
          :disabled="isLoading"
          @error="errorMessage = $event"
      >
        <template #placeholder>
          <UserAvatar
              :src="currentAvatar ? apiUrl(currentAvatar) : ''"
              :first-name="firstName"
              :last-name="lastName"
          />
        </template>
      </AvatarPicker>

      <Message v-if="errorMessage" severity="error" @close="errorMessage = ''">
        {{ errorMessage }}
      </Message>
    </div>

    <template #footer>
      <Button label="Отмена" severity="secondary" :disabled="isLoading" @click="model = false"/>
      <Button label="Сохранить" :loading="isLoading" :disabled="!avatarSelection" @click="save"/>
    </template>
  </Dialog>
</template>

<script setup>
import {ref} from 'vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import Message from 'primevue/message'
import {apiUrl} from '@/api/config'
import AvatarPicker from '@/components/AvatarPicker.vue'
import UserAvatar from '@/components/UserAvatar.vue'
import {saveAvatar} from '@/api/avatars.js'

defineProps({
  firstName: {type: String, default: ''},
  lastName: {type: String, default: ''},
  currentAvatar: {type: String, default: null},
})

const emit = defineEmits(['saved'])
const model = defineModel(false)

const avatarSelection = ref(null)
const isLoading = ref(false)
const errorMessage = ref('')

const resetForm = () => {
  avatarSelection.value = null
  errorMessage.value = ''
}

const save = async () => {
  errorMessage.value = ''
  isLoading.value = true
  try {
    await saveAvatar(avatarSelection.value)
    emit('saved')
    model.value = false
  } catch (error) {
    const data = error.response?.data
    errorMessage.value = typeof data === 'string' && data ? data : 'Не удалось сохранить аватарку'
  } finally {
    isLoading.value = false
  }
}
</script>
