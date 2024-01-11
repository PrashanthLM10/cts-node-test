// create Task Model

const mongoose = require("mongoose");


const PreviousMessage = new mongoose.Schema({
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
    'collection': 'PreviousMessage'
})

module.exports = {PreviousMessageModel: mongoose.model('PreviousMessage', PreviousMessage), prevMessageFields: ['message','_id']};