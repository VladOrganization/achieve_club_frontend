import "./assets/css/main.css"
import {createApp} from 'vue';
import PrimeVue from 'primevue/config';
import Aura from '@primeuix/themes/aura';
import {createRouter, createWebHistory} from 'vue-router'
import {routes, handleHotUpdate} from 'vue-router/auto-routes'
import App from './App.vue'
import {createPinia} from "pinia"
import {useAuthStore} from "@/stores/auth.js"
import persistedState from 'pinia-plugin-persistedstate'
import ToastService from 'primevue/toastservice'

const app = createApp(App);

const router = createRouter({
    history: createWebHistory(),
    routes
})

router.beforeEach((to, from, next) => {
    const authStore = useAuthStore()

    console.log("meta", to.meta)

    if (to.meta.requiresAuth && !authStore.isAuthenticated) {
        next('/login')
        return
    }

    const containsRolesPermissions = !!to.meta.requiresRoles

    if (containsRolesPermissions) {
        const allowAccess = to.meta.requiresRoles.includes(authStore.userRole)

        if (!allowAccess) {
            next('/login')
            return
        }
    }

    next()
});

app.use(PrimeVue, {
    theme: {
        preset: Aura,
        options: {
            darkModeSelector: ".p-dark",
        },
    }
});

app.use(router);

const pinia = createPinia()

pinia.use(persistedState)

app.use(pinia);

app.use(ToastService);


if (import.meta.hot) {
    handleHotUpdate(router)
}

app.mount('#app')
