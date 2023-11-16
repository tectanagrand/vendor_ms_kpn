FROM node:18-alpine

WORKDIR /app

COPY package.json ./

COPY package-lock.json ./

RUN npm install 
RUN npm install -g nodemon

COPY . .

EXPOSE 5000

CMD ["npm", "run", "server"]