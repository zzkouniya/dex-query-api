const config = require('../config');

const defaultRoute = (req, res) => {
  const msg = 'Oops! It seems that we don\'t have the page you are looking for.';
  res.status(404).send(msg);
};

const onError = (err, req, res, next) => {
  res.status(err.code >= 100 && err.code < 600 ? err.code : 500);
  res.json({
    message: err.message,
    stack: config.env !== 'production' ? err.stack : undefined,
  });
  next();
};

module.exports = {
  middleware: [
    defaultRoute,
    onError,
  ],
};
