const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mysql = require('mysql');

//cross origin resource sharing
var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-Response-Time, X-PINGOTHER, X-CSRF-Token, Authorization, Page, URL');
    res.setHeader('Access-Control-Allow-Methods', '*');
    res.setHeader('Access-Control-Expose-Headers', 'X-Api-Version, X-Request-Id, X-Response-Time');
    res.setHeader('Access-Control-Max-Age', '1000');
    next();
};
app.use(allowCrossDomain);

//body parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

//mysql connection
const conn = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'assignment_mini_quora'
});

conn.connect(function(err){
    if(err) throw err;
    console.log('CONNECTED TO MYSQL');
});


app.get('/', function (req, res) {
    return res.send({ error: true, message: 'hello' })
});

//check if user exists
app.post('/login', (req,res)=>{
    return new Promise((resolve,reject)=>{
        let name = req.body.name;
        let password = req.body.password;
        console.log('name ', name, ' password ', password);
        if(!name || !password){
            resolve({error:true, message:'name/password not provided', status:400})
        }
        let query = `select * from user where name = '${name}'`
        conn.query(query,(err,result,fields)=>{
            try{
                if(err) throw err;
            }catch(err){
                reject({status:false,data:err});
            }
            console.log('result ', result);
            if(result){
                if(result[0].name === name && result[0].password === password){
                    resolve({status:true,data:{user_id:result[0].user_id,name:result[0].name,email:result[0].email}})
                }else{
                    reject({status:false});
                }
            }else{
                reject({status:false});
            }
        })
    }).then((data)=>{
        res.json(data)
    }).catch((err)=>{
        res.json(err)
    })
});

//get all categories
app.get('/getAllCategories',(req,res)=>{
    return new Promise((resolve,reject)=>{
        let query = `select * from category`;
        conn.query(query,(err,result,fields)=>{
            try{
                if(err) throw err;
            }catch(err){
                reject({status:false,data:err});
            }
            if(result){
                resolve({status:true, data:result})
            }else{
                resolve({status:true, data:[]})
            }
        })
    }).then((data)=>{
        res.json(data)
    }).catch((error)=>{
        res.json(error)
    })

})

//get all the questions for a user based on category
app.get('/getAllQuestions', (req,res)=>{
    return new Promise((resolve,reject)=>{
        let query = 'select q.question_id, q.user_id, q.category_id, q.title, q.body, u.user_name, u.user_email, c.category_name from question q, category c, user u where u.user_id = q.user_id and q.category_id = c.category_id'; 
        conn.query(query, (err, result, fields)=>{
            try{
                if(err) throw err;
            }catch(err){
                reject({status:false,data:err});
            }
            console.log('result ', result);
            if(result){
                console.log(result);
                resolve({success:true, data:result})
            }else{
                resolve({success:true,data:[]})
            }
        })
    }).then((data)=>{
        res.json(data)
    }).catch((error)=>{
        res.json(error)
    })
});

//get all the replies for a particular question
app.get('/getReplies/:question_id', (req,res)=>{
    return new Promise((resolve,reject)=>{
        let question_id = req.params.question_id;
        console.log('In getReplies ',question_id);
        if(!question_id){
            resolve({error:true, message:'question_id not provided',status:400});
        }
        let query = `select * from reply r, user u where r.user_id = u.user_id and r.question_id = '${question_id}'`
        conn.query(query, (err,result, fields)=>{
            try{
                if(err) throw err;
            }catch(err){
                reject({status:false,data:err});
            }
            console.log('result ', result);
            if(result){
                resolve({success:true, data:result})
            }else{
                resolve({success:true,data:[]})
            }

        })
    }).then((data)=>{
        res.json(data)
    }).catch((error)=>{
        res.json(error)
    })

})

app.listen(8088, function () {
    console.log('Node app is running on port 8088');
});