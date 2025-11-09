import { createRouter, createWebHistory } from 'vue-router'
import { routes } from 'vue-router/auto-routes'
import { useAuthStore } from '@/stores/auth.js'

const router = createRouter({
    history: createWebHistory(),
    routes
})

router.beforeEach((to, from, next) => {
    const authStore = useAuthStore()

    if (to.meta.requiresAuth && !authStore.isAuthenticated) {
        next('/login')
        return
    }

    const containsRolesPermissions = !!to.meta.requiresRoles

    if (containsRolesPermissions) {
        const allowAccess = to.meta.requiresRoles.includes(authStore.roleName)

        if (!allowAccess) {
            next('/login')
            return
        }
    }

    next()
})

export default router