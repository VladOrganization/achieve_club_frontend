import "./assets/css/main.css"
import {createApp} from 'vue';
import PrimeVue from 'primevue/config';
import Aura from '@primeuix/themes/aura';
import {createRouter, createWebHistory} from 'vue-router'
import {routes, handleHotUpdate} from 'vue-router/auto-routes'
import App from './App.vue'
import {createPinia} from "pinia";

const app = createApp(App);

const router = createRouter({
    history: createWebHistory(),
    routes
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

app.use(pinia);

if (import.meta.hot) {
    handleHotUpdate(router)
}

app.mount('#app')
