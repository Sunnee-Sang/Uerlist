const express = require('express');
const router = express.Router();
const Soldier = require('../models/Soldier');

//when click superior if current target link to the superior
router.get('/parentsin/:id', async (req, res) => {
    const id = req.params.id;
    try {
        const parentID = await Soldier.find({_id: id})
        const parent = await Soldier.find({_id: parentID[0].parent})
        res.status(200).json(parent)
    } catch (error) {
        console.error( error);
    }
});
//link the DS will return all the children of the superior 

router.get('/childin/:id', async(req, res) => {
    let id = req.params.id;
    try {
        const children = await Soldier.findById(id);
        const child = children.children;
        //console.log(child)
        promise = child.map((item)=>{
            return Soldier.findById(item);
        })
        Promise.all(promise).then((doc)=>{
           return doc}).then(
               ((doc) => res.json(doc))
           )
    } catch (error) {
        console.error(error)
    } 
});

router.get('/', async (req,res) =>{
    try { 
        const allS= await Soldier.find()
        res.status(200).json(allS)
    } catch (error) {
        console.error(error)
        
    }
})
module.exports = router;