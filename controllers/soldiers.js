const express = require('express');
const router = express.Router();
const Soldier = require('../models/Soldier');



router.get('/', (req, res) => {
    let num =7
    //let num = parseInt(req.query.page_items);
    let pageNum = (parseInt(req.query.page) - 1) * num;
    if(pageNum < 0) {
        pageNum = 0;
    }
    //search info
    let searchInfo = {};
    //!!!! need to take care of searching for parent
    if(req.query.term) {
        let content = req.query.term;
        let searchItems = [
            {name: {$regex : `.*${content}.*`, $options: 'i'}}, 
            {email: {$regex : `.*${content}.*`, $options: 'i'}}, 
            {sex: {$regex : `.*${content}.*`, $options: 'i'}},
            //{parent: {$regex : `.*${content}.*`, $options: 'i'}}
        ];
        searchInfo = {$or: searchItems};
    }
    //sort info
    let sortInfo = { createdAt: -1 };
    if(req.query.sort_by) {
        sortInfo = { [req.query.sort_by]: parseInt(req.query.order)};
    }
    //Model.find(filter, [projection], [options], [callback])
    Soldier.find(searchInfo)
        .sort(sortInfo)
        .skip(pageNum)
        .limit(num)
        .then((docs)=>{
            if(docs.length === 0) {
                res.json("Sorry no results");
            } else {
                console.log(docs)
                res.status(200).json(docs);
            }
        })
        .catch((err)=>{
            res.json(err);
        });
});
//get all parents of current target for test 
/*if (rank === "Private") {
    superior = await Solider.find({ $text: { $search: "General Colonel Major Captain" } } )
   console.log(superior)
   return superior
}else if (rank === "Captain") {
  superior = await Solider.find({ $text: { $search: "General Colonel Major" } } )
   return superior
}else if (rank === "Major") {
    superior = await Solider.find({ $text: { $search: "General Colonel " } } )
   return superior
}else if (rank === "Colonel") {
   superior = await Solider.find({ $text: { $search: "General" } } )
   return superior
}*/

async function getAvailableparents(soldier) {
    const rank = soldier.rank;
    let findone = {} ;
    if (rank === "Private") {
        findone = { $text: { $search: "General Colonel Major Captain" }}
        //console.log(findone)
    } else if (rank === "Captain") {
        findone = { $text: { $search: "General Colonel Major" } } 
       // console.log(findone)
   }else if (rank === "Major") {
        findone ={ $text: { $search: "General Colonel " } } 
       // console.log(findone)
   }else if (rank === "Colonel") {
        findone = { $text: { $search: "General" } } 
        //console.log(findone)
   }
   try {
       const superior = await Soldier.find(findone);
       return superior;

    } catch (error) {
        console.error(error)
    }
}

/*async function getAvailableparents(target) {
    let result = [];
    let children = [];
    let q = [];
    children.push(target._id);
    q.push(target._id);
    try {
        while(q.length > 0) {
            ele = q.pop();
            const nextChildren = await Soldier.find({parent: ele});
            //children.push(...nextChildren);
            nextChildren.map((item)=>{
                q.push(item._id);
                children.push(item._id);
            });
        }
        const res = await Soldier.find({ _id: { $nin: children }});
        result = res;
    } catch(e) {
        console.log(e);
    }
    return result;
}*/

router.get('/parents/:id', async (req, res) => {
    const id = req.params.id;
    try {
        const soldier = await Soldier.findById(id);
        console.log(soldier);
        getAvailableparents(soldier).then((res)=>{
            const superior = res.map(({name}) =>name)
            //console.log(superior);
            return superior
        }).then((doc)=> {
            res.status(200).json(doc)
        })
       // console.log(result);
      // res.json(result)
    } catch (error) {
        console.error(err.message);
        res.status(500).send('Server Error');
    } 
});
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

async function createNew (cur) {
    if(cur.parent !== "null") {
        try {
            const parent = await Soldier.findById(cur.parent);
        } catch(e) {
            cur.parent = "null";
        }
    }
    return cur.save();
}
router.post('/', (req, res) => {
    //after save the new soldier, we need to update its parent's children info
    let soldier = req.body;
    //console.log(soldier)
    //let parent = null;

   if(soldier.parent !== '') {
        parent = soldier.parent;
    }
    let createSoldier = new Soldier({
        name: soldier.name,
        rank: soldier.rank,
        sex: soldier.sex,
        startDate: soldier.startDate,
        phone: soldier.phone,
        email: soldier.email,
        parent: parent,
        children: [],
        image: soldier.image,
        createdAt: new Date()
    });
    createNew(createSoldier)
        .then((doc) => {
            res.json(doc);
        })
        .catch((err) => {
            console.log(err);
        });
    // createSoldier.save()
    //     .then((child) => {
    //         if(child.parent !== "null") {
    //             return Soldier.findById(child.parent)
    //                     .then((parent) => {
    //                         parent.children.push(child._id);
    //                         return parent.save();
    //                      });
    //         }
    //     }).then(() => {
    //         res.json("after save: update success");
    //     })
    //     .catch((err) => {
    //         console.log(err);
    //     });*/
});

router.put('/:id', (req, res) => {
    let  id = req.params.id;
    let updateInfo = req.body;
    var prevparent = "null";
   // console.log(updateInfo)
    Soldier.findById(id)
        .then((child) => {
            console.log(child)
            if(updateInfo.name) {
                child.name = updateInfo.name;
            }
            if(updateInfo.rank) {
                child.rank = updateInfo.rank;
            }
            if(updateInfo.sex) {
                child.sex = updateInfo.sex;
            }
            if(updateInfo.startDate) {
                child.startDate = updateInfo.startDate;
            }
            if(updateInfo.phone) {
                child.phone = updateInfo.phone;
            }
            if(updateInfo.email) {
                child.email = updateInfo.email;
            }
            if(updateInfo.parent !== 'null') { 
                //change paren  
                //child.superior = updateInfo.superior; 
                prevparent = child.parent;
                //console.log(prevparent);
                child.parent = updateInfo.parent
                
            } else{
                prevparent= child.parent;
                child.parent = [];
                child.superior= 'N/A'
                //return prevparent
            }
            if(updateInfo.image) {
                child.image = updateInfo.image
            }
             return child.save() ;
        })
        .then( async (child)=>{ 
           // console.log(child)
            const parent = await Soldier.findById(child.parent)
            if(parent){child.superior= parent.name;}
             return child.save();
         })
        .then((child) => { 
            //remove from previous parent
            if(prevparent.length !== 0) {
                console.log('this.isthe test',prevparent)
                Soldier.findById(prevparent)
                            .then((parent) => {
                                console.log(parent);
                                console.log(typeof(child._id))
                                let newChildren = parent.children.filter((item)=>item.toSting !== child._id.toSting);
                                console.log(newChildren)
                                parent.children = newChildren;
                                parent.save();
                            });
            }
            //insert to current parent
            //console.log(updateInfo)
            if(child.parent.length !== 0) {
                console.log('this is the update ds', child.parent)
                Soldier.findById(child.parent)
                        .then((parent) => {
                            parent.children.push(child._id);
                            parent.save();
                         });
            } 
        })
        .then(() => {
            res.json("update success");
        })
        .catch((err) => {
            console.log(err);
        });
    
}); 



/*router.delete('/:id', (req, res) => {
    let id = req.params.id;
    Soldier.findOneAndDelete({_id: id})
        .then((current) => {
             const parent= current.parent;
             const chilrenNew = current.children;
             if (parent !== undefined ){
                return Soldier.findById(parent)
                .then((it) => {
                    let newChildren = it.children.filter((item)=>item !== id);
                    it.children = newChildren;
                    return it.save();
                });
             }
             console.log('now delete all the children have the parent');
             console.log(childrenNew)
            //"current" is deleted, its children should have null parent
            if(childrenNew.length !== 0  ) {
                console.log(children)
                return Promise.all(children.map(async (item) => {
                    await Soldier.findOneAndUpdate({_id: item._id}, { $unset: { parent: "" }});
                })).then(() => {
                    console.log("delete all the child as parent");
                });
                           
            }
        })
        .then(() => {
            res.json("delete success");
        })
        .catch((err) => {
            console.log(err);
        });
});*/

//delete one 
/*router.delete('/:id', (req, res) => {
    const id = req.params.id;
    Soldier.findOneAndDelete({_id: id})
        .then((current) => {
            console.log(current)
            //remove from its superior's children
            if(current.parent !== undefined) {
                console.log(`${current.parent}`);
                return Soldier.findById(current.parent)
                            .then(async (parent) => {
                                let newChildren = parent.children.filter((item)=>item != id);
                                parent.children = newChildren;
                                await parent.save();
                            });
            }
            //"current" is deleted, its children should have null superior
            //console.log(`${current.children.length}`)
            if(current.children.length !== 0) {
                console.log("inside function")
                console.log(`${current.children}`)
                return Promise.all(current.children.map(async (item) => {
                    console.log(item)
                    await Soldier.findOneAndUpdate({_id: item._id},{ $unset: { parent: "" }});
                }))
            }
        })
        .then(() => {
            res.json("delete success");
        })
        .catch((err) => {
            console.log(err);
        });    
    })*/


    router.delete('/:id', async (req, res) => {
        const id = req.params.id;
        try {
            const current = await Soldier.findOneAndDelete({_id: id});
            console.log(current);
            if( current.parent.length !== 0) {
                console.log(`${current.parent}`);
                const parent = await Soldier.findById(current.parent);
                parent.children = parent.children.filter((item)=>item != id)  
                await parent.save();
            };
            if(current.children.length !== 0) {
                console.log("inside function")
                console.log(`${current.children}`)
                Promise.all(current.children.map(async (item) => {
                    console.log(item)
                    await Soldier.findOneAndUpdate({_id: item._id},{parent: [], superior: 'N/A'});
                }))
            }
            return res.status(200).json('delete sucuess ')
        } catch (error) {
            console.error(error);
            return res.status(500).json({ msg: 'Server error' });
        }

    })


module.exports = router;