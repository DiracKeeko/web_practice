var mongoose = require('mongoose');

var studentSchema = new mongoose.Schema({
	sid  : Number, 
	name : String,
	sex  : String,
	age  : Number
});

// 静态方法↘
// 添加学生
studentSchema.statics.addStudent = function(json, callback){
	Student.checkSid(json.sid, function(trueOrF){
		if(trueOrF){
			var s = new Student(json);
			s.save(function(err){
				if(err){
					callback(-2);
					return;
				}
				// 可用，已经保存成功
				callback(1);
			});
		} else {
			// 学号被占用了
			callback(-1);
		}
	})
	
}
// 验证有没有已存在的学号
studentSchema.statics.checkSid = function(sid, callback){
	this.find({'sid': sid},function(err,results){
		//如果没有相同的id，返回true
		//如果有相同的id返回false
		callback(results.length==0);
	});
}

// 静态方法和动态方法都必须在类之间创建
// 创建Student类
var Student = mongoose.model('Student',studentSchema);

// 暴露
module.exports = Student;

