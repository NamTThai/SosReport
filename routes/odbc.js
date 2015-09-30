var express = require('express');
var router = express.Router();

var fs = require('fs');
var log = require('./log');
var sqlite = require('sqlite3').verbose();

// var dbUrl = "//cio-screencon/C$/Program Files (x86)/ScreenConnect/App_Data/Session.db";
var dbUrl = "./data/Session.db";

router.get('/export', function(req, res) {
  var db = new sqlite.Database(dbUrl);

  var query = "select Session.Name, Session.Host, Session.IsPublic, " +
    "Session.GuestLoggedOnUserDomain, Session.GuestLoggedOnUserName, " +
    "Session.GuestMachineDomain, Session.GuestMachineName, " +
    "SessionConnectionEvent.EventType, SessionConnectionEvent.Time, " +
    "SessionEvent.Host, SessionEvent.EventType from Session " +
    "left join SessionConnectionEvent on Session.SessionID = SessionConnectionEvent.SessionID " +
    "left join SessionEvent on Session.SessionID = SessionEvent.SessionID where";

  if (req.query.workstation) {
    query += ' Session.Name = "' + req.query.workstation + '"';
  }

  if (req.query.domain) {
    query += ' Session.GuestMachineDomain = "' + req.query.domain + '"';
  }

  if (req.query.user) {
    query += ' SessionEvent.Host = "' + req.query.user + '"';
  }

  response = [];

  log.debug(query);


  db.serialize(function() {
    db.each(query, function(err, row) {
      if (!err) {
        response.push(row);
      }
    }, function(err, rowCount) {
      if (err) {
        log.debug(err);
        res.send({
          statusCode: 500,
          message: err
        });
      } else {

        res.send({
          statusCode: 200,
          response: JSON.stringify(response)
        });
      }
    });
  });
});

router.get('/recommendations', function(req, res) {
  var db = new sqlite.Database(dbUrl);

  var query, column;
  switch(req.query.category) {
    case "workstation":
      query = "select distinct Name from Session";
      column = "Name";
      break;
    case "user":
      query = "select distinct Host from SessionEvent";
      column = "Host";
      break;
    case "domain":
      query = "select distinct GuestMachineDomain from Session";
      column = "GuestMachineDomain";
      break;
    default:
      res.send({
        statusCode: 500,
        message: "category not supported"
      });
      return;
  }

  var response = [];

  db.serialize(function() {
    db.each(query, function(err, row) {
      if (!err) {
        response.push(row[column]);
      }
    }, function(err, rowCount) {
      if (err) {
        res.send({
          statusCode: 500,
          message: err
        });
      } else {
        res.send({
          statusCode: 200,
          response: response
        });
      }
    });
  });

  db.close();
});

function convertToCsv(response) {
  var fileName = Date.now();
  var filePath = require('path').join("public", fileName);
  return fileName;
}

module.exports = router;
