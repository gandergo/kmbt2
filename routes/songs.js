var express = require('express');
var router = express.Router();

var mongoose = require('mongoose');
var Song = require('../models/Song.js');

/* GET /todos listing. */
router.get('/', function(req, res, next) {
  Song.find(function (err, todos) {
    if (err) return next(err);
    res.json(todos);
  }).sort({ _id: 1 });      //http://stackoverflow.com/questions/25091017/mongodb-finds-returning-document-order
});

/* POST /todos */
router.post('/', function(req, res, next) {
  req.body.uid = req.user.fbId;
  Song.create(req.body, function (err, post) {
    if (err) return next(err);
    res.json(post);
  });
});

/* GET /todos/id */
router.get('/:id', function(req, res, next) {
  Song.findById(req.params.id, function (err, post) {
    if (err) return next(err);
    res.json(post);
  });
});

/* PUT /todos/:id */
router.put('/:id', function(req, res, next) {
  req.body.uid = req.user.fbId;
  delete(req.body._id);     //http://stackoverflow.com/questions/24103966/mongoerror-mod-on-id-not-allowed
  Song.findByIdAndUpdate(req.params.id, req.body, function (err, post) {
    if (err) return next(err);
    res.json(post);
  });
});

/* DELETE /todos/:id */
router.delete('/:id', function(req, res, next) {
  Song.findByIdAndRemove(req.params.id, req.body, function (err, post) {
    if (err) return next(err);
    res.json(post);
  });
});

router.get("/statusList/list", function(req, res, next) {
    res.json(Song.schema.path('status').options.enum);
});

module.exports = router;
