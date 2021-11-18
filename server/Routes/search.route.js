const express = require('express');
const searchController = require('../Controllers/search.controller');

const router = express.Router();

router.post('/getSearchResults', searchController.getSearchResults);

module.exports = router;