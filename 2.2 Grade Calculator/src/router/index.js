import Vue from 'vue'
import VueRouter from 'vue-router'
import GradeCalculatorView from '../views/GradeCalculatorView.vue'

Vue.use(VueRouter)

export default new VueRouter({
  mode: 'hash',
  routes: [
    {
      path: '/',
      redirect: '/grade-calculator'
    },
    {
      path: '/grade-calculator',
      name: 'grade-calculator',
      component: GradeCalculatorView
    }
  ]
})
