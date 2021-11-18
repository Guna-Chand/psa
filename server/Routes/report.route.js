const express = require('express');
const reportController = require('../Controllers/report.controller');

const router = express.Router();

router.post('/sendReport', reportController.sendReport);

module.exports = router;