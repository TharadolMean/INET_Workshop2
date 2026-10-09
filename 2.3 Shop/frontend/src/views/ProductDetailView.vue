<template>
  <div>
    <v-btn text color="secondary" class="mb-5" to="/products">
      <v-icon left>mdi-arrow-left</v-icon>กลับไปหน้าสินค้า
    </v-btn>
    <v-alert v-if="error" type="error" outlined>{{ error }}</v-alert>
    <v-row v-else-if="loading">
      <v-col cols="12"><v-skeleton-loader type="article, actions" class="app-shell-card" /></v-col>
    </v-row>
    <v-card v-else-if="product" class="app-shell-card overflow-hidden">
      <v-row no-gutters>
        <v-col cols="12" md="5" class="product-image d-flex align-center justify-center" style="min-height: 360px;">
          <v-icon size="150" color="rgba(255,255,255,.55)">mdi-circuit-board</v-icon>
        </v-col>
        <v-col cols="12" md="7">
          <v-card-text class="pa-8">
            <div class="text-overline secondary--text">ELECTRONICS PRODUCT</div>
            <h1 class="page-title">{{ product.name }}</h1>
            <div class="price-text my-5">{{ formatPrice(product.price) }} บาท</div>
            <p class="muted-text text-body-1">{{ product.description || 'รายละเอียดสินค้าจะแสดงที่นี่' }}</p>
            <v-chip :color="product.stock > 0 ? 'success' : 'error'" class="my-3">
              {{ product.stock > 0 ? `มีสินค้า ${product.stock} ชิ้น` : 'หมดสต็อก' }}
            </v-chip>
            <v-divider class="my-5" />
            <v-row align="center">
              <v-col cols="12" sm="5">
                <v-text-field v-model.number="quantity" type="number" min="1" :max="product.stock" label="จำนวน" outlined :disabled="product.stock < 1" />
              </v-col>
              <v-col cols="12" sm="7">
                <v-btn block large color="primary" :disabled="!canAdd" @click="addToCart">
                  <v-icon left>mdi-cart-plus</v-icon>เพิ่มลงตะกร้า
                </v-btn>
              </v-col>
            </v-row>
          </v-card-text>
        </v-col>
      </v-row>
    </v-card>
    <v-snackbar v-model="snackbar" :color="snackbarColor">{{ snackbarText }}</v-snackbar>
  </div>
</template>

<script>
import productService from '../services/productService';
import { getApiError } from '../services/api';

export default {
  name: 'ProductDetailView',
  data: () => ({
    product: null,
    quantity: 1,
    loading: true,
    error: '',
    snackbar: false,
    snackbarText: '',
    snackbarColor: 'success',
  }),
  computed: {
    canAdd() {
      return this.product && this.product.stock > 0 && Number.isInteger(this.quantity) &&
        this.quantity >= 1 && this.quantity <= this.product.stock;
    },
  },
  created() {
    this.load();
  },
  methods: {
    async load() {
      try {
        const { data } = await productService.get(this.$route.params.id);
        this.product = data.data;
      } catch (error) {
        this.error = getApiError(error, 'ไม่พบสินค้านี้');
      } finally {
        this.loading = false;
      }
    },
    async addToCart() {
      if (!this.canAdd) {
        this.showMessage('กรุณาระบุจำนวนสินค้าให้ถูกต้องและไม่เกินสต็อก', 'error');
        return;
      }
      try {
        await this.$store.dispatch('cart/addToCart', { product: this.product, quantity: this.quantity });
        this.showMessage('เพิ่มสินค้าลงตะกร้าแล้ว', 'success');
      } catch (error) {
        this.showMessage(error.message, 'error');
      }
    },
    formatPrice(value) {
      return new Intl.NumberFormat('th-TH', { maximumFractionDigits: 2 }).format(value);
    },
    showMessage(text, color) {
      this.snackbarText = text;
      this.snackbarColor = color;
      this.snackbar = true;
    },
  },
};
</script>
