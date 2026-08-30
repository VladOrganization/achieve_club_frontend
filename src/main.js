import "./assets/css/main.css"
import {createApp} from 'vue';
import PrimeVue from 'primevue/config';
import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';
import router from '@/router.js'
import App from './App.vue'
import {createPinia} from "pinia"
import persistedState from 'pinia-plugin-persistedstate'
import ToastService from 'primevue/toastservice'
import ConfirmationService from 'primevue/confirmationservice'

const AchievePreset = definePreset(Aura, {
    semantic: {
        primary: {
            50: '#fef3eb',
            100: '#fde4d0',
            200: '#fbc7a3',
            300: '#f8a066',
            400: '#f78a3d',
            500: '#F56E0F',
            600: '#d45c0c',
            700: '#b04c0a',
            800: '#8c3c08',
            900: '#6a2d06',
            950: '#3d1a03',
        },
    },
})

const app = createApp(App);

app.use(PrimeVue, {
    theme: {
        preset: AchievePreset,
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
app.use(ConfirmationService);

app.mount('#app')
