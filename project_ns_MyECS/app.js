var express = require("express");
var mongoose = require('mongoose');
var session = require('express-session');

var adminCtrl = require("./controllers/adminCtrl.js");
var adminStudentCtrl = require("./controllers/adminStudentCtrl.js");
var adminCourseCtrl = require("./controllers/adminCourseCtrl.js");
var adminReportCtrl = require("./controllers/adminReportCtrl.js");
var mainctrl = require("./controllers/mainctrl.js");

//创建app
var app = express();
//链接数据库，斜杠后面是数据库的名字
mongoose.connect('mongodb://localhost/myECS');
//使用session
app.use(session({ 
	secret: 'Keeko', 
	cookie: { maxAge: 1000 * 60 * 20 },
	resave: false ,  
	saveUninitialized : true
}));

//设置模板引擎
app.set("view engine","ejs");

// -------- 中间件，路由清单 -----------
// ↙ 一级界面
app.get		("/admin/login"       		,adminCtrl.showLogin); //管理员-登录页面
app.post	("/admin/login"       		,adminCtrl.doLogin); //管理员-登录页面
app.get		("/admin/*"       			,adminCtrl.checkLogin); // 集体登录验证
app.get   	("/admin/logout"			,adminCtrl.doLogout);	  //退出登录
app.get		("/admin"       			,adminCtrl.showAdminDashboard); //管理员-主页面
app.get 	("/admin/course"			,adminCtrl.showAdminCourse);    //管理员-课程管理页面
app.get  	("/admin/student"			,adminCtrl.showAdminStudent);	//管理员-学生管理页面
app.get   	("/admin/report"			,adminCtrl.showAdminReport); 	//管理员-报表页面
// ↙ 二级界面 student 导入
app.get   	("/admin/student/import"	,adminStudentCtrl.showAdminStudentImport);//导入学生（界面）
app.post  	("/admin/student/import"	,adminStudentCtrl.doAdminStudentImport);  //导入学生（执行）
// ↙ 二级界面 student 增加
app.get  	("/admin/student/add"		,adminStudentCtrl.showAdminStudentAdd);	  //增加学生（界面）
app.post  	("/admin/student/add"		,adminStudentCtrl.addStudent);	//增加学生（执行）
app.propfind("/admin/student/:sid"		,adminStudentCtrl.checkStudentExist);	//检查某个学生是否存在
// ↙ 二级界面 student 表格相关
app.get  	("/admin/student/all"		,adminStudentCtrl.getAllStudent);	//得到所有学生
// ↙ 这条post语句必须放在后面 否则会挡住34 37两行语句
app.post    ("/admin/student/:sid"		,adminStudentCtrl.updateStudent);	// jqgrid表单 修改某个学生的信息
app.delete	("/admin/student/selected"	,adminStudentCtrl.removeStudent);	// 删除表格中选中的学生
app.get  	("/admin/student/download"	,adminStudentCtrl.downloadStudentXlsx);	//下载学生表格

// ↙ 二级界面 course 表格相关
app.get   	("/admin/course/all"		,adminCourseCtrl.getAllCourse); //得到所有课程
app.post  	("/admin/course"			,adminCourseCtrl.updateCourse); //行编辑接口
app.delete	("/admin/course/selected"	,adminCourseCtrl.removeCourse);	//删除选中课程
// ↙ 二级界面 course 导入	
app.get   	("/admin/course/import"		,adminCourseCtrl.showAdminCourseImport);//导入课程（界面）
app.post  	("/admin/course/import"		,adminCourseCtrl.doAdminCourseImport);	//导入课程（执行）
// ↙ 二级界面 course 增加	
app.get   	("/admin/course/add"		,adminCourseCtrl.showAdminCourseAdd);	//增加课程（界面）
app.post 	("/admin/course/add"		,adminCourseCtrl.addCourse);	//添加课程（执行）

// ↙ 二级界面 report 表格相关
app.get   	("/admin/report/student/all",adminReportCtrl.getStudentTable); //获取学生报名情况数据
app.get   	("/admin/report/course"		,adminReportCtrl.showCourseTable); //课程报名情况（界面）
app.get   	("/admin/report/course/all"	,adminReportCtrl.getCourseTable); //获取课程报名情况数据
// ↙其他杂项
app.get		("/admin/data"       		,adminReportCtrl.getData); //管理员-主页面 数据拉取

// ↙ 学生界面
app.get   	("/login"					,mainctrl.showLogin);	  //显示登录页面
app.post 	("/login"				    ,mainctrl.doLogin);		  //处理登录
app.get   	("/"						,mainctrl.showIndex);	  //显示报名表格
app.get   	("/changepw"				,mainctrl.showChangepw);  //更改密码（界面）
app.post  	("/changepw"				,mainctrl.doChangepw);	  //更改密码（执行）
app.get   	("/logout"					,mainctrl.doLogout);	  //退出登录
app.get  	("/check"					,mainctrl.check);		  //检查课程是否能报名
app.get  	("/course/all"				,mainctrl.getAllCourse);  //得到所有课程信息
app.post  	("/enroll"              	,mainctrl.enroll);		  //报名
app.post 	("/dropout"                	,mainctrl.dropout);		  //退报
app.get  	("/mycourse"				,mainctrl.showMycourse);  //我的课程 （页面）
app.get  	("/course/:cid"				,mainctrl.getCourse);  //查询cid的课程信息

//静态资源文件
app.use(express.static("public"));

//设置一个404页面
app.use(function(req,res){
	res.send("你好，你的页面不存在");
});

app.listen(3000);
console.log("程序已经运行在3000端口");