import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'practice',
      component: () => import('../views/PracticeView.vue')
    },
    {
      path: '/mock-test',
      name: 'mock-test',
      component: () => import('../views/MockTestView.vue')
    },
    {
      path: '/stats',
      name: 'stats',
      component: () => import('../views/StatsView.vue')
    }
  ]
})

export default router
