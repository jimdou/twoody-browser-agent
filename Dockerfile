FROM mcr.microsoft.com/playwright:v1.52.0-noble

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

ENV NODE_ENV=production
ENV BROWSER_AGENT_PORT=3100
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

EXPOSE 3100
CMD ["node", "server.js"]
