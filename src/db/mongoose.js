const mongoose = require('mongoose');

const connectionURL = 'mongodb+srv://prashanth-mongo:Iaamjfs4y!@prashanth-mongo-cluster.sauezk4.mongodb.net/CTS-Node-test';

const MONGODB_URL = 'mongodb+srv://prashanth_kumar_node:sanmongodb@prashanth-node.tzaoh.mongodb.net/Prashanth-Node?retryWrites=true&w=majority';

mongoose.connect(connectionURL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).catch (e=> {
    print(e);
});
