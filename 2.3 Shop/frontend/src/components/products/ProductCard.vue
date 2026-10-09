<template>
  <v-card class="product-card app-shell-card d-flex flex-column">
    <v-img :src="image || undefined" height="190" class="product-image" @error="imageFailed = true">
      <div class="fill-height d-flex align-center justify-center">
        <v-icon v-if="!image || imageFailed" size="72" color="rgba(255,255,255,.55)">mdi-circuit-board</v-icon>
      </div>
      <v-chip v-if="product.stock > 0" color="success" small class="ma-3">มีสินค้า</v-chip>
      <v-chip v-else color="error" small class="ma-3">หมดสต็อก</v-chip>
    </v-img>
    <v-card-text class="flex-grow-1">
      <div class="text-overline secondary--text">{{ (product.category && product.category.name) || 'ELECTRONICS' }}</div>
      <div class="text-h6 text-truncate">{{ product.name }}</div>
      <div class="muted-text text-truncate mt-1">{{ product.description || 'อุปกรณ์คุณภาพสำหรับการใช้งานทุกวัน' }}</div>
      <div class="price-text mt-4">{{ formatPrice(product.price) }} บาท</div>
      <div class="caption muted-text">เหลือ {{ product.stock }} ชิ้น</div>
    </v-card-text>
    <v-card-actions class="pa-4 pt-0">
      <v-btn text color="secondary" :to="{ name: 'product-detail', params: { id: product._id } }">รายละเอียด</v-btn>
      <v-spacer />
      <v-btn color="primary" :disabled="product.stock < 1" @click="$emit('add', product)">
        <v-icon left>mdi-cart-plus</v-icon>เพิ่มลงตะกร้า
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
