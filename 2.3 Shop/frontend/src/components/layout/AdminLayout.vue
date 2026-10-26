<template>
  <div class="admin-layout">
    <v-navigation-drawer
      :value="isLargeScreen || drawerOpen"
      :permanent="isLargeScreen"
      :temporary="!isLargeScreen"
      app
      width="252"
      class="admin-sidebar"
      @input="drawerOpen = $event"
    >
      <div class="admin-sidebar-brand">
        <v-avatar size="36" class="admin-brand-mark mr-3">
          <v-icon color="white" small>mdi-lightning-bolt</v-icon>
        </v-avatar>
        <div>
          <div class="admin-brand-name">ElectroHub</div>
          <div class="admin-brand-label">ADMIN PANEL</div>
        </div>
      </div>

      <v-divider />
      <div class="admin-nav-caption">จัดการระบบ</div>
      <v-list dense nav class="admin-nav-list">
        <v-list-item
          v-for="item in navigationItems"
          :key="item.name"
          :to="{ name: item.name }"
          exact
          active-class="admin-nav-item--active"
          class="admin-nav-item"
        >
          <v-list-item-icon><v-icon>{{ item.icon }}</v-icon></v-list-item-icon>
          <v-list-item-title>{{ item.title }}</v-list-item-title>
        </v-list-item>
      </v-list>

      <template v-slot:append>
        <div class="admin-sidebar-footer">
          <v-divider class="mb-2" />
          <v-list dense nav>
            <v-list-item class="admin-logout-item" @click="logout">
              <v-list-item-icon><v-icon>mdi-logout</v-icon></v-list-item-icon>
              <v-list-item-title>ออกจากระบบ</v-list-item-title>
            </v-list-item>
          </v-list>
        </div>
      </template>
    </v-navigation-drawer>

    <v-app-bar app flat class="admin-topbar">
      <v-app-bar-nav-icon
        v-if="!isLargeScreen"
        aria-label="เปิดเมนูผู้ดูแลระบบ"
        @click="drawerOpen = !drawerOpen"
      />
      <div class="admin-breadcrumb">
        <span>Admin</span>
        <v-icon small>mdi-chevron-right</v-icon>
        <strong>{{ pageTitle }}</strong>
      </div>
      <v-spacer />
      <v-btn icon class="mr-2" :aria-label="darkTheme ? 'เปลี่ยนเป็นธีมสว่าง' : 'เปลี่ยนเป็นธีมมืด'" @click="toggleTheme">
        <v-icon>{{ darkTheme ? 'mdi-white-balance-sunny' : 'mdi-moon-waning-crescent' }}</v-icon>
      </v-btn>
      <v-avatar size="34" class="admin-user-avatar mr-2">
        <v-icon small>mdi-account</v-icon>
      </v-avatar>
      <div class="admin-user-info">
        <div class="admin-user-name">{{ currentUser?.name || 'ผู้ดูแลระบบ' }}</div>
        <div class="admin-user-role">ผู้ดูแลระบบ</div>
      </div>
    </v-app-bar>

    <v-main class="admin-main">
      <v-container fluid class="admin-content">
        <transition name="fade" mode="out-in">
          <router-view />
        </transition>
      </v-container>
    </v-main>
  </div>
</template>

<script>
export default {
  name: 'AdminLayout',
  data: () => ({
    drawerOpen: false,
    navigationItems: [
      { name: 'admin-dashboard', title: 'ภาพรวม', icon: 'mdi-view-dashboard-outline' },
      { name: 'admin-products', title: 'จัดการสินค้า', icon: 'mdi-package-variant-closed' },
      { name: 'admin-categories', title: 'จัดการหมวดหมู่', icon: 'mdi-shape-outline' },
      { name: 'admin-orders', title: 'คำสั่งซื้อ', icon: 'mdi-clipboard-list-outline' },
      { name: 'admin-users', title: 'ผู้ใช้งาน', icon: 'mdi-account-multiple-outline' },
      { name: 'admin-coupons', title: 'คูปองส่วนลด', icon: 'mdi-ticket-percent-outline' },
    ],
  }),
  computed: {
    darkTheme() {
      return this.$vuetify.theme.dark;
    },
    isLargeScreen() {
      return this.$vuetify.breakpoint.lgAndUp;
    },
    currentUser() {
      return this.$store.getters['auth/currentUser'];
    },
    pageTitle() {
      const titles = {
        'admin-dashboard': 'ภาพรวม',
        'admin-products': 'สินค้า',
        'admin-categories': 'หมวดหมู่',
        'admin-orders': 'คำสั่งซื้อ',
        'admin-users': 'ผู้ใช้งาน',
        'admin-coupons': 'คูปองส่วนลด',
      };
      return titles[this.$route.name] || 'จัดการระบบ';
    },
  },
  watch: {
    '$route.name'() {
      this.drawerOpen = false;
    },
  },
  methods: {
    toggleTheme() {
      const dark = !this.$vuetify.theme.dark;
      this.$vuetify.theme.dark = dark;
      localStorage.setItem('electrohub_theme', dark ? 'dark' : 'light');
      document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    },
    logout() {
      this.$store.dispatch('auth/logout');
      this.$router.replace({ name: 'login' });
    },
  },
};
</script>
