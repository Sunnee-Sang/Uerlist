const express = require('express');
const router = express.Router();
router.use('/api/soldiers', require('./soldiers'));
router.use('/api/soldiersin', require('./soldiersin'));
module.exports = router;