const express = require("express");
require("dotenv").config();

const userRouter = require("./routers/user");
const taskRouter = require("./routers/task");

const app = express();

//customize our server to parse incoming json data (e.g req.body json data) straight-up to a JS object
app.use(express.json());

//register the created user router to our express app
app.use(userRouter);

//register the created task router to our express app
app.use(taskRouter);

module.exports = app;
