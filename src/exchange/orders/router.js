const {Router} = require('express');
const controller = require('./controller');

const router = new Router();

// router.route('/suggestion-prices')
//   .get(controller.getOrders)

router.route('/orders')
  .get(controller.getOrders)

router.route('/best-price')
  .get(controller.getBestPrice)

// router.route('/orders-history')
//   .get(controller.getOrders)

module.exports = router;
