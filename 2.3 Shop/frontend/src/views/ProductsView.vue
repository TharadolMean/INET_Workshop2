<template>
  <div>
    <v-row align="center" class="mb-6">
      <v-col cols="12" md="7">
        <div class="text-overline primary--text">SMART SHOPPING / ELECTRONICS</div>
        <h1 class="page-title">อุปกรณ์ที่ใช่สำหรับคุณ</h1>
        <p class="muted-text mb-0">เลือกดูสินค้าเทคโนโลยีคุณภาพ พร้อมสต็อกแบบเรียลไทม์</p>
      </v-col>
      <v-col cols="12" md="5">
        <v-text-field v-model="search" label="ค้นหาสินค้า" prepend-inner-icon="mdi-magnify" outlined hide-details />
      </v-col>
    </v-row>

    <v-alert v-if="error" type="error" outlined class="mb-6">
      {{ error }}
      <template #append><v-btn text @click="load">ลองใหม่</v-btn></template>
    </v-alert>

    <v-row v-if="loading">
      <v-col v-for="n in 8" :key="n" cols="12" sm="6" md="4" lg="3">
        <v-skeleton-loader type="card" class="app-shell-card" />
      </v-col>
    </v-row>
    <v-row v-else-if="filteredProducts.length">
      <v-col v-for="product in filteredProducts" :key="product._id" cols="12" sm="6" md="4" lg="3">
        <product-card :product="product" @add="addToCart" />
      </v-col>
    </v-row>
    <v-card v-else class="app-shell-card pa-12 text-center">
      <v-icon size="64" color="secondary">mdi-package-variant-closed</v-icon>
      <h2 class="mt-4">ไม่พบสินค้า</h2>
      <p class="muted-text mb-0">ลองค้นหาด้วยคำอื่น หรือกลับมาใหม่ภายหลัง</p>
    </v-card>

    <v-snackbar v-model="snackbar" :color="snackbarColor">{{ snackbarText }}</v-snackbar>
  </div>
</template>

<script>
import ProductCard from '../components/products/ProductCard.vue';
import { getApiError } from '../services/api';

export default {
  name: 'ProductsView',
  components: { ProductCard },
  data: () => ({
    search: '',
    error: '',
    snackbar: false,
    snackbarText: '',
    snackbarColor: 'success',
  }),
  computed: {
    products() {
      return this.$store.getters['products/products'];
    },
    loading() {
      return this.$store.state.products.loading;
    },
    filteredProducts() {
      const keyword = this.search.toLowerCase().trim();
      return this.products.filter((product) =>
        !keyword || `${product.name} ${product.description}`.toLowerCase().includes(keyword));
    },
  },
  created() {
    this.load();
  },
  methods: {
    async load() {
      this.error = '';
      try {
        await this.$store.dispatch('products/fetchProducts');
      } catch (error) {
        this.error = getApiError(error, 'โหลดสินค้าไม่สำเร็จ');
      }
    },
    async addToCart(product) {
      try {
        await this.$store.dispatch('cart/addToCart', { product, quantity: 1 });
        this.showMessage(`เพิ่ม ${product.name} ลงตะกร้าแล้ว`, 'success');
      } catch (error) {
        this.showMessage(error.message || 'เพิ่มสินค้าลงตะกร้าไม่สำเร็จ', 'error');
      }
    },
    showMessage(text, color) {
      this.snackbarText = text;
      this.snackbarColor = color;
      this.snackbar = true;
    },
  },
};
</script>
