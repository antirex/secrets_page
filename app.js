require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const app = express();
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");
// const hash = require("md5"); can generate 20 billion hashes/second
// const bcrypt = require("bcrypt");  can generate 17k hases/second
// const saltRounds = 10; dont use many rounds it might take days :) ......greater Sr's more secure!
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose"); //will salt and hash the user's password automatically!

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize()); //initialize the passport package
app.use(passport.session()); //ask passport to use that session

mongoose.connect("mongodb://localhost:27017/userDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.set("useCreateIndex", true);

const userScehma = new mongoose.Schema({
  email: String,
  key: String,
});

userScehma.plugin(passportLocalMongoose);

// userScehma.plugin(encrypt,{ secret: process.env.SECRET, encryptedFields: ["key"]});

const User = mongoose.model("User", userScehma);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", function (req, res) {
  res.render("home");
});

app.get("/login", function (req, res) {
  res.render("login");
});

app.get("/register", function (req, res) {
  res.render("register");
});

app.get("/secrets", function (req, res) {
  if (req.isAuthenticated()) {
    res.render("secrets");
  } else {
    res.redirect("login");
  }
});

//cookie gets deleted every time we restart the server

app.get("/logout",function(req,res){
  req.logOut();
  res.redirect("/");
})
app.post("/register", function (req, res) {
  User.register({ username: req.body.username }, req.body.password, function (
    err,
    user
  ) {
    if (err) {
      console.log(err);
      res.redirect("register");
    } else {
      passport.authenticate("local")(req, res, function () {
        res.redirect("secrets");
      });
    }
  });
});

app.post("/login", function (req, res) {
  const newUser = new User({
    username: req.body.username,
    password: req.body.password,
  });
  req.login(newUser, function (err) {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function () {
        res.redirect("secrets");
      });
    }
  });
});

app.listen(3000, function () {
  console.log("Your server is live at port 3000");
});
