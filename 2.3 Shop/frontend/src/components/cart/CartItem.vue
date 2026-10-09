<template>
  <v-card class="app-shell-card mb-3 cart-item-card">
    <v-card-text>
      <v-row align="center">
        <v-col cols="12" sm="2">
          <v-img v-if="imagePath && !imageFailed" :src="imagePath" height="72" contain @error="imageFailed = true" />
          <div v-else class="product-image d-flex align-center justify-center" style="height: 72px;">
            <v-icon>mdi-circuit-board</v-icon>
          </div>
        </v-col>
        <v-col cols="12" sm="4">
          <div class="font-weight-medium">{{ item.product.name }}</div>
          <div class="caption muted-text">{{ (item.product.category && item.product.category.name) || 'อุปกรณ์อิเล็กทรอนิกส์' }}</div>
          <div class="muted-text">{{ formatPrice(item.product.price) }} บาท / ชิ้น</div>
        </v-col>
        <v-col cols="7" sm="3">
          <v-text-field
            :value="item.quantity"
            type="number"
            min="1"
            :max="item.product.stock"
            label="จำนวน"
            dense
            outlined
            hide-details
            @change="updateQuantity"
          />
        </v-col>
        <v-col cols="5" sm="3" class="text-right">
          <div class="price-text">{{ formatPrice(item.product.price * item.quantity) }}</div>
          <div class="caption muted-text">บาท</div>
        </v-col>
        <v-col cols="12" sm="1" class="text-right">
          <v-btn icon color="error" @click="$emit('remove', item.product._id)">
            <v-icon>mdi-delete-outline</v-icon>
          </v-btn>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script>
export default {
  name: 'CartItem',
  props: {
    item: { type: Object, required: true },
  },
  data: () => ({ imageFailed: false }),
  computed: {
    imagePath() {
      return (this.item.product.image && this.item.product.image.path) || '';
    },
  },
  methods: {
    updateQuantity(value) {
      this.$emit('update', { id: this.item.product._id, quantity: Number(value) });
    },
    formatPrice(value) {
      return new Intl.NumberFormat('th-TH', { maximumFractionDigits: 2 }).format(value);
    },
  },
};
</script>
