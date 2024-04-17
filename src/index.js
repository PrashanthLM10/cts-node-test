// setting messageId whichis the id of the document in Mongodb.
global.messageId = 123;
global.print = console.log;
const express = require('express');
const cors = require('cors');
const messageRoutes = require('./routers/message.routes');
const notesRoutes = require('./routers/notes.routes');

require('./db/mongoose');

const app = express();
app.use(cors());
app.use(express.json());
app.use(messageRoutes);
app.use(notesRoutes);

// listen to port
app.listen(process.env.PORT || 3001, () => {
    print('port up', process.env.PORT || 3001);
});
