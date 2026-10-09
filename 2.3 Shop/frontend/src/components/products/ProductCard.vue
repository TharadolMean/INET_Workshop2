<template>
  <v-card class="product-card app-shell-card d-flex flex-column">
    <v-img :src="image || undefined" height="220" class="product-image" @error="imageFailed = true">
      <div class="fill-height d-flex align-center justify-center">
        <v-icon v-if="!image || imageFailed" size="72" color="rgba(255,255,255,.55)">mdi-circuit-board</v-icon>
      </div>
      <v-chip v-if="product.stock > 0" color="success" small class="ma-3 product-status">มีสินค้า</v-chip>
      <v-chip v-else color="error" small class="ma-3 product-status">หมดสต็อก</v-chip>
    </v-img>
    <v-card-text class="flex-grow-1 pa-5">
      <div class="text-overline secondary--text text-truncate">
        {{ (product.category && product.category.name) || 'อุปกรณ์อิเล็กทรอนิกส์' }}
      </div>
      <div class="text-h6 product-title">{{ product.name }}</div>
      <div class="muted-text product-description mt-2">
        {{ product.description || 'อุปกรณ์คุณภาพสำหรับการใช้งานทุกวัน' }}
      </div>
      <div class="d-flex align-end justify-space-between mt-5">
        <div class="price-text">{{ formatPrice(product.price) }} บาท</div>
        <div class="caption muted-text">เหลือ {{ product.stock }} ชิ้น</div>
      </div>
    </v-card-text>
    <v-card-actions class="px-5 pb-5 pt-0">
      <v-btn outlined color="primary" :to="{ name: 'product-detail', params: { id: product._id } }">
        ดูรายละเอียด
      </v-btn>
      <v-spacer />
      <v-btn icon color="primary" :disabled="product.stock < 1" aria-label="เพิ่มลงตะกร้า" @click="$emit('add', product)">
        <v-icon>mdi-cart-plus</v-icon>
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>
export default {
  name: 'ProductCard',
  data: () => ({ imageFailed: false }),
  props: {
    product: { type: Object, required: true },
  },
  computed: {
    image() {
      return (this.product.image && this.product.image.path) || '';
    },
  },
  methods: {
    formatPrice(value) {
      return new Intl.NumberFormat('th-TH', { maximumFractionDigits: 2 }).format(value);
    },
  },
};
</script>
