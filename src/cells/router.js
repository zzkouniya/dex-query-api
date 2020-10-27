const { Router } = require('express');
const controller = require('./controller');

const router = new Router();

router.route('/cells')
  .get(controller.getLiveCells);
router.route('/cells-for-amount')
  .get(controller.getLiveCellsForAmount);

module.exports = router;
