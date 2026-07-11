FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

# Generate Prisma Client
RUN npx prisma generate

COPY . .

# Compile TypeScript
RUN npm run build

# Create directory for persistent SQLite data
RUN mkdir -p /data

EXPOSE 3000

# Set database location to volume mount path
ENV DATABASE_URL="file:/data/dev.db"
ENV PORT=3000

# Run migrations on start, then run server
CMD npx prisma db push && npm run start
