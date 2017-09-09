var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: 'KMB Songs', uid: req.user.fbId });
});

module.exports = router;
