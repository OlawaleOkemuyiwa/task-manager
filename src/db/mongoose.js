const mongoose = require("mongoose");

//connect mongoose (MONGOOSE ALLOWS US HAVE MORE CONTROL OVER THE TYPE OF DATA WE ALLOW INTO THE DATA BASE THROUGH VALIDATION, SANITIZATION etc)
mongoose.connect(process.env.MONGOOSE_URL);

module.exports = mongoose;
