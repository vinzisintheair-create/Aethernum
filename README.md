# Aeternum — Preserve Life's Greatest Memories

Aeternum is a private digital memory preservation platform and legacy vault designed for close friends and families to catalog precious milestones, historical documents, and shared stories. 

Unlike public social media platforms, Aeternum contains **no follower counts, no public feeds, and no likes**. It is focused entirely on archiving high-fidelity records and co-authoring memories in a secure, isolated container.

---

## 🏛️ Key Features

- **Dynamic Chronological Timeline**: Catalog milestones, stories, dates occurred, locations, and media files.
- **Archival Annotations**: Append secondary witness perspectives, footnotes, and annotations to existing stories.
- **Circle Verification Engine**: Co-sign and verify historical accuracy of posts (e.g. *"Sarah Sterling verified this story"*).
- **Legacy Album Folders**: Create dynamic album collections to catalog architectural drawings, lineage portraits, and handwritten letters.
- **Shared Event Milestones**: Create and link posts to shared family milestones (e.g. Homestead Construction, Graduation).
- **Circle Isolation (Multi-tenant Security)**: Scoped space IDs ensure absolute privacy. SQLite database indices prevent cross-circle data leaks.
- **Cloudflare R2 Object Storage**: Real S3-compatible presigned upload ticketing to leverage Cloudflare's 10 GB free tier.
- **Mobile Responsive Drawer Layout**: Premium sidebar navigation drawer and sticky headers scaled for mobile viewports.

---

## 🛠️ Technology Stack

### Frontend
- **React 18** (Vite development pipeline)
- **TypeScript** for strict static types
- **Tailwind CSS** for custom responsive UI styling
- **TanStack Query (React Query) v5** for caching and automatic server sync

### Backend
- **Node.js & Express** API server
- **TypeScript** development runtime (`ts-node-dev`)
- **Prisma ORM** for database mapping
- **SQLite** for lightweight local file database storage
- **AWS S3 SDK** for Cloudflare R2 object storage presigning

---

## 🚀 Setup & Installation

### Prerequisite Environment Keys
Create a `.env` file inside the `backend` folder with the following variables:
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="generate_a_secure_token"

# Optional Cloudflare R2 Credentials (Falls back to simulated storage if omitted)
R2_ACCESS_KEY_ID="your-access-key-id"
R2_SECRET_ACCESS_KEY="your-secret-access-key"
R2_BUCKET_NAME="your-bucket-name"
R2_ENDPOINT="https://your-account-id.r2.cloudflarestorage.com"
R2_PUBLIC_URL="https://pub-your-subdomain.r2.dev"
```

### 1. Backend Server Setup
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Push database schema migrations
npx prisma db push

# Start the dev server (running on http://localhost:3000)
npm run dev
```

### 2. Frontend Development Setup
```bash
# Navigate to frontend directory
cd ../frontend

# Install dependencies
npm install

# Start Vite dev server (running on http://localhost:5173)
npm run dev
```
