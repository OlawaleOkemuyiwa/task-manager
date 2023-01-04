const validator = require("validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const mongoose = require("../db/mongoose");
const Task = require("./task");

//creating our own schema (the configuration object for a Mongoose model which reps each individual documents that populates a collection in a db) instead of making mongoose do it for us in order to take advantage of middleware(Middleware allows you to register some code to run before[pre] or after[post] a lifecycle event for your model e.g. you could use middleware to register some code to run just after a user is deleted/before the user is saved. This can be used to hash passwords just before saving a user document to the db. schema also enables us setup our own custom methods
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String, //the name field must be of string type, if not an error is returned
      required: true, //the name field must be provided
      trim: true, //remove extra spacing from the inputted name string
    },
    email: {
      type: String,
      required: true,
      unique: true, //the email must be unique. i.e no previous user document should be that new email about to be saved to the db
      trim: true,
      lowercase: true, //always convert the string value provided for the email field to lower case before saving to the db
      validate(value) {
        if (!validator.isEmail(value)) throw new Error("Email is invalid");
      },
    },
    age: {
      type: Number,
      default: 0, //if no age field is provided use 0 as the default age
      validate(value) {
        if (value < 0) throw new Error("Age must be a positive number!");
      },
    },
    password: {
      type: String,
      required: true,
      minlength: 7,
      trim: true,
      validate(value) {
        if (value.toLowerCase().includes("password")) {
          throw new Error('Password must not include the word "password"');
        }
      },
    },
    tokens: [
      {
        token: {
          type: String,
          required: true,
        },
      },
    ],
    avatar: {
      type: Buffer,
    },
  },
  {
    timestamps: true,
  }
);

//set a mongoose middleware up to hash the plain text password just before a user document is saved to the db(just before user.save() executes)
userSchema.pre("save", async function (next) {
  //this gives access to the document (individual user) that is about to be saved to the users collection in the db
  const user = this;

  //check if the password of such user is being changed/updated. This would be true when the user is first created and when the password of the user is being updated. This is done bcos we only want to hash the password when a new user with a password is created or when we update the password of a user and NOT evertime a user field (e.g name) is updated where user.save() is then called which will triger unnecessary hashings.
  if (user.isNew || user.isModified("password")) {
    user.password = await bcrypt.hash(user.password, 8);
  }

  //next is called to signify that we're done running middleware func and the user can now be saved in the db. if next is never called, it is just gonna hang forever thinking we're still running some pre-save user code
  next();
});

//set up a method on schema.statics which can then be directly accessed on the model created (i.e. by User.findByCredentials -> statics are for methods that act on the collection as a whole.)
userSchema.statics.findByCredentials = async (email, password) => {
  //find the user by email provided
  const user = await User.findOne({ email });

  //check if such user exists in the db
  if (!user) throw new Error("Unable to login");

  //compare the provided login password with the hashed password stored in the db
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error("Unable to login");
  }

  //user details confirmed and returned
  return user;
};

//set up a method on schema.methods which are basically methods of an instance created from the model (i.e. user.generateAuthTokenAndSaveUser() -> methods are for methods that act on a single document in a collection)
userSchema.methods.generateAuthTokenAndSaveUser = async function () {
  const user = this;
  const token = jwt.sign(
    { userId: user._id.toString() },
    process.env.JWT_SECRET
  );

  //user.tokens = users.tokens.concat({ token }) initially the tokens array of a user document is empty. But as the user is signing up up/loging in, a sub document with a token field(token up here is a string of an encoded token which has type and required props specified) is created. tokens is made an array to achieve a functionality that allows user to theoretically have multiple sessions logged in simultaneously e.g same user on multiple devices at once[i.e. an array of tokens]. So we then have a token for PC login, another token if you log in with a mobile device etc.
  user.tokens.push({ token });
  await user.save();

  return token;
};

//toJSON() is a method that can be defined on an object to customize its JSON representation. When res.send(obj) is called, express behind the scenes convert the obj to be sent out to a JSON string by calling JSON.stringify(obj) [a method in the global JSON object that converts a JS value to a JSON string]. JSON.stringify(obj) in turn calls the toJSON() method of such obj and the result is used as the JSON representation of the obj. [Whenever you call JSON.stringify() on an object, the toJSON method on that object (if there is one) gets called. Here we're customizing user.toJSON() in order to delete password and token properties on a user document before the returning the stripped user obj from user.toJSON() method. The stripped obj is then stringified by JSON.stringify() and then sent back to client]
//if you call JSON.stringify() on an obj that does not have a custom toJSON() method, the object will be serialized/stringified using its default behavior.
userSchema.methods.toJSON = function () {
  const user = this;

  //strip user of all properties and methods e.g user.save() imbedded in it by moongose and converts it to a plain js object to be sent as a response json
  //THIS IS KNOWN AS SERIALIZATION
  const userObj = user.toObject();

  //delete some properties off the object we dont want public
  delete userObj.password;
  delete userObj.tokens;
  delete userObj.avatar;

  return userObj;
};

//set up a virtual field on user document (a data not stored in the db but a relationship between two entities i.e user and task) which can then be populated. The virtual field userTasks is an array of tasks created by a user
userSchema.virtual("userTasks", {
  ref: "Task", //reference from the user's virtual field to the Task model
  localField: "_id", //where the local data is stored i.e the _id field in user document === owner field in Task
  foreignField: "owner", //the name of the field on the other entity(i.e the owner field in the referenced Task) that's gonna create the relationship
});

//set up a middleware that deletes the tasks created by user just before such user is removed from the db
userSchema.pre("remove", async next => {
  const user = this;
  await Task.deleteMany({ owner: user._id });

  next();
});

//define a user model in which we do data validation and sensitization on the fields of a document(through its schema)
const User = mongoose.model("User", userSchema);

module.exports = User;
