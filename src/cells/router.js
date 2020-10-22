const {Router} = require('express');
const controller = require('./controller');

const router = new Router();

router.route('/cells')
  .get(controller.getLiveCells)

module.exports = router;
