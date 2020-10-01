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
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const findOrCreate = require("mongoose-findorcreate");

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

mongoose.connect("mongodb+srv://Admin-anshul:anshulbamb@cluster0-xiyil.mongodb.net/userDB?retryWrites=true&w=majority", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.set("useCreateIndex", true);

const userScehma = new mongoose.Schema({
  email: String,
  key: String,
  googleId: String,
  secret: String,
});

userScehma.plugin(passportLocalMongoose);
userScehma.plugin(findOrCreate);

// userScehma.plugin(encrypt,{ secret: process.env.SECRET, encryptedFields: ["key"]});

const User = mongoose.model("User", userScehma);

passport.use(User.createStrategy());

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/secrets",
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
    },
    function (accessToken, refreshToken, profile, cb) {
      User.findOrCreate({ googleId: profile.id }, function (err, user) {
        return cb(err, user);
      });
    }
  )
);

app.get("/", function (req, res) {
  res.render("home page");
});

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile"] })
);

app.get(
  "/auth/google/secrets",
  passport.authenticate("google", { failureRedirect: "/login" }),
  function (req, res) {
    // Successful authentication, redirect secrets page.
    res.redirect("/secrets");
  }
);

app.get("/login", function (req, res) {
  res.render("log in");
});

app.get("/register", function (req, res) {
  res.render("register now");
});

app.get("/secrets", function (req, res) {
  User.find({ "secret": { $ne: null } }, function (err, foundUsers) {
    if (err) {
      console.log(err);
    } else {
      if (foundUsers) {
        res.render("secrets", {userWithSecrets: foundUsers});
      }
    }
  });
});

app.get("/submit", function (req, res) {
  if (req.isAuthenticated()) {
    res.render("ok");
  } else {
    res.redirect("login");
  }
});

//cookie gets deleted every time we restart the server

app.get("/logout", function (req, res) {
  req.logOut();
  res.redirect("/");
});

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
    name: req.body.username,
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

app.post("/submit", function (req, res) {
  const submittedSecret = req.body.secret;
  User.findById(req.user.id, function (err, foundUser) {
    if (err) {
      console.log(err);
    } else {
      if (foundUser) {
        foundUser.secret = submittedSecret;
        foundUser.save(function () {
          res.redirect("secrets");
        });
      }
    }
  });
});

app.listen(process.env.PORT || 3000, function () {
  console.log("The Server is live and running smoothly");
});
