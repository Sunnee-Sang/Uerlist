const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const controllers = require('./controllers');
const fileUpload = require('express-fileupload');
const Soldier = require('./models/Soldier');
const app = express();
const port = 8888;
app.use(cors());//solving the CORS issue
app.use(fileUpload())
app.use(express.json({limit: '50mb', extended: true})) // for parsing application/json
app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded

mongoose.connect(
    'mongodb+srv://xiaoyuesang:xiaoyuesang@dev-twu5o.mongodb.net/test?retryWrites=true&w=majority', 
    {useNewUrlParser: true, 
    useUnifiedTopology: true,
    useFindAndModify:false}
);
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  // we're connected!
  console.log("db connected");
});


//Soldier.findOneAndUpdate({name:"databses"}, {children: ["5efc458fad46cb66b47a1a86","5efc45db9326d766d4fd9c8c"]}).then(console.log('updata sucess'))
//Soldier.find( {parent:"5efc45040df7276674668aa6"}).then((res)=>console.log(res));
app.use(controllers);
app.listen(port);