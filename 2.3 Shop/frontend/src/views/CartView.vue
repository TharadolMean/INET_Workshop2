<template>
  <div>
    <v-row align="center" class="mb-8">
      <v-col>
        <div class="text-overline primary--text">YOUR SELECTION / CART</div>
        <h1 class="page-title">ตะกร้าสินค้า</h1>
        <p class="muted-text mb-0">ตรวจสอบรายการสินค้าและจำนวนก่อนยืนยันคำสั่งซื้อ</p>
      </v-col>
      <v-col cols="auto">
        <v-btn v-if="items.length" text color="error" @click="clearDialog = true">
          <v-icon left>mdi-delete-sweep-outline</v-icon>ล้างตะกร้า
        </v-btn>
      </v-col>
    </v-row>

    <v-alert v-if="error" type="error" outlined class="mb-5">{{ error }}</v-alert>
    <v-row v-if="items.length">
      <v-col cols="12" md="8">
        <div class="d-flex align-center justify-space-between mb-3">
          <div class="section-heading">รายการสินค้า</div>
          <div class="muted-text caption">{{ count }} ชิ้น</div>
        </div>
        <cart-item
          v-for="item in items"
          :key="item.product._id"
          :item="item"
          @update="updateQuantity"
          @remove="removeItem"
        />
      </v-col>
      <v-col cols="12" md="4">
        <v-card class="app-shell-card pa-6 sticky-card summary-card">
          <div class="text-overline primary--text">ORDER SUMMARY</div>
          <div class="section-heading mb-5">สรุปคำสั่งซื้อ</div>
          <div class="d-flex justify-space-between mb-3">
            <span class="muted-text">จำนวนสินค้า</span><span>{{ count }} ชิ้น</span>
          </div>
          <v-divider class="mb-4" />
          <div class="d-flex justify-space-between align-center">
            <span class="font-weight-medium">ยอดรวม</span><span class="price-text">{{ formatPrice(total) }} บาท</span>
          </div>
          <v-btn block large color="primary" class="mt-6" :loading="checkingOut" @click="checkoutDialog = true">
            <v-icon left>mdi-credit-card-outline</v-icon>สั่งซื้อสินค้า
          </v-btn>
          <v-btn block text color="primary" class="mt-2" to="/products">
            เลือกซื้อสินค้าต่อ
          </v-btn>
          <div class="caption muted-text mt-3">
            ระบบจะสร้าง Order เดียวจากรายการทั้งหมด และตรวจสอบสต็อกก่อนสั่งซื้อ
          </div>
        </v-card>
      </v-col>
    </v-row>
    <v-card v-else class="app-shell-card pa-12 text-center empty-state">
      <v-icon size="72" color="secondary">mdi-cart-outline</v-icon>
      <h2 class="mt-4">ยังไม่มีสินค้าในตะกร้า</h2>
      <p class="muted-text">เลือกอุปกรณ์อิเล็กทรอนิกส์ที่สนใจแล้วเพิ่มลงตะกร้า</p>
      <v-btn color="primary" to="/products">เลือกซื้อสินค้า</v-btn>
    </v-card>

    <v-dialog v-model="clearDialog" max-width="420">
      <v-card class="app-shell-card">
        <v-card-title>ล้างตะกร้าสินค้า?</v-card-title>
        <v-card-text>สินค้าที่เลือกไว้ทั้งหมดจะถูกนำออกจากตะกร้า</v-card-text>
        <v-card-actions><v-spacer /><v-btn text @click="clearDialog = false">ยกเลิก</v-btn><v-btn color="error" @click="clear">ล้างตะกร้า</v-btn></v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog v-model="checkoutDialog" max-width="450">
      <v-card class="app-shell-card">
        <v-card-title>ยืนยันการสั่งซื้อ</v-card-title>
        <v-card-text>ระบบจะตรวจสอบสต็อกทั้งหมดก่อนสร้าง Order เดียว หากรายการใดไม่พอจะยกเลิกทั้งคำสั่งซื้อ</v-card-text>
        <v-card-actions><v-spacer /><v-btn text @click="checkoutDialog = false">ยกเลิก</v-btn><v-btn color="primary" :loading="checkingOut" @click="checkout">ยืนยันสั่งซื้อ</v-btn></v-card-actions>
      </v-card>
    </v-dialog>
    <v-snackbar v-model="snackbar" :color="snackbarColor" top>{{ snackbarText }}</v-snackbar>
  </div>
</template>

<script>
import CartItem from '../components/cart/CartItem.vue';
import { getApiError } from '../services/api';

export default {
  name: 'CartView',
  components: { CartItem },
  data: () => ({
    error: '',
    snackbar: false,
    snackbarText: '',
    snackbarColor: 'success',
    clearDialog: false,
    checkoutDialog: false,
    checkingOut: false,
  }),
  computed: {
    items() {
      return this.$store.getters['cart/items'];
    },
    count() {
      return this.$store.getters['cart/count'];
    },
    total() {
      return this.$store.getters['cart/total'];
    },
  },
  created() {
    this.validateCart();
  },
  methods: {
    async validateCart() {
      try {
        const products = await this.$store.dispatch('products/fetchProducts');
        await this.$store.dispatch('cart/validateWithProducts', products);
      } catch (error) {
        this.error = getApiError(error, 'ตรวจสอบสินค้าในตะกร้าไม่สำเร็จ');
      }
    },
    updateQuantity(payload) {
      try {
        this.$store.dispatch('cart/updateQuantity', payload);
      } catch (error) {
        this.showMessage(error.message, 'error');
        this.validateCart();
      }
    },
    removeItem(id) {
      this.$store.dispatch('cart/removeItem', id);
    },
    clear() {
      this.$store.dispatch('cart/clear');
      this.clearDialog = false;
    },
    async checkout() {
      this.checkingOut = true;
      this.error = '';
      try {
        const order = await this.$store.dispatch('cart/checkout');
        await this.$store.dispatch('products/fetchProducts');
        this.checkoutDialog = false;
        this.showMessage(`สั่งซื้อสำเร็จ ${order.items.length} รายการและอัปเดตสต็อกแล้ว`, 'success');
      } catch (error) {
        this.checkoutDialog = false;
        this.error = getApiError(error, 'สั่งซื้อไม่สำเร็จ');
      } finally {
        this.checkingOut = false;
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

