var express = require('express');
var router = express.Router();

var fs = require('fs');
var log = require('./log');
var sqlite = require('sqlite3').verbose();

var dbUrl = "C:/Program Files (x86)/ScreenConnect/App_Data/Session.db";

router.get('/export', function(req, res) {
  var db = new sqlite.Database(dbUrl);

  var query = "select SessionConnection.ConnectionID, Session.Name, Session.GuestMachineDomain, " +
    "SessionConnection.ParticipantName, SessionConnectionEvent.EventType, SessionConnectionEvent.Time " +
    "from SessionConnection inner join Session on Session.SessionID = SessionConnection.SessionID inner join SessionConnectionEvent on SessionConnection.ConnectionID = SessionConnectionEvent.ConnectionID" + " where ";

  var params = [];
  var queries = [];
  if (req.query.workstation) {
    queries.push('Session.Name = (?)');
    params.push(req.query.workstation);
  }

  if (req.query.domain) {
    queries.push('Session.GuestMachineDomain = (?)');
    params.push(req.query.domain);
  }

  if (req.query.user) {
    queries.push('SessionConnection.ParticipantName = (?)');
    params.push(req.query.user);
  }

  if (params.length === 0) {
    res.send({
      statusCode: 500,
      message: "No criteria was provided"
    });
    return;
  }

  response = [];

  query += queries.join(" and ");

  log.debug(query);

  db.serialize(function() {
    db.each(query, params, function(err, row) {
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
        if (response.length === 0) {
          res.send({
            statusCode: 404,
            message: "Nothing was found"
          });
        } else {
          var jsonRes = {};
          response.forEach(function(row) {
            var key = JSON.stringify(row.ConnectionID);
            if (!jsonRes[key]) {
              jsonRes[key] = [];
              jsonRes[key].push(row.ParticipantName);
              jsonRes[key].push(row.GuestMachineDomain);
              jsonRes[key].push(row.Name);
              jsonRes[key].push(null, null);
            }
            if (row.EventType == 10) {
              jsonRes[key][3] = new Date(row.Time);
            } else {
              jsonRes[key][4] = new Date(row.Time);
            }
          });
          response = [];
          for (var key in jsonRes) {
            response.push(jsonRes[key]);
          }
          var filePath = convertToCsv(response);
          res.send({
            statusCode: 200,
            response: JSON.stringify(response),
            filePath: filePath
          });
        }
      }
    });
  });

  db.close();
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
      column = "ParticipantName";
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
  var fileName = Date.now() + '.csv';
  var filePath = require('path').join("build", fileName);

  var headers = ["Participant", "Company Name", "Machine Name", "Start", "End"];
  var file = fs.createWriteStream(filePath);
  file.write(headers.join(",") + '\n');
  response.forEach(function(row) {
    file.write(row.join(",") + '\n');
  });
  file.end();

  return fileName;
}

module.exports = router;
