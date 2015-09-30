var express = require('express');
var router = express.Router();

// Get home page
router.get('/', function(req, res) {
  res.render('index', {
    route: "search"
  });
});

router.get('/search', function(req, res) {
  res.render('index', {
    route: "search"
  });
});

module.exports = router;
