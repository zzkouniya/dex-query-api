FROM node:12.14.1

WORKDIR /app

ADD package.json .
ADD tsconfig.json .
ADD src ./src

RUN npm install -f
RUN npm install typescript -g

RUN tsc 

EXPOSE 8080

CMD [ "node", "./build/app.js" ]
