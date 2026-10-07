<template>
  <Dialog
      v-model:visible="model"
      header="Редактировать профиль"
      :modal="true"
      :draggable="false"
      class="w-full max-w-md"
      @show="initForm"
      @hide="resetForm"
  >
    <div class="space-y-4">
      <!-- Аватарка -->
      <div class="flex flex-col items-center gap-3">
        <div
            class="w-28 h-28 rounded-lg overflow-hidden bg-gradient-to-br from-stone-300 to-stone-400 flex items-center justify-center cursor-pointer"
            @click="avatarInput.click()"
        >
          <img
              v-if="avatarPreview"
              :src="avatarPreview"
              alt="Аватарка"
              class="w-full h-full object-cover"
          />
          <UserAvatar
              v-else
              :src="currentAvatar ? apiUrl(currentAvatar) : ''"
              :first-name="firstName"
              :last-name="lastName"
          />
        </div>
        <input
            ref="avatarInput"
            type="file"
            accept="image/*"
            class="hidden"
            @change="onAvatarSelected"
        />
        <Button
            :label="avatarFile ? 'Выбрать другое фото' : 'Выбрать новую аватарку'"
            icon="pi pi-image"
            severity="secondary"
            size="small"
            @click="avatarInput.click()"
        />
      </div>

      <div>
        <label for="edit-first-name" class="block text-sm font-medium text-stone-700 mb-2">Имя</label>
        <InputText id="edit-first-name" v-model="form.firstName" class="w-full" @keyup.enter="save"/>
        <p v-if="errors.firstName" class="text-red-500 text-sm mt-1">{{ errors.firstName }}</p>
      </div>

      <div>
        <label for="edit-last-name" class="block text-sm font-medium text-stone-700 mb-2">Фамилия</label>
        <InputText id="edit-last-name" v-model="form.lastName" class="w-full" @keyup.enter="save"/>
        <p v-if="errors.lastName" class="text-red-500 text-sm mt-1">{{ errors.lastName }}</p>
      </div>

      <div class="flex flex-col sm:flex-row gap-2 pt-2 border-t border-stone-200">
        <Button
            label="Редактировать пароль"
            icon="pi pi-lock"
            severity="secondary"
            size="small"
            class="flex-1"
            @click="showPasswordModal = true"
        />
        <Button
            label="Редактировать почту"
            icon="pi pi-envelope"
            severity="secondary"
            size="small"
            class="flex-1"
            @click="showEmailModal = true"
        />
      </div>

      <Message v-if="errorMessage" severity="error" @close="errorMessage = ''">
        {{ errorMessage }}
      </Message>
    </div>

    <template #footer>
      <Button label="Отмена" severity="secondary" @click="model = false"/>
      <Button label="Сохранить" :loading="isLoading" @click="save"/>
    </template>
  </Dialog>

  <EditPasswordModal v-model="showPasswordModal"/>
  <EditEmailModal v-model="showEmailModal" :current-email="email" @saved="emit('saved')"/>
</template>

<script setup>
import {ref} from 'vue'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Message from 'primevue/message'
import apiClient from '@/api/client.js'
import {apiUrl} from '@/api/config'
import EditPasswordModal from '@/components/EditPasswordModal.vue'
import EditEmailModal from '@/components/EditEmailModal.vue'

const props = defineProps({
  email: {type: String, default: ''},
  firstName: {type: String, default: ''},
  lastName: {type: String, default: ''},
  currentAvatar: {type: String, default: null},
})

const emit = defineEmits(['saved'])
const model = defineModel(false)

const MAX_AVATAR_SIZE = 10_000_000

const showPasswordModal = ref(false)
const showEmailModal = ref(false)
const avatarInput = ref(null)
const avatarFile = ref(null)
const avatarPreview = ref('')
const isLoading = ref(false)
const errorMessage = ref('')
const form = ref({firstName: '', lastName: ''})
const errors = ref({firstName: '', lastName: ''})

const initForm = () => {
  form.value = {firstName: props.firstName, lastName: props.lastName}
}

const resetForm = () => {
  if (avatarPreview.value) URL.revokeObjectURL(avatarPreview.value)
  avatarFile.value = null
  avatarPreview.value = ''
  errors.value = {firstName: '', lastName: ''}
  errorMessage.value = ''
}

const onAvatarSelected = (event) => {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return

  errorMessage.value = ''

  if (!file.type.startsWith('image/')) {
    errorMessage.value = 'Выберите файл изображения'
    return
  }
  if (file.size > MAX_AVATAR_SIZE) {
    errorMessage.value = 'Файл слишком большой (максимум 10 МБ)'
    return
  }

  if (avatarPreview.value) URL.revokeObjectURL(avatarPreview.value)
  avatarFile.value = file
  avatarPreview.value = URL.createObjectURL(file)
}

const MAX_NAME_LENGTH = 100

const validateName = (value, min, texts) => {
  const length = value.trim().length
  if (!length) return texts.required
  if (length < min) return `${texts.label} минимум ${min} символов`
  if (length > MAX_NAME_LENGTH) return `${texts.label} максимум ${MAX_NAME_LENGTH} символов`
  return ''
}

const validate = () => {
  errors.value = {
    firstName: validateName(form.value.firstName, 2, {required: 'Имя обязательно', label: 'Имя должно содержать'}),
    lastName: validateName(form.value.lastName, 5, {required: 'Фамилия обязательна', label: 'Фамилия должна содержать'}),
  }
  return !errors.value.firstName && !errors.value.lastName
}

const save = async () => {
  errorMessage.value = ''
  if (!validate()) return

  isLoading.value = true
  try {
    const firstName = form.value.firstName.trim()
    const lastName = form.value.lastName.trim()

    if (firstName !== props.firstName || lastName !== props.lastName) {
      await apiClient.patch('/api/users/change_name', {firstName, lastName})
    }

    if (avatarFile.value) {
      const data = new FormData()
      data.append('file', avatarFile.value)
      await apiClient.post('/api/avatar', data, {timeout: 60000})
    }

    emit('saved')
    model.value = false
  } catch (error) {
    const data = error.response?.data
    errorMessage.value = typeof data === 'string' && data ? data : 'Не удалось сохранить профиль'
  } finally {
    isLoading.value = false
  }
}
</script>
