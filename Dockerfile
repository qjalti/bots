FROM node:20-alpine
WORKDIR /app

RUN apk add --no-cache tzdata
ENV TZ=Europe/Moscow

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .
CMD ["node", "index.js"]