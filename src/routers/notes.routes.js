const express = require('express');
const router = express.Router();
const {NotesModel, NoteFields} = require('../models/notes.model');

router.get('/notes/getAllNotes', async (req, res) => {
    try
    {
        const notes = await NotesModel.find({});
        console.log(notes);
        res.send(notes);
    } catch(e) {
        res.status(500).send(e);
    }
});

/* 
    @params: id
*/
router.post('/notes/getNote', async (req, res) => {
    try
    {
        const note = await NotesModel.findOne({_id: req.query.id});
        res.send(note);
    } catch(e) {
        res.status(500).send(e);
    }
});

/* 
    Note:
    - The title of the note must be unique.
    @params: title, content
*/
router.post('/notes/addNote', async (req, res) => {
    try
    { 
        const note = new NotesModel(req.body);
        if(!checkIfNoteExists(req.body.title)) {
            await note.save();
            res.send(note);
        } else {
            res.status(400).send('Note with the same title already exists');
            return;
        }
    } catch(e) {
        res.status(500).send(e);
    }
});

/* 
    @params: id, title
*/
router.post('/notes/updateNoteTitle', async (req, res) => {
    try
    {
        if(!checkIfNoteExists) {
            const note = await NotesModel.findOneAndUpdate({_id: req.body.id}, req.body, {new: true});
            res.send(note);
        } else {
            res.status(400).send('Note with the same title already exists');
            return;
        }
    } catch(e) {
        res.status(500).send(e);
    }
});

/* 
    @params: id, title, content
*/
router.post('/notes/updateNoteContent', async (req, res) => {
    try
    {
        const note = await NotesModel.findOneAndUpdate({_id: req.body.id}, req.body, {new: true});
        res.send(note);
    } catch(e) {
        res.status(500).send(e);
    }
});


const getAllNoteTitles = async () => {
    const notes = await NotesModel.find({});
    return notes.map(note => note.title);
}

const checkIfNoteExists = async (title) => {
    const titles = await getAllNoteTitles();
    return titles.includes(title);
}

module.exports =  router;