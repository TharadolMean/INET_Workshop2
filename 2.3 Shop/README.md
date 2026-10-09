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
```

ใช้ฐานข้อมูล `workshop_2_3` แยกจาก `workshop_1` โดยไม่ลบหรือ reset ฐานข้อมูลเดิม ชื่อ `workshop_2.3` ใช้ไม่ได้กับ MongoDB เนื่องจากมีจุดในชื่อ database

หากต้องการใช้ Multi-item Order บนเครื่อง Local ต้องเปิด MongoDB แบบ replica set และกำหนด URI เช่น:

```env
MONGO_URI=mongodb://localhost:27017/workshop_2_3?replicaSet=rs0
```

จากนั้นเริ่ม MongoDB ด้วย `--replSet rs0` และรัน `rs.initiate()` หนึ่งครั้งใน `mongosh` หากยังใช้ MongoDB แบบ standalone ระบบส่วนอื่นยังทำงานได้ แต่ `POST /orders` จะตอบ `503` เพื่อป้องกันการหัก Stock แบบไม่ atomic

เริ่ม Backend:

```bash
npm run dev
```

Backend ทำงานที่ `http://localhost:3000` และ API base URL คือ `http://localhost:3000/api/v1`

ระบบจะสร้าง Admin เริ่มต้นจากค่า `ADMIN_EMAIL`, `ADMIN_PASSWORD` และ `ADMIN_NAME` เมื่อเปิด Server ครั้งแรก หากนำไปใช้งานจริงควรเปลี่ยนรหัสผ่านทันที

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
- เก็บ Cart ใน Local Storage
- ตรวจสอบ stock กับ Backend ก่อน checkout
- สร้าง Order ผ่าน API เดิม

### Admin

- เพิ่ม แก้ไข และลบสินค้า
- ดูคำสั่งซื้อทั้งหมด
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
- `POST /products/:id/orders`
- `POST /orders`
- `GET /orders`
- `GET /users?isApproved=false`
- `PUT /users/:id/approve`

ทุก API response ใช้รูปแบบ `{ status, message, data }` และ Frontend อ่านข้อมูลจาก `response.data.data`

การ checkout ของ Frontend ใช้ `POST /orders` เพื่อสร้าง Order เดียวที่มีสินค้าได้หลายรายการ ระบบจะตรวจสอบ stock ทั้งหมดใน Transaction เดียว และจะล้าง Cart เมื่อสร้าง Order สำเร็จเท่านั้น ส่วน `POST /products/:id/orders` ยังคงรองรับ Order แบบสินค้าเดียวเพื่อความเข้ากันได้กับ Workshop 01

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
node --check src/app.js
node --check src/routes/index.js
```

Postman collection อยู่ที่ `backend/postman/Workshop_1.postman_collection.json` และถูกปรับให้ Product CRUD และการอ่าน Order ทั้งหมดใช้ Admin token ตาม authorization ที่เพิ่มขึ้น

## Known limitations

- API เดิมยังรองรับ Order ครั้งละหนึ่ง Product และยังไม่มี payment, delivery หรือ order status
- Multi-item Order ต้องใช้ MongoDB replica set หรือ mongos เพื่อรองรับ Transaction; MongoDB แบบ standalone จะตอบ `503` พร้อมข้อความให้เปิดใช้ replica set
- Cart เป็น Local Storage ของ Browser ไม่ใช่ Cart API
- รูปสินค้าใช้ placeholder เนื่องจาก Product schema เดิมไม่มีระบบ upload หรือ image storage
- การลบ Product จะลบ Order ที่อ้างถึง Product ตามพฤติกรรมของ Backend เดิม จึงมี confirmation dialog แจ้งผู้ดูแลก่อนลบ
