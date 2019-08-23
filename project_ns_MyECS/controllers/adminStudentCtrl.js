var formidable = require('formidable');
var path = require("path");
var fs = require("fs");
var url = require("url");
var xlsx = require('node-xlsx');
var Student = require("../models/Student.js");
var dateformat = require('date-format');

exports.showAdminStudentImport = function(req,res){
    res.render("admin/student/import",{
        page : "student"
    });
}

exports.showAdminStudentAdd = function(req,res){
    res.render("admin/student/add",{
        page : "student"
    });
}

//执行表格的上传
exports.doAdminStudentImport = function(req,res){
	var form = new formidable.IncomingForm();
	form.uploadDir = "./uploads";
	form.keepExtensions = true;
    form.parse(req, function(err, fields, files) {
    	if(!files.studentexcel){
    		res.send("对不起，请上传文件！");
    	}
    	if(path.extname(files.studentexcel.name) != ".xlsx"){
    		fs.unlink("./" + files.studentexcel.path, function(err){
    			if(err){
    				console.log("删除文件错误");
    				return;
    			}
    			res.send("文件类型不正确，你上传的文件已经从服务器删除");
    		});
    		return;
    	}

    	var workSheetsFromFile = xlsx.parse("./" + files.studentexcel.path);
    	if(workSheetsFromFile.length != 6){
    		res.send("系统检查到你的Excel表格缺少子表格");
    		return;
    	}
    	for(var i = 0 ; i < 6 ; i++){
    		if(
    			workSheetsFromFile[i].data[0][0] != "学号" ||
    			workSheetsFromFile[i].data[0][1] != "姓名" 
    		){
    			res.send("系统检查到你的Excel表格" + i + "号子表的表头不正确，请保证6个年级的子表的表头都有“学号”、“姓名”");
    			return;
    		}
    	}
    	Student.importStudent(workSheetsFromFile);
    	res.send("上传成功！");
    });
}


exports.getAllStudent = function(req,res){
    //拿到参数
    var rows = url.parse(req.url,true).query.rows;
    var page = url.parse(req.url,true).query.page;
    var sidx = url.parse(req.url,true).query.sidx;
    var sord = url.parse(req.url,true).query.sord;
    
    var keyword = url.parse(req.url,true).query.keyword;
    var sordNumber = sord == "asc" ? 1 : -1;

    if(keyword === undefined || keyword == ""){
        var findFiler = {}; 
    }else{
        var reg = new RegExp(keyword , "g");
        var findFiler = {
            $or : [
                {"sid": reg},
                {"name": reg},
                {"grade": reg}
            ]
        }
    }

    Student.count(findFiler, function(err,count){
        var total = Math.ceil(count / rows);
        var sortobj = {};
        sortobj[sidx] = sordNumber;
        Student.find(findFiler).sort(sortobj).limit(rows).skip(rows * (page - 1)).exec(function(err,results){
            results.forEach(function(item){
                if(item.changedPassword){
                    item.password = '用户已更改初始密码';
                }
            });
            res.json({"records" : count, "page" : page, "total" : total , "rows" : results});
        });
    });
}

// jqgrid表单 修改学生表格的某项数据
exports.updateStudent = function(req,res){
    //学号
    var sid = parseInt(req.params.sid);
    var form = new formidable.IncomingForm();
    form.parse(req, function(err, fields, files) {
        var key = fields.cellname;
        var value = fields.value;

        Student.find({"sid" : sid} , function(err,results){
            if(err){
                res.send({"result" : -2});  //-2表示数据库错误
                return;
            }
            if(results.length == 0){
                res.send({"result" : -1});  //-1表示查无此人，无法更改
                return;
            }
            //得到学生
            var thestudent = results[0];
            //改
            thestudent[key] = value;
            if(key == 'password'){
                thestudent.changedPassword = false;
            }
            //持久化
            thestudent.save(function(err){
                if(err){
                    res.send({"result" : -2});  //-2表示数据库错误
                    return;
                }
                res.send({"result" : 1});   //1表示成功
            });
        });
    });
}

//增加学生
exports.addStudent = function(req,res){
    var form = new formidable.IncomingForm();
    form.parse(req, function(err, fields, files) {
        if(err){
            res.json({"result" : -11});      //-1表示服务器错误
            return;
        }

        // ↙ 验证数据有效性

        // 1.学号必须是9位数字
        var sid = fields.sid;
        //验证9位是不是满足
        if(!/^[\d]{9}$/.test(sid)){
            res.send({"result" : -2});      //-2 输入学号不正确
            return;
        }

        // 2.验证姓名是否合法
        var nameTxt = fields.name;
        //验证
        if(!/^[\u4E00-\u9FA5]{2,5}(?:·[\u4E00-\u9FA5]{2,5})*$/.test(nameTxt)){
            res.send({"result" : -3});      //-3表示用户名不合规范
            return;
        }


        // 3.验证年级是否合法
        //年级
        var grade = fields.grade
        //验证
        if(!grade){
            res.json({"result" : -4});  //-4表示年级没有选择
            return;
        }

        // 4.验证密码强度
        //姓名
        var password = fields.password;
        //验证
        if(checkStrength(password) != 3){
            res.json({"result" : -5});  // -5 密码强度有问题
            return;
        }

        function checkStrength(password){
            //积分制
            var lv = 0;
            if(password.match(/[a-z]/g)){lv++;}
            if(password.match(/[A-Z]/g)){lv++;}
            if(password.match(/[0-9]/g)){lv++;}
            if(password.match(/[^A-z0-9]/g)){lv++;}
            if(password.length < 6){lv=0;}
            if(lv > 3){lv=3;}
            return lv;
        }

        // 5.验证学号是否冲突
        Student.count({"sid" : sid},function(err,count){
            if(err){
                res.json({"result" : -12});
                return;
            }
            if(count != 0){
                res.json({"result" : -6});  // -6 学号冲突
                return;
            }


            var s = new Student({
                sid    : fields.sid,
                name   : fields.name,
                grade  : fields.grade,
                password : fields.password
            });
            s.save(function(err){
                if(err){
                    res.json({"result" : -13});
                    return;
                }
                res.json({"result" : 1});
            });
        });
    });
}


// 检查学生是否存在
exports.checkStudentExist = function(req,res){
    //拿到参数
    var sid = parseInt(req.params.sid);
    if(!sid){
        res.json({"result" : -1});
        return;
    }
    // ↘ 查找sid存在的数量  如果为0  表示学号可用
    Student.count({"sid" : sid},function(err,count){
        if(err){
             res.json({"result" : -1});
             return;
        }
        res.json({"result" : count});
    });
};

// ↙ 删除表格中 选中的学生
exports.removeStudent = function(req,res){
    var form = new formidable.IncomingForm();
    form.parse(req, function(err, fields, files) {
        Student.remove({"sid" : fields.arr},function(err,obj){
            if(err){
                res.json({"result" : -1});
            }else{
                res.json({"result" : obj.result.n});
            }
        })
    });
}


//下载全部学生表格
exports.downloadStudentXlsx = function(req,res){
    var TableR = [];
    var gradeArr = ["初一","初二","初三","高一","高二","高三"];
    
    function iterator(i){
        if(i == 6){
            var buffer = xlsx.build(TableR);
            var filename = dateformat('学生清单yyyy年MM月dd日hhmmss_SSS', new Date());
            fs.writeFile("./public/xlsx/" + filename + ".xlsx",buffer,function(err){
                res.redirect("/xlsx/" + filename + ".xlsx");
            });
            return;
        }
         //整理数据
        Student.find({"grade":gradeArr[i]},function(err,results){
            var sheetR = [['学号','姓名','年级','密码']];
            results.forEach(function(item){
                sheetR.push([
                    item.sid,
                    item.name,
                    item.grade,
                    item.password
                ]);
            });

            TableR.push({"name" : gradeArr[i], data : sheetR});
            //迭代！
            iterator(++i);
        });
    }
    iterator(0);
}

