const express = require("express");
const session = require("express-session");
const val = require("express-validator");
const handlebars = require("express-handlebars");
const fs = require("fs");
const words = fs.readFileSync("/usr/share/dict/words", "utf-8").toLowerCase().split("\n");
const bp = require("body-parser");
const morgan = require("morgan");

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
app.use(bp.urlencoded({
  extended: false
}));

app.use(morgan("dev"));

app.use((req, res, next) => {
  if (!req.session.word) {
    req.session.word = [];
  }
  next();
});

let word = 0;
let lettersArray;
let wordGuess = [];
let wrongLetters = [];
let guesses = 8;
let winner;

app.get("/", function(req, res) {
  if (req.session.word.length === 0) {
    // Randomly selects a word from the computer dictionay.
    word = words[Math.floor(Math.random() * words.length)];
    console.log(word);
    // Splits up said random word into individual leters and places them into the array.
    lettersArray = (word.toUpperCase()).split("");
    req.session.word = lettersArray;
    for (var i = 0; i < word.length; i++) {
      wordGuess.push("_");
      console.log(wordGuess);
    }
  }

  res.render("home", {
    wordGuess: wordGuess,
    guesses: guesses
  })
});

app.post("/guess", function(req, res) {

  letter = req.body.letter.toUpperCase();
  console.log(letter);

  req.checkBody("letter", "Please enter a letter ").notEmpty();
  req.checkBody("letter", "Only 1 letter allowed").len(1, 1);

  req.getValidationResult()

    .then((result) => {
      if (!result.isEmpty()) {
        throw new Error(result.array().map((item) => item.msg).join(" - "));
      } else if (wrongLetters.includes(letter)) {
        throw new Error("That letter has already been guessed. Please try again.");
      } else {
        console.log("No errors")
      }
    })

    .then(() => {
      //If guessed letter is present run this block:
      if (lettersArray.includes(letter)) {
        if (!wrongLetters.includes(letter)) {
          wrongLetters.push(letter);
        }
        for (var i = 0; i < lettersArray.length; i++) {
          if (letter === lettersArray[i]) {
            wordGuess.splice(i, 1, letter);
          }
        }
        //If player wins.
        if (lettersArray.join("").toString() === wordGuess.join("").toString()) {
          return res.render("winner", {
            word: word
          });
        }
      }
      //If guessed letter is incorrect.
      else {
        guesses--;
        wrongLetters.push(letter);
        // If no guesses remain.
        if (guesses === 0) {
          console.log(wrongLetters);
        }
      }
      res.render("home", {
        wordGuess: wordGuess,
        wrongLetters: wrongLetters,
        guesses: guesses
      });
    })

    .catch((error) => {
      res.render("home", {
        wordGuess: wordGuess,
        error: error,
        wrongLetters: wrongLetters,
        guesses: guesses
      });
    })
});

app.post("/reset", (req, res) => {
  req.session.word = [];
  wordGuess = [];
  wrongLetters = [];
  guesses = 8;
  res.redirect("/");
});


app.listen("3000", () => console.log("Port 3000 is always listening."));
