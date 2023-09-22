const express = require('express');
const router = new express.Router();
const {MessageModel, messageFields} = require('../models/message.model');    
const {PreviousMessageModel, prevMessageFields} = require('../models/previousMessage.model');    


//get routes

router.get('/message/getMessage/:id', async (req, res) => {
    try{
        const id = req.params.id;
        print(id);
        const [messageObj] = await MessageModel.find({_id:messageId} );
        const [previousMessageObj] = await PreviousMessageModel.find({_id:messageId} );
        if(previousMessageObj) {
            messageObj.previousMessage = previousMessageObj.message;
            messageObj.previousMessageTime = previousMessageObj.updatedAt;
        }
        const response = {
            message: messageObj.message,
            time: messageObj.updatedAt,
            previousMessage: previousMessageObj?.message || '',
            previousMessageTime: previousMessageObj?.updatedAt || ''
        }
        res.status(200).send(response);
    } catch (e) {res.status(500).send(e)};
});

//post routes
router.post('/message/setMessage', async (req, res) => {
    try {
        const {message} = {...req.body};
        const [messageObj] = await MessageModel.find({_id:messageId} );
        const [prevMessageObj] = await PreviousMessageModel.find({_id:messageId} );
        if(messageObj) {
            let prevMsgSaveStatus;
                if(prevMessageObj) {
                    prevMessageObj.message = messageObj.message;
                    prevMessageObj._id = messageId;
                    prevMsgSaveStatus = await prevMessageObj.save();
                } else {
                    prevMsgSaveStatus = await new PreviousMessageModel({_id: messageId, message: message}).save();
                }
                messageObj._id = messageId;
                messageObj.message = message;
                const saveStatus = await messageObj.save();
                res.status( 200).send({prevMsgSaveStatus, saveStatus});
        } else {
            const saveStatus = await new MessageModel({_id: messageId, message: message}).save();
            res.status( 200).send( saveStatus);
        }
    }catch(err){
        res.status(500).send(err);
    }
});

router.get('/', (req, res) => {
    res.status(200).send('working');
})


module.exports =  router;