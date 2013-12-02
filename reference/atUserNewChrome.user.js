// ==UserScript==
// @name           At User
// @namespace      tyh1k@cc98.org
// @description    仿微博提醒
// @include        http://www.cc98.org/dispbbs.asp*
// @include        http://10.10.98.98/dispbbs.asp*
// @include		   http://www.cc98.org/reannounce.asp*
// @include        http://10.10.98.98/reannounce.asp*
// @include 	   http://www.cc98.org/editannounce.asp*
// @include 	   http://10.10.98.98/editannounce.asp*
// @include 	   http://hz.cc98.lifetoy.org/dispbbs.asp*
// @include		   http://hz.cc98.lifetoy.org/reannounce.asp*
// @include 	   http://hz.cc98.lifetoy.org/editannounce.asp*

// @exclude      	
// @author         Tyh1k
// @version		   1.3	
// ==/UserScript==
var HOST_NAME = "www.cc98.org",
	TO_HOST = "www.cc98.org";

var btns = document.getElementsByName("Submit");
var form = document.getElementById("fastReplyForm");
var r_form = document.getElementsByName("frmAnnounce");
var content = document.getElementById("content");
var form_id = 0;
var submitBtn;

var successDialog = document.createElement("div");

successDialog.id = "sdialog";
successDialog.style.position = "fixed";
successDialog.style.width = 200;
successDialog.innerHTML = "<div align='center' style=\"margin:auto 0;width:100%;filter:alpha(Opacity=80);-moz-opacity:0.8;opacity: 0.8;border-style:solid;background-color:white;\">"+
"<p>@信息已成功发送</p><br/></div>"


successDialog.style.left = document.body.clientWidth / 2 - successDialog.clientWidth / 2;
successDialog.style.top = document.body.clientHeight / 2 - successDialog.clientHeight / 2;

var failDialog = document.createElement("div");

failDialog.id = "fdialog";
failDialog.style.position = "fixed";
failDialog.style.width = 200;
failDialog.innerHTML = "<div align='center' style=\"margin:auto 0;width:100%;filter:alpha(Opacity=80);-moz-opacity:0.8;opacity: 0.8;border-style:solid;background-color:white;\">"+
"<p>@信息发送失败</p><br/></div>"


failDialog.style.left = document.body.clientWidth / 2 - failDialog.clientWidth / 2;
failDialog.style.top = document.body.clientHeight / 2 - failDialog.clientHeight / 2;

function getText(ele) {
	return ele.innerText ? ele.innerText :  ele.textContent;
}


if (getText(document.body).match(/\* 帖子主题： .*/) != null) {
	form_id = 0;
}else {
	if (getText(document.body).match(/回复帖子.*/) != null)	{
			form_id = 1;
		}else {
		
		if (getText(document.body).match(/编辑帖子.*/) != null)
			form_id = 2;
	}
}	

for (i=0;i<btns.length;i++)
{
	if (form_id == 0) {
		if (btns[i].value == "OK!发表我的回应帖子") {
			submitBtn = btns[i];
		}
	}else {
		if (btns[i].value == "发 表") {
			submitBtn = btns[i];
		}
	}
		
}

submitBtn.addEventListener("click", handleSMS);

function handleSMS(){

	var pattern = /^(\[quote\]|\[quotex\])[\s\S]*(\[\/quote\]|\[\/quotex\])/ig;
	var val = document.getElementById("content").value.replace(pattern,'');
	pattern = /@([^\s^@]+\s)/ig;
	var res = val.match(pattern);

	var url = window.location.toString().replace(window.location.host, TO_HOST);
	if (form_id == 0) {
		var title = getText(document.body).match(/\* 帖子主题： .*/).toString().replace(/\[显示该页所有图片\].*/,'').toString().replace("* 帖子主题： ",'');
		var message = '我在帖子'+"[url="+url+"][color=blue]"+title+"[/color][/url]"+'中@了你,快来看看吧~!';
	}else {
		if (form_id == 1) {
			url = url.toString().replace("reannounce.asp","dispbbs.asp");
			var message = '我在'+"[url="+url+"][color=blue]这个帖子[/color][/url]"+'中@了你,快来看看吧~!';
		}else {
			url = url.toString().replace("editannounce.asp","dispbbs.asp");
			var message = '我在'+"[url="+url+"][color=blue]这个帖子[/color][/url]"+'中@了你,快来看看吧~!';	
		
		}
	}
	
	
	if ((res != null) && (res.length > 0)){
		if (form_id ==0) {
			form.addEventListener("submit",function(e){
				e.preventDefault();
				return false;
			});	
		}else{
			r_form[0].addEventListener("submit",function(e){
				e.preventDefault();
				return false;
			});					
		}
	}
		

	for(i=0;i<res.length;i++) {
		var name = res[i].replace("@",'').toString().replace(/\s+/,'');
			var xmlhttp = new XMLHttpRequest();
			if (xmlhttp == null) return;
			xmlhttp.onreadystatechange = function(){
				if (xmlhttp.readyState == 4) {
					if (xmlhttp.status == 200) {
						if (xmlhttp.responseText.indexOf("操作成功") != -1)
						{						 
							document.body.appendChild(successDialog);
							if (form_id ==0) {
								setTimeout("document.body.removeChild(document.getElementById('sdialog'));document.getElementById('fastReplyForm').submit();",2000)
							}else {
								setTimeout("document.body.removeChild(document.getElementById('sdialog'));document.getElementsByName('frmAnnounce')[0].submit();",2000)
							}
							
						}else {
							document.body.appendChild(failDialog);
							if (form_id == 0) { 
								setTimeout("document.body.removeChild(document.getElementById('fdialog'));document.getElementById('fastReplyForm').submit();",2000)
								submitBtn.disabled = false;
							}else {
								setTimeout("document.body.removeChild(document.getElementById('fdialog'));document.getElementsByName('frmAnnounce')[0].submit();",2000)
								submitBtn.disabled = false;
							}
						}
					}
				}
			};
			var data = "touser="+encodeURIComponent(name)+"&font="+"&title="+encodeURIComponent("提示")+"&message="+encodeURIComponent(message);
			xmlhttp.open("post",'http://' + HOST_NAME + '/messanger.asp?action=send', true);
			xmlhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded;charset=UTF-8");
			xmlhttp.setRequestHeader("If-Modified-Since","0");
			xmlhttp.send(data);
	}
	
	return false;

}