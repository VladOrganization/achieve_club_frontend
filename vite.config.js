import {fileURLToPath, URL} from 'node:url'

import {defineConfig, loadEnv} from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import VueRouter from 'unplugin-vue-router/vite'
import tailwindcss from "@tailwindcss/vite"
import Components from 'unplugin-vue-components/vite'
import { PrimeVueResolver } from '@primevue/auto-import-resolver'

// https://vite.dev/config/
export default defineConfig(({mode}) => {
    const env = loadEnv(mode, process.cwd(), '')
    const apiTarget = `${env.VITE_API_URL || 'https://localhost'}:${env.VITE_API_PORT || 7170}`

    return {
        plugins: [
            VueRouter({}),
            vue(),
            tailwindcss(),
            Components({
                resolvers: [
                    PrimeVueResolver()
                ]
            }),
            vueDevTools(),
        ],
        resolve: {
            alias: {
                '@': fileURLToPath(new URL('./src', import.meta.url))
            },
        },
        server: {
            proxy: {
                '/media': {
                    target: apiTarget,
                    changeOrigin: true,
                    secure: false,
                    rewrite: (path) => path.replace(/^\/media/, ''),
                },
            },
        },
    }
})
