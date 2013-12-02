// ==UserScript==
// @name           reform cc98
// @namespace      foggywillow@gmail.com
// @description    为cc98增加一些功能
// @author         foggywillow
// @version        0.1
// @include        http://www.cc98.org/*
// @include        http://10.10.98.98/*
// @run-at         document-start
// ==/UserScript==

// ======================
const _DEBUG = 1;
// ======================

function $(id) { return document.getElementById(id); }

// ======================


// AjaxDialog: 仿 Discuz ajax回复对话框
// AdminFunction: 为管理者提供一些方便的主题管理功能
// MJManager: 马甲管理
// cc98Fix: 修复98在firefox下的一些小问题
var config = {
	enableAjaxDialog: true,
	enableAdminFunction: false,
	enableMJManager: true,
	enableCC98Fix: true,

	configAjaxDialog: {
		opacity: "0.9"
	},

	configAdminFunction: {
		todo: ""
	},

	configMJManager: {
		todo: ""
	},
	
	setUsingAjaxDialog: function(value) {this.enableAjaxDialog = value;},
	setUsingAdminFunction: function(value) {this.enableAdminFunction = value;},
	setUsingMJManager: function(value) {this.enableMJManager = value;},
	setUsingCC98Fix: function(value) {this.enableCC98Fix = value;},

	loadConfig: function() {
		if (GM_getValue)
		{
			GM_getValue("enableAjaxDialog", true);
			GM_getValue("enableAdminFunction", false);
			GM_getValue("enableMJManager", true);
			GM_getValue("enableCC98Fix", true);
		}
	},

	saveConfig: function() {
		if (GM_getValue)
		{
			GM_setValue("enableAjaxDialog", this.enableAjaxDialog);
			GM_setValue("enableAdminFunction", this.enableAdminFunction);
			GM_setValue("enableMJManager", this.enableMJManager);
			GM_setValue("enableCC98Fix", this.enableCC98Fix);
		}
	}
}

var resource = {
	quotesrc: "data:image/png,%89PNG%0D%0A%1A%0A%00%00%00%0DIHDR%00%00%00%0E%00%00%00%0D%08%06%00%00%00%99%DC_%7F%00%00%00%19tEXtSoftware%00Adobe%20ImageReadyq%C9e%3C%00%00%01*IDATx%DAb%FC%FF%FF%3F%03%08%A4%B7l%820%A0%E0%DB%2FF%06.%B6%FF%60%1A%19%2Cn%F2%85%08%804%A65o%FC%8F%0D%FC%F9%FB%EF%FF%E7%AF%7F%FE%BFx%FB%F3%FF%93W%DF%C08%B4b%13H%8A%81%11%A4if%8D%1F%C3%89'(%16%82%C1%CF%DF%A8%7C%15%9E%1F%0C%FC%DCl%0CI%CD%DB%18%98%18p%00%98%A6%9F%7F%FF%831%08%9C%7F%CB%0E%97g%01%11%40%17%E1%D4%04%02%BF%FE%80%F0%7F%06%A0%AB%C1%FC%DF%7F%FFB4~%FF%F1%0F%A8%18a9H%03H1%08%C0%14%C3%C0%C7%AF%BF%106%FE%FA%0D%B2%82%1D%C5%06t%0D%9F%BF%40%0C%FE'%09%D6%C2%C0%04%0BndM%E8%00%A4%89%97%E7%1FD%C3%BF%3F%0C%FF%FEA%A3%23%A6v%D3%FF%B7%1F%BEc%C5%B3%8F%FF%FB%BF%E2%F2%9F%FFO%3F%FC%FD%FF%E6%C7%A7%FF%01%A5%EB!%D1%01K%00%B1u%9B%FF%83%02%85%9D%155%1AfT%B8%82%E9%C4%E6%1D%60zcO%00%22%01%E0%C3%20%1B%406%FB%15Cl%82a%B8%8D%F8%80%7F%C9%86%FF(%B6%81%FC%CA%40%04%40%D6%00%03%00%01%06%00%D6n%01%E6%0Ai%9Ai%00%00%00%00IEND%AEB%60%82",
	multiquotesrc: "data:image/png,%89PNG%0D%0A%1A%0A%00%00%00%0DIHDR%00%00%00%0E%00%00%00%0D%08%06%00%00%00%99%DC_%7F%00%00%00%09pHYs%00%00%0B%13%00%00%0B%13%01%00%9A%9C%18%00%00%0AOiCCPPhotoshop%20ICC%20profile%00%00x%DA%9DSgTS%E9%16%3D%F7%DE%F4BK%88%80%94KoR%15%08%20RB%8B%80%14%91%26*!%09%10J%88!%A1%D9%15Q%C1%11EE%04%1B%C8%A0%88%03%8E%8E%80%8C%15Q%2C%0C%8A%0A%D8%07%E4!%A2%8E%83%A3%88%8A%CA%FB%E1%7B%A3k%D6%BC%F7%E6%CD%FE%B5%D7%3E%E7%AC%F3%9D%B3%CF%07%C0%08%0C%96H3Q5%80%0C%A9B%1E%11%E0%83%C7%C4%C6%E1%E4.%40%81%0A%24p%00%10%08%B3d!s%FD%23%01%00%F8~%3C%3C%2B%22%C0%07%BE%00%01x%D3%0B%08%00%C0M%9B%C00%1C%87%FF%0F%EAB%99%5C%01%80%84%01%C0t%918K%08%80%14%00%40z%8EB%A6%00%40F%01%80%9D%98%26S%00%A0%04%00%60%CBcb%E3%00P-%00%60'%7F%E6%D3%00%80%9D%F8%99%7B%01%00%5B%94!%15%01%A0%91%00%20%13e%88D%00h%3B%00%AC%CFV%8AE%00X0%00%14fK%C49%00%D8-%000IWfH%00%B0%B7%00%C0%CE%10%0B%B2%00%08%0C%000Q%88%85)%00%04%7B%00%60%C8%23%23x%00%84%99%00%14F%F2W%3C%F1%2B%AE%10%E7*%00%00x%99%B2%3C%B9%249E%81%5B%08-q%07WW.%1E(%CEI%17%2B%146a%02a%9A%40.%C2y%99%192%814%0F%E0%F3%CC%00%00%A0%91%15%11%E0%83%F3%FDx%CE%0E%AE%CE%CE6%8E%B6%0E_-%EA%BF%06%FF%22bb%E3%FE%E5%CF%ABp%40%00%00%E1t~%D1%FE%2C%2F%B3%1A%80%3B%06%80m%FE%A2%25%EE%04h%5E%0B%A0u%F7%8Bf%B2%0F%40%B5%00%A0%E9%DAW%F3p%F8~%3C%3CE%A1%90%B9%D9%D9%E5%E4%E4%D8J%C4B%5Ba%CAW%7D%FEg%C2_%C0W%FDl%F9~%3C%FC%F7%F5%E0%BE%E2%24%812%5D%81G%04%F8%E0%C2%CC%F4L%A5%1C%CF%92%09%84b%DC%E6%8FG%FC%B7%0B%FF%FC%1D%D3%22%C4Ib%B9X*%14%E3Q%12q%8ED%9A%8C%F32%A5%22%89B%92)%C5%25%D2%FFd%E2%DF%2C%FB%03%3E%DF5%00%B0j%3E%01%7B%91-%A8%5Dc%03%F6K'%10Xt%C0%E2%F7%00%00%F2%BBo%C1%D4(%08%03%80h%83%E1%CFw%FF%EF%3F%FDG%A0%25%00%80fI%92q%00%00%5ED%24.T%CA%B3%3F%C7%08%00%00D%A0%81*%B0A%1B%F4%C1%18%2C%C0%06%1C%C1%05%DC%C1%0B%FC%606%84B%24%C4%C2B%10B%0Ad%80%1Cr%60)%AC%82B(%86%CD%B0%1D*%60%2F%D4%40%1D4%C0Qh%86%93p%0E.%C2U%B8%0E%3Dp%0F%FAa%08%9E%C1(%BC%81%09%04A%C8%08%13a!%DA%88%01b%8AX%23%8E%08%17%99%85%F8!%C1H%04%12%8B%24%20%C9%88%14Q%22K%915H1R%8AT%20UH%1D%F2%3Dr%029%87%5CF%BA%91%3B%C8%002%82%FC%86%BCG1%94%81%B2Q%3D%D4%0C%B5C%B9%A87%1A%84F%A2%0B%D0dt1%9A%8F%16%A0%9B%D0r%B4%1A%3D%8C6%A1%E7%D0%ABh%0F%DA%8F%3EC%C70%C0%E8%18%073%C4l0.%C6%C3B%B18%2C%09%93c%CB%B1%22%AC%0C%AB%C6%1A%B0V%AC%03%BB%89%F5c%CF%B1w%04%12%81E%C0%096%04wB%20a%1EAHXLXN%D8H%A8%20%1C%244%11%DA%097%09%03%84Q%C2'%22%93%A8K%B4%26%BA%11%F9%C4%18b21%87XH%2C%23%D6%12%8F%13%2F%10%7B%88C%C47%24%12%89C2'%B9%90%02I%B1%A4T%D2%12%D2F%D2nR%23%E9%2C%A9%9B4H%1A%23%93%C9%DAdk%B2%079%94%2C%20%2B%C8%85%E4%9D%E4%C3%E43%E4%1B%E4!%F2%5B%0A%9Db%40q%A4%F8S%E2(R%CAjJ%19%E5%10%E54%E5%06e%982AU%A3%9AR%DD%A8%A1T%115%8FZB%AD%A1%B6R%AFQ%87%A8%134u%9A9%CD%83%16IK%A5%AD%A2%95%D3%1Ah%17h%F7i%AF%E8t%BA%11%DD%95%1EN%97%D0W%D2%CB%E9G%E8%97%E8%03%F4w%0C%0D%86%15%83%C7%88g(%19%9B%18%07%18g%19w%18%AF%98L%A6%19%D3%8B%19%C7T071%EB%98%E7%99%0F%99oUX*%B6*%7C%15%91%CA%0A%95J%95%26%95%1B*%2FT%A9%AA%A6%AA%DE%AA%0BU%F3U%CBT%8F%A9%5ES%7D%AEFU3S%E3%A9%09%D4%96%ABU%AA%9DP%EBS%1BSg%A9%3B%A8%87%AAg%A8oT%3F%A4~Y%FD%89%06Y%C3L%C3OC%A4Q%A0%B1_%E3%BC%C6%20%0Bc%19%B3x%2C!k%0D%AB%86u%815%C4%26%B1%CD%D9%7Cv*%BB%98%FD%1D%BB%8B%3D%AA%A9%A19C3J3W%B3R%F3%94f%3F%07%E3%98q%F8%9CtN%09%E7(%A7%97%F3~%8A%DE%14%EF)%E2)%1B%A64L%B91e%5Ck%AA%96%97%96X%ABH%ABQ%ABG%EB%BD6%AE%ED%A7%9D%A6%BDE%BBY%FB%81%0EA%C7J'%5C'Gg%8F%CE%05%9D%E7S%D9S%DD%A7%0A%A7%16M%3D%3A%F5%AE.%AAk%A5%1B%A1%BBDw%BFn%A7%EE%98%9E%BE%5E%80%9ELo%A7%DEy%BD%E7%FA%1C%7D%2F%FDT%FDm%FA%A7%F5G%0CX%06%B3%0C%24%06%DB%0C%CE%18%3C%C55qo%3C%1D%2F%C7%DB%F1QC%5D%C3%40C%A5a%95a%97%E1%84%91%B9%D1%3C%A3%D5F%8DF%0F%8Ci%C6%5C%E3%24%E3m%C6m%C6%A3%26%06%26!%26KM%EAM%EE%9ARM%B9%A6)%A6%3BL%3BL%C7%CD%CC%CD%A2%CD%D6%995%9B%3D1%D72%E7%9B%E7%9B%D7%9B%DF%B7%60ZxZ%2C%B6%A8%B6%B8eI%B2%E4Z%A6Y%EE%B6%BCn%85Z9Y%A5XUZ%5D%B3F%AD%9D%AD%25%D6%BB%AD%BB%A7%11%A7%B9N%93N%AB%9E%D6g%C3%B0%F1%B6%C9%B6%A9%B7%19%B0%E5%D8%06%DB%AE%B6m%B6%7Dagb%17g%B7%C5%AE%C3%EE%93%BD%93%7D%BA%7D%8D%FD%3D%07%0D%87%D9%0E%AB%1DZ%1D~s%B4r%14%3AV%3A%DE%9A%CE%9C%EE%3F%7D%C5%F4%96%E9%2FgX%CF%10%CF%D83%E3%B6%13%CB)%C4i%9DS%9B%D3Gg%17g%B9s%83%F3%88%8B%89K%82%CB.%97%3E.%9B%1B%C6%DD%C8%BD%E4Jt%F5q%5D%E1z%D2%F5%9D%9B%B3%9B%C2%ED%A8%DB%AF%EE6%EEi%EE%87%DC%9F%CC4%9F)%9EY3s%D0%C3%C8C%E0Q%E5%D1%3F%0B%9F%950k%DF%AC~OCO%81g%B5%E7%23%2Fc%2F%91W%AD%D7%B0%B7%A5w%AA%F7a%EF%17%3E%F6%3Er%9F%E3%3E%E3%3C7%DE2%DEY_%CC7%C0%B7%C8%B7%CBO%C3o%9E_%85%DFC%7F%23%FFd%FFz%FF%D1%00%A7%80%25%01g%03%89%81A%81%5B%02%FB%F8z%7C!%BF%8E%3F%3A%DBe%F6%B2%D9%EDA%8C%A0%B9A%15A%8F%82%AD%82%E5%C1%AD!h%C8%EC%90%AD!%F7%E7%98%CE%91%CEi%0E%85P~%E8%D6%D0%07a%E6a%8B%C3~%0C'%85%87%85W%86%3F%8Ep%88X%1A%D11%975w%D1%DCCs%DFD%FAD%96D%DE%9Bg1O9%AF-J5*%3E%AA.j%3C%DA7%BA4%BA%3F%C6.fY%CC%D5X%9DXIlK%1C9.*%AE6nl%BE%DF%FC%ED%F3%87%E2%9D%E2%0B%E3%7B%17%98%2F%C8%5Dpy%A1%CE%C2%F4%85%A7%16%A9.%12%2C%3A%96%40L%88N8%94%F0A%10*%A8%16%8C%25%F2%13w%25%8E%0Ay%C2%1D%C2g%22%2F%D16%D1%88%D8C%5C*%1EN%F2H*Mz%92%EC%91%BC5y%24%C53%A5%2C%E5%B9%84'%A9%90%BCL%0DL%DD%9B%3A%9E%16%9Av%20m2%3D%3A%BD1%83%92%91%90qB%AA!M%93%B6g%EAg%E6fv%CB%ACe%85%B2%FE%C5n%8B%B7%2F%1E%95%07%C9k%B3%90%AC%05Y-%0A%B6B%A6%E8TZ(%D7*%07%B2geWf%BF%CD%89%CA9%96%AB%9E%2B%CD%ED%CC%B3%CA%DB%907%9C%EF%9F%FF%ED%12%C2%12%E1%92%B6%A5%86KW-%1DX%E6%BD%ACj9%B2%3Cqy%DB%0A%E3%15%05%2B%86V%06%AC%3C%B8%8A%B6*m%D5O%AB%EDW%97%AE~%BD%26zMk%81%5E%C1%CA%82%C1%B5%01k%EB%0BU%0A%E5%85%7D%EB%DC%D7%ED%5DOX%2FY%DF%B5a%FA%86%9D%1B%3E%15%89%8A%AE%14%DB%17%97%15%7F%D8(%DCx%E5%1B%87o%CA%BF%99%DC%94%B4%A9%AB%C4%B9d%CFf%D2f%E9%E6%DE-%9E%5B%0E%96%AA%97%E6%97%0En%0D%D9%DA%B4%0D%DFV%B4%ED%F5%F6E%DB%2F%97%CD(%DB%BB%83%B6C%B9%A3%BF%3C%B8%BCe%A7%C9%CE%CD%3B%3FT%A4T%F4T%FAT6%EE%D2%DD%B5a%D7%F8n%D1%EE%1B%7B%BC%F64%EC%D5%DB%5B%BC%F7%FD%3E%C9%BE%DBU%01UM%D5f%D5e%FBI%FB%B3%F7%3F%AE%89%AA%E9%F8%96%FBm%5D%ADNmq%ED%C7%03%D2%03%FD%07%23%0E%B6%D7%B9%D4%D5%1D%D2%3DTR%8F%D6%2B%EBG%0E%C7%1F%BE%FE%9D%EFw-%0D6%0DU%8D%9C%C6%E2%23pDy%E4%E9%F7%09%DF%F7%1E%0D%3A%DAv%8C%7B%AC%E1%07%D3%1Fv%1Dg%1D%2FjB%9A%F2%9AF%9BS%9A%FB%5Bb%5B%BAO%CC%3E%D1%D6%EA%DEz%FCG%DB%1F%0F%9C4%3CYyJ%F3T%C9i%DA%E9%82%D3%93g%F2%CF%8C%9D%95%9D%7D~.%F9%DC%60%DB%A2%B6%7B%E7c%CE%DFj%0Fo%EF%BA%10t%E1%D2E%FF%8B%E7%3B%BC%3B%CE%5C%F2%B8t%F2%B2%DB%E5%13W%B8W%9A%AF%3A_m%EAt%EA%3C%FE%93%D3O%C7%BB%9C%BB%9A%AE%B9%5Ck%B9%EEz%BD%B5%7Bf%F7%E9%1B%9E7%CE%DD%F4%BDy%F1%16%FF%D6%D5%9E9%3D%DD%BD%F3zo%F7%C5%F7%F5%DF%16%DD~r'%FD%CE%CB%BB%D9w'%EE%AD%BCO%BC_%F4%40%EDA%D9C%DD%87%D5%3F%5B%FE%DC%D8%EF%DC%7Fj%C0w%A0%F3%D1%DCG%F7%06%85%83%CF%FE%91%F5%8F%0FC%05%8F%99%8F%CB%86%0D%86%EB%9E8%3E99%E2%3Fr%FD%E9%FC%A7C%CFd%CF%26%9E%17%FE%A2%FE%CB%AE%17%16%2F~%F8%D5%EB%D7%CE%D1%98%D1%A1%97%F2%97%93%BFm%7C%A5%FD%EA%C0%EB%19%AF%DB%C6%C2%C6%1E%BE%C9x31%5E%F4V%FB%ED%C1w%DCw%1D%EF%A3%DF%0FO%E4%7C%20%7F(%FFh%F9%B1%F5S%D0%A7%FB%93%19%93%93%FF%04%03%98%F3%FCc3-%DB%00%00%00%20cHRM%00%00z%25%00%00%80%83%00%00%F9%FF%00%00%80%E9%00%00u0%00%00%EA%60%00%00%3A%98%00%00%17o%92_%C5F%00%00%02%1CIDATx%DA%84%92%3BkTQ%14F%D79%F7%CE%23%89%18'%1A%09%83E%1AI%A5%96%16%CA%40%C4%C6F-%04%15c0D%C1_%A0%95%91%D8%F9%07%141%8D%85%82%26%81%A0%82%881%85%20%9AF%B4P%F0%91%C9c%60%94d2%8F%CCd%EE%F3%9Cmq%C7%B4~%FD%C7%E2%DBk%AB%F1%C99%1C%ADF%F3%FBz%1E%D0I%10)%5CG%F0B%B0%02Z)V%FE%B4FE%98%9E%B9%7B%1A%00%D7%D5j%FCTah%EA%E4%B1!%F4%BF%A6%82(%06%3F%04%2F%B0%E4%BA%60v%FE%DB%B3W%1F%96G%80%C7%00j%F2%FE%5B%99%B8~%82%85e%A1%B4R%A2%F8%7D%09%A4C%8E%15)G%F0%22p%10%82%C8R%AE%B4%CFYa%D6%8D%AD%0D%DA%86%CC%EA%F2%1A9%C7%E3%C6%D5a%94%DA%01'%E4%40h%87%86%5C%97f%E6%CD%D7%99%D7%1FW%CE%BB%22%E0%07%B0%BE%BA%CA%D8X%81%85%A2%90r%93%92%B1I%D1%02Z%B9t7c%AE%9C9%C4%97%9F%1BO5%90%B1%02%26%B6x%16%D2.%A45%3B%7B%95%12%04%C1ZKi%5B%B3%DE%04c%8D%AF%AB-%B3X%5Eo%60E%F0C%08%E3%84%E2%C5%82%17%26%FB%9A%A1%D0%08%85%C8%82%1F%1Abc%D1%1Bu%EF%F8%C3%E9%C5y%01%8C%81%20%86V%94%A8%A8%07B3%12%8C%80%17(j%5B%9AX%1C%94%26%EBf%D3N%BC%D9%F0%CEj%AD%8A%95%FA%F6%FE%81%3D%3D%C4%B1B%04z-%84%06%96%D6-%B9nM%BE%0F6%AB%0D%3C%DF%7Cv%0E%17.%E2h%15%D5%9A%FETq%AD2%7Cp%AF%7B%60%BBZ%25h%D41%5B5%9C%A0M~%A0%17%C7%AF%93j%FD%E6%D1%CBO%EF%CA%15%AF%A0Fn%3DGun%1F%C7%B6%BF%DE%8A%C6%B5VX%81(%B2te%DD%0Bw%AE%1D%3DR%DEhs%F3%DE%FB%B9%C1%FC%EEQG%AB%A6%12Il_%9Ex%91x3%A0T%F2j%D6B%10%1B%B2igr%A0o%D7%C4%AFR%EDR*%A5%9F%88%80%CB%7F%92q%1D%DA%5Et%FB%C7Z%B5%3F%93v%06%3B%1C%FE%0E%00%EC%D9(%8CUz%5B!%00%00%00%00IEND%AEB%60%82"
}

var http = {
	get: function(url, callback) {
		var xhr = new XMLHttpRequest();
		xhr.open('GET', url, true);
		xhr.onreadystatechange = function()
		{
			if (xhr.readyState == 4 && xhr.status == 200)
			{
				callback(xhr);
			}
		}
		xhr.send();
	},

	post: function(url, data, callback) {
		var xhr = new XMLHttpRequest();
		xhr.open('POST', url, true);
		xhr.setRequestHeader("Content-type","application/x-www-form-urlencoded");
		xhr.onreadystatechange = function()
		{
			if (xhr.readyState == 4 && xhr.status == 200)
			{
				callback(xhr);
			}
		};
		xhr.send(data);
	},
	
	upload: function(url, file, callback_success, callback_fail) {
		var reader = new FileReader();
		reader.onload = function(e)
		{
			var xhr = new XMLHttpRequest();
			var boundary = "----------------";
			boundary += parseInt(Math.random()*98989898+1);
			boundary += parseInt(Math.random()*98989898+1);

			xhr.open('POST', url, true);
			xhr.setRequestHeader("Content-Type","multipart/form-data; boundary="+boundary);
			
			var data = [boundary,"\r\n",
				"Content-Disposition: form-data; name=\"act\"\r\n\r\nupload",
				"\r\n",boundary,"\r\n",
				"Content-Disposition: form-data; name=\"fname\"\r\n\r\n",file.name,
				"\r\n",boundary,"\r\n",
				"Content-Disposition: form-data; name=\"file1\"; filename=\"",file.name,"\"\r\n",
				"Content-Type: ",file.type,"\r\n\r\n",
				e.target.result,
				"\r\n",boundary,"\r\n",
				"Content-Disposition: form-data; name=\"Submit\"\r\n\r\n\xc9\xcf\xb4\xab",  // 上传
				"\r\n",boundary,"--\r\n"].join("");

			xhr.onload = function() {
				callback_success(xhr);
			};
			xhr.onerror = function() {
				callback_fail(xhr);
			};
			xhr.sendAsBinary(data);
		}
		reader.readAsBinaryString(file);
	}
}

const AJAXDLG_SHOW = 1, AJAXDLG_HIDE = 0;
const AJAXDLG_IDLE = 0, AJAXDLG_POST = 1, AJAXDLG_UPLOAD = 2;

var ajaxDialog = {
	state: AJAXDLG_HIDE,
	work: AJAXDLG_IDLE,
	dialog: null,
	_isDragging: false,
	_x: 0,
	_y: 0,

	createDialog: function() {
		var html = "<table cellspacing='0' cellpadding='3'><tbody>"+
					"<tr><td id='cornerul' class='dlgborder' style=\"height:8px;width:8px;padding:0;\"></td><td class='dlgborder' style=\"height:8px;width:584px;padding:0\"></td><td id='cornerur' class='dlgborder' style=\"height:8px;width:8px;padding:0\"></td></tr>"+
					"<tr><td class='dlgborder' style=\"width:8px;padding:0;\"></td>"+
						"<td style=\"padding:0;background-color:\#F5FAFE\"><div style=\"margin:15px;\">" +
							"<h3 id='ajaxDialogTitle' style=\"cursor:move;\">参与/回复主题"+
								"<span style=\"float:right;\">"+
								"<a id='btnCloseDialog' href=\"javascript:;\">"+
								"<img src='http://file.cc98.org/uploadfile/2010/4/11/1982947828.png' border='0'/></a></span>" +
							"</h3>"+
							"<div>标题  <input id='replyTitle' maxlength='100' size='70'></div>" +
							"<div>"+
							"<div id='ajaxDialogToolBar' style=\"background-color:#E8E8E8;border-width:1px 1px;height:25px;margin:5px 0 0;\">"+
								"<a id='btnPostEmotion' href=\"javascript:;\" >"+	// 发贴心情
								"<img src='http://www.cc98.org/face/face7.gif' border='0' style=\"margin:5px 5px 5px;\" /></a>"+
								"<a id='btnCC98Emotion' href=\"javascript:;\" >"+	// cc98标准表情
								"<img src='http://www.cc98.org/emot/simpleemot/emot88.gif' border='0' style=\"margin:5px 5px 5px;width:15px;height:15px\" /></a>"+
								"<a id='btnUpload' href=\"javascript:;\" >" +   // 上传
								"<img src='http://file.cc98.org/uploadfile/2010/5/4/21521278526.png' border='0' style=\"margin:5px 5px 5px;width:15px;height:15px;\" /></a>"+
							"</div>"+
							"<div id='funcContent'></div>"+
							"<div id='contentContainer' style='background-color:#E8E8E8; width:574px; height:204px;'><textarea rows='5' id='replyContent' style='width:570px;height:200px;margin:2px;'></textarea></div>"+
							"<table cellpadding='2'><tbody>"+
							"<tr><td><input type='button' value=' Say! ' id='replySubmit' style='margin-top:3px;'/></td>"+
							"<td><div id='requestState' style=\"color:red;padding-left:10px;padding-top:3px;\"></div></td></tr>"+
							"</tbody></table>"+
						"</div></td>"+
					"<td class='dlgborder' style=\"width:8px;padding:0;padding:0;\"></td></tr>"+
					"<tr><td class='dlgborder' id='cornerdl' style=\"height:8px;width:8px;padding:0;\"></td><td class='dlgborder' style=\"height:8px;width:584px;padding:0;\"></td><td class='dlgborder' id='cornerdr' style=\"height:8px;width:8px;padding:0;\"></td></tr>"+
				"</tbody></table>";
		var ajaxDialog = document.createElement('div');
		ajaxDialog.id = 'ajaxDialog';
		ajaxDialog.innerHTML = html;

		if (cc98.isUserTheme)
		{
			$('contentWrapper').appendChild(ajaxDialog);
		}
		else
		{
			document.body.appendChild(ajaxDialog);
		}
		
		var css = "#ajaxDialog { "
				+ "position: fixed; width: 616px; height: 361px;"
				+ "top:" + (document.body.clientHeight - 361)/2 + "px;"
				+ "left:" + (document.body.clientWidth - 616)/2 + "px;"
				+ "box-shadow: 0 0 10px black; border-radius: 6px;"
				+ "}"
				+ "#cornerul { border-radius: 6px 0 0 0; }"
				+ "#cornerur { border-radius: 0 6px 0 0; }"
				+ "#cornerdl { border-radius: 0 0 0 6px; }"
				+ "#cornerdr { border-radius: 0 0 6px 0; }"
				+ ".dlgborder { background-color: #15acea; }";
		
		GM_addStyle(css);
		
		ajaxDialog.style.display = "none";
		this.dialog = ajaxDialog;
		this.state = AJAXDLG_HIDE;
	},

	showDialog: function() {
		this.dialog.style.display = "";
		this.state = AJAXDLG_SHOW;
	},

	hideDialog: function() {
		this.dialog.style.display = "none";
		this.state = AJAXDLG_HIDE;
	},
/*
	beginDrag: function(event) {
		this._isDragging = true;

		this._x = event.clienteX;
		this._y = event.clienteY;
	},

	onDrag: function(event) {
		if (this._isDragging == false)
			return ;
		
		var offset = $('ajaxDialog').offset();
		$('ajaxDialog').css({
			'left': offset.left + event.clienteX - this._x,
			'top': offset.top + event.clienteY - this._y
		});

	},

	endDrag: function() {
		this._isDragging = false;
	},
*/
	// html5 upload
	// 代码参照http://ie.microsoft.com/testdrive/HTML5/CORSUpload/Default.html
	handleUpload: function(e) {
		e.stopPropagation();
		e.preventDefault();
		
		if (ajaxDialog.work != AJAXDLG_IDLE)	// 在处理其它工作，返回
			return ;

		var filelist = e.dataTransfer.files;
		if (!filelist || !filelist.length) return ; 

		ajaxDialog.work = AJAXDLG_UPLOAD;
		
		var ctn = $('contentContainer');

		var html5uploadpanel = document.createElement('div');
		html5uploadpanel.id = 'html5uploadpanel';
		html5uploadpanel.innerHTML = 
			'<table cellspacing="0" style="width:100%;">'+
			'<thead><tr><th width="50%">文件名</th><th width="20%">大小</th><th width="30%">状态</th></tr></thead>'+
			'<tbody id="uploadresult"></tbody>';
		var css = "#html5uploadpanel { width:570px; height:200px; position:relative; top:-202px; left:2px; background-color:#E8E8E8; }"+
			"#uploadresult > *:nth-child(even) { background-color:#ddd; } #uploadresult > *:nth-child(odd) { background-color:#eee; }"+
			".uploadfail { color:#900; } .uploadsuccess { color:#090; }";
		GM_addStyle(css);
		ctn.appendChild(html5uploadpanel);
		var uploadresult = html5uploadpanel.firstChild.childNodes[1];	// tbody
		var postcontent = ctn.firstChild;

		var url = document.location.toString().toLowerCase();
		var boardid = url.match(/boardid=([^&]*)/)[1];
		url = "http://www.cc98.org/saveannouce_upfile.asp?boardid="+boardid;
		var list = [];
		for (var i = 0; i < filelist.length && i < 10; i++)
		{
			list.push(filelist[i]);
		}
		uploadNext();


		function uploadNext()
		{
			if (list.length)
			{
				uploadFile(list.shift());
			}
			else  // 所有文件都上传完成
			{
				setTimeout(function() {
						ctn.style.backgroundColor='#E8E8E8';
						ctn.removeChild(html5uploadpanel);
						ajaxDialog.work = AJAXDLG_IDLE; },
					1000);
			}
		};


		function uploadFile(file)
		{
			var result = document.createElement("tr");
			var name = document.createElement("td");
			var size = document.createElement("td");
			var status = document.createElement("td");

			result.appendChild(name);
			result.appendChild(size);
			result.appendChild(status);
			uploadresult.appendChild(result);

			name.textContent = file.name;
			size.textContent = (file.size / 1024).toFixed(2) + " kB";

			if (file.size >= 500*1024)  // 文件大小大于500K，不能上传
			{
				status.textContent = "文件大于500k";
				status.className = "uploadfail";
				uploadNext();
			}
			else
			{
				function handleUploadSuccess(xhr) {
					var response = xhr.responseText;
					var pattern = /<script>insertupload\('([^'"]+)'\);<\/script>/i;

					if (pattern.exec(response))
					{
						status.textContent = "上传成功"; 
						status.className = "uploadsuccess";
						postcontent.value += RegExp.$1;
					}
					else if (response.indexOf("文件格式不正确") != -1)
					{
						status.textContent = "文件格式不正确";
						status.className = "uploadfail";
					}
					else {
						status.textContent = "上传失败";
						status.className = "uploadfail";
					}
					uploadNext();
				};

				function handleUploadFail(xhr) {
					status.textContent = "上传失败";
					status.className = "uploadfail";
					uploadNext();
				};
				
				status.textContent = "上传中...";
				http.upload(url, file, handleUploadSuccess, handleUploadFail);
			}
		};
	},
	

	submit: function() {
		if (this.state == AJAXDLG_HIDE)
			return ;
				
		if (this.work != AJAXDLG_IDLE)
			return ;

		var btnReply = $('replySubmit');
		if (btnReply.getAttribute('disabled') == 'disabled')
			return ;
		btnReply.setAttribute('disabled','disabled');

		$('requestState').innerHTML = '发表帖子中...';
		var locate = location.href;
		var cookie = document.cookie;

		var username = cookie.match(/username=([^&;]*)/)[1];
		var password = cookie.match(/password=([^&;]*)/)[1];
		var url = document.location.toString().toLowerCase();
		var boardid = url.match(/boardid=([^&]*)/)[1];
		var id = url.match(/&id=([^&]*)/)[1];

		var content = $('replyContent').value;
		var dataSend = encodeURIComponent(content);
		
		// 发帖提交的URL
		var postUrl = 'http://www.cc98.org/SaveReAnnounce.asp?method=fastreply&BoardID=' + boardid;
		// 发帖需要提交的数据
		var formData = 'followup='+id+'&RootID='+id+'&star=1&TotalUseTable=bbs4&UserName='+username+'&passwd='+password;
		if ($('replyTitle') != undefined)	// 如果存在标题
		{
			var titleData = $('replyTitle').value;
			formData += '&subject='+titleData;
		}

		formData +='&Expression=';	// 发贴心情
		if ($('btnPostEmotion') != undefined)
		{
			var postEmotionSrc = $('btnPostEmotion').firstChild.src;
			formData += postEmotionSrc.substring(postEmotionSrc.lastIndexOf('/')+1);
		}
		else
		{
			formData += "face7.gif";
		}

		formData +='&Content='+dataSend+'&signflag=yes';

		http.post(postUrl, formData,
			function (xhr) {
				var statelbl = $("requestState");
				var response = xhr.responseText;
				if (response.indexOf("状态：回复帖子成功") != -1)
				{
					statelbl.innerHTML = "发帖成功，正在跳转...";
					location.reload();
				}
				else if (response.indexOf("本论坛限制发贴距离时间为10秒") != -1)
				{
					statelbl.innerHTML = "论坛限制发贴距离时间为10秒，请稍后再发。";
				}
				else
				{
					statelbl.innerHTML = "未知错误";
				}
			}
		)
	},

	registerEvent: function() {
		$('btnCloseDialog').addEventListener('click',
			function() { ajaxDialog.hideDialog(); },
			false );
		/*
		var dialogTitle = $('ajaxDialogTitle');
		dialogTitle.addEventListener('mousedown',
			function(event) { ajaxDialog.beginDrag(event); },
			false );
		dialogTitle.addEventListener('mouseup',
			function() { ajaxDialog.endDrag() },
			false );
		dialogTitle.addEventListener('mousemove',
			function(event) { ajaxDialog.onDrag(event) },
			false );
		*/
		var btnPost = $('replySubmit');
		btnPost.addEventListener('click',
			function() { ajaxDialog.submit(); },
			false );

		// html5 upload
		var cnt = $('contentContainer');
		cnt.addEventListener('dragenter',
			function() {this.style.backgroundColor='#15acea';},
			false );
		cnt.addEventListener('dragleave',
			function() {this.style.backgroundColor='#E8E8E8';},
			false );
		cnt.addEventListener('dragover',
			function(e) { e.stopPropagation(); e.preventDefault(); },
			false );
		cnt.addEventListener('drop',
			ajaxDialog.handleUpload,
			false );
	}
	
}

// 马甲管理器
var mjManager = {
	create: function() {
		var navPanel = $('.TopLighNav1 > div > div').eq(0);
		$('<img align="absmiddle" src="pic/navspacer.gif" />').appendTo(navPanel);
		$('<a href="#" id="mjMenuTitle">马甲管理</a>').appendTo(navPanel);
		$('#mjMenuTitle').css({'margin-left': '4px', 'text-decorator': 'none'});
	},

	showMJList: function() {
		return null;
	}
}

var html = {
	getQuoteFromRawHtml: function(rawhtml) {
		try
		{
			var quoteContent = rawhtml.match(/<textarea.*>([\s\S]*)<\/textarea>/i)[1];
			return quoteContent;
		}
		catch(err)
		{
			/* 转移到ajaxDialog中处理
			if (rawhtml.indexOf('本主题已经锁定') != -1)
			{
				$('requestState').innerHTML = '本主题已经锁定，不能发帖';
				$('replySubmit').setAttribute('disabled','disabled');
			}
			*/
			return null;
		}
	},

	buildQuoteHtml: function(content, url) {
		var tmpUrl = url.toLowerCase();
		var boardid = tmpUrl.match(/boardid=([^&]*)/)[1];
		var id = tmpUrl.match(/&id=([^&]*)/)[1];
		var page = tmpUrl.match(/&star=([^&]*)/)[1];
		var floor = tmpUrl.match(/&bm=([^&]*)/)[1];
		var quoteUrl = "http://www.cc98.org/dispbbs.asp?boardid="+boardid+"&id="+id+"&star="+page+"#"+floor;

		var insertIndex = content.indexOf("[/b]") + 4;
		var html = content.substring(0,insertIndex) + "&nbsp;&nbsp;[url=" + quoteUrl + ",t=self][color=blue][b]查看原贴<-[/b][/color][/url]\n" + content.substring(insertIndex);

		return html;
	}
}

// cc98相关参数
const CC98_NOTLOGIN = 0, CC98_LOGIN = 1;
var cc98 = {
	isSimpleEdition: false,
	username: 'not login',
	password: 'not login',
	state: CC98_NOTLOGIN,
	isUserTheme: false,
	
	checkState: function() {
		var pattern = /cc98Simple=(\d{1})/i;
		this.isSimpleEdition = (pattern.exec(document.cookie) && RegExp.$1 == "1");

		pattern = /username=([^&]+)/i;
		if (pattern.exec(document.cookie))
		{
			this.state = CC98_LOGIN;
			this.username = RegExp.$1;
		}
		else
			this.state = CC98_NOTLOGIN;
	},

	addQuoteIcon: function() {

	},

	BlockMsgPopup: function() {
		var win = window;
		var _win = win.wrappedJSObject || win;
		var _open = _win.open;

		_win.open = function () {
			var args = Array.prototype.slice.call(arguments);
			var url = args[0];
			var allowPopup = false;
			
			var id;
			var sender = null;

			var pattern = new RegExp("messanger\.asp\?action\=read","i");
			
			if (url.search(/messanger\.asp\?action=read/ig) == -1)
			{
				allowPopup = true;
			}
			else
			{
				var r;
				pattern = new RegExp("id=([0-9]+)","i");
				r = pattern.exec(url);
				if (r != null)
					id = r[1];

				pattern = new RegExp("sender=(.+)","i");
				r = pattern.exec(url);
				if (r != null)
					sender = r[1];

				allowPopup = false;
			}
			return allowPopup ? _open.apply(this, args) : null;
		}
	},
	
	reform: function () {

		this.isUserTheme = true;

		var topBanner = document.body.children[4];
		var mailBanner = document.body.children[5];

		var wrapper = document.createElement("div");
		wrapper.id = 'contentWrapper';
		wrapper.innerHTML = document.body.innerHTML;

		document.body.innerHTML = '';
		document.body.appendChild(wrapper);

		GM_addStyle('body { background-image: url("http://file.cc98.org/uploadfile/2009/3/27/1861451968.jpg"); background-attachment: fixed; }'
				  + '#contentWrapper { margin: 0 100px; box-shadow: 0 0 10px black; background-color: white }'
				  );
	},

	restoreDefault: function () {
		this.isUserTheme = false;
	}
}

const UNKNOWN = 0, GM = 1, SCRIPTISH = 2, FIREFOX = 3, CHROME = 4, OPERA = 5;
const NOTSTART = 0, STARTINIT = 1, IDLE = 2;

// 脚本相关		
var app = {
	browser: UNKNOWN,
	state: NOTSTART,
	
	registerGlobalEvent: function() {
		if (config.enableAjaxDialog)
		{
			document.addEventListener('keyup',
				function(event) {
					var url = window.location.href.toLowerCase();

					if (event.altKey == true && event.keyCode == 82)	// alt + r
					{
						if (url.indexOf('dispbbs.asp?') != -1)	// 在显示帖子页面中，则按alt+r后显示ajaxDialog
						{
							if (ajaxDialog.state == AJAXDLG_HIDE)
								ajaxDialog.showDialog();
						}
					}

					if (event.keyCode == 27)    // ESC
						if (ajaxDialog.state == AJAXDLG_SHOW)
							ajaxDialog.hideDialog();
					
					if (event.ctrlKey === true && event.keyCode === 13)
					{
						if (ajaxDialog.state == AJAXDLG_SHOW)
							ajaxDialog.submit();
					}

				}, false);

		}
	},

	registerElementEvent: function() {
		if (config.enableAjaxDialog)
		{
			ajaxDialog.registerEvent();
		}
		
		//$('mjMenuTitle').hover(function() { mjManager.showMJList(); });
	},
	
	checkEnvironment: function() {
		if (typeof(GM_log) != 'undefined')  // Greasemonkey or Scriptish
		{
			if (typeof(GM_setClipboard) != 'undefined')  // Scriptish
				browser = SCRIPTISH;
			else
				browser = GM;
		}
		else if (window.opera)	// Opera
			browser = OPERA;
		else if (window.google || window.chrome || window.chromium)  // Chrome or Chromium
			browser = CHROME;
		else if (window.mozIndexedDB)  // Firefox
			browser = FIREFOX;
		else
			browser = UNKNOWN;

		if (_DEBUG == 1)
		{
			console.info(browser);
		}
	},

	appInitAtStart: function() {

		if (this.state != NOTSTART)
			return ;

		this.checkEnvironment();

		cc98.checkState();

		this.registerGlobalEvent();

		this.state = STARTINIT;
	},

	appInitAtDocumentReady: function() {

		if (this.state != STARTINIT)
			return ;

		// cc98.reform();

		if (config.enableAjaxDialog)
			ajaxDialog.createDialog();

		if (config.enableMJManager)
			// mjManager.create();

		this.registerElementEvent();

		this.state = IDLE;
	}
}


// ============================

app.appInitAtStart();

// 现在DOMContentLoaded事件在HTML5规范中标准化了，FF, Chrome, Opera都支持
document.addEventListener("DOMContentLoaded", function(){ DOMLoad(); } , false);

// =========================================


// 在DOMContentLoaded事件触发式发生
function DOMLoad() {

	app.appInitAtDocumentReady();

}
