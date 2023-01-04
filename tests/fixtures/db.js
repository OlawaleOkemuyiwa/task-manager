const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const User = require("../../src/models/user");
const Task = require("../../src/models/task");

const userOneId = new mongoose.Types.ObjectId();
const userOne = {
  _id: userOneId,
  name: "Mike Adenuga",
  email: "waleokemuyiwa@gmail.com",
  password: "123mike",
  age: 67,
  tokens: [
    {
      token: jwt.sign({ userId: userOneId }, process.env.JWT_SECRET),
    },
  ],
};

const userTwoId = new mongoose.Types.ObjectId();
const userTwo = {
  _id: userTwoId,
  name: "Jess",
  email: "okemuyiwawale@gmail.com",
  password: "myhouse099@@",
  tokens: [
    {
      token: jwt.sign({ userId: userTwoId }, process.env.JWT_SECRET),
    },
  ],
};

const taskOne = {
  _id: new mongoose.Types.ObjectId(),
  description: "First task",
  completed: false,
  owner: userOne._id,
};

const taskTwo = {
  _id: new mongoose.Types.ObjectId(),
  description: "Second task",
  completed: true,
  owner: userOne._id,
};

const taskThree = {
  _id: new mongoose.Types.ObjectId(),
  description: "Third task",
  completed: true,
  owner: userTwo._id,
};

const setupDatabase = async () => {
  //empty the entire users collection in db
  await User.deleteMany({});
  //empty the entire tasks collection in db
  await Task.deleteMany({});
  //save our first test user into the collection for testong
  await new User(userOne).save();
  //save our 2nd test user into the collection for testing
  await new User(userTwo).save();
  //save the test tasks
  await new Task(taskOne).save();
  await new Task(taskTwo).save();
  await new Task(taskThree).save();
};

module.exports = {
  userOneId,
  userOne,
  userTwoId,
  userTwo,
  taskOne,
  taskTwo,
  taskThree,
  setupDatabase,
};
