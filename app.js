require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const app = express();
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect("mongodb://localhost:27017/userDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const userScehma = new mongoose.Schema({
  email: String,
  key: String,
});

userScehma.plugin(encrypt,{ secret: process.env.SECRET, encryptedFields: ["key"]});

const User = mongoose.model("User", userScehma);

app.get("/", function (req, res) {
  res.render("home");
});

app.get("/login", function (req, res) {
  res.render("login");
});

app.get("/register", function (req, res) {
  res.render("register");
});

app.post("/register", function (req, res) {
  const newUser = new User({
    email: req.body.username,
    key: req.body.password,
  });
  newUser.save(function (err) {
    if (err) {
      console.log(err);
    } else {
      res.render("secrets");
    }
  });
});

app.post("/login",function(req,res){
    const userName = req.body.username;
    const password = req.body.password;
    User.findOne({email: userName},function(err,foundUser){
        if(err){
           console.log(err);
           
        }
        else{
            if(foundUser){
                if(foundUser.key === password){
                    res.render("secrets");
                }
                else{
                    res.render("partial_success");
                }
            }
            else{
                res.render("fail");
            }
        }
    })
});

app.listen(3000, function () {
  console.log("Your server is live at port 3000");
});
