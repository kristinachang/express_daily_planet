"use strict";

var bcrypt = require("bcrypt");
var salt = bcrypt.genSaltSync(10);

module.exports = function(sequelize, DataTypes) {
  var User = sequelize.define("User", {
    email: {
      type: DataTypes.STRING,
      unique: true,
      validate: {
        len: [6, 30],
      }
    },
    passwordDigest: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: true
      }
    }
  }, 

  { instanceMethods: {
    checkPassword: function(password) {
      return bcrypt.compareSync(password, this.passwordDigest);
    }
  },
    classMethods: { 
      encryptPassword: function(password) {
        var hash = bcrypt.hashSync(password, salt);
        return hash;
      },
      createSecure: function(email, password) {
        if(password.length < 6) {
          throw new Error("Password needs to be more than 6 characters");
        }
        return this.create({
          email: email,
          passwordDigest: this.encryptPassword(password)
        });
      },
      authenticate: function(email, password) {
        return this.find({
          where: {
            email: email
          }
        })
        .then(function(user) {
          if (user === null) {
            throw new Error("Username does not exist");
          }
          else if (user.checkPassword(password)) {
            return user;
          }
        });
      }
      // associate: function(models) {
      //   // associations can be defined here
      // }
    }
  });
  return User;
};

