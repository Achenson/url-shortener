"use strict";

var express = require("express");
var mongo = require("mongodb");
var mongoose = require("mongoose");
var bodyParser = require("body-parser");

var cors = require("cors");

var app = express();
var opn = require("opn");

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here

app.use(bodyParser.urlencoded({ extended: false }));

app.use("/public", express.static(process.cwd() + "/public"));

const MONGOLAB_URI =
  "mongodb+srv://Achenson:dsf3Z1IKO1GCEZtv@mongo-for-fcc-13gh5.mongodb.net/test?retryWrites=true&w=majority";
// Basic Configuration
//var port = process.env.PORT || 3000;
var port = 3000;
/** this project needs a db !! **/

mongoose
  .connect(MONGOLAB_URI, { useNewUrlParser: true })
  .then(() => console.log("connection succesfull"))
  .catch(err => console.log(err));

const EntrySchema = new mongoose.Schema({
  short: { type: String, required: true },
  long: { type: String, required: true }
});

const Entry = mongoose.model("Entry", EntrySchema);

app.get("/", function(req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

app.get("/api/shorturl/:shorturl", function(req, res, next) {
  Entry.find({ short: req.params.shorturl }, function(err, post) {
    if (err) return next(err);

    //find method return an array
    if (!post.length) {
      console.log("nie ma");
      res.send(post);
    } else {
      console.log(post[0].long);
      //opening link in a new tab
      opn(post[0].long);
      res.send({ original_url: post[0].long, short_url: post[0].short });
    }
  });
});

app.post("/api/shorturl/new", function(req, res, next) {
  // short url
  const myUrl = req.body.url;

  const properURL = /^https*:\/\/\w+\.\w+\.\w+(\/[^\/]+)*\/*$/i;

  if (!properURL.test(myUrl)) {
    res.send({ error: "invalid URL" });
  } else {
    Entry.find({ long: myUrl }, function(err, post) {
      if (err) return next(err);

      if (post.length) {
        res.send({ error: "URI already present in the database" });
      } else {
        let newShort = 1;
        let newShortToString = "notThis";

        makeNewShort();

        function makeNewShort() {
          Entry.find({ short: newShort.toString() }, function(err, post, next) {
            if (err) return next(err);

            if (post.length) {
              newShort += 1;
              //recursive call to makeNewShort if the value for short URL is already taken
              makeNewShort();
            } else {
              newShortToString = newShort.toString();

              const newEntry = new Entry({
                short: newShortToString,
                long: req.body.url
              });

              newEntry.save(function(err) {
                if (err) return console.error(err);
              });

              res.send({
                original_url: req.body.url,
                short_url: newShortToString
              });
            }
          });
        }
      }
    });
  } /////
});

app.listen(port, function() {
  console.log("Node.js listening ...");
});
