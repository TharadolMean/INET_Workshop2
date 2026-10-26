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
            v-if="selectedImage && !imageFailed"
            :src="selectedImage"
            max-height="390"
            contain
            :alt="`รูปสินค้า ${product.name}`"
            @error="imageFailed = true"
          />
          <div v-else class="product-fallback text-center">
            <v-icon size="150" color="rgba(37,99,235,.28)">mdi-circuit-board</v-icon>
            <div class="caption muted-text">ภาพสินค้าจะแสดงที่นี่</div>
          </div>
          <div v-if="galleryImages.length > 1" class="product-gallery-thumbnails" role="group" aria-label="เลือกรูปสินค้า">
            <v-btn
              v-for="(image, index) in galleryImages"
              :key="image"
              icon
              :aria-label="`แสดงรูปสินค้า ${index + 1}`"
              :aria-pressed="selectedGalleryIndex === index"
              :class="{ 'product-gallery-thumbnail--selected': selectedGalleryIndex === index }"
              @click="selectedGalleryIndex = index; imageFailed = false"
            >
              <v-img :src="image" :alt="`รูปสินค้า ${product.name} มุมที่ ${index + 1}`" width="42" height="42" contain />
            </v-btn>
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
                <v-btn v-if="isAuthenticated" block large color="primary" :disabled="!canAdd" @click="addToCart">
                  <v-icon left>mdi-cart-plus</v-icon>เพิ่มลงตะกร้า
                </v-btn>
                <v-btn v-else block large color="primary" :to="{ name: 'login', query: { redirect: '/cart' } }">
                  <v-icon left>mdi-login</v-icon>เข้าสู่ระบบเพื่อสั่งซื้อ
                </v-btn>
              </v-col>
            </v-row>
          </v-card-text>
        </v-col>
      </v-row>
    </v-card>
    <v-row v-if="product && product.specifications && product.specifications.length" class="mt-6">
      <v-col cols="12" md="7">
        <v-card class="app-shell-card pa-6">
          <div class="text-overline primary--text">PRODUCT DETAILS</div>
          <h2 class="section-heading mb-4">ข้อมูลจำเพาะ</h2>
          <v-simple-table class="specification-table">
            <tbody><tr v-for="specification in product.specifications" :key="specification.name">
              <th scope="row">{{ specification.name }}</th><td>{{ specification.value }}</td>
            </tr></tbody>
          </v-simple-table>
        </v-card>
      </v-col>
    </v-row>
    <section v-if="relatedProducts.length" class="mt-10">
      <div class="text-overline primary--text">MORE TO EXPLORE</div>
      <h2 class="section-heading mb-4">สินค้าใกล้เคียง</h2>
      <v-row>
        <v-col v-for="related in relatedProducts" :key="related._id" cols="12" sm="6" md="4">
          <product-card :product="related" @add="addRelatedToCart" />
        </v-col>
      </v-row>
    </section>
    <v-snackbar v-model="snackbar" :color="snackbarColor">{{ snackbarText }}</v-snackbar>
  </div>
</template>

<script>
import productService from '../services/productService';
import ProductCard from '../components/products/ProductCard.vue';
import { getApiError } from '../services/api';

export default {
  name: 'ProductDetailView',
  components: { ProductCard },
  data: () => ({
    product: null,
    quantity: 1,
    loading: true,
    error: '',
    snackbar: false,
    snackbarText: '',
    snackbarColor: 'success',
    imageFailed: false,
    selectedGalleryIndex: 0,
  }),
  computed: {
    isAuthenticated() {
      return this.$store.getters['auth/isAuthenticated'];
    },
    relatedProducts() {
      if (!this.product?.category?._id) return [];
      return this.$store.getters['products/products']
        .filter((item) => item._id !== this.product._id && item.category?._id === this.product.category._id)
        .slice(0, 3);
    },
    galleryImages() {
      const images = (this.product?.images || []).map((image) => image.path).filter(Boolean);
      if (images.length) return images;
      return this.product?.image?.path ? [this.product.image.path] : [];
    },
    selectedImage() {
      return this.galleryImages[this.selectedGalleryIndex] || this.galleryImages[0] || '';
    },
    canAdd() {
      return this.product && this.product.stock > 0 && Number.isInteger(this.quantity) &&
        this.quantity >= 1 && this.quantity <= this.product.stock;
    },
  },
  created() {
    this.load();
  },
  watch: {
    '$route.params.id'() {
      this.product = null;
      this.imageFailed = false;
      this.selectedGalleryIndex = 0;
      this.load();
    },
  },
  methods: {
    async load() {
      this.loading = true;
      this.error = '';
      try {
        const productResponse = await productService.get(this.$route.params.id);
        this.$store.dispatch('products/fetchProducts').catch(() => {});
        const { data } = productResponse;
        this.product = data.data;
        this.selectedGalleryIndex = 0;
      } catch (error) {
        this.error = getApiError(error, 'ไม่พบสินค้านี้');
      } finally {
        this.loading = false;
      }
    },
    addRelatedToCart(product) {
      this.$store.dispatch('cart/addToCart', { product, quantity: 1 })
        .then(() => this.showMessage(`เพิ่ม ${product.name} ลงตะกร้าแล้ว`, 'success'))
        .catch((error) => this.showMessage(error.message, 'error'));
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
