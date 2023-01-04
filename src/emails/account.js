const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    type: "OAuth2",
    user: process.env.USER,
    pass: process.env.PASSWORD,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    refreshToken: process.env.REFRESH_TOKEN,
  },
});

const sendWelcomeEmail = (email, name) => {
  const options = {
    from: "okemuyiwaseun@gmail.com",
    to: email,
    subject: "Thanks for joining in!",
    text: `Welcome to the app, ${name}. Let me know how you get along with the app`,
    // html: "<h1> We are glad to have you on board</h1>" we can also include html mark-ups in the textbody
  };

  transporter.sendMail(options, function (error, result) {
    if (error) {
      console.log("Error " + error);
    }
  });
};

const sendCancelEmail = (email, name) => {
  const options = {
    from: "okemuyiwaseun@gmail.com",
    to: email,
    subject: "Sorry to see you go!",
    text: `Goodbye, ${name}. I hope to see you back sometime soon`,
  };

  transporter.sendMail(options, function (error, result) {
    if (error) {
      console.log("Error " + error);
    }
  });
};

module.exports = {
  sendWelcomeEmail,
  sendCancelEmail,
};
