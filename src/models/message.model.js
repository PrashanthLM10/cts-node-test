// create Task Model

const mongoose = require("mongoose");


const Message = new mongoose.Schema({
    _id: {
        type:Number,
        required: true
    },
    message: {
        type: String,
        required: true,
        trim: true
    },
    time:{
        type: Number,
        required: true
    }
}, {
    timestamps: true,
    'collection': 'Message'
})

module.exports = {MessageModel: mongoose.model('Message', Message), messageFields: ['message','_id']};