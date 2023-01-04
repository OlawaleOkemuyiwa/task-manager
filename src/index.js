const app = require("./app");

const port = process.env.PORT;

app.listen(port, () => {
  console.log(`Server is up on port ${port}`);
});

//  /Users/bglag/mongodb/bin/mongod.exe --dbpath=/Users/bglag/mongodb-data
