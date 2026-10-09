<template>
  <div>
    <v-btn text color="primary" class="mb-5" to="/products">
      <v-icon left>mdi-arrow-left</v-icon>กลับไปหน้าสินค้า
    </v-btn>
    <v-alert v-if="error" type="error" outlined>{{ error }}</v-alert>
    <v-row v-else-if="loading">
      <v-col cols="12"><v-skeleton-loader type="article, actions" class="app-shell-card" /></v-col>
    </v-row>
    <v-card v-else-if="product" class="app-shell-card overflow-hidden">
      <v-row no-gutters>
        <v-col cols="12" md="5" class="product-image d-flex align-center justify-center pa-6" style="min-height: 420px;">
          <v-img
            v-if="product.image && product.image.path && !imageFailed"
            :src="product.image.path"
            max-height="390"
            contain
            @error="imageFailed = true"
          />
          <div v-else class="product-fallback text-center">
            <v-icon size="150" color="rgba(37,99,235,.28)">mdi-circuit-board</v-icon>
            <div class="caption muted-text">ภาพสินค้าจะแสดงที่นี่</div>
          </div>
        </v-col>
        <v-col cols="12" md="7">
          <v-card-text class="pa-6 pa-md-10">
            <div class="text-overline secondary--text">
              {{ (product.category && product.category.name) || 'อุปกรณ์อิเล็กทรอนิกส์' }}
            </div>
            <h1 class="page-title">{{ product.name }}</h1>
            <div class="price-text my-6">{{ formatPrice(product.price) }} บาท</div>
            <p class="muted-text text-body-1 product-detail-description">
              {{ product.description || 'รายละเอียดสินค้าจะแสดงที่นี่' }}
            </p>
            <v-chip :color="product.stock > 0 ? 'success' : 'error'" class="my-3">
              {{ product.stock > 0 ? `มีสินค้า ${product.stock} ชิ้น` : 'หมดสต็อก' }}
            </v-chip>
            <v-divider class="my-5" />
            <v-row align="end">
              <v-col cols="12" sm="4">
                <v-text-field v-model.number="quantity" type="number" min="1" :max="product.stock" label="จำนวน" outlined dense :disabled="product.stock < 1" />
              </v-col>
              <v-col cols="12" sm="8">
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
    imageFailed: false,
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
