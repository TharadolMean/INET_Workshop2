<template>
  <div class="admin-page">
    <v-row align="center" class="admin-page-header mb-5">
      <v-col><div class="text-overline primary--text">ADMIN CONSOLE</div><h1 class="page-title">คูปองส่วนลด</h1><p class="muted-text mb-0">กำหนดเงื่อนไขส่วนลด ระบบจะคำนวณและบันทึก snapshot ตอน checkout</p></v-col>
      <v-col cols="auto"><v-btn color="primary" @click="open()"><v-icon left>mdi-plus</v-icon>สร้างคูปอง</v-btn></v-col>
    </v-row>
    <v-alert v-if="error" type="error" outlined>{{ error }}</v-alert>
    <v-card class="app-shell-card">
      <v-data-table :headers="headers" :items="coupons" :loading="loading" no-data-text="ยังไม่มีคูปอง">
        <template v-slot:item.discount="{ item }">{{ item.discountType === 'percent' ? item.discountValue + '%' : formatPrice(item.discountValue) + ' บาท' }}</template>
        <template v-slot:item.validity="{ item }">{{ formatDate(item.startsAt) }} – {{ formatDate(item.expiresAt) }}</template>
        <template v-slot:item.usage="{ item }">{{ item.usageCount }} / {{ item.usageLimit || '∞' }}</template>
        <template v-slot:item.isActive="{ item }"><v-chip small :color="item.isActive ? 'success' : 'grey'">{{ item.isActive ? 'เปิดใช้' : 'ปิดใช้' }}</v-chip></template>
        <template v-slot:item.actions="{ item }"><v-btn icon small aria-label="แก้ไขคูปอง" @click="open(item)"><v-icon small>mdi-pencil-outline</v-icon></v-btn><v-btn icon small color="error" aria-label="ปิดหรือลบคูปอง" @click="confirmRemove = item"><v-icon small>mdi-delete-outline</v-icon></v-btn></template>
      </v-data-table>
    </v-card>
    <v-dialog v-model="dialog" max-width="620">
      <v-card class="app-shell-card"><v-card-title>{{ editing ? 'แก้ไขคูปอง' : 'สร้างคูปอง' }}</v-card-title><v-card-text>
        <v-form ref="form" @submit.prevent="save">
          <v-text-field v-model="form.code" label="รหัสคูปอง" outlined dense :rules="[required]" :disabled="Boolean(editing && editing.usageCount)" />
          <v-text-field v-model="form.description" label="รายละเอียด" outlined dense />
          <v-row>
            <v-col cols="12" sm="6"><v-select v-model="form.discountType" :items="discountTypes" label="ประเภทส่วนลด" outlined dense /></v-col>
            <v-col cols="12" sm="6"><v-text-field v-model.number="form.discountValue" :label="form.discountType === 'percent' ? 'ส่วนลด (%)' : 'ส่วนลด (บาท)'" type="number" min="0.01" outlined dense :rules="[required, positive]" /></v-col>
            <v-col cols="12" sm="6"><v-text-field v-model.number="form.minSubtotal" label="ยอดขั้นต่ำ (บาท)" type="number" min="0" outlined dense /></v-col>
            <v-col cols="12" sm="6"><v-text-field v-model.number="form.maxDiscount" label="ส่วนลดสูงสุด (บาท, optional)" type="number" min="0" outlined dense /></v-col>
            <v-col cols="12" sm="6"><v-text-field v-model.number="form.usageLimit" label="จำนวนครั้งรวม (ว่าง = ไม่จำกัด)" type="number" min="1" outlined dense /></v-col>
            <v-col cols="12" sm="6"><v-text-field v-model.number="form.perUserLimit" label="ครั้งต่อลูกค้า" type="number" min="1" outlined dense /></v-col>
            <v-col cols="12" sm="6"><v-text-field v-model="form.startsAt" label="เริ่มใช้ (ถ้ากำหนด)" type="datetime-local" outlined dense /></v-col>
            <v-col cols="12" sm="6"><v-text-field v-model="form.expiresAt" label="หมดอายุ (ถ้ากำหนด)" type="datetime-local" outlined dense /></v-col>
          </v-row>
          <v-checkbox v-model="form.isActive" label="เปิดใช้งาน" />
          <div class="d-flex justify-end"><v-btn text @click="dialog = false">ยกเลิก</v-btn><v-btn color="primary" type="submit" :loading="saving">บันทึก</v-btn></div>
        </v-form>
      </v-card-text></v-card>
    </v-dialog>
    <v-dialog :value="Boolean(confirmRemove)" max-width="420" @input="!$event && (confirmRemove = null)">
      <v-card class="app-shell-card"><v-card-title>ปิดหรือลบคูปอง?</v-card-title><v-card-text>คูปอง {{ confirmRemove && confirmRemove.code }} ที่ยังไม่ถูกใช้จะถูกลบ หากมีประวัติใช้แล้ว ระบบจะปิดใช้งานและเก็บ Order เดิมไว้</v-card-text><v-card-actions><v-spacer /><v-btn text @click="confirmRemove = null">ยกเลิก</v-btn><v-btn color="error" :loading="removing" @click="remove">ยืนยัน</v-btn></v-card-actions></v-card>
    </v-dialog>
    <v-snackbar v-model="snackbar" color="success">{{ message }}</v-snackbar>
  </div>
</template>

<script>
import couponService from '../services/couponService';
import { getApiError } from '../services/api';

const emptyForm = () => ({ code: '', description: '', discountType: 'percent', discountValue: 10, minSubtotal: 0, maxDiscount: null, usageLimit: null, perUserLimit: 1, startsAt: '', expiresAt: '', isActive: true });
const toDateInput = (value) => {
  if (!value) return '';
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

export default {
  name: 'AdminCouponsView',
  data: () => ({ coupons: [], loading: true, saving: false, removing: false, error: '', dialog: false, confirmRemove: null, editing: null, form: emptyForm(), snackbar: false, message: '', discountTypes: [{ text: 'เปอร์เซ็นต์', value: 'percent' }, { text: 'จำนวนเงิน', value: 'fixed' }], headers: [{ text: 'รหัส', value: 'code' }, { text: 'ส่วนลด', value: 'discount' }, { text: 'ขั้นต่ำ', value: 'minSubtotal' }, { text: 'ช่วงเวลา', value: 'validity', sortable: false }, { text: 'ใช้แล้ว', value: 'usage', sortable: false }, { text: 'สถานะ', value: 'isActive' }, { text: '', value: 'actions', sortable: false }] }),
  created() { this.load(); },
  methods: {
    async load() { this.loading = true; try { const { data } = await couponService.list(); this.coupons = data.data || []; } catch (error) { this.error = getApiError(error, 'โหลดคูปองไม่สำเร็จ'); } finally { this.loading = false; } },
    open(coupon) {
      this.editing = coupon || null;
      this.form = coupon ? { ...coupon, startsAt: toDateInput(coupon.startsAt), expiresAt: toDateInput(coupon.expiresAt) } : emptyForm();
      this.dialog = true;
    },
    async save() {
      if (!this.$refs.form.validate()) return;
      this.saving = true; this.error = '';
      const payload = { ...this.form, code: this.form.code.trim().toUpperCase(), maxDiscount: this.form.maxDiscount === '' ? null : this.form.maxDiscount, usageLimit: this.form.usageLimit === '' ? null : this.form.usageLimit, startsAt: this.form.startsAt ? new Date(this.form.startsAt).toISOString() : null, expiresAt: this.form.expiresAt ? new Date(this.form.expiresAt).toISOString() : null };
      try { if (this.editing) await couponService.update(this.editing._id, payload); else await couponService.create(payload); this.dialog = false; this.message = 'บันทึกคูปองแล้ว'; this.snackbar = true; await this.load(); }
      catch (error) { this.error = getApiError(error, 'บันทึกคูปองไม่สำเร็จ'); }
      finally { this.saving = false; }
    },
    async remove() { if (!this.confirmRemove) return; this.removing = true; try { await couponService.remove(this.confirmRemove._id); this.confirmRemove = null; await this.load(); } catch (error) { this.error = getApiError(error, 'ปิดคูปองไม่สำเร็จ'); } finally { this.removing = false; } },
    required(value) { return Boolean(String(value || '').trim()) || 'กรุณากรอกข้อมูล'; },
    positive(value) { return Number(value) > 0 || 'ต้องมากกว่า 0'; },
    formatDate(value) { return value ? new Date(value).toLocaleString('th-TH') : 'ไม่กำหนด'; },
    formatPrice(value) { return new Intl.NumberFormat('th-TH', { maximumFractionDigits: 2 }).format(value || 0); },
  },
};
</script>
