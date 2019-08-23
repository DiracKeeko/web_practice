var formidable = require("formidable");

exports.showAdminDashboard = function(req,res){
    if(req.session.login != true || req.session.role != "admin"){
        res.redirect("/admin/login");
        return;
    }
	res.render("admin/index",{
		page : "index"
	});
}

exports.showAdminCourse = function(req,res){
    res.render("admin/course",{
        page : "course"
    });
}

exports.showAdminStudent = function(req,res){
    res.render("admin/student",{
        page : "student"
    });
}

exports.showAdminReport = function(req,res){
	res.render("admin/report",{
		page : "report"
	});
}

exports.showLogin = function(req,res){
	res.render("admin/login");
}

exports.doLogin = function(req,res){
	var form = new formidable.IncomingForm();
    form.parse(req, function(err, fields, files) {
    	if(err){
    		res.json({"result" : -1});	//-1表示服务器错误
    		return;
    	}
    	var id = fields.id;			//用户输入的用户名
        var password = fields.password;	//用户输入的密码
        
        if(id=='admin' && password=="admin"){
            req.session.login = true;
            req.session.role = 'admin';
            res.json({'result': 1});
        }else{
            res.json({"result" : -2});
        }
    });	
}

exports.doLogout = function(req,res){
    req.session.login = false;
    req.session.role = "";
    res.redirect("/admin/login");
}

exports.checkLogin = function(req,res,next){
    if(req.session.login != true || req.session.role != "admin"){
        res.redirect("/admin/login");
        return;
    }
	next();
}