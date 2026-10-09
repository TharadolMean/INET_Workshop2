<template>
  <div>
    <v-app-bar app color="surface" elevate-on-scroll>
      <v-app-bar-nav-icon class="d-md-none" @click="drawer = !drawer" />
      <v-toolbar-title class="font-weight-bold">
        <v-icon color="primary" left>mdi-lightning-bolt</v-icon>
        ElectroHub
      </v-toolbar-title>
      <v-spacer />
      <v-text-field
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
      <div class="d-none d-md-flex align-center">
        <v-btn text class="nav-link" to="/products">สินค้า</v-btn>
        <v-btn text class="nav-link" to="/cart">
          <v-badge :content="cartCount" :value="cartCount" color="secondary" overlap>
            <v-icon>mdi-cart-outline</v-icon>
          </v-badge>
          <span class="ml-2">ตะกร้า</span>
        </v-btn>
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
      <v-btn v-else outlined color="primary" to="/login">เข้าสู่ระบบ</v-btn>
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
        <v-list-item to="/products" @click="drawer = false">
          <v-list-item-icon><v-icon>mdi-storefront-outline</v-icon></v-list-item-icon>
          <v-list-item-title>สินค้า</v-list-item-title>
        </v-list-item>
        <v-list-item @click="searchProducts">
          <v-list-item-icon><v-icon>mdi-magnify</v-icon></v-list-item-icon>
          <v-list-item-title>ค้นหาสินค้า</v-list-item-title>
        </v-list-item>
        <v-list-item to="/cart" @click="drawer = false">
          <v-list-item-icon><v-icon>mdi-cart-outline</v-icon></v-list-item-icon>
          <v-list-item-title>ตะกร้าสินค้า ({{ cartCount }})</v-list-item-title>
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
      </v-list>
    </v-navigation-drawer>
  </div>
</template>

<script>
export default {
  name: 'AppNavbar',
  data: () => ({ drawer: false, searchTerm: '' }),
  computed: {
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
