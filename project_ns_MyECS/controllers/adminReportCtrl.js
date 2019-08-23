var formidable = require('formidable');
var path = require("path");
var url = require("url");
var Student = require("../models/Student.js");
var Course = require("../models/Course.js");

exports.getStudentTable = function(req,res){
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
                {"grade": reg},
                {"course": reg},
                {"courseNum": reg}
            ]
        }
    }

    Student.count(findFiler, function(err,count){
        var total = Math.ceil(count / rows);
        var sortobj = {};
        sortobj[sidx] = sordNumber;

        Course.find({},function(err,cResults){
            var cidMap = {};
            cResults.forEach(function(item){
                cidMap[item.cid] = item.name; 
            });
            Student.find(findFiler).sort(sortobj).limit(rows).skip(rows * (page - 1)).exec(function(err,results){
                results.forEach(function(item){
                    for(var i = 0; i<item.mycourses.length; i++){
                        item.mycourses[i] = cidMap[item.mycourses[i]];
                    }
                    // item.mycourses.forEach(function(data){
                    //     item.mycoursesName.push(cidMap[data]);
                    // });
                    item.mycoursesNum = item.mycourses.length;
                });
                res.json({"records" : count, "page" : page, "total" : total , "rows" : results});
            });
        });
    });
}

exports.showCourseTable = function(req,res){
    res.render('admin/reportCourse',{
        page : "report"
    });
}

exports.getCourseTable = function(req,res){
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
        
        var regexp = new RegExp(keyword , "g");
        var findFiler = {
            $or : [
                {"cid": regexp},
                {"name": regexp},
                {"teacher": regexp},
                {"dayofweek": regexp},
                {"allow": regexp}
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


exports.getData = function(req,res){
    var cNum, sNum;
    var sFin = 0;
    Course.find({},function(err,cData){ 
        cNum = cData.length;
        Student.find({},function(err,sData){ 
            sNum = sData.length;
            sData.forEach(function(item){
                if(item.mycourses.length==2){
                    sFin++;
                }
            })
            res.send({"cNum":cNum, "sNum":sNum, "sFin":sFin});
        });
    });
}
