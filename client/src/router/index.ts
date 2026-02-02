import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            name: 'login',
            component: LoginView,
        },
        {
            path: '/lobby',
            name: 'lobby',
            component: () => import('../views/LobbyView.vue'),
        },
        {
            path: '/match',
            name: 'match',
            component: () => import('../views/MatchView.vue'),
        },
        {
            path: '/deck',
            name: 'deck',
            component: () => import('../views/DeckView.vue'),
        },
    ],
})

export default router
