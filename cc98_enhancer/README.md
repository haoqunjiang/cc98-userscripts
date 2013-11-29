##目录介绍##

- lib 目录为 JavaScript 源代码
- res 目录为资源文件（图片等）
- node\_modules 目录是运行 grunt 所需要的包
- Gruntfile.js 是 grunt 任务配置文件
- package.json 是说明文件，遵循 CommonJS/Package1.1 规范
- cc98\_enhancer.user.js 是由 grunt 生成的最终油猴脚本文件

##lib 目录下的文件##

1. intro.js 入口文件，包括油猴脚本的 meta 信息和匿名闭包的开口
2. modular.js 自定义的简化的 define/require 函数
3. modular-shim 给项目引入的第三方库适配上 define/require 接口
4. q-http.js 利用 Q 的 Promise/A+ 实现的浏览器端 http 库
5. traverse.js 简化了的 DOM 遍历库
6. CC98URLMap.js [cc98][1] 网站的网址映射
7. libcc98.js [cc98][1] 网站的一些操作接口
8. options.js 配置管理以及配置界面显示
9. utils.js 一些杂项功能，比如屏蔽用户
10. alias.js 心灵之约的备注功能
11. editor.js [cc98][1] 网站的编辑器增强（颜色选择器、上传文件、@用户）
12. emotions.js 给 [cc98][1] 网站的回复框加上自定义表情功能
13. app.js 脚本的路由，根据当前网址判断哪些模块可以启动
14. outro.js 出口文件，闭合匿名闭包函数

[1]: http://www.cc98.org/
