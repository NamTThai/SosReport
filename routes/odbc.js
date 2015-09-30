var express = require('express');
var router = express.Router();

var fs = require('fs');
var log = require('./log');
var sqlite = require('sqlite3').verbose();

var dbUrl = "//cio-screencon/C$/Program Files (x86)/ScreenConnect/App_Data/Session.db";

router.get('/export', function(req, res) {
  var db = new sqlite.Database(dbUrl);

  var query = "select SessionConnection.ConnectionID, Session.Name, Session.GuestMachineDomain, " +
    "SessionConnection.ParticipantName, SessionConnectionEvent.EventType, SessionConnectionEvent.Time " +
    "from SessionConnection inner join Session on Session.SessionID = SessionConnection.SessionID inner join SessionConnectionEvent on SessionConnection.ConnectionID = SessionConnectionEvent.ConnectionID" + " where";

  var params = [];
  if (req.query.workstation) {
    query += ' Session.Name = (?)';
    params.push(req.query.workstation);
  }

  if (req.query.domain) {
    query += ' Session.GuestMachineDomain = (?)';
    params.push(req.query.domain);
  }

  if (req.query.user) {
    query += " SessionConnection.ParticipantName = '" + req.query.user + "'";
    params.push(req.query.user);
  }

  if (params.length === 0) {
    res.send({
      statusCode: 500,
      message: "No criteria was provided"
    });
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
      query = "select distinct ParticipantName from SessionConnection";
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
        response.push(row);
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
