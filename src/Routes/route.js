const express = require('express');
const router = express.Router();

const URLController= require("../controllers/URLController")

router.post('/url/shorten', URLController.createUrl)

router.get('/:urlCode', URLController.getUrl)

module.exports = router;
