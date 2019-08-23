var formidable = require("formidable");
var fs = require("fs");
var Course = require("../models/Course.js");
var mongoose = require("mongoose");
var url = require("url");


exports.showAdminCourseImport = function(req,res){
    res.render("admin/course/import",{
        page : "course"
    });
}

exports.showAdminCourseAdd = function(req,res){
    res.render("admin/course/add",{
        page : "course"
    });
}


//执行导入JSON数据，进入数据库。
exports.doAdminCourseImport = function(req,res){
	var form = new formidable.IncomingForm();
	//设置上传路径
	form.uploadDir = "./uploads";
	form.keepExtensions = true;
    form.parse(req, function(err, fields, files) {
        if(err){
            res.send("上传失败！请检查！");
            return;
        }
    	//得到上传这个文件，发出读取请求
        fs.readFile(files.coursejson.path,function(err,data){
            if(err){
                    res.send("上传失败！请检查！");
                    return;
                }
            var dataobj = JSON.parse(data.toString());
            //先删除数据表
            mongoose.connection.collection("courses").drop(function(){
                //读的内容插入数据库
                Course.insertMany(dataobj.courses,function(err,r){
                    if(err){
                        res.send("上传失败！请检查！");
                        return;
                    }
                    res.send("恭喜！成功导入" + r.length + "条课程信息！");
                });
            }); 
        });
    });
}


exports.getAllCourse = function(req,res){
    var rows = url.parse(req.url,true).query.rows;  
    var page = url.parse(req.url,true).query.page;
    var sidx = url.parse(req.url,true).query.sidx;
    var sord = url.parse(req.url,true).query.sord;
    var keyword = url.parse(req.url,true).query.keyword;

    var sordNumber = sord == "asc" ? 1 : -1;

    if(keyword === undefined || keyword == ""){
        var findFiler = {}; //空对象，检索全部
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


// ↙ 修改某个课程 行编辑之后jqgrid默认向当前页的url发送post请求
exports.updateCourse = function(req,res){
    var form = new formidable.IncomingForm();
    form.parse(req, function(err, fields, files) {
        var cid = fields.cid;
        Course.find({"cid" : cid} , function(err,results){
            if(err){
                res.send({"result" : -2});  //-2表示数据库错误
                return;
            }
            if(results.length == 0){
                res.send({"result" : -1});  //-1表示查无此人，无法更改
                return;
            }
            //得到学生
            var thecourse = results[0];
            //改
            thecourse.name = fields.name;
            thecourse.dayofweek = fields.dayofweek;
            thecourse.number = fields.number;
            thecourse.allow = fields.allow.split(",");
            thecourse.teacher = fields.teacher;
            thecourse.briefintro = fields.briefintro;
            //持久化
            thecourse.save(function(err){
                if(err){
                    res.send({"result" : -2});  //-2表示数据库错误
                    return;
                }

                res.send({"result" : 1});   //1表示成功
            });
        });
    });
}

// ↙ 删除表单中选中的课程
exports.removeCourse = function(req,res){
    var form = new formidable.IncomingForm();
    form.parse(req, function(err, fields, files) {
        //直接命令模块做事情，删除元素。
        Course.remove({"cid" : fields.arr},function(err,obj){
            if(err){
                res.json({"result" : -1});
            }else{
              
                res.json({"result" : obj.result.n});
            }
        })
    });
}


// 增加课程
exports.addCourse = function(req,res){
    var form = new formidable.IncomingForm();
    form.parse(req, function(err, fields, files) {
        if(err){
            res.json({"result" : -1});      //-1表示服务器错误
            return;
        }
        var cid = fields.cid;
        // ↙ 验证课程编号是否冲突
        Course.count({"cid" : cid},function(err,count){
            if(err){
                res.json({"result" : -1});
                return;
            }
            if(count != 0){
                res.json({"result" : -3});  //-3表示用户名被占用
                return;
            }

            var c = new Course({
               cid : fields.cid,
               name : fields.name,
               dayofweek : fields.dayofweek,
               allow : fields.allow,
               number : fields.number,
               teacher : fields.teacher,
               briefintro : fields.briefintro
               
            });
            c.save(function(err){
                if(err){
                    res.json({"result" : -1});
                    return;
                }
                res.json({"result" : 1});
            });
        });
    });
}
