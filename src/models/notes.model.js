const mongoose = require("mongoose");

const Note = new mongoose.Schema({
    title: String,
    content: String,
    created_at: Date,
    updated_at: Date
}, {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    collection: "Notes"
});

module.exports = {NotesModel: mongoose.model('Note', Note), noteFields: ['title', 'content', '_id']}