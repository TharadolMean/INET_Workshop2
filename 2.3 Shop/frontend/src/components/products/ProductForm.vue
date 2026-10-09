<template>
  <v-form ref="form" @submit.prevent="submit">
    <v-text-field v-model="form.name" label="ชื่อสินค้า" :rules="[required]" outlined dense />
    <v-textarea v-model="form.description" label="รายละเอียด" rows="3" outlined dense />
    <v-select
      v-model="form.category"
      :items="categories"
      item-text="name"
      item-value="_id"
      label="หมวดหมู่"
      clearable
      outlined
      dense
    />
    <v-row>
      <v-col cols="12" sm="6">
        <v-text-field v-model.number="form.price" label="ราคา (บาท)" type="number" min="0" :rules="[required, nonNegative]" outlined dense />
      </v-col>
      <v-col cols="12" sm="6">
        <v-text-field v-model.number="form.stock" label="สต็อก" type="number" min="0" :rules="[required, integer]" outlined dense />
      </v-col>
    </v-row>
    <v-file-input
      v-model="imageFile"
      label="รูปสินค้า"
      accept="image/jpeg,image/png,image/webp"
      prepend-icon="mdi-camera-outline"
      hint="รองรับ JPG, PNG, WebP ขนาดไม่เกิน 5 MB"
      persistent-hint
      outlined
      dense
      show-size
    />
    <v-img v-if="previewImage" :src="previewImage" max-height="160" contain class="rounded mb-4" />
    <v-btn
      v-if="existingImage && !imageFile && !removeImage"
      text
      small
      color="error"
      class="mb-4"
      @click="removeImage = true"
    >
      ลบรูปเดิม
    </v-btn>
    <div class="d-flex justify-end">
      <v-btn text @click="$emit('cancel')">ยกเลิก</v-btn>
      <v-btn type="submit" color="primary" :loading="loading">บันทึกสินค้า</v-btn>
    </div>
  </v-form>
</template>

<script>
const blank = () => ({ name: '', description: '', price: 0, stock: 0, category: null });

export default {
  name: 'ProductForm',
  props: {
    value: { type: Object, default: blank },
    categories: { type: Array, default: () => [] },
    loading: Boolean,
  },
  data() {
    return { form: { ...blank(), ...this.value }, imageFile: null, removeImage: false };
  },
  watch: {
    value(value) {
      this.form = { ...blank(), ...value };
      this.imageFile = null;
      this.removeImage = false;
    },
  },
  computed: {
    existingImage() {
      return this.value && this.value.image && this.value.image.path;
    },
    previewImage() {
      if (this.imageFile) return URL.createObjectURL(this.imageFile);
      if (this.removeImage) return '';
      return this.existingImage || '';
    },
  },
  methods: {
    required(value) {
      return value !== undefined && value !== null && String(value).trim() !== '' || 'กรุณากรอกข้อมูล';
    },
    nonNegative(value) {
      return Number(value) >= 0 || 'ต้องเป็นตัวเลขตั้งแต่ 0 ขึ้นไป';
    },
    integer(value) {
      return Number.isInteger(Number(value)) && Number(value) >= 0 || 'ต้องเป็นจำนวนเต็มตั้งแต่ 0 ขึ้นไป';
    },
    submit() {
      if (!this.$refs.form.validate()) return;
      this.$emit('submit', {
        ...this.form,
        price: Number(this.form.price),
        stock: Number(this.form.stock),
        image: this.imageFile || undefined,
        removeImage: this.removeImage,
      });
    },
  },
};
</script>
