GulpIDE
=======

##项目介绍

这是整合了[livereload功能](http://lufeng.me/post/livereload)的GUI程序，用于前端开发的预处理task runner，如果你用过grunt,可以理解为是grunt的图形界面程序，实际是使用[gulpjs]()，gulpjs和grunt一样，也是一个task runner，但gulp是基于流的操作，比grunt更高效、更简洁。

项目使用node-webkit构建，目前只写好了windows的alpha版本([下载地址](http://pan.baidu.com/s/1hqy0DRA))，对于bug和建议，欢迎提交[issue](https://github.com/keith3/GulpIDE/issues)。

由于前期准备不足，不熟悉node-webkit，导致目前的代码写的比较糟糕，近期将使用Angular或者Backbone重写。

##软件功能

- 新建项目
	- 选择项目所需的库文件直接拷贝到新项目目录下
	- 选择预处理项，默认支持livereload, 目前可选less编译, coffee script编译， js压缩，css压缩。
- 添加已有项目
	- 对于原来不是gulp项目的新项目，程序会将其转换为gulp项目，然后根据自己项目的目录结构修改gulpfile.js
- 编辑项目配置文件(gulpfile.js)

## 构建过程

- 新建项目
	1. 建立项目目录，拷贝livereload所需的node_modules到项目目录下
	2. 如果新建项目时选择了task(less, coffee, cssmin, uglify)将会下载node_module
	3. 在项目目录下建立app文件夹，这是你的代码的放置位置
	4. 如果新建项目时选择了libs，拷贝相应文件/文件夹到新项目app目录下的libs文件夹中
	5. 新建完成后加载gulpfile.js到编辑区
	
- 添加项目
	1. 检测项目目录下是否存在gulpfile.js，
		- 有则直接加载gulpfile.js到编辑区
		- 没有则将你的项目拷贝到一个临时文件夹下，然后同新建项目过程相同
			- 新建完成后将临时文件夹的内容移动到新建项目的app文件夹下

##已知问题

- 新建项目窗口，选择目录的input，本应该设置一个button，将file的input元素隐藏，button的click事件触发file元素，file的change事件获取file值并填充到name="location"的input区域，像主页menu的new project就是这样做的，但是在这里change事件不能触发。 

##ToDo

- 快捷键绑定
- gulpfile编辑区域完善
- task list显示全部任务,任务可以分别运行
- 生成新项目时自定义项目目录结构
- 多个项目任务同时运行

##使用说明

- 下载后加压即可使用。
- 你的程序代码因该都在项目的app文件夹下
- asset文件夹下的libs目录用于存放库文件，可以把自己常用的库文件放在这，新建项目时选择需要的库文件，会将其拷贝到新项目目录下
- asset下的template目录package.json和gulpfile.js不建议修改（除非你比较熟悉gulpjs），其他的文件可以自行替换
- asset下的node_module目录不能动，里面是构建livereload功能的基本模块，并且都是指定版本
