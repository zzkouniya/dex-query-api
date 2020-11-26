## Introduction

`dex-query-api` provides a set of API endpoints for querying live cells and order history. It is built on top of lumos indexer.

### Setup

```
npm i
```

### Start server

```
npm run dev
```

When the server starts, it will also start a lumos indexer listening to a CKB node.

### Configuration

The configurations should be specified in the `.env` file. Please refer to the example in `.env.example`.

### Run tests

```
npm test
```
