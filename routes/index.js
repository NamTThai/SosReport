var express = require('express');
var router = express.Router();

// Get home page
router.get('/', function(req, res) {
  res.render('index', {
    route: "one"
  });
});

router.get('/one', function(req, res) {
  res.render('index', {
    route: "one"
  });
});

router.get('/two', function(req, res) {
  res.render('index', {
    route: "two"
  });
});

module.exports = router;
