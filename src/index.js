global.messageId = 123;
global.print = console.log;
const express = require('express');
const messageRoutes = require('./routers/message.routes');

require('./db/mongoose');

const app = express();

app.use(express.json());
app.use(messageRoutes);

// listen to port
app.listen(process.env.PORT || 3000, () => {
    print('port up');
});

