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
            <v-btn v-if="isCustomer" text color="secondary" class="mt-2" @click="addToWishlist(product)"><v-icon left>mdi-heart-plus-outline</v-icon>บันทึกในรายการโปรด</v-btn>
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
          <product-card :product="related" @add="addRelatedToCart" @wishlist="addToWishlist" />
        </v-col>
      </v-row>
    </section>
    <section v-if="product" class="mt-10">
      <div class="text-overline primary--text">CUSTOMER REVIEWS</div>
      <div class="d-flex align-center flex-wrap mb-4">
        <h2 class="section-heading mr-3">รีวิวจากผู้ซื้อ</h2>
        <span class="review-stars" aria-label="คะแนนเฉลี่ย">
          <v-icon v-for="star in 5" :key="star" small :color="star <= Math.round(reviewSummary.averageRating) ? 'warning' : 'grey lighten-1'">mdi-star</v-icon>
        </span>
        <span class="muted-text ml-2">{{ reviewSummary.averageRating.toFixed(1) }} · {{ reviewSummary.count }} รีวิว</span>
      </div>
      <v-alert v-if="reviewError" type="error" outlined>{{ reviewError }}</v-alert>
      <v-row>
        <v-col v-for="review in reviews" :key="review._id" cols="12" md="6">
          <v-card class="app-shell-card pa-5">
            <div class="d-flex align-center justify-space-between">
              <strong>{{ review.user?.name || 'ลูกค้า' }}</strong>
              <span>{{ '★'.repeat(review.rating) }}<span class="muted-text">{{ '★'.repeat(5 - review.rating) }}</span></span>
            </div>
            <p class="mb-1 mt-3">{{ review.comment || 'ไม่มีข้อความรีวิว' }}</p>
            <div class="caption muted-text">ซื้อแล้ว · {{ formatDate(review.createdAt) }}</div>
          </v-card>
        </v-col>
      </v-row>
      <v-card v-if="isCustomer" class="app-shell-card pa-5 mt-4" max-width="720">
        <h3 class="text-h6 mb-3">{{ myReview ? 'แก้ไขรีวิวของคุณ' : 'เขียนรีวิว' }}</h3>
        <p class="caption muted-text">รีวิวได้หลัง Order ของสินค้านี้มีสถานะจัดส่งแล้วเท่านั้น</p>
        <v-select v-model="reviewRating" :items="[5, 4, 3, 2, 1]" label="คะแนน 1–5" outlined dense />
        <v-textarea v-model="reviewComment" label="ความคิดเห็น" rows="3" outlined counter="2000" />
        <v-btn color="primary" :loading="savingReview" @click="saveReview">บันทึกรีวิว</v-btn>
      </v-card>
    </section>
    <v-snackbar v-model="snackbar" :color="snackbarColor">{{ snackbarText }}</v-snackbar>
  </div>
</template>

<script>
import productService from '../services/productService';
import ProductCard from '../components/products/ProductCard.vue';
import reviewService from '../services/reviewService';
import wishlistService from '../services/wishlistService';
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
    reviews: [],
    reviewSummary: { averageRating: 0, count: 0 },
    reviewRating: 5,
    reviewComment: '',
    reviewError: '',
    savingReview: false,
  }),
  computed: {
    isAuthenticated() {
      return this.$store.getters['auth/isAuthenticated'];
    },
    isCustomer() {
      return this.$store.getters['auth/currentUser']?.role === 'user';
    },
    myReview() {
      const currentUser = this.$store.getters['auth/currentUser'];
      return this.reviews.find((review) => String(review.user?._id) === String(currentUser?._id || currentUser?.id));
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
        await this.loadReviews();
      } catch (error) {
        this.error = getApiError(error, 'ไม่พบสินค้านี้');
      } finally {
        this.loading = false;
      }
    },
    async loadReviews() {
      try {
        const { data } = await reviewService.list(this.product._id);
        this.reviews = data.data.items || [];
        this.reviewSummary = data.data.summary || { averageRating: 0, count: 0 };
        if (this.myReview) {
          this.reviewRating = this.myReview.rating;
          this.reviewComment = this.myReview.comment;
        }
      } catch (error) {
        this.reviewError = getApiError(error, 'โหลดรีวิวไม่สำเร็จ');
      }
    },
    async saveReview() {
      this.reviewError = '';
      this.savingReview = true;
      try {
        await reviewService.save(this.product._id, { rating: Number(this.reviewRating), comment: this.reviewComment });
        await this.loadReviews();
        this.snackbarText = 'บันทึกรีวิวแล้ว'; this.snackbar = true;
      } catch (error) {
        this.reviewError = getApiError(error, 'บันทึกรีวิวไม่สำเร็จ');
      } finally { this.savingReview = false; }
    },
    async addToWishlist(product) {
      try {
        await wishlistService.add(product._id);
        this.snackbarText = 'บันทึกในรายการโปรดแล้ว'; this.snackbar = true;
      } catch (error) { this.snackbarText = getApiError(error, 'บันทึกรายการโปรดไม่สำเร็จ'); this.snackbar = true; }
    },
    formatDate(value) {
      return value ? new Date(value).toLocaleDateString('th-TH') : '-';
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
