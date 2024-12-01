FROM node:14
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm install mysql
CMD ["node", "index.js"]
EXPOSE 3000
