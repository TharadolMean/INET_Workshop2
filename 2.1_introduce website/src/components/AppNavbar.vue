<template>
  <div>
    <v-app-bar app color="transparent" class="app-navbar" flat>
      <v-container class="d-flex align-center py-0">
        <v-btn text class="brand-button px-0" to="/" @click="closeDrawer">
          <span class="brand-mark">&lt;/&gt;</span>
          <span class="brand-name">Profile<span>.dev</span></span>
        </v-btn>

        <v-spacer />

        <div class="d-none d-md-flex align-center">
          <v-btn
            v-for="item in navItems"
            :key="item.to"
            text
            class="nav-link mx-1"
            :to="item.to"
            :class="{ 'nav-link--active': $route.path === item.to }"
          >
            {{ item.label }}
          </v-btn>
        </div>

        <v-app-bar-nav-icon
          class="d-md-none"
          aria-label="Open navigation menu"
          @click="drawer = !drawer"
        />
      </v-container>
    </v-app-bar>

    <v-navigation-drawer v-model="drawer" app temporary right color="#111827">
      <div class="pa-5">
        <div class="eyebrow mb-2">Explore</div>
        <div class="text-h6 font-weight-bold mb-6">My profile</div>
        <v-btn
          v-for="item in navItems"
          :key="item.to"
          block
          text
          class="drawer-link justify-start mb-2"
          :to="item.to"
          @click="closeDrawer"
        >
          <v-icon left small>{{ item.icon }}</v-icon>
          {{ item.label }}
        </v-btn>
      </div>
    </v-navigation-drawer>
  </div>
</template>

<script>
export default {
  name: 'AppNavbar',
  data () {
    return {
      drawer: false,
      navItems: [
        { label: 'Home', to: '/', icon: 'mdi-home-outline' },
        { label: 'About', to: '/about', icon: 'mdi-account-outline' },
        { label: 'Education', to: '/education', icon: 'mdi-school-outline' },
        { label: 'Strengths', to: '/strengths', icon: 'mdi-star-outline' }
      ]
    }
  },
  methods: {
    closeDrawer () {
      this.drawer = false
    }
  }
}
</script>

<style scoped>
.app-navbar {
  background: rgba(11, 17, 32, 0.84) !important;
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
  backdrop-filter: blur(16px);
}

.brand-button {
  color: #f8fafc !important;
  font-size: 1rem;
  letter-spacing: 0;
  text-transform: none;
}

.brand-mark {
  color: #a78bfa;
  font-size: 1.15rem;
  font-weight: 800;
  margin-right: 10px;
}

.brand-name {
  font-weight: 800;
}

.brand-name span {
  color: #a78bfa;
}

.nav-link {
  color: #a7b1c2 !important;
  font-size: 0.85rem;
  text-transform: none;
}

.nav-link:hover,
.nav-link--active {
  color: #f8fafc !important;
}

.nav-link--active::after {
  background: #8b5cf6;
  border-radius: 99px;
  bottom: 5px;
  content: '';
  height: 2px;
  left: 16px;
  position: absolute;
  right: 16px;
}

.drawer-link {
  color: #cbd5e1 !important;
  text-transform: none;
}
</style>
