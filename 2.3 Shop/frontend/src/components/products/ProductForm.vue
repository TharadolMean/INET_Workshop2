<template>
  <v-form ref="form" @submit.prevent="submit">
    <v-text-field v-model="form.name" label="ชื่อสินค้า" :rules="[required]" outlined dense />
    <v-textarea v-model="form.description" label="รายละเอียด" rows="3" outlined dense />
    <v-row>
      <v-col cols="12" sm="6">
        <v-text-field v-model.number="form.price" label="ราคา (บาท)" type="number" min="0" :rules="[required, nonNegative]" outlined dense />
      </v-col>
      <v-col cols="12" sm="6">
        <v-text-field v-model.number="form.stock" label="สต็อก" type="number" min="0" :rules="[required, integer]" outlined dense />
      </v-col>
    </v-row>
    <div class="d-flex justify-end">
      <v-btn text @click="$emit('cancel')">ยกเลิก</v-btn>
      <v-btn type="submit" color="primary" :loading="loading">บันทึกสินค้า</v-btn>
    </div>
  </v-form>
</template>

<script>
const blank = () => ({ name: '', description: '', price: 0, stock: 0 });

export default {
  name: 'ProductForm',
  props: {
    value: { type: Object, default: blank },
    loading: Boolean,
  },
  data() {
    return { form: { ...blank(), ...this.value } };
  },
  watch: {
    value(value) {
      this.form = { ...blank(), ...value };
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
      });
    },
  },
};
</script>
