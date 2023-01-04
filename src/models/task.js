const mongoose = require("../db/mongoose");

const taskSchema = new mongoose.Schema(
  {
    description: {
      type: String,
      required: true,
      trim: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      require: true,
      ref: "User", //allows us create a reference from this field to another model. The model is specified by writing it out just as it was when the model was created by mongoose.model i.e. owner field --> User model
    },
    completed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Task = mongoose.model("Task", taskSchema);

module.exports = Task;
