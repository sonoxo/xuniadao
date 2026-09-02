FROM node:20-alpine
WORKDIR /app
COPY apps/resilience-atlas/package.json ./package.json
COPY apps/resilience-atlas/ ./
ENV NODE_ENV=production
ENV PORT=8787
EXPOSE 8787
CMD ["npm","start"]
