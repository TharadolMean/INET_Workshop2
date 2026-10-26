# ElectroHub Workshop 03

ระบบร้านค้าออนไลน์สำหรับอุปกรณ์อิเล็กทรอนิกส์ พัฒนาต่อจาก Backend ของ Workshop 01 และเพิ่ม Frontend ด้วย Vue 2

## Tech Stack

- Backend: Node.js, Express 5, MongoDB, Mongoose, JWT, bcryptjs
- Frontend: Vue 2.7, Vuetify 2, Vue Router 3, Vuex 3, Axios, Vue CLI 5

## โครงสร้าง

```text
2.3 Shop/
├── backend/
│   ├── postman/
│   └── src/
└── frontend/
    ├── public/
    └── src/
        ├── components/
        ├── router/
        ├── services/
        ├── store/
        └── views/
```

## การตั้งค่า MongoDB และ Backend

ต้องเปิด MongoDB ในเครื่องก่อน แล้วเข้าโฟลเดอร์ `backend`:

```bash
npm install
```

สร้างไฟล์ `.env` จาก `.env.example` และกำหนดค่าที่จำเป็น:

```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/workshop_2_3
JWT_SECRET=<long-random-secret>
JWT_EXPIRES_IN=1d
CORS_ORIGINS=http://localhost:8080
ADMIN_EMAIL=admin@example.local
ADMIN_PASSWORD=<unique-development-password>
```

ใช้ฐานข้อมูล `workshop_2_3` แยกจาก `workshop_1` โดยไม่ลบหรือ reset ฐานข้อมูลเดิม ชื่อ `workshop_2.3` ใช้ไม่ได้กับ MongoDB เนื่องจากมีจุดในชื่อ database

Checkout, ยกเลิก Order และบันทึกประวัติสต็อกใช้ MongoDB transaction จึงต้องเปิด Local MongoDB แบบ replica set และกำหนด URI เช่น:

```env
MONGO_URI=mongodb://localhost:27017/workshop_2_3?replicaSet=rs0
```

จากนั้นเริ่ม MongoDB ด้วย `--replSet rs0` และรัน `rs.initiate()` หนึ่งครั้งใน `mongosh` หากยังใช้ MongoDB แบบ standalone ระบบส่วนอื่นยังทำงานได้ แต่ `POST /orders`, `POST /products/:id/orders` และการยกเลิก Order จะตอบ `503` เพื่อไม่ให้ stock กับ audit history บันทึกไม่ตรงกัน

เริ่ม Backend:

```bash
npm run dev
```

Backend ทำงานที่ `http://localhost:3000` และ API base URL คือ `http://localhost:3000/api/v1`

กำหนด `JWT_SECRET` เป็นค่าสุ่มที่ยาวอย่างน้อย 32 ตัวอักษร ห้ามใช้ค่า placeholder จาก `.env.example` ระบบจะหยุดเริ่มทำงานหาก secret ไม่ถูกต้อง

สร้างค่า secret บน Windows ได้ด้วย `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` จากโฟลเดอร์ `backend` แล้วนำผลลัพธ์ไปใส่ใน `.env` บัญชี Admin ใหม่ต้องใช้รหัสผ่านเฉพาะที่มีความยาว 12–72 ตัวอักษร

หากยังไม่มี Admin ระบบจะสร้างบัญชีแรกจาก `ADMIN_EMAIL`, `ADMIN_PASSWORD` และ `ADMIN_NAME` โดยไม่มีรหัสผ่านเริ่มต้นที่เดาได้ หากมี Admin อยู่แล้ว ระบบจะไม่เปลี่ยนบัญชีเดิม ตัวแปร `ADMIN_PASSWORD` ใช้เฉพาะตอนสร้าง Admin ใหม่

หากต้องเปลี่ยนรหัสผ่าน Admin เดิมในฐานข้อมูล Local ให้ตั้ง `RESET_ADMIN_EMAIL` และ `RESET_ADMIN_PASSWORD` ชั่วคราวใน `backend/.env` (รหัสผ่านใหม่ 12–72 ตัวอักษร) แล้วรัน `npm run admin:reset-password` จาก `backend` จากนั้นลบตัวแปร reset ออกจาก `.env` คำสั่งนี้ปฏิเสธการทำงานเมื่อ `NODE_ENV=production` และไม่ถูกรันอัตโนมัติ

ฟิลด์ archive เข้ากันได้กับข้อมูลเก่าโดยไม่ต้อง migrate หากต้องการ backfill ค่าเริ่มต้นไว้ในเอกสาร Product ให้สำรองฐานข้อมูลก่อน แล้วรัน `npm run db:migrate:archive` จาก `backend` คำสั่งนี้ทำซ้ำได้และแก้เฉพาะเอกสารที่ยังไม่มี `isArchived`; ไม่ลบหรือเปลี่ยนสินค้าที่ archive แล้ว

## การตั้งค่าและเริ่ม Frontend

เข้าโฟลเดอร์ `frontend`:

```bash
npm install
```

คัดลอก `.env.example` เป็น `.env` ได้เมื่อจำเป็น:

```env
VUE_APP_API_URL=/api/v1
```

เริ่ม Frontend:

```bash
npm run serve
```

เปิด `http://localhost:8080`

Development proxy จะส่ง `/api` ไปยัง Backend ที่ port 3000

## ความสามารถของระบบ

### ลูกค้า

- สมัครสมาชิกและรอ Admin อนุมัติ
- Login ด้วย JWT หลังได้รับอนุมัติ
- ดูสินค้าและรายละเอียดสินค้า
- เพิ่ม ลด และลบสินค้าใน Cart
- เก็บ Cart ใน Local Storage แยกตามบัญชีผู้ใช้บน Browser เครื่องนั้น
- ตรวจสอบ stock กับ Backend ก่อน checkout
- สร้าง Order ผ่าน API เดิม
- ดูประวัติและรายละเอียด Order ของตัวเอง
- ติดตามสถานะ Order และประวัติการเปลี่ยนสถานะ
- ยกเลิก Order ของตัวเองได้ก่อนเริ่มจัดเตรียมสินค้า โดยระบบคืนสต็อกให้ครั้งเดียว
- บันทึกโปรไฟล์ เบอร์โทรศัพท์ และสมุดที่อยู่จัดส่ง; ข้อมูลแยกตามบัญชีและที่อยู่ถูก snapshot ลง Order เมื่อเลือกใช้
- บันทึก Wishlist ฝั่ง server และดูรายการเดิมได้เมื่อเข้าสู่ระบบจากเครื่องเดิมหรือเครื่องอื่น
- ใช้รหัสคูปองได้ โดย backend คำนวณส่วนลดจากราคาสินค้าจริงและแสดงยอดก่อนส่วนลด ส่วนลด และยอด Order จำลอง
- เขียนรีวิวได้เมื่อมี Order ของสินค้านั้นที่จัดส่งแล้ว; แก้ไขหรือลบได้เฉพาะรีวิวของตนเอง
- เลือกดูสินค้าและหมวดหมู่ที่เปิดใช้งานได้โดยไม่ต้อง login; ต้อง login และได้รับอนุมัติก่อนใช้ตะกร้าและสั่งซื้อ
- กรองสินค้าได้ตามหมวดหมู่ คำค้นหา ช่วงราคา สต็อก และการเรียงลำดับ
- ค้นหาสินค้าจากสเปก และเปลี่ยนหน้ารายการได้โดยให้ Backend กรองและนับผล
- เปรียบเทียบสินค้าได้ครั้งละไม่เกิน 4 รายการ โดยดูราคา หมวดหมู่ สต็อก รายละเอียดและสเปก
- ดูภาพสินค้าแบบแกลเลอรี ข้อมูลจำเพาะ และสินค้าในหมวดหมู่เดียวกัน
- สลับธีมมืด/สว่างได้ทั้งหน้าร้านและแอดมิน โดยจำค่าบน Browser

### Admin

- ดู Dashboard สรุป Order มูลค่า Order จำลอง ลูกค้า สินค้า/สต็อก Order ล่าสุด สินค้าขายดี สถานะ และแนวโน้มรายวัน/เดือน พร้อมตัวกรองวันที่
- สร้างและจัดการคูปองส่วนลดแบบเปอร์เซ็นต์หรือจำนวนเงิน พร้อมช่วงเวลา ยอดขั้นต่ำ เพดานส่วนลด และจำนวนสิทธิ์
- Dashboard แสดงสต็อกต่ำเฉพาะสินค้าที่เปิดขาย; Order ยกเลิกไม่ถูกรวมในมูลค่า Order หรือยอดขายสินค้า
- เพิ่มและแก้ไขสินค้า; การลบจะเก็บสินค้าเข้าคลัง (archive) และกู้คืนได้
- จัดการรูปสินค้าได้สูงสุด 8 ภาพ และบันทึกข้อมูลจำเพาะแบบชื่อ/ค่า
- สินค้าที่ archive จะไม่แสดงหน้าร้าน และ Order เก่าจะไม่ถูกลบ
- ค้นหาสินค้าและดูการแจ้งเตือนสินค้าเหลือไม่เกิน 5 ชิ้น
- ปรับสต็อกเพิ่ม/ลดพร้อมเหตุผล โดยเก็บผู้ปรับ จำนวนก่อน/หลัง และเวลา; หน้าแก้ไขสินค้าจะแนะนำให้ใช้หน้าปรับสต็อก และ API `PUT /products/:id` เดิมยังเปลี่ยน stock ได้โดยระบบบันทึก audit ให้อัตโนมัติ
- ส่งออก Order ตามช่วงวันที่เป็น CSV จาก Dashboard (ไม่เกิน 366 วัน และป้องกัน formula injection)
- ดูจำนวนสินค้าทั้งหมด สต็อกปกติ ใกล้หมด และหมดสต็อก พร้อมกรองตารางตามสต็อก
- ดูจำนวนหมวดหมู่ทั้งหมด หมวดหมู่ที่เปิดใช้งานและปิดใช้งาน พร้อมกรองตามสถานะ
- ดูคำสั่งซื้อทั้งหมด
- เปลี่ยนสถานะ Order ตามลำดับที่ระบบอนุญาต และดูประวัติผู้เปลี่ยนพร้อมเวลา
- ตรวจสอบประวัติการเคลื่อนไหวสต็อกผ่าน API สำหรับ Admin
- ค้นหา Order และกรองตามช่วงเวลา
- อนุมัติสมาชิกที่รอการอนุมัติ
- เข้าถึงหน้าจัดการผ่าน Router Guard และ Backend authorization

## API ที่ Frontend ใช้

- `POST /register`
- `POST /login`
- `GET /products`
- `GET /products/:id`
- `POST /products`
- `PUT /products/:id`
- `DELETE /products/:id`
- `POST /products/:id/restore` (admin)
- `POST /products/:id/orders`
- `POST /orders`
- `GET /orders/mine`
- `GET/PATCH /customers/me`
- `GET/POST /customers/me/addresses`
- `PUT/DELETE /customers/me/addresses/:addressId`
- `GET /wishlist`, `POST/DELETE /wishlist/:productId`
- `POST /coupons/validate`
- `GET /products/:id/reviews`, `POST /products/:id/reviews`
- `PUT/DELETE /reviews/:id`
- `GET/POST /admin/coupons`, `PUT/DELETE /admin/coupons/:id`
- `GET /orders`
- `POST /orders/:id/cancel`
- `PATCH /orders/:id/status` (admin)
- `GET /inventory/movements` (admin; รองรับ `product`, `order`, `limit`)
- `POST /inventory/adjustments` (admin; body: `product`, integer `delta`, `reason`)
- `GET /inventory/adjustments` (admin; รองรับ `product`, `page`, `limit`)
- `GET /admin/dashboard` (admin; รองรับ `from`, `to` รูปแบบ `YYYY-MM-DD` และ `interval=day|month`)
- `GET /admin/reports/orders.csv` (admin; รองรับ `from`, `to` ช่วงไม่เกิน 366 วัน)
- `GET /users?isApproved=false`
- `PUT /users/:id/approve`

ทุก API response ใช้รูปแบบ `{ status, message, data }` และ Frontend อ่านข้อมูลจาก `response.data.data`

`GET /products` ที่ไม่ส่ง `paged`, `page` หรือ `limit` ยังคงคืน `data` เป็น array เพื่อความเข้ากันได้กับ clients เดิม หากส่ง `paged=true` หรือ `page`/`limit` จะคืน `{ items, pagination }` ใน `data`; ฝั่ง Admin จะมี `summary` เพิ่มสำหรับจำนวนสินค้าและสต็อก ตัวกรอง `q`, `category`, `minPrice`, `maxPrice`, `inStock`, `stockStatus` และ `sort` ถูกตรวจสอบและประมวลผลจาก Backend

`GET /products`, `GET /products/:id` และ `GET /categories` เปิดให้อ่าน catalog ที่เปิดใช้งานได้โดยไม่ต้อง login และรองรับ optional JWT เพื่อคงสิทธิ์ดูรายการ archive ให้ Admin; การเขียนข้อมูลและ Order ยังคงต้องผ่าน authentication, approval และ role check เดิม `GET /orders/mine` แสดงเฉพาะ Order ของผู้ใช้ที่ login อยู่ โดยอ้างอิง user จาก JWT ส่วน `GET /orders` ใช้สำหรับ Admin ดู Order ทั้งหมด

Dashboard ใช้ MongoDB aggregation และช่วงวันที่ UTC (ค่าเริ่มต้น 30 วันล่าสุด, สูงสุด 10 ปี; กราฟรายวันจำกัดไม่เกิน 366 วัน) มูลค่า Order คำนวณจาก `totalPrice` และไม่นับ Order ที่ยกเลิก จึงเป็นมูลค่า Order จำลอง ไม่ใช่รายได้ที่รับชำระแล้ว จำนวนลูกค้ารวมผู้ใช้ role `user` ทั้งหมด และสินค้า/สต็อกบน Dashboard นับเฉพาะ Product ที่ไม่ archive

สถานะ Order คือ `pending → confirmed → packing → shipped → delivered` โดยยกเลิกได้จาก `pending` หรือ `confirmed` เท่านั้น การยกเลิกผ่าน transaction เปลี่ยนสถานะ คืน stock และบันทึก Inventory Movement พร้อมกัน Order เก่าที่ไม่มีสถานะจะอ่านเป็น `delivered` เพื่อไม่ให้ยกเลิกแล้วคืน stock ให้รายการที่อาจจัดส่งไปแล้ว; Order เก่าไม่มี status history ย้อนหลัง

Wishlist, profile และ address book เก็บใน MongoDB และแยกตามผู้ใช้จาก JWT โดยตรง คูปองตรวจวันใช้งาน ยอดขั้นต่ำ stock และราคาปัจจุบันบน backend; การ checkout จองสิทธิ์คูปอง บันทึก redemption, immutable price/address snapshots, Order และ stock movements ใน MongoDB transaction เดียว การยกเลิก Order ที่ยังยกเลิกได้จะคืนสิทธิ์คูปองให้ครั้งเดียว Order เก่าที่ไม่มี breakdown จะแสดงยอดเดิมโดยไม่ backfill

รีวิว public อ่านได้ แต่เขียนได้เฉพาะบัญชีลูกค้าที่มี Order ของสินค้านั้นสถานะ `delivered` (รวม legacy Order ที่ไม่มีสถานะซึ่งระบบเดิมถือว่าปิดแล้ว) มีรีวิวได้หนึ่งรายการต่อ Product ต่อผู้ใช้; สรุปคะแนนคำนวณจากข้อมูลรีวิวจริง

การ checkout ของ Frontend ใช้ `POST /orders` เพื่อสร้าง Order เดียวที่มีสินค้าได้หลายรายการ ระบบจะตรวจสอบ stock ทั้งหมดใน Transaction เดียว และจะล้าง Cart เมื่อสร้าง Order สำเร็จเท่านั้น ส่วน `POST /products/:id/orders` ยังคงรองรับ Order แบบสินค้าเดียวเพื่อความเข้ากันได้กับ Workshop 01

การปรับสต็อกและการบันทึกประวัติใช้ MongoDB transaction และต้องใช้ replica set หรือ mongos เช่นเดียวกับ checkout; endpoint ตอบ `503` เมื่อฐานข้อมูลไม่รองรับ transaction หน้า Admin แนะนำ endpoint ปรับสต็อกพร้อมเหตุผล ส่วน API `PUT /products/:id` เดิมยังใช้แก้ stock ได้และจะสร้าง audit entry อัตโนมัติ สต็อกตั้งต้นตอนสร้างสินค้าไม่ต้องมี transaction การเพิ่ม collection `InventoryAdjustment` ไม่ต้อง migrate ข้อมูลเดิม; ประวัติจะเริ่มเก็บเมื่อเปิดใช้ Phase 5 และไม่ backfill การปรับในอดีต

## แนวคิด Vue ที่ใช้

- Components: ProductCard, ProductForm, CartItem และ Layout components
- Vue Router: หน้า Login, Register, Products, Cart และ Admin
- Data binding และ `v-model`: แบบฟอร์มสินค้า, Login, Register และจำนวนสินค้า
- `v-if` / `v-for`: loading, error, empty state, stock และรายการสินค้า/Order
- Lifecycle hooks: โหลดข้อมูลเมื่อเปิด View
- Vuex: Auth, Products และ Cart state
- Local Storage: JWT, user session และ Cart
- Axios: เรียกใช้งาน GET, POST, PUT และ DELETE API

## การตรวจสอบ

```bash
# frontend
npm run build

# backend
npm test
```

Postman collection อยู่ที่ `backend/postman/Workshop_1.postman_collection.json` และถูกปรับให้ Product CRUD และการอ่าน Order ทั้งหมดใช้ Admin token ตาม authorization ที่เพิ่มขึ้น

## Known limitations

- Legacy API ยังรองรับ Order ครั้งละหนึ่ง Product; ระบบยังไม่มี payment gateway หรือ carrier integration
- Multi-item Order ต้องใช้ MongoDB replica set หรือ mongos เพื่อรองรับ Transaction; MongoDB แบบ standalone จะตอบ `503` พร้อมข้อความให้เปิดใช้ replica set
- Single-item checkout และการยกเลิก Order ใช้ transaction ด้วย เพื่อบันทึก stock และ Inventory Movement ให้สอดคล้องกัน จึงต้องใช้ replica set หรือ mongos เช่นกัน
- Cart เป็น Local Storage แยกตามบัญชีใน Browser ปัจจุบัน ยังไม่มี Cart API สำหรับ sync ข้ามอุปกรณ์
- รูปสินค้าจัดเก็บในเครื่องผ่าน Multer; ค่าชนิดไฟล์ตรวจจาก MIME metadata และยังไม่มี content sniffing
- การ archive Product คงเอกสาร Product และ Order ไว้ใน MongoDB โดยไม่ต้อง migration; ฟิลด์ archive ของเอกสารเก่าจะถือว่า active
- Product schema เพิ่ม `specifications` และ `images` แบบ optional/default ว่าง โดยเก็บ `image` เดิมไว้รองรับ record และ client เก่า ไม่ต้อง migration; gallery ใช้รูปที่ upload ในเครื่องเท่านั้น
- Phase 4 เพิ่มฟิลด์ optional ใน User/Order และ collections ใหม่ `Wishlist`, `Coupon`, `CouponRedemption`, `ProductReview`; ค่าเริ่มต้นรักษา record เก่าได้โดยไม่ต้อง migration อย่างไรก็ตาม checkout ที่ใช้คูปองยังต้องใช้ MongoDB replica set ตาม requirement ของ transaction เดิม
