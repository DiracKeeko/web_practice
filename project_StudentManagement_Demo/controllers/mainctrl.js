
var Student = require('../models/Student.js');
var formidable = require("formidable");
// var url = require("url");

exports.showIndex = function(req,res){
	res.render('index');
}

exports.showAdd = function(req,res){
	res.render('add');
}

exports.doAddStudent = function(req,res){
	console.log('server acquire a post');
	var form = new formidable.IncomingForm();
	form.parse(req, function(err,fields,files){
		Student.addStudent(fields,function(result){
			res.json({'result': result});
		})
	})
}

exports.check = function(req,res){
	var sid = req.params.sid;

	console.log('i am check, sid-->' + sid);

	Student.checkSid(sid, function(trueOrF){
		res.json({'result': trueOrF});
	})
}

exports.getAllStudent = function(req,res){
	Student.find({}, function(err,results){
		res.json({'results':results});
	});
}

exports.showUpdate = function(req, res){
	var sid = req.params.sid;

	Student.find({'sid': sid}, function(err,results){
		if(results.length == 0){
			res.send('查无此人，请检查网址');
			return;
		}

		res.render('update', {
			info: results[0]
		});
	})
	
}

exports.updateStudent = function(req, res){
	var sid = req.params.sid;
	if(!sid){
		return;
	}

	// 获取提交的表单信息↙
	var form = new formidable.IncomingForm();
	form.parse(req, function(err,fields,files){
		// ↙ 找到原学生信息
		Student.find({'sid':sid},function(err,results){
			if(results.length == 0){
				res.json({'result':-1});
				return;
			}
			var theStudent = results[0];

			//更改学生信息
			theStudent.name = fields.name;
			theStudent.age = fields.age;
			theStudent.sex = fields.sex;

			theStudent.save(function(err){
				if(err){
					res.json({'result':-1});
				} else {
					res.json({'result': 1});
				}
			});
		});
	});
}


exports.deleteStudent = function(req, res){
	var sid = req.params.sid;
	Student.find({'sid': sid}, function(err, results){
		if(err || results.length == 0){
			res.json({'result': -1});
			return;
		}

		// delete
		results[0].remove(function(err){
			if(err){
				res.json({'result': -1});
				return;
			}

			res.json({'result': 1});
		});
	});
}