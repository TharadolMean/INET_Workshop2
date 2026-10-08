<template>
  <v-app>
    <AppNavbar />
    <v-main>
      <router-view />
    </v-main>
    <footer class="site-footer">
      <v-container class="d-flex flex-wrap align-center justify-space-between py-5">
        <span class="footer-brand">Profile<span>.dev</span></span>
        <span class="footer-note">Built with Vue 2 & Vuetify</span>
      </v-container>
    </footer>
  </v-app>
</template>

<script>
import AppNavbar from '@/components/AppNavbar.vue'

export default {
  name: 'App',
  components: {
    AppNavbar
  }
}
</script>

<style scoped>
.site-footer {
  border-top: 1px solid rgba(148, 163, 184, 0.1);
}

.footer-brand {
  color: #f8fafc;
  font-size: 0.9rem;
  font-weight: 800;
}

.footer-brand span {
  color: #a78bfa;
}

.footer-note {
  color: #718096;
  font-size: 0.75rem;
}

@media (max-width: 600px) {
  .site-footer .container {
    align-items: flex-start !important;
    flex-direction: column;
    gap: 8px;
  }
}
</style>
