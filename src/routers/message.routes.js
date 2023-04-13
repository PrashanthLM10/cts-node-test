const express = require('express');
const router = new express.Router();
const {MessageModel, messageFields} = require('../models/message.model');    


//get routes

router.get('/message/getMessage/:id', async (req, res) => {
    try{
        const id = req.params.id;
        print(id);
        const [messageObj] = await MessageModel.find({_id:messageId} );
        res.status(200).send(messageObj);
    } catch (e) {res.status(500).send(e)};
});

//post routes
router.post('/message/setMessage', async (req, res) => {
    try {
        const {message} = {...req.body};
        const [messageObj] = await MessageModel.find({_id:messageId} );
        if(messageObj) {
                messageObj._id = messageId;
                messageObj.message = message;
                const saveStatus = await messageObj.save();
                res.status( 200).send( saveStatus);
        } else {
            const saveStatus = await new MessageModel({_id: messageId, message: message}).save();
            res.status( 200).send( saveStatus);
        }
    }catch(err){
        res.status(500).send(err);
    }
});


module.exports =  router;