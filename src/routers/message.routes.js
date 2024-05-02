const express = require('express');
const os = require('node:os'); 
const cp = require('child_process');
const router = new express.Router();
const {MessageModel, messageFields} = require('../models/message.model');    
const {PreviousMessageModel, prevMessageFields} = require('../models/previousMessage.model');    


//get routes

router.get('/message/getMessage', async (req, res) => {
    try{
        const [messageObj] = await MessageModel.find({_id:messageId} );
        const [previousMessageObj] = await PreviousMessageModel.find({_id:messageId} );
        if(previousMessageObj) {
            messageObj.previousMessage = previousMessageObj.message;
            messageObj.previousMessageTime = previousMessageObj.time;
        }
        const response = {
            message: messageObj.message,
            time: messageObj.time,
            previousMessage: previousMessageObj?.message || '',
            previousMessageTime: previousMessageObj?.time || ''
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
                    prevMessageObj.time = messageObj.time || new Date().valueOf();
                    prevMsgSaveStatus = await prevMessageObj.save();
                } else {
                    prevMsgSaveStatus = await new PreviousMessageModel({_id: messageId, message: message, time: messageObj.time || new Date().valueOf()}).save();
                }
                messageObj._id = messageId;
                messageObj.message = message;
                messageObj.time = new Date().valueOf();
                const saveStatus = await messageObj.save();
                res.status( 200).send({prevMsgSaveStatus, saveStatus});
        } else {
            const saveStatus = await new MessageModel({_id: messageId, message: message, time: new Date().valueOf()}).save();
            res.status( 200).send( saveStatus);
        }
    }catch(err){
        res.status(500).send(err);
    }
});

router.get('/', (req, res) => {
 
    function getComputerName() {
    switch (process.platform) {
        case "win32":
        return process.env.COMPUTERNAME;
        case "darwin":
        return cp.execSync("scutil --get ComputerName").toString().trim();
        case "linux":
        const prettyname = cp.execSync("hostnamectl --pretty").toString().trim();
        return prettyname === "" ? os.hostname() : prettyname;
        default:
        return os.hostname();
     }
    }
    res.status(200).send({platform: os.platform(), hostname: getComputerName(), machine: os.machine(), userProfile:process.env['USERPROFILE']});
})


module.exports =  router;