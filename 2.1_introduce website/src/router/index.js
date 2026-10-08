import Vue from 'vue'
import VueRouter from 'vue-router'
import HomeView from '../views/HomeView.vue'
import AboutView from '../views/AboutView.vue'
import EducationView from '../views/EducationView.vue'
import StrengthsView from '../views/StrengthsView.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView
  },
  {
    path: '/about',
    name: 'about',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: AboutView
  },
  {
    path: '/education',
    name: 'education',
    component: EducationView
  },
  {
    path: '/strengths',
    name: 'strengths',
    component: StrengthsView
  }
]

const router = new VueRouter({
  routes
})

export default router
