var g_oSFS = null;
var g_oUserData = null;
var g_oCurrentRoom = null;

document.addEventListener("DOMContentLoaded", function() {
	loadLocalStorage();
});

//====================================================================================================
//====================================================================================================
// sfs event handles

function initSFSConnection(host, port, zone, useSSL) {
	var config = {};
	config.host = host;
	config.port = parseInt(port);
	config.zone = zone;
	config.debug = true;
	config.useSSL = useSSL;
	g_oSFS = new SFS2X.SmartFox(config);

	g_oSFS.logger.level = SFS2X.LogLevel.DEBUG;
	g_oSFS.logger.enableConsoleOutput = true;
	g_oSFS.logger.enableEventDispatching = false;

	g_oSFS.addEventListener(SFS2X.SFSEvent.CONNECTION, onConnection, this);
	g_oSFS.addEventListener(SFS2X.SFSEvent.CONNECTION_LOST, onConnectionLost, this);
	g_oSFS.addEventListener(SFS2X.SFSEvent.LOGIN, onLogin, this);
	g_oSFS.addEventListener(SFS2X.SFSEvent.LOGIN_ERROR, onLoginError, this);
	g_oSFS.addEventListener(SFS2X.SFSEvent.LOGOUT, onLogout, this);
	g_oSFS.addEventListener(SFS2X.SFSEvent.ROOM_JOIN, onRoomJoin, this);
	g_oSFS.addEventListener(SFS2X.SFSEvent.ROOM_JOIN_ERROR, onRoomJoinError, this);
	g_oSFS.addEventListener(SFS2X.SFSEvent.EXTENSION_RESPONSE, onExtensionResponse, this);

	g_oSFS.connect();
}

function onConnection(p_oEvent) {
	if (p_oEvent.success) {
		showSinglePanel($("#panel-login"));
	}
	else {
		
	}
}

function onConnectionLost(p_oEvent) {
	showSinglePanel($("#panel-connect"));
	g_oUserData = null;
	g_oCurrentRoom = null;
}

function onLogin(p_oEvent) {
	g_oUserData = p_oEvent.data.getSFSObject("user_data");
	var position = g_oUserData.getInt("position");
	if (position == 0) {
		showSinglePanel($("#panel-admin"));
		showSingleSidePanelAdmin($("#tab-admin-home-page"), $("#side-panel-admin-home-page"));
		$("#admin-name").text("Xin chào, " + g_oUserData.getUtfString("name"));
	}
	else if (position == 1) {
		showSinglePanel($("#panel-director"));
	}
	else if (position == 2) {
		showSinglePanel($("#panel-leader"));
	}
	else if (position == 3) {
		showSinglePanel($("#panel-sale"));
	}
	else if (position == 4) {
		showSinglePanel($("#panel-telesale"));
	}
}

function onLoginError(p_oEvent) {
	if (p_oEvent.errorCode == 2) {
		alert("Tên đăng nhập không tồn tại!");
	}
	else if (p_oEvent.errorCode == 3) {
		alert("Mật khẩu không chính xác!");
	}
	else {
		alert("Tài khoản đã hết hạn hoặc bị xóa, liên hệ admin để được xử lý!");
	}
}

function onLogout(p_oEvent) {
	showSinglePanel($("#panel-login"));
	g_oUserData = null;
	g_oCurrentRoom = null;
}

function onRoomJoin(p_oEvent) {
	g_oCurrentRoom = p_oEvent.room;
}
 
function onRoomJoinError(p_oEvent) {
	
}

function onExtensionResponse(p_oEvent) {
	if (p_oEvent.cmd == "admin_search_user") {
		var _oUserData = p_oEvent.params.getSFSObject("user_data");
		if (_oUserData == null) {
			$("#admin-search-user-error").show();
			$("#admin-search-user-result").hide();
		}
		else {
			$("#admin-search-user-error").hide();
			$("#admin-search-user-result").show();
			$("#admin-search-user-account").text(_oUserData.getUtfString("user_name"));
			$("#admin-search-user-name").text(_oUserData.getUtfString("name"));
			var _arPosition = [ "Admin", "Giám đốc", "Trưởng phòng", "Sale", "Telesale" ];
			$("#admin-search-user-position").text(_arPosition[_oUserData.getInt("position")]);
			$("#admin-search-user-room").text("Vhomes " + _oUserData.getInt("room"));
			$("#admin-search-user-last-accessed").text(_oUserData.getUtfString("last_accessed"));
			$("#admin-search-user-created-datetime").text(_oUserData.getUtfString("created_datetime"));
			$("#admin-search-user-expired-datetime").text(_oUserData.getUtfString("expired_datetime"));
			$("#admin-search-user-deleted").text(_oUserData.getInt("deleted") == 0 ? "Chưa bị xóa" : "Đã bị xóa");
			if (_oUserData.getInt("deleted") == 0) {
				$("#admin-delete-user").show();
				$("#admin-restore-user").hide();
			}
			else {
				$("#admin-delete-user").hide();
				$("#admin-restore-user").show();
			}
		}
	}
	else if (p_oEvent.cmd == "admin_reset_password_user") {
		var _bSuccessed = p_oEvent.params.getBool("successed");
		if (_bSuccessed == true) {
			alert("Mật khẩu đã được reset thành 'vhomes'!");
		}
		else {
			alert("Reset mật khẩu không thành công!");
		}
	}
}

//====================================================================================================
//====================================================================================================
// button onclick event handles

function onConnectButtonClick() {
	var server = $("#server").val();
	var port = $("#port").val();
	localStorage.setItem("server", server);
	localStorage.setItem("port", port);
	initSFSConnection(server, port, "MainExtension", false);
}

function onTogglePasswordClick() {
	$("#login-password").attr("type", $("#toggle-password").prop('checked') == true ? "text" : "password");
}

function onToggleAdminUpdatePasswordClick() {
	$("#admin-update-password-old").attr("type", $("#toggle-update-password").prop('checked') == true ? "text" : "password");
	$("#admin-update-password-new").attr("type", $("#toggle-update-password").prop('checked') == true ? "text" : "password");
	$("#admin-update-password-new-repeat").attr("type", $("#toggle-update-password").prop('checked') == true ? "text" : "password");
}

function onLoginButtonClick() {
	var username = $("#login-username").val();
	var password = $("#login-password").val();
	localStorage.setItem("login_username", username);
	localStorage.setItem("login_password", password);
	
	var hashPassword = CryptoJS.MD5(password).toString();
	var loginParams = new SFS2X.SFSObject()
	loginParams.putUtfString("password", hashPassword);
	g_oSFS.send(new SFS2X.LoginRequest(username, "", loginParams, "MainExtension"));
}

function onLogoutButtonClick() {
	g_oSFS.send(new SFS2X.LogoutRequest());
}

//==========
//==========
// admin

function onAdminHomePageTabClick() {
	showSingleSidePanelAdmin($("#tab-admin-home-page"), $("#side-panel-admin-home-page"));
}

function onAdminCreateLeaderTabClick() {
	showSingleSidePanelAdmin($("#tab-admin-create-leader"), $("#side-panel-admin-create-leader"));
}

function onAdminUpdateUserTabClick() {
	showSingleSidePanelAdmin($("#tab-admin-update-user"), $("#side-panel-admin-update-user"));
}

function onAdminChangePasswordTabClick() {
	showSingleSidePanelAdmin($("#tab-admin-change-password"), $("#side-panel-admin-change-password"));
}

function onAdminSearchUserButtonClick() {
	var _sUserName = $("#admin-search-user").val();
	var _oRequestParams = new SFS2X.SFSObject()
	_oRequestParams.putUtfString("user_name", _sUserName);
	g_oSFS.send(new SFS2X.ExtensionRequest("lobby.admin_search_user", _oRequestParams, g_oCurrentRoom));
}

function onAdminResetPasswordUserButtonClick() {
	var _sUserName = $("#admin-search-user").val();
	var _oRequestParams = new SFS2X.SFSObject()
	_oRequestParams.putUtfString("user_name", _sUserName);
	g_oSFS.send(new SFS2X.ExtensionRequest("lobby.admin_reset_password_user", _oRequestParams, g_oCurrentRoom));
}

function onAdminExtendUserButtonClick() {
	var _sUserName = $("#admin-search-user").val();
	var _oRequestParams = new SFS2X.SFSObject()
	_oRequestParams.putUtfString("user_name", _sUserName);
	g_oSFS.send(new SFS2X.ExtensionRequest("lobby.admin_extend_user", _oRequestParams, g_oCurrentRoom));
}

function onAdminDeleteUserButtonClick() {
	var _sUserName = $("#admin-search-user-account").text();
	var _oRequestParams = new SFS2X.SFSObject()
	_oRequestParams.putUtfString("user_name", _sUserName);
	g_oSFS.send(new SFS2X.ExtensionRequest("lobby.admin_delete_user", _oRequestParams, g_oCurrentRoom));
}

function onAdminRestoreUserButtonClick() {
	var _sUserName = $("#admin-search-user-account").text();
	var _oRequestParams = new SFS2X.SFSObject()
	_oRequestParams.putUtfString("user_name", _sUserName);
	g_oSFS.send(new SFS2X.ExtensionRequest("lobby.admin_restore_user", _oRequestParams, g_oCurrentRoom));
}

function onAdminUpdatePasswordButtonClick() {
	var _sOldPassword = $("#admin-update-password-old").val();
	var _sNewPassword = $("#admin-update-password-new").val();
	var _sNewPasswordRepeat = $("#admin-update-password-new-repeat").val();
	if (_sNewPassword !== _sNewPasswordRepeat) {
		alert("Nhập lại mật khẩu chưa chính xác!");
	}
	var _sHashOldPassword = CryptoJS.MD5(_sOldPassword).toString();
	var _sHashNewPassword = CryptoJS.MD5(_sNewPassword).toString();
	var _oRequestParams = new SFS2X.SFSObject()
	_oRequestParams.putInt("id", g_oUserData.getInt("id"));
	_oRequestParams.putUtfString("old_password", _sHashOldPassword);
	_oRequestParams.putUtfString("new_password", _sHashNewPassword);
	g_oSFS.send(new SFS2X.ExtensionRequest("zone.update_password", _oRequestParams, null));
}

//====================================================================================================
//====================================================================================================
// others

$(function() {
  $('#extend-user-datetimepicker').datetimepicker({
    format: 'YYYY-MM-DD HH:mm:ss'
	});
});

function loadLocalStorage() {
	var server = localStorage.getItem("server") == undefined ? "127.0.0.1" : localStorage.getItem("server");
	var port = localStorage.getItem("port") == undefined ? "8080" : localStorage.getItem("port");
	$("#server").val(server);
	$("#port").val(port);

	var username = localStorage.getItem("login_username") == undefined ? "" : localStorage.getItem("login_username");
	var password = localStorage.getItem("login_password") == undefined ? "" : localStorage.getItem("login_password");
	$("#login-username").val(username);
	$("#login-password").val(password);
}

function showSinglePanel(panel) {
	if (panel.is(":hidden") == false) {
		return;
	}
	$("#panel-connect").hide();
	$("#panel-login").hide();
	$("#panel-admin").hide();
	$("#panel-director").hide();
	$("#panel-leader").hide();
	$("#panel-sale").hide();
	$("#panel-telesale").hide();
	panel.fadeIn(300);
}

function showSingleSidePanelAdmin(tab, sidePanel) {
	if (sidePanel.is(":hidden") == false) {
		return;
	}
	$("#tab-admin-home-page").removeClass("active");
	$("#tab-admin-create-leader").removeClass("active");
	$("#tab-admin-update-user").removeClass("active");
	$("#tab-admin-change-password").removeClass("active");
	tab.addClass("active");
	$("#side-panel-admin-home-page").hide();
	$("#side-panel-admin-create-leader").hide();
	$("#side-panel-admin-update-user").hide();
	$("#side-panel-admin-change-password").hide();
	sidePanel.fadeIn(300);
}