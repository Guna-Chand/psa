const express = require('express');
const homepageController = require('../Controllers/homepage.controller');

const router = express.Router();

router.post('/searchTermSuggestions', homepageController.searchSuggestions);
router.post('/getVisitCount', homepageController.getVisitCount);
router.post('/getCarousal', homepageController.getCarousal);
router.post('/initialFireup', homepageController.topFive);

module.exports = router;