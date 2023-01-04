const express = require("express");
const multer = require("multer");
const sharp = require("sharp");

const User = require("../models/user");
const auth = require("../express-middleware/auth");
const { sendWelcomeEmail, sendCancelEmail } = require("../emails/account");
const router = new express.Router();

//set up a POST request handler for the route "host/users" (this is a rest API route for SIGNUP/creating new users);
router.post("/users", async (req, res) => {
  const user = new User(req.body);
  try {
    await user.save();
    sendWelcomeEmail(user.email, user.name);
    const token = await user.generateAuthTokenAndSaveUser();
    res.status(201).send({ user, token });
  } catch (error) {
    res.status(400).send(error);
  }
});

//set up a POST request handler for the route "host/users/login" (this is a rest API route for authenticating and logging in a user);
router.post("/users/login", async (req, res) => {
  try {
    const user = await User.findByCredentials(
      req.body.email,
      req.body.password
    );
    const token = await user.generateAuthTokenAndSaveUser();
    res.send({ user, token });
  } catch (error) {
    res.status(400).send();
  }
});

//set up a route handler to allow users log out from a session (removing the presently generated token)
router.post("/users/logout", auth, async (req, res) => {
  try {
    const token = req.token;
    const user = req.user;
    user.tokens = user.tokens.filter(tokenDoc => tokenDoc.token !== token);
    await user.save();
    res.send({ success: "logout successful" });
  } catch (error) {
    res.status(500).send();
  }
});

//setup up a route handler to allow a user logout from all sessions (wipping out all previously generated tokens)
router.post("/users/logoutAll", auth, async (req, res) => {
  try {
    const user = req.user;
    user.tokens = [];
    await user.save();
    res.send();
  } catch (error) {
    res.status(500).send();
  }
});

//set up a GET request handler for the route "host/users/me" in order to get the profile of the currently logged-in(authenticated) user
router.get("/users/me", auth, async (req, res) => {
  res.send(req.user);
});

//set up a PATCH request handler to update/modify the document of an authenticated user
router.patch("/users/me", auth, async (req, res) => {
  const update = req.body;
  const user = req.user;
  const updateKeys = Object.keys(update);
  const fieldsThatCanBeUpdated = ["name", "email", "password", "age"];
  const updateIsValid = updateKeys.every(updateKey =>
    fieldsThatCanBeUpdated.includes(updateKey)
  );

  if (!updateIsValid) {
    return res.status(400).send({ error: "Invalid Updates!!" });
  }

  try {
    updateKeys.forEach(updateKey => (user[updateKey] = update[updateKey]));
    await user.save();
    res.send(user);
  } catch (error) {
    res.status(500).send(error);
  }
});

//set up a DELETE request handler to delete an authenicated user document from db
router.delete("/users/me", auth, async (req, res) => {
  try {
    const user = req.user;
    await user.remove();
    sendCancelEmail(user.email, user.name);
    res.send(user);
  } catch (error) {
    res.status(500).send();
  }
});

const upload = multer({
  // dest: "avatars",
  limits: {
    fileSize: 1000000,
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error("Please upload a supported image type"));
    }
    cb(undefined, true);
  },
});

//Set up a post request handler to make an authenticated user upload a picture
router.post(
  "/users/me/avatar",
  auth,
  upload.single("avatar"),
  async (req, res) => {
    const user = req.user;
    //req.file.buffer is the image buffer provided by multer/upload middeware after it has run the fileFilter validation function
    const buffer = await sharp(req.file.buffer)
      .resize({ width: 250, height: 250 })
      .png()
      .toBuffer();
    user.avatar = buffer;
    await user.save();
    res.send();
  },
  async (error, req, res, next) => {
    res.status(400).send({ error: error.message });
  }
);

//set up a delete request handler to make an authenticated user delete it's avatar
router.delete("/users/me/avatar", auth, async (req, res) => {
  const user = req.user;
  try {
    user.avatar = undefined;
    await user.save();
    res.send();
  } catch (error) {
    res.status(500).send();
  }
});

//set up a URL to serve uploaded images up(to use in image tags when creating the user profile in client side)
router.get("/users/:id/avatar", async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);
    if (!user || !user.avatar) throw new Error();

    //set a response header
    res.set("Content-Type", "image/png");

    res.send(user.avatar);
  } catch (error) {
    res.status(404).send();
  }
});

module.exports = router;
