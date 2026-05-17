# Interior Design Management — Backend API

Production-ready REST API built with **Node.js, Express.js, and MongoDB Atlas**.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 18+ |
| Framework | Express.js |
| Database | MongoDB Atlas + Mongoose |
| Auth | JWT + bcryptjs |
| File Uploads | Multer + Cloudinary |
| Validation | express-validator |
| Config | dotenv, cookie-parser, cors |

---

## Project Structure

```
backend/
├── config/
│   ├── db.js                   # MongoDB Atlas connection
│   └── cloudinary.js           # Cloudinary + Multer setup
├── controllers/
│   ├── authController.js
│   ├── projectController.js
│   ├── serviceController.js
│   ├── contactController.js
│   ├── bookingController.js
│   └── testimonialController.js
├── middleware/
│   ├── auth.js                 # JWT protect + restrictTo
│   ├── errorHandler.js         # Global error handler
│   ├── validate.js             # express-validator runner
│   └── rateLimiter.js          # In-memory rate limiting
├── models/
│   ├── User.js
│   ├── Project.js
│   ├── Service.js
│   ├── Contact.js
│   ├── Booking.js
│   └── Testimonial.js
├── routes/
│   ├── authRoutes.js
│   ├── projectRoutes.js
│   ├── serviceRoutes.js
│   ├── contactRoutes.js
│   ├── bookingRoutes.js
│   └── testimonialRoutes.js
├── utils/
│   ├── AppError.js             # Custom error class
│   ├── response.js             # sendResponse, pagination helpers
│   ├── jwt.js                  # Token creation helpers
│   └── cloudinaryHelpers.js    # deleteImage / deleteImages
├── uploads/                    # Temp local (Cloudinary handles storage)
├── .env.example
├── .gitignore
├── package.json
└── server.js
```

---

## Quick Start

### 1. Install dependencies

```bash
cd backend
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Fill in all values in .env
```

### 3. Run development server

```bash
npm run dev
```

### 4. Run production server

```bash
npm start
```

---

## Environment Variables

| Variable | Description |
|---|---|
| `PORT` | Server port (default: 5000) |
| `NODE_ENV` | `development` or `production` |
| `MONGO_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Long random string for signing JWTs |
| `JWT_EXPIRES_IN` | e.g. `7d`, `24h` |
| `JWT_COOKIE_EXPIRES_IN` | Days until cookie expires |
| `CLOUDINARY_CLOUD_NAME` | From Cloudinary dashboard |
| `CLOUDINARY_API_KEY` | From Cloudinary dashboard |
| `CLOUDINARY_API_SECRET` | From Cloudinary dashboard |
| `CLIENT_URL` | Comma-separated allowed CORS origins |

---

## API Endpoints

All responses follow the format:
```json
{
  "success": true,
  "message": "...",
  "data": {},
  "meta": { "page": 1, "limit": 10, "total": 50, "totalPages": 5 }
}
```

### 🔐 Auth  `/api/auth`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/signup` | Public | Create admin account |
| POST | `/login` | Public | Login + receive JWT |
| POST | `/logout` | Public | Clear auth cookie |
| GET | `/me` | Admin | Get own profile |
| PATCH | `/update-password` | Admin | Change password |

### 📁 Projects  `/api/projects`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/` | Public | Get all projects (filter, search, paginate) |
| GET | `/:id` | Public | Get single project |
| POST | `/` | Admin | Create project (multipart/form-data) |
| PUT | `/:id` | Admin | Update project |
| DELETE | `/:id` | Admin | Delete project + Cloudinary images |

**Query params:** `?category=Residential&featured=true&search=kitchen&page=1&limit=10`

### 🛠 Services  `/api/services`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/` | Public | Get all services |
| GET | `/:id` | Public | Get single service |
| POST | `/` | Admin | Create service |
| PUT | `/:id` | Admin | Update service |
| DELETE | `/:id` | Admin | Delete service |

### 📩 Contact  `/api/contact`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/` | Public | Submit inquiry |
| GET | `/` | Admin | Get all inquiries |
| GET | `/:id` | Admin | Get single inquiry |
| PATCH | `/:id/status` | Admin | Update status |
| DELETE | `/:id` | Admin | Delete inquiry |

**Status values:** `new`, `read`, `replied`, `archived`

### 📅 Bookings  `/api/bookings`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/` | Public | Submit booking |
| GET | `/` | Admin | Get all bookings |
| GET | `/:id` | Admin | Get single booking |
| PATCH | `/:id/status` | Admin | Update status |
| DELETE | `/:id` | Admin | Delete booking |

**Status values:** `pending`, `confirmed`, `completed`, `cancelled`

### ⭐ Testimonials  `/api/testimonials`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/` | Public | Get approved testimonials |
| GET | `/:id` | Public | Get single testimonial |
| POST | `/` | Public | Submit testimonial |
| PUT | `/:id` | Admin | Update / approve / feature |
| DELETE | `/:id` | Admin | Delete testimonial |

---

## API Testing (Postman / curl)

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password123"}'
```

### Get Projects (with filter + pagination)
```bash
curl "http://localhost:5000/api/projects?category=Residential&featured=true&page=1&limit=6"
```

### Create Project (multipart)
```bash
curl -X POST http://localhost:5000/api/projects \
  -H "Authorization: Bearer <token>" \
  -F "title=Modern Living Room" \
  -F "description=A complete redesign..." \
  -F "category=Residential" \
  -F "budget=25000" \
  -F "featured=true" \
  -F "images=@/path/to/image1.jpg" \
  -F "images=@/path/to/image2.jpg"
```

### Submit Contact Form
```bash
curl -X POST http://localhost:5000/api/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane Doe","email":"jane@example.com","phone":"+1234567890","message":"I am interested in a kitchen redesign."}'
```

### Book a Consultation
```bash
curl -X POST http://localhost:5000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Smith",
    "email": "john@example.com",
    "phone": "+1234567890",
    "date": "2024-06-15",
    "time": "10:00 AM",
    "projectType": "Residential",
    "budget": "$25k–$50k",
    "message": "Looking for full home redesign."
  }'
```

### Approve a Testimonial (Admin)
```bash
curl -X PUT http://localhost:5000/api/testimonials/<id> \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"isApproved": true, "isFeatured": true}'
```

---

## Deployment

### Render

1. Push code to GitHub
2. Create a **Web Service** on Render
3. Set **Build Command:** `npm install`
4. Set **Start Command:** `npm start`
5. Add all environment variables from `.env.example`
6. Deploy ✅

### Railway

1. Connect GitHub repo on Railway
2. Railway auto-detects Node.js
3. Add environment variables in **Variables** tab
4. Set `PORT` to `$PORT` (Railway injects this)
5. Deploy ✅

### Vercel (Serverless)

Add `vercel.json` in the backend root:
```json
{
  "version": 2,
  "builds": [{ "src": "server.js", "use": "@vercel/node" }],
  "routes": [{ "src": "/(.*)", "dest": "server.js" }]
}
```

Then: `vercel --prod`

---

## Security Checklist

- [x] Passwords hashed with bcryptjs (12 rounds)
- [x] JWT stored in httpOnly cookie (not localStorage)
- [x] JWT verification on every protected route
- [x] CORS whitelist via environment variable
- [x] Input validation on all routes (express-validator)
- [x] Rate limiting on auth + public POST routes
- [x] Mongoose validation as second layer
- [x] Global error handler — no stack traces in production
- [x] Environment variables for all secrets
- [x] Images stored on Cloudinary, not local disk

---

## Image Upload Notes

- Accepted formats: `jpg`, `jpeg`, `png`, `webp`
- Max file size: 10 MB per image
- Projects: up to 10 images per request (`images` field)
- Services / Testimonials: single image (`image` field)
- Images are automatically optimized by Cloudinary (max 1920×1080, quality auto)
- Deleting a document also removes its Cloudinary images

---

## Pagination

All list endpoints support:

| Param | Default | Max |
|---|---|---|
| `page` | `1` | — |
| `limit` | `10` | `100` |

Response `meta` field:
```json
{
  "page": 1,
  "limit": 10,
  "total": 47,
  "totalPages": 5,
  "hasNextPage": true,
  "hasPrevPage": false
}
```
