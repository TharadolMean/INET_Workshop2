FROM node:22-alpine

ENV NODE_ENV=development
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src
COPY scripts ./scripts
RUN mkdir -p uploads/products && chown -R node:node /app

USER node
EXPOSE 3000
CMD ["node", "src/server.js"]
