var fs = require('fs');
var childProcess = require('child_process');
var gui = require('nw.gui');
var treeKill = require('tree-kill');
var npmDonwload;
var delimiter;
var tasks;
/win*/i.test(process.platform) ? delimiter = '\\' : delimiter = '/';

gui.Window.get().setResizable(false);
gui.Window.get().focus();
// gui.Window.get().requestAttention(true);
// gui.Window.get().setAlwaysOnTop(true);


function createFolder(path) {
    var parentFolder = path.substr(0, path.lastIndexOf('\\'));
    if (fs.existsSync(parentFolder)) {
        fs.mkdirSync(path);
    } else {
        createFolder(parentFolder); 
        createFolder(path); 
    }
}

function createAppFolder(path) {
    var indexHtml = "<!DOCTYPE html>"
                    + "\n<html>"
                    + "\n<head>"
                    + "\n    <meta charset='UTF-8'>"
                    + "\n    <title></title>"
                    + "\n    <link rel='stylesheet' type='text/css' href='css/style.css'>"
                    + "\n    <script src='js/index.js'></script>"
                    + "\n</head>"
                    + "\n<body>"
                    + "\n    <h1>Hello</h1>"
                    + "\n</body>"
                    + "\n</html>";
    fs.mkdirSync(path + '/app');
    // fs.mkdirSync(path + '/app/build');
    // fs.mkdirSync(path + '/app/src');
    // fs.mkdirSync(path + '/app/src/assets');
    // fs.mkdirSync(path + '/app/src/assets/img');
    // fs.mkdirSync(path + '/app/src/assets/libs');
    fs.mkdirSync(path + '/app/libs');
    fs.mkdirSync(path + '/app/js');
    fs.mkdirSync(path + '/app/img');
    fs.mkdirSync(path + '/app/css');
    if (typeof tasks !== 'undefined') {
        var taskDirs = tasks.split(',');
        if ($.inArray('less', taskDirs) >= 0) {
            fs.mkdirSync(path + '/app/css/less');
            fs.mkdirSync(path + '/app/css/maps');
            fs.writeFileSync(path + '/app/css/less/style.less', fs.readFileSync('asset/template/style.less'));
        }
        if ($.inArray('coffee', taskDirs) >= 0) {
            fs.mkdirSync(path + '/app/js/coffee');
            fs.writeFileSync(path + '/app/js/coffee/index.coffee', 'document.write("<h1>hello coffee</h1>")');
        }
    }
    // copy libs to app/libs
    $.each($("#libField li input"), function(i, val) {
    	if ($(this).is(':checked')) {
    		var source = process.cwd() + "\\asset\\libs\\" + $(this).val();
    		var dest = path + "\\app\\libs";
    		var command = "xcopy " + source + " " + dest;
    		if (fs.lstatSync(source).isDirectory()) {
    			command += "  /e /i";
    		}
    		childProcess.exec(command, function(err, stdout, stderr) {
    			if (err !== null) alert('Copy libs failed...' + err);
    		});
    	}
    });
    fs.writeFileSync(path + '/app/index.html', indexHtml);
    fs.writeFileSync(path + '/app/css/style.css', fs.readFileSync('asset/template/style.css'));
    fs.writeFileSync(path + '/app/js/index.js', 'document.write("Hello Gulpjs")');
}

function createProject(path) {
    createFolder(path);
    fs.readFile('asset/template/package.json', {'encoding': 'utf8'}, function(err, data) {
        if (err) throw err;
        fs.writeFile(path + '/package.json', data, npmInstall(path, function(err) {
            if (err !== null) {
                $("#dialog").hide();
                alert('Error: ' + err);
                gui.Window.get().close(); 
            } else {
                createAppFolder(path);
                if (typeof tasks !== 'undefined') {
                	path += tasks;
                }
                localStorage.newProject = path;
                $("#dialog").hide();
                gui.Window.get().close(); 
            }
        }));
    });
}

function npmInstall(path, callback) {
    $("#dialog").show();
    // var command = "npm.cmd install --save-dev gulp gulp-connect gulp-watch gulp-open gulp-load-plugins";

    if (typeof tasks !== 'undefined') {
        var command = "npm.cmd install --save-dev "
    	var task = tasks.split(',');
    	task.splice(0, 1);
    	for (var i in task) {
    		switch (task[i]) {
    			case 'less':
    				var plugins = "gulp-less gulp-sourcemaps";
    				break;
    			case 'coffee':
    				var plugins = "gulp-coffee";
    				break;
    			case 'cssmin':
    				var plugins = "gulp-cssmin gulp-rename";
    				break;
    			case 'uglify':
    				var plugins = "gulp-uglify gulp-rename";
    				break;
    			default: 
    				var plugins = "";
    				break;
    		}
    		command += " " + plugins;
    	}
        setTimeout(function() {
            npmDonwload.kill('SIGINT');
        }, 6 * 60000);
        npmDonwload = childProcess.exec(command, {'cwd': path});
        npmDonwload.on('exit', function(code, sig) {
            if (code != 0) {
                if (sig == 'SIGINT') {
                    callback("npm install failed, check your internet connection.")
                } else {
                    delProject(path);
                }
            } else {
                var copyNpmModule = childProcess.exec(getCopyCmd(path));
                copyNpmModule.on('exit', function() {
                    callback(null);
                });
            }
        });
    } else {
        var copyNpmModule = childProcess.exec(getCopyCmd(path));
        copyNpmModule.on('exit', function() {
            callback(null);
        });
    }
    
}

function delProject(path) {
    // delete folder just created.
    var delFolder = childProcess.exec('rd /s /q ' + path, function(err) {
        if (err) {
            alert('del error ' + err)
        }
    }); 
}

function getCopyCmd(path) {
    var source = process.cwd() + "\\asset\\node_modules";
    var dest = path + '\\node_modules';
    return command = "xcopy " + source + " " + dest + " /e /i";
}

function createFailed(path) {
    if (typeof npmDonwload !== 'undefined') {
        // if (confirm("Confirm to cancle the new project?")) {
        treeKill(npmDonwload.pid, 'SIGKILL');
        // } else {
        //     alert('contine');
        // }
    } else {
        gui.Window.get().close();
    }
}

function getLibs() {
	var appendHtml = "";
	getFolderContent('asset/libs', function(libs) {
		if (libs.length > 0) {
			for (var i in libs) {
				appendHtml += "<li><input type='checkbox' id='" + libs[i] + "' value='"+ libs[i]+"'><label for='" + libs[i] + "'>" + libs[i] + "<label></li>";
			}
			$('#libField ul').append(appendHtml);
		} else {
			$('#libField ul').html('No libs, you can add your own libs in /asset/libs/');
		}
	});
}

function getFolderContent(path, callback) {
    fs.readdir(path, function(err, files) {
        if (err === null) {
            callback(files);
        } else {
            alert("Readdir errors..." + err);
        }
    });
}

function checkData() {
    if ($('#name').val().indexOf('/') >= 0 || $('#name').val().indexOf('\\') >= 0) {
        alert('Ilegal project name');
        return false;
    }
    if ($("#name").val().length < 1) {
        alert('Please input project name.');
        return false;
    }
    if ($("#location").val().length < 1) {
        alert("Please choose project location.");
        return false;
    }
    return true;
}

// check if the asset folder exists
function checkAsset() {
    if (fs.existsSync('asset')) {
        return true;
    } else {
        alert('Asset folder missed, install can\'t be continued');
        return false;
    }
}

function firstLoginHint() {
    if (typeof localStorage.installHint === 'undefined' || localStorage.InstallHint) {
        alert('It will download npm modules, please be patient.');
        localStorage.installHint = false;
    }
}

$(document).ready(function() {
	getLibs();
    $('#ok').click(function(e) {
        firstLoginHint();
        e.preventDefault();
        if (checkData() && checkAsset()) {
            $(this).attr('disabled', true);
            var path = $("#location").val() + '\\' + $("#name").val();
            $.each($("#taskField li input"), function(i, val) {
    	    	if ($(this).is(':checked')) {
    	    		tasks += ',' + $(this).val();
    	    	}
    	    });
            if (typeof tasks !== 'undefined') 
            {
            	tasks = tasks.substr(tasks.indexOf(','));
            }
            createProject(path);
        }
    });

    $("#cancle").click(function() {
        createFailed();
    });

    // $("#browse").click(chooseFolder);

    function chooseFolder() {
        $("#chooseLocation").trigger('click');      
    }
    $("#chooseLocation").change(function() {
        $('#location').val($(this).val());
    });
    /*$("#dialog").dialog({
        resizable: false,
        draggable: false,
        // modal: true,
        closeText: "hide" 
    }); */

    // $( "button" ).button().click(function(e) {
    //     e.preventDefault();
    // });
        
});
