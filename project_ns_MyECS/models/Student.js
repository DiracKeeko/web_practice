var mongoose = require('mongoose');

var studentSchema = new mongoose.Schema({
    sid             : String,
    name            : String,
    grade           : String,
    password        : String,
    changedPassword : {type: Boolean, default: false},
    mycourses		: [String],
    mycoursesNum    : Number
})

studentSchema.statics.importStudent = function(worksheetsFormFile){
    let str = "ABDEFGHJKLMNPQRTUVWXYZabdefghijkmnpqrtuvwxyz23456789&$%#@!";
    let gradeArr = ["初一","初二","初三","高一","高二","高三"];

    mongoose.connection.collection('students').drop(function(){
        for(let i = 0; i<worksheetsFormFile.length; i++){
            for(let j = 1; j<worksheetsFormFile[i].data.length; j++){
                let password = '';
                for(let k=0; k<6; k++){
                    password += str[parseInt(str.length * Math.random())];
                }
                let s = new Student({
                    sid : worksheetsFormFile[i].data[j][0],
                    name : worksheetsFormFile[i].data[j][1],
                    grade : gradeArr[i],
					password : password
                })
                s.save();
            }
        }
    });
}

var Student = mongoose.model('Student', studentSchema);

module.exports = Student;

