const express = require("express");
const session = require("express-session");
const val = require("express-validator");
const handlebars = require("express-handlebars");
const fs = require("fs");
const words = fs.readFileSync("/usr/share/dict/words", "utf-8").toLowerCase().split("\n");
const bp = require("body-parser");

const app = express();

app.engine("handlebars", handlebars());
app.set("views", "./views");
app.set("view engine", "handlebars");

// Location of static files.
app.use(express.static("public"));

app.use(val());

app.use(
  session({
    secret: "ninja",
    resave: false,
    saveUninitialized: true
  })
);

// Parses data
app.use(bp.json());
app.use(bp.urlencoded( {
  extended: false
}));

app.use((req, res, next) => {
  if (!req.session.word) {
    req.session.word = [];
  }
  next();
});

let word;
let wordArray;
let emptyArray = [];//empty array for initial setup
let spentCharArray = [];
let remTurns = 8;

app.get('/', function(req, res) {
  if (req.session.word.length === 0) {
    word = words[Math.floor(Math.random() * words.length)]; //selects random word from library
    wordArray = (word.toUpperCase()).split(""); //splits random word into array
    req.session.word = wordArray;
    for (var i = 0; i < word.length; i++) {
      emptyArray.push("_"); //creates empty array of same length as word
    }
  }

  res.render('home', {
    emptyArray: emptyArray,
    remTurns: remTurns
  })
});

app.post("/charGuess", function(req, res) {

  let character = req.body.character.toUpperCase();

  req.checkBody('character', '- Please enter a character ').notEmpty();
  req.checkBody('character', '- Only 1 character allowed').len(1, 1);

  req.getValidationResult()

    .then((result) => {
      // do something with the validation result -
        // throw error method:
    if (!result.isEmpty()) {
      throw new Error(result.array().map((item) => item.msg).join(' - '));
        } else if (spentCharArray.includes(character)) {
        throw new Error('Letter has already been guessed');
      } else {
        console.log('No errors')
      }
    })

    .then(() => {
      //if guessed letter is present run this block:
      if (wordArray.includes(character)) {
        if (!spentCharArray.includes(character)) {
          spentCharArray.push(character);
        }
        for (var i = 0; i < wordArray.length; i++) {
          if (character === wordArray[i]) {
            emptyArray.splice(i, 1, character);
            console.log(emptyArray);
          }
        }
        //setup link to winpage
        if (wordArray.join("").toString() === emptyArray.join("").toString()) {
           return res.render('winner', {
            word: word
          });
        }
      }
      //if guessed letter is not present
      else {
        remTurns--;
        spentCharArray.push(character);
        if (remTurns === 0) {
          return res.render('loser', {
            word: word
          })
        }
      }
      res.render('home', {
        emptyArray: emptyArray,
        spentCharArray: spentCharArray,
        remTurns: remTurns
      });
    })

    .catch((error) => {
      res.render('home', {
        emptyArray: emptyArray,
        error: error,
        spentCharArray: spentCharArray,
        remTurns: remTurns
      });
    })
});

app.post("/reset", (req, res) =>{
  req.session.word = [];
    emptyArray = [];
    spentCharArray = [];
    remTurns = 8;
    res.redirect("/");
});


app.listen("3000", () => console.log("Port 3000 listening."));
