const express = require('express');
const app = express();
const helmet = require('helmet');
const cors = require('cors');
const bodyParser = require('body-parser');
const boolParser = require('express-query-boolean');
const config = require('./config');
const ordersRouter = require('./exchange/orders/router');
const swagger = require('./swagger/middleware');

app.use(helmet());
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(boolParser());
app.use('/api-docs', swagger.middleware);
app.use(
  ordersRouter,
);

module.exports = app;
