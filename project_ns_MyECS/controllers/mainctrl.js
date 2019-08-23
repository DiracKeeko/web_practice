var formidable = require("formidable");
var Student = require("../models/Student.js");
var Course = require("../models/Course.js");
var crypto = require("crypto");
var _ = require("underscore");
var url = require("url");

exports.showLogin = function(req,res){
	res.render("login");
}

//执行登录
exports.doLogin = function(req,res){

	var form = new formidable.IncomingForm();
    form.parse(req, function(err, fields, files) {
    	if(err){
    		res.json({"result" : -1});	//-1表示服务器错误
    		return;
    	}
    	var sid = fields.sid;			//用户输入的用户名
    	var password = fields.password;	//用户输入的密码

    	// ↙ 1.先查询有没有这个学生
    	Student.find({"sid" : sid},function(err,results){
    		if(err){
	    		res.json({"result" : -1});	//-1表示服务器错误
	    		return;
    		}

    		if(results.length == 0){
    			res.json({"result" : -2});	//-2表示没有这个学生
	    		return;
    		}

    		// 2.看看这个人是否已经修改过密码
    		var changedPassword = results[0].changedPassword;
    		if(!changedPassword){
    			if(results[0].password === password){
                    req.session.login = true;
                    req.session.sid = sid;
                    req.session.name = results[0].name;
                    req.session.changedPassword = false;
                    req.session.grade = results[0].grade;
    				res.json({"result" : 1});	//1表示登录成功
	    			return;
    			}else{
    				res.json({"result" : -3});	//-3表示密码错误
    				return;
    			}
    		}else{
    			//如果这个人修改过密码，则要将用户输入的密码进行sha256加密之后与数据库中的密码进行匹配。
    		    if(results[0].password === crypto.createHash("sha256").update(password).digest("hex")){
                    
                    req.session.login = true;
                    req.session.sid = sid;
                    req.session.name = results[0].name;
                    req.session.changedPassword = true;
                    req.session.grade = results[0].grade;
                    res.json({"result" : 1});   //1表示登录成功
                    return;
                }else{
                    res.json({"result" : -3});  //-3表示密码错误
                    return;
                }
            }
    	});
    });
}

//显示报名表格
exports.showIndex = function(req,res){
    if(req.session.role == 'admin'){
        res.send("请以学生身份登录");
        return;
    }
    if(req.session.login != true){
        res.redirect("/login");
        return;
    }
    if(req.session.changedPassword == false){
        res.redirect("/changepw");
        return;
    }

    //呈递首页
    res.render("index",{ 
        "sid" : req.session.sid,
        "name" : req.session.name,
        "grade" : req.session.grade
    });
}


exports.doLogout = function(req,res){
    req.session.login = false;
    req.session.sid = "";
    res.redirect("/login");
}


//更改密码
exports.showChangepw = function(req,res){
    if(req.session.login != true){
        res.redirect("/login");
        return;
    }

    res.render("changepw",{
        "sid" : req.session.sid,
        "name" : req.session.name,
        "grade" : req.session.grade,
        "showtip" : !req.session.changedPassword
    });
}


//更改密码
exports.doChangepw = function(req,res){
    var form = new formidable.IncomingForm();
    form.parse(req, function(err, fields, files) {
        var pw = fields.pw;
        Student.find({"sid" : req.session.sid},function(err,results){
            var thestudent = results[0];
            //更改过密码
            thestudent.changedPassword = true;
            //重写session
            req.session.changedPassword = true;
            //保存更改后的密码
            thestudent.password = crypto.createHash("sha256").update(pw).digest("hex");
            //持久
            thestudent.save();
            res.json({"result" : 1});
        });
    });
}


exports.check = function(req,res){
    if(req.session.login != true){
        res.redirect("/login");
        return;
    }
    var results = {};

    Student.find({"sid" : req.session.sid},function(err,students){
        var thestudent = students[0];
        var mycourses = thestudent.mycourses;
        var grade = thestudent.grade;
        var occupyWeek = [];

        Course.find({},function(err,courses){
            courses.forEach(function(item){
                if(mycourses.indexOf(item.cid) != -1){
                    //已经被占用的星期
                    occupyWeek.push(item.dayofweek);
                }
            });
            

            courses.forEach(function(item){
                if(mycourses.indexOf(item.cid) != -1){
                    results[item.cid] = "已经报名此课";
                }else if(occupyWeek.indexOf(item.dayofweek) != -1){
                    results[item.cid] = "当天被占用";
                }else if(item.number <= 0){
                    results[item.cid] = "人数不够了";
                }else if(item.allow.indexOf(grade) == -1){
                   results[item.cid] =  "年级不符合要求";
                }else if(occupyWeek.length == 2){
                   results[item.cid] =  "已达报名上限";
                }else{
                   results[item.cid] = "可以报名";
                }
            });

            res.json(results);
        });
    });
}

//报名
exports.enroll = function(req,res){
    var sid = req.session.sid;
    var form = new formidable.IncomingForm();
    form.parse(req, function(err, fields, files) {
        var cid = fields.cid;

        Student.find({"sid" : sid },function(err,students){
            students[0].mycourses.push(cid);
            students[0].save(function(){
                Course.find({"cid" : cid} , function(err,courses){
                    courses[0].mystudents.push(sid);
                    courses[0].number --;
                    courses[0].save(function(){
                        res.json({"result" : 1});
                    })
                })
            });
        });
    });
}

//退报
exports.dropout = function(req,res){
    var sid = req.session.sid;
    var form = new formidable.IncomingForm();
    form.parse(req, function(err, fields, files) {
        var cid = fields.cid;

        Student.find({"sid" : sid },function(err,students){
            students[0].mycourses = _.without(students[0].mycourses, cid);
            students[0].save(function(){
                Course.find({"cid" : cid} , function(err,courses){
                    courses[0].mystudents = _.without(courses[0].mystudents, sid);
                     courses[0].number++;
                    courses[0].save(function(){
                        res.json({"result" : 1});
                    })
                })
            });
        });
    });
}

exports.showMycourse = function(req,res){
    if(req.session.login != true){
        res.redirect("/login");
        return;
    }
    Student.find({'sid': req.session.sid},function(err,results){
        var myself = results[0];
        var mycourses = myself.mycourses;
        res.render('mycourse', {
            "sid" : req.session.sid,
            "name" : req.session.name,
            "grade" : req.session.grade,
            'mycourses': mycourses
        });
    });
}

exports.getCourse = function(req,res){
    var cid = req.params.cid;
    Course.find({'cid':cid},function(err,results){
        res.json({'results': results});
    });
}

// 获取所有学生信息
exports.getAllCourse = function(req,res){
    var rows = url.parse(req.url,true).query.rows;  //一页多少条目
    var page = url.parse(req.url,true).query.page;
    var sidx = url.parse(req.url,true).query.sidx;
    var sord = url.parse(req.url,true).query.sord;
    var keyword = url.parse(req.url,true).query.keyword;
    var sordNumber = sord == "asc" ? 1 : -1;

    if(keyword === undefined || keyword == ""){
        var findFiler = {}; 
    }else{
        var regexp = new RegExp(keyword , "g");
        var findFiler = {
            $or : [
                {"cid": regexp},
                {"name": regexp},
                {"teacher": regexp},
                {"briefintro": regexp},
                {"allow": regexp},
                {"dayofweek": regexp}
            ]
        }
    }

    Course.count(findFiler,function(err,count){
        var total = Math.ceil(count / rows);
        var sortobj = {};
        sortobj[sidx] = sordNumber;
        Course.find(findFiler).sort(sortobj).limit(rows).skip(rows * (page - 1)).exec(function(err,results){
            res.json({"records" : count, "page" : page, "total" : total , "rows" : results});
        });
    });
}
