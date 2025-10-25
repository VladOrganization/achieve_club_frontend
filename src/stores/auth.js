// src/stores/authStore.ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useAuthStore = defineStore('auth', () => {
    // State
    const userId = ref<string | null>(null);
    const authToken = ref<string | null>(null);
    const refreshToken = ref<string | null>(null);
    const userRole = ref<string | null>(null);

    // Getters
    const isAuthenticated = computed(() => !!authToken.value);
    const isAdmin = computed(() => userRole.value === 'admin');

    // Actions
    const setAuthData = (
        id,
        token,
        refresh,
        role
    ) => {
        userId.value = id;
        authToken.value = token;
        refreshToken.value = refresh;
        userRole.value = role;
    };

    const updateTokens = (token, refresh) => {
        authToken.value = token;
        refreshToken.value = refresh;
    };

    const logout = () => {
        userId.value = null;
        authToken.value = null;
        refreshToken.value = null;
        userRole.value = null;
    };

    return {
        userId,
        authToken,
        refreshToken,
        userRole,
        isAuthenticated,
        isAdmin,
        setAuthData,
        updateTokens,
        logout,
    };
});