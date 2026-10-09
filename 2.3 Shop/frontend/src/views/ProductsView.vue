<template>
  <div>
    <section class="hero-panel pa-6 pa-md-10 mb-8">
      <v-row align="center" class="hero-content">
        <v-col cols="12" md="7">
          <div class="text-overline orange--text text--lighten-2">ELECTROHUB / SMART TECH</div>
          <h1 class="display-1 font-weight-bold mt-2">อัปเกรดทุกประสบการณ์ด้วยเทคโนโลยีที่ใช่</h1>
          <p class="text-body-1 blue--text text--lighten-5 mt-4 mb-6">
            ค้นหาอุปกรณ์อิเล็กทรอนิกส์ที่เข้ากับสไตล์การใช้งานของคุณ พร้อมดูสต็อกจริงก่อนตัดสินใจ
          </p>
          <v-btn color="secondary" large class="mr-2 mb-2" @click="scrollToProducts">
            เลือกซื้อสินค้า
            <v-icon right>mdi-arrow-down</v-icon>
          </v-btn>
          <v-btn outlined dark large class="mb-2" @click="focusSearch">
            ดูสินค้าทั้งหมด
            <v-icon right>mdi-view-grid-outline</v-icon>
          </v-btn>
        </v-col>
        <v-col cols="12" md="5" class="d-flex justify-center">
          <div class="hero-device-stack" aria-hidden="true">
            <v-icon size="150" color="blue lighten-3">mdi-laptop</v-icon>
            <v-icon size="64" color="orange lighten-2" class="hero-headphones">mdi-headphones</v-icon>
            <v-icon size="52" color="white" class="hero-keyboard">mdi-keyboard-outline</v-icon>
          </div>
        </v-col>
      </v-row>
    </section>

    <section class="mb-8">
      <div class="d-flex align-center justify-space-between mb-4">
        <div>
          <div class="text-overline primary--text">SHOP BY CATEGORY</div>
          <h2 class="section-heading">เลือกตามสไตล์การใช้งาน</h2>
        </div>
        <v-btn text color="primary" class="d-none d-sm-flex" @click="clearCategory">ดูทั้งหมด</v-btn>
      </div>
      <v-row>
        <v-col v-for="category in categories" :key="category._id" cols="6" sm="4" md="2">
          <v-card
            class="category-tile pa-4 text-center"
            :class="{ 'blue lighten-5': selectedCategory === category._id }"
            flat
            @click="selectCategory(category._id)"
          >
            <v-icon color="primary" size="30">{{ categoryIcon(category.slug) }}</v-icon>
            <div class="caption font-weight-medium mt-2">{{ category.name }}</div>
          </v-card>
        </v-col>
        <v-col v-if="!categories.length" cols="12">
          <div class="muted-text caption">ยังไม่มีหมวดหมู่สินค้า</div>
        </v-col>
      </v-row>
    </section>

    <v-alert v-if="error" type="error" outlined class="mb-6">
      {{ error }}
      <template #append><v-btn text @click="load">ลองใหม่</v-btn></template>
    </v-alert>

    <section id="product-grid">
      <v-row align="end" class="mb-4">
        <v-col cols="12" md="7">
          <div class="text-overline primary--text">CURATED FOR YOU</div>
          <h2 class="section-heading mb-1">สินค้าทั้งหมด</h2>
          <p class="muted-text mb-0">{{ visibleProducts.length }} รายการที่พร้อมให้เลือก</p>
        </v-col>
        <v-col cols="12" sm="7" md="3">
          <v-text-field
            id="product-search"
            ref="searchInput"
            v-model="search"
            label="ค้นหาสินค้า"
            prepend-inner-icon="mdi-magnify"
            outlined
            dense
            hide-details
          />
        </v-col>
        <v-col cols="12" sm="5" md="2">
          <v-select
            v-model="sortBy"
            :items="sortOptions"
            item-text="text"
            item-value="value"
            label="เรียงตาม"
            outlined
            dense
            hide-details
          />
        </v-col>
      </v-row>

    <v-row v-if="loading">
      <v-col v-for="n in 8" :key="n" cols="12" sm="6" md="4" lg="3">
        <v-skeleton-loader type="card" class="app-shell-card" />
      </v-col>
    </v-row>
    <v-row v-else-if="visibleProducts.length">
      <v-col v-for="product in visibleProducts" :key="product._id" cols="12" sm="6" md="4" lg="3">
        <product-card :product="product" @add="addToCart" />
      </v-col>
    </v-row>
    <v-card v-else class="app-shell-card pa-10 text-center">
      <v-icon size="64" color="primary">mdi-package-variant-closed</v-icon>
      <h2 class="mt-4">ไม่พบสินค้าที่ตรงกับการค้นหา</h2>
      <p class="muted-text mb-5">ลองเปลี่ยนคำค้นหาหรือเลือกดูสินค้าทั้งหมด</p>
      <v-btn color="primary" outlined @click="resetFilters">ล้างตัวกรอง</v-btn>
    </v-card>
    </section>

    <v-snackbar v-model="snackbar" :color="snackbarColor">{{ snackbarText }}</v-snackbar>
  </div>
</template>

<script>
import ProductCard from '../components/products/ProductCard.vue';
import { getApiError } from '../services/api';
import categoryService from '../services/categoryService';

export default {
  name: 'ProductsView',
  components: { ProductCard },
  data: () => ({
    search: '',
    selectedCategory: '',
    sortBy: 'newest',
    categories: [],
    error: '',
    snackbar: false,
    snackbarText: '',
    snackbarColor: 'success',
    sortOptions: [
      { text: 'มาใหม่', value: 'newest' },
      { text: 'ชื่อ ก-ฮ', value: 'name-asc' },
      { text: 'ราคาน้อยไปมาก', value: 'price-asc' },
      { text: 'ราคามากไปน้อย', value: 'price-desc' },
    ],
  }),
  computed: {
    products() {
      return this.$store.getters['products/products'];
    },
    loading() {
      return this.$store.state.products.loading;
    },
    visibleProducts() {
      const keyword = this.search.toLowerCase().trim();
      const filtered = this.products.filter((product) => {
        const searchable = `${product.name} ${product.description} ${product.category?.name || ''}`.toLowerCase();
        return (!keyword || searchable.includes(keyword)) &&
          (!this.selectedCategory || product.category?._id === this.selectedCategory);
      });
      return [...filtered].sort((first, second) => {
        if (this.sortBy === 'name-asc') return first.name.localeCompare(second.name, 'th');
        if (this.sortBy === 'price-asc') return first.price - second.price;
        if (this.sortBy === 'price-desc') return second.price - first.price;
        return new Date(second.createdAt || 0) - new Date(first.createdAt || 0);
      });
    },
  },
  watch: {
    '$route.query.q'(value) {
      this.search = value || '';
    },
  },
  created() {
    this.search = this.$route.query.q || '';
    this.load();
  },
  methods: {
    async load() {
      this.error = '';
      try {
        const [, { data }] = await Promise.all([
          this.$store.dispatch('products/fetchProducts'),
          categoryService.list(),
        ]);
        this.categories = (data.data || []).filter((category) => category.isActive);
      } catch (error) {
        this.error = getApiError(error, 'โหลดสินค้าไม่สำเร็จ');
      }
    },
    selectCategory(id) {
      this.selectedCategory = this.selectedCategory === id ? '' : id;
      this.scrollToProducts();
    },
    clearCategory() {
      this.selectedCategory = '';
    },
    resetFilters() {
      this.search = '';
      this.selectedCategory = '';
      this.sortBy = 'newest';
    },
    scrollToProducts() {
      this.$nextTick(() => document.getElementById('product-grid')?.scrollIntoView({ behavior: 'smooth' }));
    },
    focusSearch() {
      this.scrollToProducts();
      this.$nextTick(() => this.$refs.searchInput?.focus());
    },
    categoryIcon(slug) {
      if (slug?.includes('gaming')) return 'mdi-controller-outline';
      if (slug?.includes('audio')) return 'mdi-headphones';
      if (slug?.includes('keyboard') || slug?.includes('mouse')) return 'mdi-keyboard-outline';
      if (slug?.includes('computer') || slug?.includes('laptop')) return 'mdi-laptop';
      return 'mdi-usb-port';
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
