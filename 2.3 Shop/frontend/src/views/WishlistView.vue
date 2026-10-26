<template>
  <div>
    <div class="text-overline primary--text">SAVED FOR LATER</div>
    <h1 class="page-title mb-6">รายการโปรด</h1>
    <v-alert v-if="error" type="error" outlined>{{ error }}</v-alert>
    <v-row v-if="loading"><v-col v-for="n in 4" :key="n" cols="12" sm="6" md="4"><v-skeleton-loader type="card" class="app-shell-card" /></v-col></v-row>
    <v-row v-else-if="items.length">
      <v-col v-for="product in items" :key="product._id" cols="12" sm="6" md="4">
        <product-card :product="product" @add="addToCart" @wishlist="addToWishlist" />
        <v-btn block text color="error" @click="remove(product)"><v-icon left>mdi-heart-off-outline</v-icon>นำออกจากรายการโปรด</v-btn>
      </v-col>
    </v-row>
    <v-card v-else class="app-shell-card pa-10 text-center"><v-icon size="56" color="secondary">mdi-heart-outline</v-icon><h2 class="mt-3">ยังไม่มีรายการโปรด</h2><v-btn color="primary" to="/products">เลือกดูสินค้า</v-btn></v-card>
    <v-snackbar v-model="snackbar" color="success">{{ message }}</v-snackbar>
  </div>
</template>

<script>
import ProductCard from '../components/products/ProductCard.vue';
import wishlistService from '../services/wishlistService';
import { getApiError } from '../services/api';

export default {
  name: 'WishlistView',
  components: { ProductCard },
  data: () => ({ items: [], loading: true, error: '', snackbar: false, message: '' }),
  created() { this.load(); },
  methods: {
    async load() {
      this.loading = true;
      try { const { data } = await wishlistService.list(); this.items = data.data || []; }
      catch (error) { this.error = getApiError(error, 'โหลดรายการโปรดไม่สำเร็จ'); }
      finally { this.loading = false; }
    },
    async remove(product) {
      try { const { data } = await wishlistService.remove(product._id); this.items = data.data || []; }
      catch (error) { this.error = getApiError(error, 'นำสินค้าออกไม่สำเร็จ'); }
    },
    async addToCart(product) {
      try { await this.$store.dispatch('cart/addToCart', { product, quantity: 1 }); this.message = 'เพิ่มสินค้าลงตะกร้าแล้ว'; this.snackbar = true; }
      catch (error) { this.error = error.message; }
    },
    async addToWishlist(product) {
      try { await wishlistService.add(product._id); this.message = 'สินค้าอยู่ในรายการโปรดแล้ว'; this.snackbar = true; }
      catch (error) { this.error = getApiError(error, 'บันทึกรายการโปรดไม่สำเร็จ'); }
    },
  },
};
</script>
