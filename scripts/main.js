var g_oSFS = null;
var g_oUserData = null;
var g_oCurrentRoom = null;

var g_sPhoneNumber = "";

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
	sendRequestGetInfo();
}

function onLoginError(p_oEvent) {
	if (p_oEvent.errorCode === 2) {
		alert("Tên đăng nhập không tồn tại!");
	}
	else if (p_oEvent.errorCode === 3) {
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
	showSinglePanel($("#panel-telesale"));
	$("#telesale-name").text(g_oUserData.getUtfString("name"));
}
 
function onRoomJoinError(p_oEvent) {
	
}

function onExtensionResponse(p_oEvent) {
	if (p_oEvent.cmd === "owner_info") {
		g_oUserData = p_oEvent.params.getSFSObject("user_info");
		setRequestGetRoomName();
	}
	else if (p_oEvent.cmd === "get_room_name") {
		var _sRoomName = p_oEvent.params.getUtfString("room_name");
		sendRequestJoinRoom(_sRoomName);
	}
	else if (p_oEvent.cmd === "get_phone_number") {
		g_sPhoneNumber = p_oEvent.params.getUtfString("phone_number");
		$("#telesale-phone-number").text(g_sPhoneNumber);
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
	$("#login-password").attr("type", $("#toggle-password").prop('checked') === true ? "text" : "password");
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

// Telesale actions
function onAdminSearchUserButtonClick() {
	var _sUserName = $("#admin-search-user").val();
	var _oRequestParams = new SFS2X.SFSObject()
	_oRequestParams.putUtfString("user_name", _sUserName);
	g_oSFS.send(new SFS2X.ExtensionRequest("lobby.admin_search_user", _oRequestParams, g_oCurrentRoom));
}

function sendRequestGetInfo() {
	var username = localStorage.getItem("login_username") === undefined ? "" : localStorage.getItem("login_username");
	var _oRequestParams = new SFS2X.SFSObject()
	_oRequestParams.putUtfString("email", username);
	g_oSFS.send(new SFS2X.ExtensionRequest("zone.owner_info", _oRequestParams, null));
}

function setRequestGetRoomName() {
	var _oRequestParams = new SFS2X.SFSObject()
	_oRequestParams.putInt("owner_id", g_oUserData.getInt("owner"));
	g_oSFS.send(new SFS2X.ExtensionRequest("zone.get_room_name", _oRequestParams, null));
}

function sendRequestJoinRoom(p_sRoomName) {
	g_oSFS.send(new SFS2X.JoinRoomRequest(p_sRoomName));
}

function onTelesaleCallButtonClick() {
	window.open('tel:' + g_sPhoneNumber + '');
	$('#telesale-call-result').modal('show');
}

function onTelesaleCallResultCareClick() {
	$('#telesale-call-result-note').modal('show');
}

function onTelesaleCallResult(p_nResult) {
	var _sNote = "";
	$('#telesale-call-result').modal('hide');
	if (p_nResult == 1) {
			_sNote = $("#telesale-note").val();
			$('#telesale-call-result-note').modal('hide');
	}
	var _oRequestParams = new SFS2X.SFSObject()
	_oRequestParams.putUtfString("customer", g_sPhoneNumber);
	_oRequestParams.putInt("result", p_nResult);
	_oRequestParams.putUtfString("note", _sNote);

	g_oSFS.send(new SFS2X.ExtensionRequest("telesale.call_result", _oRequestParams, g_oCurrentRoom));
}

// others
function loadLocalStorage() {
	var server = localStorage.getItem("server") === undefined ? "34.87.73.198" : localStorage.getItem("server");
	var port = localStorage.getItem("port") === undefined ? "8080" : localStorage.getItem("port");
	$("#server").val(server);
	$("#port").val(port);

	var username = localStorage.getItem("login_username") === undefined ? "" : localStorage.getItem("login_username");
	var password = localStorage.getItem("login_password") === undefined ? "" : localStorage.getItem("login_password");
	$("#login-username").val(username);
	$("#login-password").val(password);
}

function showSinglePanel(panel) {
	if (panel.is(":hidden") === false) {
		return;
	}
	$("#panel-connect").hide();
	$("#panel-login").hide();
	$("#panel-telesale").hide();
	panel.fadeIn(300);
}