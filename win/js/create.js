function createProject(path, callback) {
    fs.readFile('asset/template/package.json', {'encoding': 'utf8'}, function(err, data) {
        if (err) throw err;
        fs.writeFile(path + '/package.json', data, npmInstall(path, function(err) {
            if (err !== null) {
                alert('Error: ' + err);
                // 创建失败，删除之前创建的文件/夹
            } else {
                callback();
                $("#dialog").hide();
            }
        }));
    });
}

function npmInstall(path, callback) {
    $("#dialog").show();
    var command = "npm.cmd install --save-dev gulp gulp-connect gulp-open gulp-load-plugins";
    childProcess.exec(command, {'cwd': path}, function(err, stdout, stderr) {
        if (err !== null) {
            callback(err);
        } else {
            callback(null);
        } 
    });
}
