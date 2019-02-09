const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mysql = require('mysql');
const _ = require('underscore');

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

//check if user exists
app.post('/login', (req,res)=>{
    return new Promise((resolve,reject)=>{
        let name = req.body.name;
        let password = req.body.password;
        console.log('name ', name, ' password ', password);
        if(!name || !password){
            resolve({error:true, message:'name/password not provided', status:400})
        }
        let query = `select * from user where user_name = '${name}'`
        conn.query(query,(err,result,fields)=>{
            try{
                if(err) throw err;
            }catch(err){
                reject({status:false,data:err});
            }
            console.log('result ', result);
            if(result){
                if(result[0].user_name === name && result[0].password === password){
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
app.get('/getAllCategories',async (req,res)=>{
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
        let reply_result;
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
                reply_result = result;
                let query1 = `SELECT reply_id, flag, count(*) as count from vote where question_id = '${question_id}' group by reply_id, flag`;
                conn.query(query1,(err1,result1,fields)=>{
                    try{
                        if(err) throw err;
                    }catch(err){
                        reject({status:false,data:err})
                    }
                    if(result1){
                        console.log('Reply result ', reply_result);
                        console.log('Votes result ', result1);
                        _.each(reply_result,(reply)=>{
                            reply.like = 0;
                            reply.dislike = 0;
                            console.log('Each reply ', reply);
                            _.each(result1,(vote)=>{
                                console.log('Each vote ', vote);
                                if(reply.reply_id === vote.reply_id && vote.flag == 'true'){
                                    reply.like = reply.like + vote.count;
                                }
                                if(reply.reply_id === vote.reply_id && vote.flag == 'false'){
                                    reply.dislike = reply.dislike + vote.count;
                                }
                            })
                        })
                        resolve({success:true, data:reply_result})
                    }else{
                        resolve({success:true,data:[]})
                    }
                })
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

//post a new question
app.post('/newQuestion', (req,res)=>{
    return new Promise((resolve,reject)=>{
        let data = req.body;
        console.log('Data passed ', data);
        if(data){
            let query = `INSERT INTO question(user_id,category_id,title,body) VALUES('${data.user_id}','${data.category}','${data.title}','${data.body}')`;
            conn.query(query,(err,result,fields)=>{
                try{
                    if(err) throw err;
                }catch(error){
                    reject(error)
                }
                if(result){
                    console.log(result)
                    resolve({status:true,data:'question added successfully'});
                }else{
                    reject({status:false,data:'Something went wrong'});
                }
            })
        }else{
            reject({status:false,data:'Data not provided'})
        }
    }).then((result)=>{
        res.json(result)
    }).catch((error)=>{
        res.json(error)
    })

});

//add a new reply
app.post('/addReply',(req,res)=>{
    return new Promise((resolve,reject)=>{
        let data = req.body;
        console.log('Data passed ', data);
        if(data){
            let query = `INSERT INTO reply(user_id,question_id,comment) VALUES('${data.user_id}','${data.question_id}','${data.comment}') `;
            conn.query(query,(err,result,fields)=>{
                try{
                    if(err) throw err;
                }catch(error){
                    reject(error)
                }
                if(result){
                    console.log(result)
                    resolve({status:true,data:'reply added successfully'});
                }else{
                    reject({status:false,data:'Something went wrong'});
                }
            })
        }else{
            reject({status:false,data:'Data not provided'})
        }
    }).then((data)=>{
        res.json(data)
    }).catch((error)=>{
        res.json(error)
    })
});

app.post('/addVote',(req,res)=>{
    return new Promise((resolve,reject)=>{
        let data = req.body;
        console.log('Data passed ', data);
        if(data){
            let query = `INSERT INTO vote(user_id,question_id,reply_id,flag) VALUES('${data.user_id}','${data.question_id}','${data.reply_id}','${data.flag}') `;
            conn.query(query,(err,result,fields)=>{
                try{
                    if(err) throw err;
                }catch(error){
                    reject(error)
                }
                if(result){
                    console.log(result)
                    resolve({status:true,data:'reply added successfully'});
                }else{
                    reject({status:false,data:'Something went wrong'});
                }
            })
        }else{
            reject({status:false,data:'Data not provided'})
        }
    }).then((data)=>{
        res.json(data)
    }).catch((error)=>{
        res.json(error)
    })

})

app.listen(8088, function () {
    console.log('Node app is running on port 8088');
});