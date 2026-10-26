<template>
  <div>
    <div class="text-overline primary--text">CUSTOMER ACCOUNT</div>
    <h1 class="page-title mb-6">บัญชีของฉัน</h1>
    <v-alert v-if="error" type="error" outlined>{{ error }}</v-alert>
    <v-tabs v-model="tab" background-color="transparent" class="mb-5">
      <v-tab>โปรไฟล์</v-tab><v-tab>ที่อยู่จัดส่ง</v-tab>
    </v-tabs>
    <v-card v-if="tab === 0" class="app-shell-card pa-6" max-width="760">
      <v-form @submit.prevent="saveProfile">
        <v-text-field v-model="profile.name" label="ชื่อที่แสดง" outlined :rules="[required]" />
        <v-text-field :value="profile.email" label="อีเมล" outlined readonly hint="อีเมลใช้เข้าสู่ระบบและแก้ไขไม่ได้ที่นี่" persistent-hint />
        <v-text-field v-model="profile.phone" label="เบอร์โทรศัพท์" outlined />
        <v-btn color="primary" type="submit" :loading="saving">บันทึกโปรไฟล์</v-btn>
      </v-form>
    </v-card>
    <template v-else>
      <div class="d-flex justify-end mb-4">
        <v-btn color="primary" @click="openAddress()"><v-icon left>mdi-plus</v-icon>เพิ่มที่อยู่</v-btn>
      </div>
      <v-row v-if="addresses.length">
        <v-col v-for="address in addresses" :key="address._id" cols="12" md="6">
          <v-card class="app-shell-card pa-5">
            <div class="d-flex align-center justify-space-between">
              <h2 class="text-h6">{{ address.label }}</h2>
              <v-chip v-if="address.isDefault" small color="primary">ค่าเริ่มต้น</v-chip>
            </div>
            <div>{{ address.recipient }} · {{ address.phone }}</div>
            <div class="muted-text">{{ address.line1 }} {{ address.line2 }} {{ address.subdistrict }} {{ address.district }} {{ address.province }} {{ address.postalCode }}</div>
            <div class="mt-3">
              <v-btn text small color="primary" @click="openAddress(address)">แก้ไข</v-btn>
              <v-btn text small color="error" @click="removeAddress(address)">ลบ</v-btn>
              <v-btn v-if="!address.isDefault" text small @click="setDefault(address)">ตั้งเป็นค่าเริ่มต้น</v-btn>
            </div>
          </v-card>
        </v-col>
      </v-row>
      <v-card v-else class="app-shell-card pa-10 text-center">
        <v-icon size="56" color="primary">mdi-map-marker-outline</v-icon>
        <h2 class="mt-3">ยังไม่มีที่อยู่จัดส่ง</h2>
        <p class="muted-text">บันทึกที่อยู่เพื่อเลือกใช้ในขั้นตอนสั่งซื้อ</p>
      </v-card>
    </template>
    <v-dialog v-model="addressDialog" max-width="620">
      <v-card class="app-shell-card">
        <v-card-title>{{ editingAddress ? 'แก้ไขที่อยู่' : 'เพิ่มที่อยู่จัดส่ง' }}</v-card-title>
        <v-card-text>
          <v-form ref="addressForm" @submit.prevent="saveAddress">
            <v-row>
              <v-col cols="12" sm="6"><v-text-field v-model="address.label" label="ชื่อเรียกที่อยู่" outlined dense :rules="[required]" /></v-col>
              <v-col cols="12" sm="6"><v-text-field v-model="address.recipient" label="ชื่อผู้รับ" outlined dense :rules="[required]" /></v-col>
              <v-col cols="12" sm="6"><v-text-field v-model="address.phone" label="เบอร์โทรศัพท์" outlined dense :rules="[required]" /></v-col>
              <v-col cols="12"><v-text-field v-model="address.line1" label="ที่อยู่" outlined dense :rules="[required]" /></v-col>
              <v-col cols="12"><v-text-field v-model="address.line2" label="ที่อยู่เพิ่มเติม (ถ้ามี)" outlined dense /></v-col>
              <v-col cols="12" sm="6"><v-text-field v-model="address.subdistrict" label="แขวง/ตำบล" outlined dense :rules="[required]" /></v-col>
              <v-col cols="12" sm="6"><v-text-field v-model="address.district" label="เขต/อำเภอ" outlined dense :rules="[required]" /></v-col>
              <v-col cols="12" sm="6"><v-text-field v-model="address.province" label="จังหวัด" outlined dense :rules="[required]" /></v-col>
              <v-col cols="12" sm="6"><v-text-field v-model="address.postalCode" label="รหัสไปรษณีย์" outlined dense :rules="[required]" /></v-col>
            </v-row>
            <v-checkbox v-model="address.isDefault" label="ตั้งเป็นที่อยู่เริ่มต้น" />
            <div class="d-flex justify-end"><v-btn text @click="addressDialog = false">ยกเลิก</v-btn><v-btn color="primary" type="submit" :loading="saving">บันทึกที่อยู่</v-btn></div>
          </v-form>
        </v-card-text>
      </v-card>
    </v-dialog>
    <v-snackbar v-model="snackbar" color="success">{{ message }}</v-snackbar>
  </div>
</template>

<script>
import customerService from '../services/customerService';
import { getApiError } from '../services/api';

const blankAddress = () => ({ label: '', recipient: '', phone: '', line1: '', line2: '', subdistrict: '', district: '', province: '', postalCode: '', isDefault: false });

export default {
  name: 'CustomerAccountView',
  data: () => ({ profile: { name: '', email: '', phone: '' }, addresses: [], address: blankAddress(), editingAddress: null, tab: 0, saving: false, loading: false, error: '', snackbar: false, message: '', addressDialog: false }),
  created() { this.load(); },
  methods: {
    async load() {
      this.loading = true;
      try {
        const [profile, addresses] = await Promise.all([customerService.getProfile(), customerService.listAddresses()]);
        this.profile = { name: profile.data.data.name || '', email: profile.data.data.email || '', phone: profile.data.data.phone || '' };
        this.addresses = addresses.data.data || [];
      } catch (error) { this.error = getApiError(error, 'โหลดข้อมูลบัญชีไม่สำเร็จ'); }
      finally { this.loading = false; }
    },
    required(value) { return Boolean(String(value || '').trim()) || 'กรุณากรอกข้อมูล'; },
    async saveProfile() {
      this.saving = true; this.error = '';
      try {
        const { data } = await customerService.updateProfile({ name: this.profile.name, phone: this.profile.phone });
        this.profile.name = data.data.name; this.$store.commit('auth/UPDATE_PROFILE', { name: data.data.name, phone: data.data.phone });
        this.message = 'บันทึกโปรไฟล์แล้ว'; this.snackbar = true;
      } catch (error) { this.error = getApiError(error, 'บันทึกโปรไฟล์ไม่สำเร็จ'); }
      finally { this.saving = false; }
    },
    openAddress(value) {
      this.editingAddress = value || null;
      this.address = value ? { ...value } : blankAddress();
      this.addressDialog = true;
    },
    async saveAddress() {
      if (!this.$refs.addressForm.validate()) return;
      this.saving = true;
      try {
        if (this.editingAddress) await customerService.updateAddress(this.editingAddress._id, this.address);
        else await customerService.createAddress(this.address);
        this.addressDialog = false; await this.load();
      } catch (error) { this.error = getApiError(error, 'บันทึกที่อยู่ไม่สำเร็จ'); }
      finally { this.saving = false; }
    },
    async setDefault(address) {
      try { await customerService.updateAddress(address._id, { ...address, isDefault: true }); await this.load(); }
      catch (error) { this.error = getApiError(error, 'ตั้งค่าที่อยู่ไม่สำเร็จ'); }
    },
    async removeAddress(address) {
      try { await customerService.deleteAddress(address._id); await this.load(); }
      catch (error) { this.error = getApiError(error, 'ลบที่อยู่ไม่สำเร็จ'); }
    },
  },
};
</script>
