const { Router } = require('express');
const controller = require('./controller');

const router = new Router();

router.route('/orders')
  .get(controller.getOrders);

router.route('/best-price')
  .get(controller.getBestPrice);

router.route('/order-history')
  .get(controller.getOrderHistory);

module.exports = router;
