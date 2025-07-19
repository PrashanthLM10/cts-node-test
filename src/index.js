// setting messageId whichis the id of the document in Mongodb.
global.messageId = 123;
global.print = console.log;
const dotenv = require("dotenv");
const express = require("express");
const cors = require("cors");
const { setSocket } = require("./group/index");
const messageRoutes = require("./routers/message.routes");
const notesRoutes = require("./routers/notes.routes");

require("./db/mongoose");

// setup env, fallback to 'development'
dotenv.config({ path: `.env.${process.NODE_ENV || "development"}` });

// setup express app
let app = express();

// parse req, res to json
app.use(express.json());

// enable cors
app.use(cors());

//add logger middleware
const loggerMiddleWare = (req, res, next) => {
  console.log("Request made to - ", req.path);
  next();
};

//add router(s)
const setupExpress = async () => {
  app.use(loggerMiddleWare);
  app.use(messageRoutes);
  app.use(notesRoutes);
  const { configureRouter } = require("./routers/files");
  app = await configureRouter(app);

  // listen to port
  const server = app.listen(process.env.PORT || 3003, () => {
    print("port up", process.env.PORT || 3003);
  });
  setSocket(server);
};

setupExpress();
