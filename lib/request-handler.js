var request = require('request');
var crypto = require('crypto');
var bcrypt = require('bcrypt-nodejs');
var util = require('../lib/utility');

var User = require('../app/models/user');
var Link = require('../app/models/link');

exports.renderIndex = function(req, res) {
  res.render('index');
};

exports.signupUserForm = function(req, res) {
  res.render('signup');
};

exports.loginUserForm = function(req, res) {
  res.render('login');
};

exports.logoutUser = function(req, res) {
  req.session.destroy(function(){
    res.redirect('/login');
  });
};

exports.fetchLinks = function(req, res) {
  Link.find({}, function(err, links){
    if (err) {
      util.handleInternalError(req, res, err);
    } else {
      res.send(200, links);
    }
  });
};

exports.saveLink = function(req, res) {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    res.send(404);
  } else {
    Link.findOne({ url: uri }, function(err, link) {
      if (link) {
        res.send(200, link);
      } else {
        util.getUrlTitle(uri, function(err, title) {
          if (err) {
            util.handleInternalError(req, res, err);
          }
          Link.create({
            url: uri,
            visits: 0,
            base_url: req.headers.origin,
            title: title
          }, function(err, newLink){
            if (err) {
              util.handleInternalError(req, res, err);
            }
            res.send(200, newLink);
          });

        });
      }
    });

  }

};

exports.loginUser = function(req, res) {
  var username = req.body.username;
  var password = req.body.password;

  User.findOne({ username: username }, function(err, user) {
    if (err){
      util.handleInternalError(req, res, err);
    } else {
      if (!user) {
        res.redirect('/login');
      } else {
        user.comparePassword(password, function(match) {
          if (match) {
            util.createSession(req, res, user);
          } else {
            res.redirect('/login');
          }
        });
      }
    }
  });
};

exports.signupUser = function(req, res) {
  var username = req.body.username;
  var password = req.body.password;

  User.findOne({ username: username }, function(err, user) {
    if (err){
      util.handleInternalError(req, res, err);
    } else {
      if (!user) {
        User.create({
          username: username,
          password: password
        }, function(err, newUser) {
          if (err) {
            util.handleInternalError(req, res, err);
          } else {
            util.createSession(req, res, newUser);
          }
        });
      } else {
        console.log('Account already exists');
        res.redirect('/signup');
      }
    }

  });
};

exports.navToLink = function(req, res) {
  Link.findOne({ code: req.params[0] }, function(err, link) {
    if (err){
      util.handleInternalError(req, res, err);
    } else {
      if (!link) {
        res.redirect('/');
      } else {
        link.visits++;
        link.save(function(err, result) {
          if (err) {
            util.handleInternalError(req, res, err);
          } else {
            res.redirect(link.url);
          }
        });
      }
    }
  });
};
