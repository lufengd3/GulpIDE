// $("#content").width($("#horizonParent").width() - $("#project").width() - 14);
// $('#logTitle').css("top", ($("#editor").height() + 28));
// $("#log").height($("#verticalParent").height() - $("#editor").height() - 3);
var gui = require('nw.gui');
var fs = require('fs');
var mv = require('mv');
var treeKill = require('tree-kill');
var menuBar = require('menuBar.js');
var menu = new menuBar(gui);
var childProcess = require('child_process');
var isWin = /win*/i.test(process.platform);
var delimiter;
var gulpProcess;
var currentProject;
var projectLiObj;
var fileStatus = "Edit...";

init();
isWin ? delimiter = '\\' : delimiter = '/';
function init() {
    if (typeof localStorage.firstLogin === 'undefined') {
        childProcess.exec('npm --version', function(err, stdout, stderr) {
            if (err) alert('You have to install node.js first, if you have installed npm check if it\'s added in PATH. ');
            else localStorage.firstLogin = false;
        })
    }
    // set window
    // gui.Window.get().maximize();
    // open new project
    if (typeof localStorage.newProject !== 'undefined') {
    	var tasks = localStorage.newProject.split(',');
    	if (tasks.length > 1) {
    		localStorage.newProject = tasks[0];
    		tasks.splice(0, 1);
    	} else {
    		tasks = [];
    	}
        createGulpFile(localStorage.newProject, tasks, function(err) {
            if (typeof err === 'undefined') {
                openGulpFile(localStorage.newProject + delimiter + 'gulpfile.js');
                addProjectToList(localStorage.newProject);
            } else {
                alert(err + ' Path is: ' + localStorage.newProject);
            }
            delete localStorage.newProject;
        });
    }
    refreshProjectList();
    // load last opening file
    if (typeof localStorage.openning !== 'undefined' && localStorage.openning !== '') {
        openGulpFile(localStorage.openning);
    }

    // Create a shortcut with |option|.
    var shortcutSave = new gui.Shortcut({key : "Ctrl+S"});
    var shortcutNew = new gui.Shortcut({key : "Ctrl+N"});
    var shortcutOpen = new gui.Shortcut({key : "Ctrl+O"});
    /*gui.App.registerGlobalHotKey(shortcutSave);
    gui.App.registerGlobalHotKey(shortcutNew);
    gui.App.registerGlobalHotKey(shortcutOpen);*/
    shortcutSave.on('active', function() {
        saveGulpFile();
    });
    shortcutNew.on('active', function() {
        createNewProject();
    });
    shortcutOpen.on('active', function() {
        openProject();
    });
}
function chooseFolder(name, callback) {
    $(name).trigger('click');
    $(name).change(function() {
        callback($(this).val());
        // console.log("Path: " + $(this).val());
    });
}

function getFolderContent(path, callback) {
	if (fs.lstatSync(path).isDirectory()) {
	    fs.readdir(path, function(err, files) {
	        if (err === null) {
	            callback(files);
	        } else {
	            alert("Readdir errors...");
	        }
	    });
	} else {
		callback([]);
	}
}

// tasks should be an array
function createGulpFile(path, tasks, callback) {
    if (fs.existsSync(path)) {
        var gulpfile = fs.readFileSync('asset/template/gulpfile.js');
        fs.writeFile(path + '/gulpfile.js', gulpfile, function(err) {
            if (err) {
                alert('Error: ' + err)
            } else {
            	// add tasks
                fs.appendFileSync(path + '/gulpfile.js', getGulpConf(tasks));
                callback();
            }
        });
    } else {
        // throw new Error('404 Not Found!');
        var err = "Folder not exists.";
        callback(err);
    }
}

function getGulpConf(plugins) {
    var code = "";
    var less = "\n\r\n\r// compile less files"
               + "\n\rgulp.task('less', function () {"
               + "\n\r    gulp.src('app/css/less/*.less')"
               + "\n\r    .pipe($.sourcemaps.init())"
               + "\n\r    .pipe($.less())"
               + "\n\r    .on('error', console.error.bind('error'))"
               + "\n\r    .pipe($.sourcemaps.write('maps'))"
               + "\n\r    .pipe(gulp.dest('app/css'));"
               + "\n\r});"
               + "\n\r\n\rgulp.task('watchless', function() {"
               + "\n\r    $.watch('app/css/less/*.less', function() {"
               + "\n\r        gulp.start('less');"
               + "\n\r    })"
               + "\n\r})"
               + "\n\r\n\rdefaultTask.push('watchless');";

    var coffee = "\n\r\n\r//compile coffee script"
                + "\n\rgulp.task('coffee', function() {"
                + "\n\r  gulp.src('app/js/coffee/*.coffee')"
                + "\n\r    .pipe($.coffee({bare: true}))"
                + "\n\r    .on('error', console.error.bind('error'))"
                + "\n\r    .pipe(gulp.dest('app/js/'))"
                + "\n\r});"
                + "\n\r\n\rgulp.task('watchcoffee', function() {"
                + "\n\r    $.watch('app/js/coffee/*.coffee', function() {"
                + "\n\r        gulp.start('coffee');"
                + "\n\r    })"
                + "\n\r})"
                + "\n\r\n\rdefaultTask.push('watchcoffee');";

    var uglify = "\n\r\n\r// Minify javascript files"
                + "\n\rgulp.task('uglify', function() {"
                + "\n\r    gulp.src(['app/js/*.js', '!app/js/*.min.js'])"
                + "\n\r    .pipe($.uglify())"
                + "\n\r    .pipe($.rename({suffix: '.min'}))"
                + "\n\r    .pipe(gulp.dest('app/js'))"
                + "\n\r});";

    var cssmin = "\n\r\n\rgulp.task('cssmin', function () {"
                + "\n\r    gulp.src(['app/css/*.css', '!css/*.min.css'])"
                + "\n\r        .pipe($.cssmin())"
                + "\n\r        .pipe($.rename({suffix: '.min'}))"
                + "\n\r        .pipe(gulp.dest('app/css'));"
                + "\n\r});";

    // choose which part to appen to gulpfile.js
    for (var i in plugins) {
        switch(plugins[i]) {
            case "less":
                code += less;
                break;
            case "coffee":
                code += coffee;
                break;
            case "uglify":
                code += uglify;
                break;
            case "cssmin":
                code += cssmin;
                break;
            default:
                break;
        }
    }
    code += "\n\r\n\rgulp.task('default', defaultTask);";

    return code;
}

function openGulpFile(path) {
    if (fs.existsSync(path)) {
        // while (fileContent.indexOf('\n\r') > -1) {
        //     lineNum += 1;
        //     fileContent = fileContent.replace('\n\r', '<br /><span class="lineNum">' + lineNum + '</span>'); 
        // } 
        var fileContent = fs.readFileSync(path).toString().replace(/ /g, '&nbsp;');
        fileContent = fileContent.replace(/\n/g, '<br>');
        //fileContent = '<span class="lineNum">' + 1 + '</span>' + fileContent.replace(/\n\r/g, '<br>');
        $('#editor').html(fileContent);  
        $("#editorTitle").text(path);
        $("#editorTitle").attr('path', path.substr(0, path.lastIndexOf('\\')));
        localStorage.openning = path;
    }
}

function saveGulpFile() {
    var path = $('#editorTitle').text();
    if (fs.existsSync(path)) {
        var fileContent = $('#editor').html(); 
        var search = [/&nbsp;/g, /<br>/g, /<div>/g, /<\div>/g, /<div .*/g];
        var replace = [' ', '\n', ' ', ' ', ''];
        for (var i in search) {
            fileContent = fileContent.replace(search[i], replace[i]);
        }
        fs.writeFile(path, fileContent, function(err) {
            if (err !== null) {
                fileStatus = "Edit...";
                $('#fileStatus').text(fileStatus);
                alert(err); 
            } else { 
                fileStatus = "Saved.";
                $('#fileStatus').text(fileStatus);
            }
        });
    }
}

function checkProExist(path) {
    var projects = [];
    $(".projectLi").each(function() {
        projects.push($(this).attr('path'));
    });
    if ($.inArray(path, projects) < 0) {
        return true;
    } else {
        return false;
    }
}

function checkProOk(path) {
    if (fs.existsSync(path + '/gulpfile.js')) {
        return true;
    } else {
        rmProjectFromList(path);
        return false;
    }
}

function addProjectToList(path) {
    // add new project to projects list and save to localStorage if selected folder not in the list
    if (checkProExist(path)) {
        var pathToStore;
        if (typeof localStorage.projects !== 'undefined' && localStorage.projects.length > 0) {
            localStorage.projects.charAt(localStorage.projects.length + 1) == ',' ? pathToStore= path : pathToStore = ',' + path
            localStorage.projects += pathToStore;
        } else {
            localStorage.projects = path;
        }
        refreshProjectList();
    }
}

function rmProjectFromList() {
	if ($('#action').text() == 'Stop Server') {
		alert("Gulp task still running, stop it before you remove this project.");
	} else {
	    var path = projectLiObj.attr('path');
	    
		// rm from localStorage
	    var projects = localStorage.projects.split(',');
	    projects.splice(path.indexOf(projects), 1);
	    localStorage.projects = projects.toString();
	    projectLiObj.remove();
	    $('#project li').each(function() {
			var liObjid = projectLiObj.attr('id');
			var idRegExp = new RegExp("^" + liObjid + "[0-9]{1,}");
			if (idRegExp.test($(this).attr('id'))) {
				$(this).remove();
			}
		});

	    // if the project's gulp file is openning in editor, cleat it
		if ($("#editorTitle").attr("path") == path) {
	        $("#editor").html('');
	        $("#editorTitle").attr('path', '');
	        $("#editorTitle").text('*');
	        localStorage.openning = '';
	        $('#action').attr('disabled', true);
	        $('#restart').attr('disabled', true);
	        $('#logContent p').text('');
	    }
    }
}

function refreshProjectList() {
    $('#project ul').html('');
    if (typeof localStorage.openning !== 'undefined') {
        var openningPath = localStorage.openning.substr(0, localStorage.openning.lastIndexOf('\\'));
    } else {
        var openningPath = '';
    }
    if (typeof localStorage.projects !== "undefined" && localStorage.project !== "") {
        var projects = localStorage.projects.split(','); 
        for (var i in projects) {
            if (projects[i] !== '' && fs.existsSync(projects[i])) {
                var folderName = projects[i].substr(projects[i].lastIndexOf('\\') + 1);
                // var childNum = $('#project ul').children('li').length + 1;
                $("#project ul").append("<li class='projectLi' id=" + i + " show=0 path='" + projects[i] + "'>" + folderName + "</li>");
                if (openningPath == projects[i]) {
                    $('.projectLi').find('.helightProject').removeClass('helightProject');
                    $(".projectLi:last-child").addClass("helightProject");
                }
            } else {
                projects.splice(i, 1);
            }
        }
        localStorage.projects = projects;
    } else {
        delete localStorage.projects;
        localStorage.openning = '';
        $("#editorTitle").attr('path', '');
    }
    if ($('#editorTitle') != '*') $('#action').attr('disabled', false);
    // right click project <li>, show the remove menu
    $(".projectLi").mousedown(function(e) {
        e.preventDefault();
        if (e.button == 2) {
            projectLiObj = $(this);
            menu.projectMenu.popup(e.pageX, e.pageY);
        }
    });
    $('.projectLi').on('click', function() {
    	projectLiObj = $(this);
        var path = $(this).attr('path');
        if (checkProOk(path)) {
            $('#action').attr('disabled', false);
            // if ($(this).children().length == 0) {
	            // directory show/hide action
	            showChildren($(this));
	        // }
            openGulpFile(path + delimiter + "gulpfile.js");
        } else {
            alert('Project is dameaged.');
            rmProjectFromList();
            refreshProjectList();
        }
        $(this).parent().find(".helightProject").removeClass("helightProject");
        $(this).addClass('helightProject');
    });
}

function scrollToBottom(element) {
    var ele = $(element);
    ele.scrollTop(ele.prop("scrollHeight"));
}

function serverAction(type) {
    if (type == 1) {
        if ($("#action").text() == "Start Server") {
            startServer();
            $("#action").text('Stop Server');
            $('#restart').attr('disabled', false);
        } else {
            stopServer();
            $("#action").text('Start Server');
            $('#restart').attr('disabled', true);
        }
    } else {
        stopServer();
        startServer();
    }
    scrollToBottom('#log');
}

function startServer() {
    var path = $("#editorTitle").attr('path');
    $('#logContent p').text('');
    gulpProcess = childProcess.spawn('gulp.cmd', [], {'cwd': path});
    // console.log('gulpProcess pid is: ' + gulpProcess.pid);
    gulpProcess.stdout.on('data', function(data) {
        $("#logContent p").append(data.toString() + "<br />");
        scrollToBottom('#log');
    });
    gulpProcess.on('close', function(err) {
        $("#logContent p").append("<br><font color=red>" + err.toString() + "</font><br />");
    });
    gulpProcess.stderr.on('data', function(data) {
        $("#logContent p").append("<font color=red>" + data.toString() + "</font><br />");
        scrollToBottom('#log');
    });
    gulpProcess.on( "exit", function (code, signal) {
        if (code != 0) {
            var errMessage;
            /*switch(code) {
                case 8: 
                    errMessage = "服务器端口被占用.";
                    break;
                default:
                    errMessage = "Error..." + "child process terminated due to receipt of signal "+signal;
            }*/    
            // $("#log p").append("<font color=red>" + errMessage + "</font><br />");
            // $("#log p").append("<font color=red>Check your server port whether is Occupancied.</font><br />");
        }
    });
}

function stopServer() {
    if (gulpProcess !== 'undefined') {
        treeKill(gulpProcess.pid, 'SIGKILL');
        gulpProcess = null;
        $("#logContent p").append("Server Stopped !");
    }
}

function createNewProject() {
    newWin = gui.Window.open('newProject.html', {
            position: 'center', 
            width: 800, 
            height: 500, 
            toolbar: false, 
            focus: true
        });
    // newWin.setResizable(false);
    newWin.on('closed', function() {
        newWin = null;
        gui.Window.get().reload();
    });
}

function openProject() {
    // open existing project
    chooseFolder('#newProject', function(path) {
        getFolderContent(path, function(folderContent) {
            // check if the project is a gulp project
            if ($.inArray('gulpfile.js', folderContent) < 0) {
                if (confirm("This is not a gulp project, add gulpfile.js now?")) {
                    changeToGulp(path);
                }
            } else {
                openGulpFile(path + delimiter + "gulpfile.js");
                addProjectToList(path);
            }
        });
    });
}

function changeToGulp(path) {
    fs.rename(path, path+"temp", function(err) {
        fs.mkdirSync(path);
        createProject(path, function() {
            // create new gulp file and open in editor
            createGulpFile(path, [], function() {
                mv(path+'temp', path + "\\app", function(err) {
                    if (err) console.log(err);
                });
                if (typeof localStorage.firstLogin === 'undefined') {
                    alert('Remember to change the gulpfile, default path config maybe doesn\'t work.')
                }
                openGulpFile(path + '\\gulpfile.js');
                addProjectToList(path);
            });
        }); 
    });
}

function showChildren(liObj) {
    var path = liObj.attr('path');
    if (liObj.attr('show') == 0) {
		liObj.attr('show', 1);
		getFolderContent(path, function(files) {
	        if (files.length > 0) {
				var parentId = liObj.attr('id');
	            for (var i in files) {
	            	var thisId = parentId.toString() + i;
	            	var thisPadding = 10 * thisId.length + "px";
	                var folderPath = path + "\\" + files[i];
	                if (!fs.lstatSync(folderPath).isDirectory()) {
		            	var fileClass = "class='projectFile'";
		            } else {
		            	var fileClass = "";
		            }
	                var appendHtml = "<li " + fileClass + " style='padding-left:"+ thisPadding +"' show=0 path=" + folderPath + " id='" + thisId + "'>" + files[i] + "</li>"; 
		            liObj.after(appendHtml);
		            $("#" + thisId).click(function() {
	                	showChildren($(this));
	                });
	            }
	        }
	    });
	} else {
		// hideChildren(liObj);
		liObj.attr('show', 0);
		// unbindClick(liObj.children('li'));
		$('#project li').each(function() {
			var liObjid = liObj.attr('id');
			var idRegExp = new RegExp("^" + liObjid + "[0-9]{1,}");
			if (idRegExp.test($(this).attr('id'))) {
				$(this).remove();
			}
		});
	}
}

gui.Window.get().menu = menu.menu;

// fileMenu action
// open project
menu.fileMenu.items[1].click = function() {
    openProject();
}

// save gulpfile
menu.fileMenu.items[2].click = function() {
    saveGulpFile();
}

// create gulp project
menu.fileMenu.items[0].click = function() {
    createNewProject();
}

// projects list right click 'remove project' action
menu.projectMenu.items[0].click = function() {
    rmProjectFromList();
}

gui.Window.get().on('close', function() {
	if (typeof newWin !== 'undefined' && newWin != null) {
		newWin.close(true);
	}
	if ($("#action").text() == 'Stop Server') {
		/*if (confirm("Gulp task still running, stop it and quit now?")) {
			treeKill(gulpProcess.pid, 'SIGKILL');
			setTimeout(function() {
				this.close(true);
			}, 10000);
		}*/
		alert("Gulp task still running, stop it before you quit.");
	} else {
		this.close(true);
	}
})

$(document).ready(function() {	
    $('#editor').on('blur', function() {
        saveGulpFile();
    });

    $("#editor").on('focus', function() {
        $('#fileStatus').text(fileStatus);
    });

    $('#editor').bind("DOMSubtreeModified",function(){
        $('#fileStatus').text("Edit...");
    });

    // right click project <li>, show the remove menu
    /*$("#project li").mousedown(function(e) {
        e.preventDefault();
        if (e.button == 2) {
            projectLiObj = $(this);
            menu.projectMenu.popup(e.pageX, e.pageY);
        }
    });*/

    if ($('#editorTitle').text().trim() === '*') {
        $('#action').attr('disabled', true);
    }
    $('#restart').attr('disabled', true);
    // start/stop gulp server
    $("#action").click(function(e) {
        e.preventDefault();
        if ($("#editorTitle").attr('path') !== '') {
            serverAction(1);
        } else {
            alert('Please choose project first.')
        }
    });

    // restart gulp server
    $("#restart").click(function(e) {
        e.preventDefault();
        if ($("#action").text() === 'Stop Server') {
            serverAction(2);
        }
    });

    $("#editor").resizable({
        handles: 's',
        maxHeight: 900,
        minHeight: 200
    });
    $("#project").resizable({
        handles: 'e',       
        maxWidth: 400,
        minWidth: 150
    });
    $("#project").resize(function() {
        $("#content").width($("#horizonParent").width() - $("#project").width() - 14);
    });
    $("#editor").resize(function() {
    	// $('#logTitle').css("top", ($("#editor").height() + 28));
        $("#log").height($("#verticalParent").height() - $("#editor").height() - 38);
    });

    $(window).on('resize', function(w, h) {
    	// $('#logTitle').css("top", ($("#editor").height() + 28));
        $("#content").width($("#horizonParent").width() - $("#project").width() - 14); 
        $("#log").height($("#verticalParent").height() - $("#editor").height() - 38);
    });

    // $( "button" ).button().click(function(e) {
    //     e.preventDefault();
    // });
});
