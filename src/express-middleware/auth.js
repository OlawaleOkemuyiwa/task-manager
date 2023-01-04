const jwt = require("jsonwebtoken");
const User = require("../models/user");

//authenticate a user in order to be able to access particular endpoints e.g users/me etc using express middleware that gets 3 arguments: req, res, next
const auth = async (req, res, next) => {
  try {
    //get the token sent as part of the request header
    const token = req.header("Authorization").replace("Bearer ", "");

    //verify that the token is correct(that it was created by our server and hasn't expired) and return decoded object. It has two properties: 1) the obj used to create the token 2)iat prop e.g  decoded == {userId: "6246C....", iat: ......})
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    //using the id encoded when creating the token which is now available on the decoded token, find the user with such id and also has a token field in the tokens array as the present token ["array.field" is a special mongodb syntax to specify a query condition on a field embedded in an array of documents. token is a field embedded in tokens array so "tokens.token"]
    const user = await User.findOne({
      _id: decoded.userId,
      "tokens.token": token,
    });

    //if no such user is found, throw an error
    if (!user) throw new Error();

    //Add token and user as properties to the req object in order to give the route handler that's gonna be executed next access to the user already fetched & authenticated and also such user's token(to avoid making it fetch the user/token again wasting time)
    req.token = token;
    req.user = user;

    //let the route handler func get executed
    next();
  } catch (error) {
    res.status(401).send({ error: "Please authenticate." });
  }
};

module.exports = auth;
