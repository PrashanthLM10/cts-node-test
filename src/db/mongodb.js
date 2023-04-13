const {MongoClient} = require('mongodb');
const Todo = require('./models/to-do.model');
const yargs = require('yargs');

//Db client variable
let dbClient;

const connectionUrl = 'mongodb://127.0.0.1:27017'
const databaseName = 'to-do';
let clientObj;

MongoClient.connect(connectionUrl, {useNewUrlParser: true, useUnifiedTopology: true }, (error, client) => {
    if(error) return console.log('Error connecting to DB');

    const db = client.db(databaseName);

    //insert doc
    /* db.collection('users').insertOne({name: 'Sunny', email: 'prashanth.sunny0236@gmail.com'}, (error, res) => {
        if(error) return console.log('Error connecting inserting record');
    }); */

    //dbClient = db;

    // find docs
    /* const insertProm = db.collection('tasks').find({'status': false});
    insertProm.toArray().then(console.log); */

    // update docs
    /* const insertprom = db.collection('tasks').updateMany({completed: true}, {$set:{completed: false}});
    insertprom.then(console.log); */

    //delete docs
    /* const deletProm = db.collection('users').deleteMany({name: 'Sunny'});
    deletProm.then(console.log); */
    
});









        /* Mongodb client can be assigned to a global variable and used outside
        yargs.command('add', 'Add task',  {
            todo: {
                type: 'string',
                require: true
            }, status: {
                type: 'boolean',
                require: false
            }, tags: {
                type: 'string',
                require: false
            }
        }, (arg) => {
            setTimeout(() => {
                console.log('----------------', dbClient)
            }, 4000);
        } )

yargs.parse(); */