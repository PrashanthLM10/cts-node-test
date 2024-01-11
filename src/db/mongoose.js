const mongoose = require('mongoose');

const connectionURL = 'mongodb+srv://prashanthsunny0236:G34qzW5v7oz0wsfc@messagecluster.0ysmova.mongodb.net/MessageDB?retryWrites=true&w=majority';

const MONGODB_URL = 'mongodb+srv://prashanth_kumar_node:sanmongodb@prashanth-node.tzaoh.mongodb.net/Prashanth-Node?retryWrites=true&w=majority';

mongoose.connect(connectionURL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).catch (e=> {
    print(e);
});
