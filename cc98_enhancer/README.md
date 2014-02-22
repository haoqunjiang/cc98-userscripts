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
4. CC98URLMap.js [cc98][1] 网站的网址映射
5. libcc98.js [cc98][1] 网站的一些操作接口（依赖于 [jQuery](http://jquery.com/download/) 库和 [chaos](https://github.com/sodatea/chaos) 库）
6. options.js 配置管理以及配置界面显示
7. utils.js 一些杂项功能，比如屏蔽用户
8. alias.js 备注功能
9. editor.js [cc98][1] 网站的编辑器增强（颜色选择器、上传文件、@用户）
10. emotions.js 给 [cc98][1] 网站的回复框加上自定义表情功能
11. app.js 脚本的路由，根据当前网址判断哪些模块可以启动
12. outro.js 出口文件，闭合匿名闭包函数

[1]: http://www.cc98.org/


##功能列表##

1. [finished] 屏蔽帖子
2. [todo] 帖内搜索（使用 IndexedDB 做离线缓存）
3. [todo] 完善的设置界面
4. [finished] 上传下载设置（利用用户草稿箱）
5. [todo] 文件上传（加入 audio, video 标签支持，碰到大文件提示建议去 emhang.8866.org 上传）
6. [todo] 表情
7. [todo] @ 
8. [todo] UBB 编辑器
9. [todo] 字体、排版美化、屏蔽签名档
10. [todo] 备注
11. [todo] 当前页发米、任意修改发米数量、批量发米、如果是米楼可以记录之前发过的米方便下次接着发
12. [todo] 导出站短
13. [todo] 投票统计
14. [todo] 马甲切换器什么的
