const express = require("express");
const Task = require("../models/task");
const auth = require("../express-middleware/auth");

const router = new express.Router();

//set up a POST request handler for the route "host/tasks" (this is a rest API route for creating new tasks);
router.post("/tasks", auth, async (req, res) => {
  const user = req.user;
  const task = new Task({ ...req.body, owner: user._id });
  try {
    await task.save();
    res.status(201).send(task);
  } catch (error) {
    res.status(400).send(error);
  }
});

//GET "host/tasks?completed=true/false" in order to fetch tasks documents created by a particular authorized user based on its "completed" query
//GET "host/tasks?limit=10&skip=3" to limit the number of results we get back for any given request and skip to the no of data we wish to skip
//GET "host/tasks?sortBy=createdAt/completed_asc" [asc == from the oldest data to the newest, desc == from the newest to the oldest]
router.get("/tasks", auth, async (req, res) => {
  const user = req.user;

  const taskCompleted = req.query.completed;
  const limit = req.query.limit;
  const skip = req.query.skip;
  const sortBy = req.query.sortBy;

  const match = {};
  if (taskCompleted) {
    match.completed = taskCompleted === "true";
  }

  const sort = {};
  if (sortBy) {
    const parts = sortBy.split("_");
    sort[parts[0]] = parts[1] === "desc" ? -1 : 1;
  }

  try {
    await user.populate({
      path: "userTasks", //populate the virtual field which has been connected to Task with data of tasks created by it. Basically an array of task documents
      match, //filter the data returned back e.g return only documents whose completed field is true
      options: {
        limit: parseInt(limit, 10), //limit the amount of data returned to the number specified
        skip: parseInt(skip, 10), //if skip === 3, then skip the first 3 task data and return the rest
        sort,
      },
    });
    res.send(user.userTasks);
  } catch (error) {
    res.status(500).send();
  }
});

//set up a GET request handler for the route "host/tasks/:id" in order to fetch a partcular task document
router.get("/tasks/:id", auth, async (req, res) => {
  const taskId = req.params.id;
  const user = req.user;
  try {
    const task = await Task.findOne({ _id: taskId, owner: user._id });
    if (!task) {
      return res.status(404).send();
    }
    res.send(task);
  } catch (error) {
    res.status(500).send();
  }
});

//set up a PATCH request handler to update/modify field(s) a task document
router.patch("/tasks/:id", auth, async (req, res) => {
  const taskId = req.params.id;
  const user = req.user;
  const update = req.body;
  const updateKeys = Object.keys(update);
  const fieldsThatCanBeUpdated = ["description", "completed"];
  const updateIsVailid = updateKeys.every(updateKey =>
    fieldsThatCanBeUpdated.includes(updateKey)
  );

  if (!updateIsVailid) {
    return res.status(400).send({ error: "Invalid request" });
  }

  try {
    const task = await Task.findOne({ _id: taskId, owner: user._id });

    if (!task) return res.status(404).send();

    updateKeys.forEach(updateKey => (task[updateKey] = update[updateKey]));
    await task.save();

    res.send(task);
  } catch (error) {
    res.status(400).send(error);
  }
});

//set up a DELETE request handler to delete a task document
router.delete("/tasks/:id", auth, async (req, res) => {
  const taskId = req.params.id;
  const user = req.user;
  try {
    // const taskToDelete = await Task.findOne({
    //   _id: taskId,
    //   owner: user._id,
    // });
    // await taskToDelete.remove();

    const taskDeleted = await Task.findOneAndDelete({
      _id: taskId,
      owner: user._id,
    });
    if (!taskDeleted) return res.status(404).send();

    res.send(taskDeleted);
  } catch (error) {
    res.status(500).send();
  }
});

module.exports = router;
