import Vue from 'vue';
import Router from 'vue-router';
import store from '../store';

import LoginView from '../views/LoginView.vue';
import RegisterView from '../views/RegisterView.vue';
import ProductsView from '../views/ProductsView.vue';
import ProductDetailView from '../views/ProductDetailView.vue';
import CartView from '../views/CartView.vue';
import AdminProductsView from '../views/AdminProductsView.vue';
import AdminCategoriesView from '../views/AdminCategoriesView.vue';
import AdminOrdersView from '../views/AdminOrdersView.vue';
import AdminUsersView from '../views/AdminUsersView.vue';

Vue.use(Router);

const router = new Router({
  mode: 'history',
  routes: [
    { path: '/', redirect: '/products' },
    { path: '/login', name: 'login', component: LoginView, meta: { guest: true } },
    { path: '/register', name: 'register', component: RegisterView, meta: { guest: true } },
    { path: '/products', name: 'products', component: ProductsView, meta: { requiresAuth: true } },
    {
      path: '/products/:id',
      name: 'product-detail',
      component: ProductDetailView,
      meta: { requiresAuth: true },
    },
    { path: '/cart', name: 'cart', component: CartView, meta: { requiresAuth: true } },
    {
      path: '/admin/products',
      name: 'admin-products',
      component: AdminProductsView,
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/admin/categories',
      name: 'admin-categories',
      component: AdminCategoriesView,
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/admin/orders',
      name: 'admin-orders',
      component: AdminOrdersView,
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/admin/users',
      name: 'admin-users',
      component: AdminUsersView,
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    { path: '*', redirect: '/products' },
  ],
});

router.beforeEach((to, from, next) => {
  const authenticated = store.getters['auth/isAuthenticated'];
  const admin = store.getters['auth/isAdmin'];

  if (to.meta.guest && authenticated) return next('/products');
  if (to.meta.requiresAuth && !authenticated) {
    return next({ name: 'login', query: { redirect: to.fullPath } });
  }
  if (to.meta.requiresAdmin && !admin) return next('/products');
  return next();
});

export default router;
