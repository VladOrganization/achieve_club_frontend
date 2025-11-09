import "./assets/css/main.css"
import {createApp} from 'vue';
import PrimeVue from 'primevue/config';
import Aura from '@primeuix/themes/aura';
import router from '@/router.js'
import App from './App.vue'
import {createPinia} from "pinia"
import persistedState from 'pinia-plugin-persistedstate'
import ToastService from 'primevue/toastservice'

const app = createApp(App);

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

app.mount('#app')