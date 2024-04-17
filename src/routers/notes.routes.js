const express = require('express');
const router = express.Router();
const {NotesModel, NoteFields} = require('../models/notes.model');

router.get('/notes/getAllNotes', async (req, res) => {
    try
    {
        const notes = await NotesModel.find({});
        res.send(notes.map(note =>  ({title: note.title, _id: note._id})));
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
        const note = await NotesModel.findOne({_id: req.body._id});
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
        if(!checkIfNoteExists(req.body.title)) {
            console.log('------------');
            const note = await new NotesModel({title: req.body.title, content: ''}).save();
            res.status(200).send(note);
        } else {
            console.log('title', title)
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
            const [note] = await NotesModel.findOne({_id: req.body._id});
            note.title = req.body.title;
            const saveStatus = await note.save();
            res.status(200).send(saveStatus);
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
        const note = await NotesModel.findOne({_id: req.body._id});
        note.content = req.body.content;
        const saveStatus = await note.save();
        res.status(200).send(saveStatus);
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