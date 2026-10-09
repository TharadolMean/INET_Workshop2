<template>
  <v-app>
    <app-navbar />
    <v-main>
      <v-container fluid class="py-8">
        <transition name="fade" mode="out-in">
          <router-view />
        </transition>
      </v-container>
    </v-main>
    <app-footer />
    <v-snackbar v-model="expiredMessage" color="warning" top>
      เซสชันหมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง
    </v-snackbar>
  </v-app>
</template>

<script>
import AppNavbar from './components/layout/AppNavbar.vue';
import AppFooter from './components/layout/AppFooter.vue';

export default {
  name: 'App',
  components: { AppNavbar, AppFooter },
  data: () => ({ expiredMessage: false }),
  created() {
    window.addEventListener('shop-auth-expired', this.handleExpired);
  },
  beforeDestroy() {
    window.removeEventListener('shop-auth-expired', this.handleExpired);
  },
  methods: {
    handleExpired() {
      this.$store.dispatch('auth/logout');
      this.expiredMessage = true;
      if (this.$route.name !== 'login') this.$router.push({ name: 'login' });
    },
  },
};
</script>
