import "./assets/css/main.css"
import {createApp} from 'vue';
import PrimeVue from 'primevue/config';
import Aura from '@primeuix/themes/aura';
import {definePreset} from '@primeuix/themes';
import router from '@/router.js'
import App from './App.vue'
import {createPinia} from "pinia"
import persistedState from 'pinia-plugin-persistedstate'
import ToastService from 'primevue/toastservice'

const app = createApp(App);

// Основной цвет темы — оранжевый из логотипа ByteSchool (градиент #eec35a → #f56f10, середина #f38222)
const ByteSchool = definePreset(Aura, {
    semantic: {
        primary: {
            50: '#fff6ec',
            100: '#ffe9d0',
            200: '#fdd1a3',
            300: '#fab26b',
            400: '#f69a45',
            500: '#f38222',
            600: '#e96d12',
            700: '#c2540f',
            800: '#9a4314',
            900: '#7c3914',
            950: '#431c08',
        },
        // Тёплая нейтральная палитра (stone), чтобы серые элементы PrimeVue сочетались с оранжевым
        colorScheme: {
            light: {
                surface: {
                    0: '#ffffff',
                    50: '#fafaf9',
                    100: '#f5f5f4',
                    200: '#e7e5e4',
                    300: '#d6d3d1',
                    400: '#a8a29e',
                    500: '#78716c',
                    600: '#57534e',
                    700: '#44403c',
                    800: '#292524',
                    900: '#1c1917',
                    950: '#0c0a09',
                },
            },
        },
    },
});

app.use(PrimeVue, {
    theme: {
        preset: ByteSchool,
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

app.mount('#app')