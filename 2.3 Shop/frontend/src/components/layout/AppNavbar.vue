<template>
  <div>
    <v-app-bar app color="surface" elevate-on-scroll>
      <v-app-bar-nav-icon class="d-lg-none" @click="drawer = !drawer" />
      <v-toolbar-title class="font-weight-bold d-flex align-center">
        <v-avatar size="34" class="brand-mark mr-2">
          <v-icon color="white" small>mdi-lightning-bolt</v-icon>
        </v-avatar>
        <span class="brand-name">ElectroHub</span>
      </v-toolbar-title>
      <v-spacer />
      <v-btn icon class="mr-1" :aria-label="darkTheme ? 'เปลี่ยนเป็นธีมสว่าง' : 'เปลี่ยนเป็นธีมมืด'" @click="toggleTheme">
        <v-icon>{{ darkTheme ? 'mdi-white-balance-sunny' : 'mdi-moon-waning-crescent' }}</v-icon>
      </v-btn>
      <v-text-field
        v-if="!isAdmin"
        v-model="searchTerm"
        class="nav-search d-none d-lg-flex mr-4"
        label="ค้นหาสินค้า"
        prepend-inner-icon="mdi-magnify"
        append-icon="mdi-arrow-right"
        clearable
        dense
        outlined
        hide-details
        @keyup.enter="searchProducts"
        @click:append="searchProducts"
      />
      <div class="d-none d-lg-flex align-center">
        <template v-if="!isAdmin">
          <v-btn text class="nav-link" to="/products">สินค้า</v-btn>
          <v-btn text class="nav-link" :to="isAuthenticated ? '/cart' : { name: 'login', query: { redirect: '/cart' } }">
            <v-badge :content="cartCount" :value="cartCount" color="secondary" overlap>
              <v-icon>mdi-cart-outline</v-icon>
            </v-badge>
            <span class="ml-2">ตะกร้า</span>
          </v-btn>
        </template>
        <v-btn v-if="isAuthenticated && !isAdmin" text class="nav-link" to="/my-orders">คำสั่งซื้อของฉัน</v-btn>
        <v-btn v-if="isAuthenticated && !isAdmin" icon class="nav-link" aria-label="รายการโปรด" to="/wishlist"><v-icon>mdi-heart-outline</v-icon></v-btn>
        <v-btn v-if="isAuthenticated && !isAdmin" text class="nav-link" to="/account">บัญชีของฉัน</v-btn>
        <div v-if="isAdmin" class="admin-nav-links d-flex align-center">
          <v-btn text class="nav-link" to="/admin/products">จัดการสินค้า</v-btn>
          <v-btn text class="nav-link" to="/admin/categories">หมวดหมู่</v-btn>
          <v-btn text class="nav-link" to="/admin/orders">ออเดอร์</v-btn>
          <v-btn text class="nav-link" to="/admin/users">ผู้ใช้</v-btn>
        </div>
      </div>
      <v-btn v-if="isAuthenticated" icon class="ml-2" aria-label="ออกจากระบบ" @click="logout">
        <v-icon>mdi-logout</v-icon>
      </v-btn>
      <template v-else>
        <v-btn text class="d-none d-sm-inline-flex" to="/register">สมัครสมาชิก</v-btn>
        <v-btn outlined color="primary" to="/login">เข้าสู่ระบบ</v-btn>
      </template>
    </v-app-bar>

    <v-navigation-drawer v-model="drawer" app temporary>
      <v-list nav>
        <v-list-item v-if="currentUser" class="mb-3">
          <v-list-item-avatar color="primary">
            <v-icon>mdi-account</v-icon>
          </v-list-item-avatar>
          <v-list-item-content>
            <v-list-item-title>{{ currentUser.name }}</v-list-item-title>
            <v-list-item-subtitle>{{ isAdmin ? 'ผู้ดูแลระบบ' : 'ลูกค้า' }}</v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>
        <v-divider />
        <v-list-item v-if="!isAdmin" class="py-2">
          <v-text-field
            v-model="searchTerm"
            label="ค้นหาสินค้า"
            prepend-inner-icon="mdi-magnify"
            outlined
            dense
            hide-details
            @keyup.enter="searchProducts"
          />
        </v-list-item>
        <template v-if="!isAdmin">
          <v-list-item to="/products" @click="drawer = false">
            <v-list-item-icon><v-icon>mdi-storefront-outline</v-icon></v-list-item-icon>
            <v-list-item-title>สินค้า</v-list-item-title>
          </v-list-item>
          <v-list-item @click="searchProducts">
            <v-list-item-icon><v-icon>mdi-magnify</v-icon></v-list-item-icon>
            <v-list-item-title>ค้นหาสินค้า</v-list-item-title>
          </v-list-item>
          <v-list-item :to="isAuthenticated ? '/cart' : { name: 'login', query: { redirect: '/cart' } }" @click="drawer = false">
            <v-list-item-icon><v-icon>mdi-cart-outline</v-icon></v-list-item-icon>
            <v-list-item-title>ตะกร้าสินค้า ({{ cartCount }})</v-list-item-title>
          </v-list-item>
        </template>
        <v-list-item v-if="isAuthenticated && !isAdmin" to="/my-orders" @click="drawer = false">
          <v-list-item-icon><v-icon>mdi-clipboard-list-outline</v-icon></v-list-item-icon>
          <v-list-item-title>คำสั่งซื้อของฉัน</v-list-item-title>
        </v-list-item>
        <v-list-item v-if="isAuthenticated && !isAdmin" to="/wishlist" @click="drawer = false"><v-list-item-icon><v-icon>mdi-heart-outline</v-icon></v-list-item-icon><v-list-item-title>รายการโปรด</v-list-item-title></v-list-item>
        <v-list-item v-if="isAuthenticated && !isAdmin" to="/account" @click="drawer = false"><v-list-item-icon><v-icon>mdi-account-cog-outline</v-icon></v-list-item-icon><v-list-item-title>บัญชีของฉัน</v-list-item-title></v-list-item>
        <v-list-item @click="toggleTheme">
          <v-list-item-icon><v-icon>{{ darkTheme ? 'mdi-white-balance-sunny' : 'mdi-moon-waning-crescent' }}</v-icon></v-list-item-icon>
          <v-list-item-title>{{ darkTheme ? 'ใช้ธีมสว่าง' : 'ใช้ธีมมืด' }}</v-list-item-title>
        </v-list-item>
        <template v-if="isAdmin">
          <v-subheader>การจัดการ</v-subheader>
          <v-list-item to="/admin/products" @click="drawer = false"><v-list-item-title>สินค้า</v-list-item-title></v-list-item>
          <v-list-item to="/admin/categories" @click="drawer = false"><v-list-item-title>หมวดหมู่</v-list-item-title></v-list-item>
          <v-list-item to="/admin/orders" @click="drawer = false"><v-list-item-title>คำสั่งซื้อ</v-list-item-title></v-list-item>
          <v-list-item to="/admin/users" @click="drawer = false"><v-list-item-title>ผู้ใช้</v-list-item-title></v-list-item>
        </template>
        <v-list-item v-if="isAuthenticated" @click="logout">
          <v-list-item-icon><v-icon>mdi-logout</v-icon></v-list-item-icon>
          <v-list-item-title>ออกจากระบบ</v-list-item-title>
        </v-list-item>
        <v-list-item v-else to="/login" @click="drawer = false">
          <v-list-item-icon><v-icon>mdi-login</v-icon></v-list-item-icon>
          <v-list-item-title>เข้าสู่ระบบ</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>
  </div>
</template>

<script>
export default {
  name: 'AppNavbar',
  data: () => ({ drawer: false, searchTerm: '' }),
  computed: {
    darkTheme() {
      return this.$vuetify.theme.dark;
    },
    isAuthenticated() {
      return this.$store.getters['auth/isAuthenticated'];
    },
    isAdmin() {
      return this.$store.getters['auth/isAdmin'];
    },
    currentUser() {
      return this.$store.getters['auth/currentUser'];
    },
    cartCount() {
      return this.$store.getters['cart/count'];
    },
  },
  methods: {
    toggleTheme() {
      const dark = !this.$vuetify.theme.dark;
      this.$vuetify.theme.dark = dark;
      localStorage.setItem('electrohub_theme', dark ? 'dark' : 'light');
      document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    },
    searchProducts() {
      this.drawer = false;
      this.$router.push({
        name: 'products',
        query: this.searchTerm.trim() ? { q: this.searchTerm.trim() } : {},
      });
    },
    logout() {
      this.$store.dispatch('auth/logout');
      this.drawer = false;
      if (this.$route.name !== 'login') this.$router.push('/login');
    },
  },
};
</script>
