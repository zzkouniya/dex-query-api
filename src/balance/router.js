const { Router } = require('express');
const controller = require('./controller');

const router = new Router();

router.route('/ckb-balance')
  .get(controller.getCKBBalance);
router.route('/sudt-balance')
  .get(controller.getSUDTBalance);

module.exports = router;
