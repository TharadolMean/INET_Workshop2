<template>
  <v-form ref="form" @submit.prevent="submit">
    <v-text-field v-model="form.name" label="ชื่อสินค้า" :rules="[required]" outlined dense />
    <v-textarea v-model="form.description" label="รายละเอียด" rows="3" outlined dense />
    <v-textarea
      v-model="specificationsText"
      label="ข้อมูลจำเพาะ (หนึ่งรายการต่อบรรทัด: ชื่อ: ค่า)"
      hint="ตัวอย่าง: หน่วยประมวลผล: 8-core · ระบบจะแสดงข้อมูลตามที่บันทึกจริง"
      persistent-hint
      rows="3"
      outlined
      dense
    />
    <v-alert v-if="specificationsError" dense type="error" outlined>{{ specificationsError }}</v-alert>
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
      v-model="imageFiles"
      label="รูปสินค้า (เลือกได้สูงสุด 8 ภาพ)"
      multiple
      :rules="[maxImages]"
      @change="removeImage = false"
      accept="image/jpeg,image/png,image/webp"
      prepend-icon="mdi-camera-outline"
      hint="รองรับ JPG, PNG, WebP ขนาดไม่เกิน 5 MB"
      persistent-hint
      outlined
      dense
      show-size
    />
    <div v-if="previewImages.length" class="d-flex flex-wrap mb-4">
      <v-img v-for="(image, index) in previewImages" :key="`${image}-${index}`" :src="image" max-width="112" height="90" contain class="rounded mr-2 mb-2 product-form-preview" />
    </div>
    <v-btn
      v-if="existingImages.length && !imageFiles.length && !removeImage"
      text
      small
      color="error"
      class="mb-4"
      @click="removeImage = true"
    >
      ลบรูปเดิมทั้งหมด
    </v-btn>
    <div class="d-flex justify-end">
      <v-btn text @click="$emit('cancel')">ยกเลิก</v-btn>
      <v-btn type="submit" color="primary" :loading="loading">บันทึกสินค้า</v-btn>
    </div>
  </v-form>
</template>

<script>
const blank = () => ({ name: '', description: '', price: 0, stock: 0, category: null, specifications: [] });

export default {
  name: 'ProductForm',
  props: {
    value: { type: Object, default: blank },
    categories: { type: Array, default: () => [] },
    loading: Boolean,
  },
  data() {
    return {
      form: { ...blank(), ...this.value },
      specificationsText: this.formatSpecifications(this.value.specifications),
      specificationsError: '',
      imageFiles: [],
      removeImage: false,
    };
  },
  watch: {
    value(value) {
      this.form = { ...blank(), ...value };
      this.specificationsText = this.formatSpecifications(value.specifications);
      this.specificationsError = '';
      this.imageFiles = [];
      this.removeImage = false;
    },
  },
  computed: {
    existingImages() {
      const gallery = this.value?.images || [];
      if (gallery.length) return gallery.map((image) => image.path).filter(Boolean);
      return this.value?.image?.path ? [this.value.image.path] : [];
    },
    previewImages() {
      if (this.imageFiles.length || this.removeImage) return [];
      return this.existingImages;
    },
  },
  methods: {
    formatSpecifications(specifications = []) {
      return (specifications || []).map((entry) => `${entry.name}: ${entry.value}`).join('\n');
    },
    required(value) {
      return value !== undefined && value !== null && String(value).trim() !== '' || 'กรุณากรอกข้อมูล';
    },
    nonNegative(value) {
      return Number(value) >= 0 || 'ต้องเป็นตัวเลขตั้งแต่ 0 ขึ้นไป';
    },
    integer(value) {
      return Number.isInteger(Number(value)) && Number(value) >= 0 || 'ต้องเป็นจำนวนเต็มตั้งแต่ 0 ขึ้นไป';
    },
    maxImages(files) {
      return !files || files.length <= 8 || 'เลือกรูปสินค้าได้ไม่เกิน 8 ภาพ';
    },
    submit() {
      if (!this.$refs.form.validate()) return;
      this.specificationsError = '';
      const specifications = this.specificationsText.split('\n').map((line) => {
        const separator = line.indexOf(':');
        if (separator < 1) return null;
        return { name: line.slice(0, separator).trim(), value: line.slice(separator + 1).trim() };
      }).filter((entry) => entry && entry.name && entry.value);
      if (this.specificationsText.trim() && specifications.length !== this.specificationsText.split('\n').filter((line) => line.trim()).length) {
        this.specificationsError = 'กรุณาระบุชื่อและค่าคั่นด้วยเครื่องหมาย : ในแต่ละบรรทัด';
        return;
      }
      this.$emit('submit', {
        ...this.form,
        price: Number(this.form.price),
        stock: Number(this.form.stock),
        specifications,
        images: this.imageFiles,
        removeImage: this.removeImage,
      });
    },
  },
};
</script>
