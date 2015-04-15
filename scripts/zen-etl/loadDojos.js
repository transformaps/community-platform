'use strict'

var fs = require('fs');
var seneca = require('seneca')();
var async = require('async');

var dojos = JSON.parse(fs.readFileSync('./data/dojos.json', 'utf8'));
var plugin = "load-dojos";
var config = require('config');
var ENTITY_NS = "cd/dojos";

var pg = require('pg');
var conString = config.postgresql.connstring;

function pgEscapeString(str){
  var escapedStr = str ? str.split("'").join("''") : "";
  return escapedStr;
}


seneca.ready(function() {
  seneca.add({ role: plugin, cmd: 'insert' }, function (args, done) {

    var client = new pg.Client(conString);

    client.connect(function(err){
      
      if(err){
        console.error('could not connect to postgres', err);
        return done(err)
      }

      function createDojo(dojo, cb){

        var query = "INSERT INTO cd_dojos(id, mysql_dojo_id, name, creator, created, verified_at, verified_by," +
                    "verified, need_mentors, stage, time, location, coordinates, notes, email, " + 
                    "website, twitter, google_group, eb_id, supporter_image, deleted, deleted_by, deleted_at," +
                    "private, url_slug, continent, alpha2, alpha3, country_number, country_name)" + 
                    " VALUES ('" + dojo.id + "','" + dojo.mysql_dojo_id + "','" + pgEscapeString(dojo.name) + "','"+
                     dojo.creator + "','" + dojo.created + "','"  + dojo.verified_at + "','"  +
                     dojo.verified_by + "'," + dojo.verified + "," + dojo.need_mentors + "," +
                     dojo.stage + ",'" + pgEscapeString(dojo.time) + "','" + pgEscapeString(dojo.location) + "','" +
                     pgEscapeString(dojo.coordinates) + "','" + pgEscapeString(dojo.notes) + "','" + dojo.email + "','" + dojo.website + "','" +
                     dojo.twitter + "','" + dojo.google_group + "','" + dojo.eb_id + "','" + dojo.supporter_image + "','" +
                     dojo.deleted + "','" + dojo.deleted_by + "','"  + dojo.deleted_at + "','" + dojo.private + "','" +  dojo.url_slug + 
                     "','" + dojo.continent +  "','"  + dojo.alpha2 + "','" + dojo.alpha3 + "'," + dojo.country_number + ",'" + pgEscapeString(dojo.country_name) + "')";

        console.log("query", query);
        
        client.query(query, function(err, result) {
          if(err) {
            console.error('error running query', err);
            return cb(err);
          }
          
          return cb();
        });
      }

      var loadDojos = function (done) {
        async.eachSeries(dojos, createDojo , done);
      };

      async.series([
        loadDojos
      ], function(err){
        if(err){
          return done(err);
        }

        client.end();
        done();
      });
    
    });


  });

  seneca.act({ role: plugin, cmd: 'insert', timeout: false }, function(err){
    if(err){
      console.log(err);
      process.exit(1);
    } else{
      console.log("dojos complete");
      process.exit(0);
    }   
  });
  
});
