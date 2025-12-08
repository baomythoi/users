# 👤 AIGen Users Service

> Service quản lý người dùng cho AIGen Platform: hồ sơ, danh sách/chi tiết, trạng thái, phân quyền, caching và tích hợp RabbitMQ.

[![Node.js](https://img.shields.io/badge/Node.js-20.x-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.1-blue.svg)](https://www.typescriptlang.org/)
[![Fastify](https://img.shields.io/badge/Fastify-4.18-black.svg)](https://www.fastify.io/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 📋 Mục lục

- [Giới thiệu](#-giới-thiệu)
- [Tính năng](#-tính-năng)
- [Kiến trúc hệ thống](#-kiến-trúc-hệ-thống)
- [Công nghệ sử dụng](#️-công-nghệ-sử-dụng)
- [Yêu cầu hệ thống](#-yêu-cầu-hệ-thống)
- [Cài đặt](#-cài-đặt)
- [Chạy ứng dụng](#-chạy-ứng-dụng)
- [Migration Database](#-migration-database)
- [Scripts](#-scripts)
- [Đóng góp](#-đóng-góp)

---

## 🎯 Giới thiệu

Users Service là backend chịu trách nhiệm quản lý dữ liệu người dùng trong hệ thống AIGen:

- 👤 Hồ sơ người dùng: lấy/sửa, đăng ký, đổi mật khẩu, kích hoạt, đổi trạng thái
- 👥 Danh sách/chi tiết users: tổng hợp kết nối (Facebook Pages, Zalo OAs), trạng thái gói/tokens qua RPC đến Chatbot Service
- ⚡ Cache-first: ưu tiên lấy từ Redis, miss thì truy vấn DB và set cache (TTL 30 ngày)
- 🧱 Repository pattern: tách lớp SQL ra khỏi service (singleton repositories)

Service sử dụng mô hình primary/replica cho PostgreSQL: ghi vào primary, đọc từ replica.

---

## ✨ Tính năng

### Core Features

- ✅ Profile: get/edit, register, activate, change password, set status
- ✅ Users: pagination, filter, detail view (kết nối FB/Zalo, package/tokens)
- ✅ Caching: Redis caching cho profile (key `users:{username}:open-api:profile`)
- ✅ RabbitMQ RPC: lấy package/tokens từ Chatbot

### Technical Features

- 🔄 Message Queue: RabbitMQ cho RPC/worker
- 💾 Caching Layer: Redis
- 📊 Database Replication: Primary/Replica
- 🔒 JWT Authentication (có sẵn plugin)
- 📝 Logging: Pino + pretty print
- 🐳 Dockerized

---

## 🏗️ Kiến trúc hệ thống

```
┌─────────────────────────────────────────────────────────────┐
│                   FASTIFY APPLICATION                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  Routes     │→ │  Services   │→ │ Repositories│        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│         ↓                ↓                  ↓               │
│  ┌─────────────────────────────────────────────┐           │
│  │         RabbitMQ RPC/Workers                │           │
│  └─────────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────┘
														↓
┌─────────────────────────────────────────────────────────────┐
│                    DATA LAYER                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│  │PostgreSQL│  │  Redis   │  │ RabbitMQ │                  │
│  └──────────┘  └──────────┘  └──────────┘                  │
└─────────────────────────────────────────────────────────────┘
														↓
┌─────────────────────────────────────────────────────────────┐
│                 EXTERNAL SERVICES                           │
│  ┌──────────┐                                              │
│  │ Chatbot  │  (RPC: package/tokens)                       │
│  └──────────┘                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Công nghệ sử dụng

### Backend Framework

- Node.js `v20.x`
- TypeScript `v5.1`
- Fastify `v4.18`

### Database & ORM

- PostgreSQL `v16`
- Objection.js `v3.1`
- Knex.js `v3.1`

### Cache & Queue

- Redis `v7`
- RabbitMQ `v3`
- amqplib

### Auth & Security

- @fastify/jwt, @fastify/rate-limit, @fastify/cors

### Utilities

- Ajv, Joi, Moment, Axios, Pino, Sharp

---

## 🖥️ Yêu cầu hệ thống

### Development

- Node.js: >= 20.x
- npm (hoặc nvm để quản lý version)
- PostgreSQL: >= 16.x
- Redis: >= 7.x
- RabbitMQ: >= 3.x
- Docker/Compose: optional (khuyến nghị)

### Production (khuyến nghị)

- RAM: 2GB (khuyến nghị 4GB+)
- CPU: 2 cores+
- Storage: 20GB+
- OS: Linux (Ubuntu 22.04 LTS)

---

## 📦 Cài đặt

### 1) Clone repository

```bash
git clone https://github.com/leekien5/aigen-users.git
cd aigen-users
```

### 2) Cài dependencies

```bash
yarn install
```

### 3) Khởi động hạ tầng (tùy chọn)

```bash
docker compose up -d
```

### 4) Tạo file môi trường

```bash
cp .env.example .env
```

---

## 🚀 Chạy ứng dụng

### Development (hot reload)

```bash
yarn dev
```

### Production build

```bash
yarn build
yarn start
```

### Docker

```bash
docker build -t aigen-users:latest .
docker run --name aigen-users \
	-e PORT=3000 \
	-e DB_HOST=host.docker.internal \
	-e DB_PORT=5432 \
	-e DB_USER=postgres \
	-e DB_PASSWORD=postgres \
	-e DB_NAME=aigen_users \
	-e REDIS_HOST=host.docker.internal \
	-e REDIS_PORT=6379 \
	-e RABBITMQ_URL=amqp://guest:guest@host.docker.internal:5672 \
	-p 3000:3000 \
	aigen-users:latest
```

Ứng dụng chạy tại: http://localhost:3000

---

## 🗄️ Migration Database

Sử dụng scripts có sẵn (Knex + ts-node):

```bash
# Chạy tất cả migrations
yarn migrate

# Rollback migration gần nhất
yarn rollback

# Reset toàn bộ database (rollback all + migrate latest)
yarn migrate:reset
```

---

## 📜 Scripts

| Command            | Description                                   |
| ------------------ | --------------------------------------------- |
| `yarn dev`         | Chạy dev server với hot reload                |
| `yarn build`       | Build TypeScript → JavaScript                 |
| `yarn start`       | Chạy production server                        |
| `yarn lint`        | Kiểm tra code bằng ESLint                     |
| `yarn lint:fix`    | Tự động fix lỗi ESLint                        |
| `yarn migrate`     | Chạy database migrations                      |
| `yarn rollback`    | Rollback migration gần nhất                   |
| `yarn migrate:reset` | Reset toàn bộ database                      |

---

## � Đóng góp

Chào mừng mọi đóng góp! Vui lòng:

1. Fork repo, tạo branch feature: `git checkout -b feature/YourFeature`
2. Commit: `git commit -m "feat: add YourFeature"`
3. Push và tạo Pull Request

Coding tips:

- Dùng TypeScript và tuân thủ ESLint
- Theo repository pattern cho mọi truy vấn SQL
- Khi ghi dữ liệu, nhớ clear cache các key liên quan
- Ưu tiên đọc từ replica với các truy vấn nặng

---

## 📄 License

MIT — xem file [LICENSE](LICENSE)

---

## 👥 Team & Support

- Repository: https://github.com/leekien5/aigen-users
- Branch: `develop`
- Issues: mở ticket trong tab Issues của repository

Nếu cần hỗ trợ nhanh, vui lòng tạo Issue kèm log và steps để reproduce.
