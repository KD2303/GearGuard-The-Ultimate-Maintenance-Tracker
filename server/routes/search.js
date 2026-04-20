const express = require('express');
const router = express.Router();
const { globalSearch } = require('../controllers/searchController');

router.get('/', globalSearch);

module.exports = router;
