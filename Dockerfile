FROM node:22-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

ENV NODE_ENV=production
ENV BROWSER_AGENT_PORT=3100

EXPOSE 3100
CMD ["node", "server.js"]
