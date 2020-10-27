FROM node:14

WORKDIR /app
ADD package.json .
ADD src ./src
RUN npm install

EXPOSE 8080

CMD [ "npm", "start" ]
