FROM node:12


ENV NODE_ENV production

WORKDIR /app

ADD package.json .
ADD package-lock.json .
ADD tsconfig.json .
ADD src ./src

RUN npm install -f
RUN npm install typescript -g

RUN tsc 

EXPOSE 8080

CMD [ "node", "--max-old-space-size=8192 ./build/app.js" ]
