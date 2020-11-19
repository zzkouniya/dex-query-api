FROM node:12

WORKDIR /app

ENV CKB_NODE_RPC_URL http://localhost:8114"
ENV INDEXER_FOLDER_PATH ./indexer_data
ENV ORDER_LOCK_CODE_HASH 0x9c833b9ebd4259ca044d2c47c5e51b7fc25380b07291e54b248d3808f08ed7fd
ENV ORDER_LOCK_HASH_TYPE data

ADD package.json .
ADD tsconfig.json .
ADD src ./src

RUN npm install -f
RUN npm install typescript -g

RUN tsc 

EXPOSE 8080

CMD [ "node", "./build/app.js" ]
