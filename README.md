# 🔐 Users Service

Service phụ trách quản lý người dùng trong hệ thống Aigen Platform, bao gồm hồ sơ người dùng, phân quyền,...

## 🛠️ Công nghệ

- Node.js 22
- TypeScript
- Fastify
- PostgreSQL
- RabbitMQ
- MongoDB
- Redis

## 🚀 Cách chạy

### 🐳 Dùng Docker (recommend)

```bash
docker-compose up -d --build

```

### 📄 Tạo file `.env`

```bash
cp .env.example .env
```

### ⚙️ Chạy local
```bash
npm install
npm run start:dev
```

### 📜 Scripts thường dùng

| Lệnh                | Mô tả                      |
| ------------------- | -------------------------- |
| `npm run start`     | Chạy bản production        |
| `npm run start:dev` | Chạy bản dev có hot reload |
| `npm run build`     | Biên dịch code TypeScript  |
