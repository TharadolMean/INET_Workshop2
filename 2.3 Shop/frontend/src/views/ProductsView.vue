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
            :class="{ 'category-tile--selected': selectedCategory === category._id }"
            flat
            role="button"
            tabindex="0"
            :aria-pressed="selectedCategory === category._id"
            @click="selectCategory(category._id)"
            @keyup.enter="selectCategory(category._id)"
            @keyup.space.prevent="selectCategory(category._id)"
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
          <p class="muted-text mb-0" aria-live="polite">แสดง {{ products.length }} จาก {{ totalProducts }} รายการ</p>
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
        <v-col cols="6" sm="4" md="2">
          <v-text-field v-model.number="minPrice" label="ราคาต่ำสุด" type="number" min="0" prepend-inner-icon="mdi-currency-thb" outlined dense hide-details />
        </v-col>
        <v-col cols="6" sm="4" md="2">
          <v-text-field v-model.number="maxPrice" label="ราคาสูงสุด" type="number" min="0" prepend-inner-icon="mdi-currency-thb" outlined dense hide-details />
        </v-col>
        <v-col cols="12" sm="4" md="2">
          <v-checkbox v-model="inStockOnly" label="แสดงสินค้าที่มีสต็อก" hide-details class="mt-2" />
        </v-col>
      </v-row>

    <v-row v-if="loading">
      <v-col v-for="n in 8" :key="n" cols="12" sm="6" md="4" lg="3">
        <v-skeleton-loader type="card" class="app-shell-card" />
      </v-col>
    </v-row>
    <v-row v-else-if="visibleProducts.length">
      <v-col v-for="product in visibleProducts" :key="product._id" cols="12" sm="6" md="4" lg="3">
        <product-card :product="product" @add="addToCart" @wishlist="addToWishlist" @compare="toggleCompare" />
      </v-col>
    </v-row>
    <v-card v-else class="app-shell-card pa-10 text-center">
      <v-icon size="64" color="primary">mdi-package-variant-closed</v-icon>
      <h2 class="mt-4">ไม่พบสินค้าที่ตรงกับการค้นหา</h2>
      <p class="muted-text mb-5">ลองเปลี่ยนคำค้นหาหรือเลือกดูสินค้าทั้งหมด</p>
      <v-btn color="primary" outlined @click="resetFilters">ล้างตัวกรอง</v-btn>
    </v-card>
    </section>

    <v-card v-if="compareProducts.length" class="app-shell-card pa-4 mt-6 d-flex flex-wrap align-center justify-space-between">
      <div class="mb-2 mb-sm-0">เลือกเปรียบเทียบแล้ว {{ compareProducts.length }}/4 รายการ</div>
      <div><v-btn text small @click="compareProducts = []">ล้างรายการ</v-btn><v-btn color="primary" small :disabled="compareProducts.length < 2" @click="compareDialog = true">เปรียบเทียบ</v-btn></div>
    </v-card>
    <v-pagination v-if="totalPages > 1" v-model="page" :length="totalPages" :total-visible="7" class="mt-5" aria-label="เปลี่ยนหน้ารายการสินค้า" />

    <v-dialog v-model="compareDialog" max-width="1000" scrollable>
      <v-card class="app-shell-card">
        <v-card-title>เปรียบเทียบสินค้า <v-spacer /><v-btn icon aria-label="ปิดหน้าต่าง" @click="compareDialog = false"><v-icon>mdi-close</v-icon></v-btn></v-card-title>
        <v-card-text>
          <div class="compare-table-wrap"><table class="compare-table"><thead><tr><th>คุณสมบัติ</th><th v-for="item in compareProducts" :key="item._id">{{ item.name }}<v-btn icon x-small aria-label="นำสินค้าออกจากรายการเปรียบเทียบ" @click="toggleCompare(item)"><v-icon small>mdi-close</v-icon></v-btn></th></tr></thead><tbody>
            <tr><th>ราคา</th><td v-for="item in compareProducts" :key="`${item._id}-price`">{{ formatPrice(item.price) }} บาท</td></tr>
            <tr><th>หมวดหมู่</th><td v-for="item in compareProducts" :key="`${item._id}-category`">{{ item.category?.name || '—' }}</td></tr>
            <tr><th>สต็อก</th><td v-for="item in compareProducts" :key="`${item._id}-stock`">{{ item.stock > 0 ? `${item.stock} ชิ้น` : 'หมดสต็อก' }}</td></tr>
            <tr><th>รายละเอียด</th><td v-for="item in compareProducts" :key="`${item._id}-description`">{{ item.description || '—' }}</td></tr>
            <tr v-for="spec in comparisonSpecifications" :key="spec"><th>{{ spec }}</th><td v-for="item in compareProducts" :key="`${item._id}-${spec}`">{{ item.specifications?.find((entry) => entry.name === spec)?.value || '—' }}</td></tr>
          </tbody></table></div>
        </v-card-text>
        <v-card-actions><v-spacer /><v-btn text @click="compareDialog = false">ปิด</v-btn></v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar" :color="snackbarColor">{{ snackbarText }}</v-snackbar>
  </div>
</template>

<script>
import ProductCard from '../components/products/ProductCard.vue';
import { getApiError } from '../services/api';
import categoryService from '../services/categoryService';
import wishlistService from '../services/wishlistService';

export default {
  name: 'ProductsView',
  components: { ProductCard },
  data: () => ({
    search: '',
    page: 1,
    pageSize: 12,
    searchTimer: null,
    compareProducts: [],
    compareDialog: false,
    selectedCategory: '',
    minPrice: null,
    maxPrice: null,
    inStockOnly: false,
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
      return this.products;
    },
    pagination() {
      return this.$store.state.products.pagination;
    },
    totalProducts() {
      return this.pagination?.totalItems || 0;
    },
    totalPages() {
      return this.pagination?.totalPages || 0;
    },
    comparisonSpecifications() {
      return [...new Set(this.compareProducts.flatMap((item) => (item.specifications || []).map((entry) => entry.name)))];
    },
  },
  watch: {
    '$route.query.q'(value) {
      this.search = value || '';
    },
    search() { this.scheduleLoad(); },
    selectedCategory() { this.scheduleLoad(); },
    minPrice() { this.scheduleLoad(); },
    maxPrice() { this.scheduleLoad(); },
    inStockOnly() { this.scheduleLoad(); },
    sortBy() { this.scheduleLoad(); },
    page() { this.loadProducts(); },
  },
  created() {
    this.search = this.$route.query.q || '';
    this.load();
  },
  beforeDestroy() {
    clearTimeout(this.searchTimer);
  },
  methods: {
    async load() {
      this.error = '';
      try {
        const [, { data }] = await Promise.all([
          this.loadProducts(),
          categoryService.list(),
        ]);
        this.categories = (data.data || []).filter((category) => category.isActive);
      } catch (error) {
        this.error = getApiError(error, 'โหลดสินค้าไม่สำเร็จ');
      }
    },
    scheduleLoad() {
      this.page = 1;
      clearTimeout(this.searchTimer);
      this.searchTimer = setTimeout(() => this.loadProducts(), 250);
    },
    async loadProducts() {
      const filters = {
        paged: 'true', page: this.page, limit: this.pageSize, sort: this.sortBy,
        ...(this.search.trim() ? { q: this.search.trim() } : {}),
        ...(this.selectedCategory ? { category: this.selectedCategory } : {}),
        ...(this.minPrice !== null && this.minPrice !== '' ? { minPrice: this.minPrice } : {}),
        ...(this.maxPrice !== null && this.maxPrice !== '' ? { maxPrice: this.maxPrice } : {}),
        ...(this.inStockOnly ? { inStock: 'true' } : {}),
      };
      try {
        await this.$store.dispatch('products/fetchProducts', filters);
        const pagination = this.$store.state.products.pagination;
        if (pagination && this.page !== pagination.page) this.page = pagination.page;
      } catch (error) {
        this.error = getApiError(error, 'ค้นหาสินค้าไม่สำเร็จ');
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
      this.minPrice = null;
      this.maxPrice = null;
      this.inStockOnly = false;
      this.sortBy = 'newest';
      this.page = 1;
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
    async addToWishlist(product) {
      try {
        await wishlistService.add(product._id);
        this.showMessage(`บันทึก ${product.name} ในรายการโปรดแล้ว`, 'success');
      } catch (error) {
        this.showMessage(getApiError(error, 'บันทึกรายการโปรดไม่สำเร็จ'), 'error');
      }
    },
    toggleCompare(product) {
      const index = this.compareProducts.findIndex((item) => item._id === product._id);
      if (index >= 0) this.compareProducts.splice(index, 1);
      else if (this.compareProducts.length < 4) this.compareProducts.push(product);
      else this.showMessage('เปรียบเทียบได้ครั้งละไม่เกิน 4 สินค้า', 'info');
    },
    formatPrice(value) {
      return new Intl.NumberFormat('th-TH', { maximumFractionDigits: 2 }).format(value || 0);
    },
    showMessage(text, color) {
      this.snackbarText = text;
      this.snackbarColor = color;
      this.snackbar = true;
    },
  },
};
</script>
