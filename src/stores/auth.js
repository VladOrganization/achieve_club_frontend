import {defineStore} from 'pinia';
import {ref, computed} from 'vue';

// "Запомнить меня": true -> localStorage, false -> sessionStorage (до закрытия вкладки)
const rememberStorage = {
    getItem: (key) => sessionStorage.getItem(key) ?? localStorage.getItem(key),
    setItem: (key, value) => {
        let remember = true;
        try {
            remember = JSON.parse(value).remember !== false;
        } catch {
        }
        const [target, other] = remember ? [localStorage, sessionStorage] : [sessionStorage, localStorage];
        target.setItem(key, value);
        other.removeItem(key);
    },
    removeItem: (key) => {
        sessionStorage.removeItem(key);
        localStorage.removeItem(key);
    },
};

export const useAuthStore = defineStore('auth', () => {
    // State
    const userId = ref(null);
    const authToken = ref(null);
    const refreshToken = ref(null);
    const userRole = ref(null);
    const remember = ref(true);

    // Getters
    const isAuthenticated = computed(() => !!refreshToken.value);

    const roleMap = new Map([
        [1, 'student'],
        [2, 'admin'],
        [3, 'supervisor']
    ]);

    const roleName = computed(() => roleMap.get(userRole.value));

    // Actions
    const setAuthData = (
        id,
        token,
        refresh,
        role,
        rememberMe = true
    ) => {
        remember.value = rememberMe;
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
        remember.value = true;
    };

    return {
        userId,
        authToken,
        refreshToken,
        userRole,
        remember,
        isAuthenticated,
        roleName,
        setAuthData,
        updateTokens,
        logout,
    };
}, {
    persist: {
        key: 'auth-data',
        enabled: true,
        storage: rememberStorage,
        pick: ['userId', 'refreshToken', 'userRole', 'remember'],
        omit: ['authToken']
    }
});