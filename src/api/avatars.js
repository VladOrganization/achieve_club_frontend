import apiClient from '@/api/client.js'

// Список предзагруженных аватарок: относительные пути вида "avatars/presets/<имя>.webp"
export const fetchAvatarPresets = async () => {
    const response = await apiClient.get('/api/avatar/presets')
    return response.data || []
}

// Сохраняет выбор из AvatarPicker: либо загружает свой файл, либо ставит предзагруженную аватарку
export const saveAvatar = async (selection) => {
    if (selection?.type === 'file') {
        const data = new FormData()
        data.append('file', selection.file)
        await apiClient.post('/api/avatar', data, {timeout: 60000})
    } else if (selection?.type === 'preset') {
        await apiClient.put('/api/avatar/presets/select', {path: selection.path})
    }
}
