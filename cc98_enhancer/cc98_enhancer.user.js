// ==UserScript==
// @id             cc98_enhancer
// @name           cc98 enhancer
// @version        0.0.1
// @namespace      soda@cc98.org
// @author         soda <sodazju@gmail.com>
// @description    
// @include        *
// @include        http://www.cc98.org/list.asp*
// @include        http://www.cc98.org/dispbbs.asp*
// @run-at         document-end
// ==/UserScript==

// 长期目标
// 1. libcc98.js
// 2. 屏蔽功能（主题、用户）
// 3. ID 备注
// 4. 统一的管理界面
// 5. 自定义表情（从回复脚本独立出来）
// 6. 改善原生回复功能
// 7. 设计全新的多账户界面

// 一些小改进
// 1. 事件管理界面增加快捷键
// 2. 浏览帖子和帖子列表时增加[下一页]按钮

// 在 Scriptish 和 TamperMonkey 下的测试表明 @require meta block 是顺序加载的，所以可以用它来组织代码文件
// 发布的时候在每个 js 文件后加上时间戳