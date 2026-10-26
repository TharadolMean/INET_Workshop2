import Vue from 'vue';
import Router from 'vue-router';
import store from '../store';

import LoginView from '../views/LoginView.vue';
import RegisterView from '../views/RegisterView.vue';
import ProductsView from '../views/ProductsView.vue';
import ProductDetailView from '../views/ProductDetailView.vue';
import CartView from '../views/CartView.vue';
import MyOrdersView from '../views/MyOrdersView.vue';
import AdminLayout from '../components/layout/AdminLayout.vue';
import AdminProductsView from '../views/AdminProductsView.vue';
import AdminCategoriesView from '../views/AdminCategoriesView.vue';
import AdminOrdersView from '../views/AdminOrdersView.vue';
import AdminUsersView from '../views/AdminUsersView.vue';
import AdminDashboardView from '../views/AdminDashboardView.vue';

Vue.use(Router);

const router = new Router({
  mode: 'history',
  routes: [
    {
      path: '/',
      redirect: () => (store.getters['auth/isAdmin'] ? '/admin/dashboard' : '/products'),
    },
    { path: '/login', name: 'login', component: LoginView, meta: { guest: true } },
    { path: '/register', name: 'register', component: RegisterView, meta: { guest: true } },
    { path: '/products', name: 'products', component: ProductsView, meta: { requiresAuth: true, requiresCustomer: true } },
    {
      path: '/products/:id',
      name: 'product-detail',
      component: ProductDetailView,
      meta: { requiresAuth: true, requiresCustomer: true },
    },
    { path: '/cart', name: 'cart', component: CartView, meta: { requiresAuth: true, requiresCustomer: true } },
    {
      path: '/my-orders',
      name: 'my-orders',
      component: MyOrdersView,
      meta: { requiresAuth: true, requiresCustomer: true },
    },
    {
      path: '/admin',
      component: AdminLayout,
      meta: { adminLayout: true },
      children: [
        { path: '', redirect: { name: 'admin-dashboard' } },
        {
          path: 'dashboard',
          name: 'admin-dashboard',
          component: AdminDashboardView,
          meta: { requiresAuth: true, requiresAdmin: true },
        },
        {
          path: 'products',
          name: 'admin-products',
          component: AdminProductsView,
          meta: { requiresAuth: true, requiresAdmin: true },
        },
        {
          path: 'categories',
          name: 'admin-categories',
          component: AdminCategoriesView,
          meta: { requiresAuth: true, requiresAdmin: true },
        },
        {
          path: 'orders',
          name: 'admin-orders',
          component: AdminOrdersView,
          meta: { requiresAuth: true, requiresAdmin: true },
        },
        {
          path: 'users',
          name: 'admin-users',
          component: AdminUsersView,
          meta: { requiresAuth: true, requiresAdmin: true },
        },
      ],
    },
    { path: '*', redirect: '/products' },
  ],
});

router.beforeEach((to, from, next) => {
  const authenticated = store.getters['auth/isAuthenticated'];
  const admin = store.getters['auth/isAdmin'];
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);
  const requiresAdmin = to.matched.some((record) => record.meta.requiresAdmin);
  const requiresCustomer = to.matched.some((record) => record.meta.requiresCustomer);
  const guestOnly = to.matched.some((record) => record.meta.guest);

  if (guestOnly && authenticated) return next(admin ? '/admin/dashboard' : '/products');
  if (requiresAuth && !authenticated) {
    return next({ name: 'login', query: { redirect: to.fullPath } });
  }
  if (requiresCustomer && admin) return next('/admin/dashboard');
  if (requiresAdmin && !admin) return next('/products');
  return next();
});

export default router;
