var g_oSFS = null;
var g_oUserData = null;
var g_oCurrentRoom = null;

// admin

// director

// leader
var g_arListSale = null;

// sale
var g_nDeletingTelesale = -1;
var g_nUpdatingTelesale = -1;
var g_nParentViewingFolder = 0;
var g_nViewingFolder = 0;
var g_nRenamingDatasheet = -1;
var g_nDeletingDatasheet = -1;
var g_nRenamingProject = -1;
var g_arViewingDatasheet = [];
var g_arUploadingDatasheet = [];

// other
var g_arViettel = [ "032", "033", "034", "035", "036", "037", "038", "039", "086", "096", "097", "098" ];
var g_arVinaphone = [ "088", "091", "094", "081", "082", "083", "084", "085" ];
var g_arMobiphone = [ "089", "090", "093", "070", "076", "077", "078", "079" ];

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
	if (position === 0) {
		showSinglePanel($("#panel-admin"));
		showSingleSidePanelAdmin($("#tab-admin-home-page"), $("#side-panel-admin-home-page"));
		$("#admin-name").text("Xin chào, " + g_oUserData.getUtfString("name"));
	}
	else if (position === 1) {
		showSinglePanel($("#panel-director"));
	}
	else if (position === 2) {
		showSinglePanel($("#panel-leader"));
		showSingleSidePanelLeader($("#tab-leader-home-page"), $("#side-panel-leader-home-page"));
		$("#leader-name").text("Xin chào, " + g_oUserData.getUtfString("name"));
	}
	else if (position === 3) {
		showSinglePanel($("#panel-sale"));
		showSingleSidePanelSale($("#tab-sale-telesale-manager"), $("#side-panel-sale-telesale-manager"));
		$("#sale-name").text("Xin chào, " + g_oUserData.getUtfString("name"));
		loadTelesaleManagerTable();
		onSaleOpenFolderButtonClick();
		loadProjectManagerTable();
	}
	else if (position === 4) {
		showSinglePanel($("#panel-telesale"));
		$("#telesale-name").text("Xin chào, " + g_oUserData.getUtfString("name"));
	}
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
}
 
function onRoomJoinError(p_oEvent) {
	
}

function onExtensionResponse(p_oEvent) {
	if (p_oEvent.cmd === "update_password") {
		var _bSuccessed = p_oEvent.params.getBool("successed");
		if (_bSuccessed === true) {
			alert("Thay đổi mật khẩu thành công!");
		}
		else {
			alert("Thay đổi mật khẩu KHÔNG thành công! Vui lòng kiểm tra lại.");
		}
	}
	else if (p_oEvent.cmd === "admin_search_user") {
		var _oUserData = p_oEvent.params.getSFSObject("user_data");
		if (_oUserData === null) {
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
			$("#admin-search-user-deleted").text(_oUserData.getInt("deleted") === 0 ? "Chưa bị xóa" : "Đã bị xóa");
			if (_oUserData.getInt("deleted") === 0) {
				$("#admin-delete-user").show();
				$("#admin-restore-user").hide();
			}
			else {
				$("#admin-delete-user").hide();
				$("#admin-restore-user").show();
			}
		}
	}
	else if (p_oEvent.cmd === "admin_create_leader") {
		var _bSuccessed = p_oEvent.params.getBool("successed");
		if (_bSuccessed === true) {
			alert("Tạo tài khoản Trưởng phòng thành công!");
		}
		else {
			alert("Tạo tài khoản Trưởng phòng KHÔNG thành công! Tên đăng nhập có thể đã được sử dụng.");
		}
	}
	else if (p_oEvent.cmd === "admin_reset_password_user") {
		var _bSuccessed = p_oEvent.params.getBool("successed");
		if (_bSuccessed === true) {
			alert("Mật khẩu đã được reset thành 'vhomes'!");
		}
		else {
			alert("Reset mật khẩu không thành công!");
		}
	}
	else if (p_oEvent.cmd === "leader_get_data") {
		var _arListSale = p_oEvent.params.getSFSArray("list_sale");
		$("#leader-data-table > tbody").empty();
		for (let i = 0; i < _arListSale.size(); i++) {
			var _oSale = _arListSale.getSFSObject(i);
			var _sSale = '<tr class=\"info\"><td>' + _oSale.getUtfString("name") + '</td><td>Doe</td><td>john@example.com</td></tr>';
			$('#leader-data-table > tbody').append(_sSale);
		}
	}
	else if (p_oEvent.cmd === "leader_create_sale") {
		var _bSuccessed = p_oEvent.params.getBool("successed");
		if (_bSuccessed === true) {
			alert("Tạo tài khoản mới thành công!");
		}
		else {
			alert("Tạo tài khoản mới KHÔNG thành công! Tên đăng nhập đã được sủ dụng, vui lòng dùng tên khác.");
		}
	}
	else if (p_oEvent.cmd === "sale_create_telesale") {
		var _bSuccessed = p_oEvent.params.getBool("successed");
		if (_bSuccessed === true) {
			$('#sale-create-telesale-modal').modal('hide');
			g_oUserData = p_oEvent.params.getSFSObject("sale_data");
			loadTelesaleManagerTable();
			alert("Tạo tài khoản mới thành công!");
		}
		else {
			alert("Tạo tài khoản mới KHÔNG thành công! Tên đăng nhập đã được sủ dụng, vui lòng dùng tên khác.");
		}
	}
	else if (p_oEvent.cmd === "sale_delete_telesale") {
		var _bSuccessed = p_oEvent.params.getBool("successed");
		if (_bSuccessed === true) {
			$('#sale-delete-telesale-modal').modal('hide');
			g_oUserData = p_oEvent.params.getSFSObject("sale_data");
			loadTelesaleManagerTable();
			alert("Xóa tài khoản thành công!");
		}
		else {
			alert("Xóa tài khoản KHÔNG thành công! Vui lòng liên hệ admin.");
		}
	}
	else if (p_oEvent.cmd === "sale_update_telesale_project") {
		var _bSuccessed = p_oEvent.params.getBool("successed");
		if (_bSuccessed === true) {
			$('#sale-update-telesale-project-modal').modal('hide');
			g_oUserData = p_oEvent.params.getSFSObject("sale_data");
			loadTelesaleManagerTable();
			alert("Cập nhật Dự án thành công!");
		}
		else {
			alert("Cập nhật Dự án KHÔNG thành công!");
		}
	}
	else if (p_oEvent.cmd === "sale_update_telesale_datasheet") {
		var _bSuccessed = p_oEvent.params.getBool("successed");
		if (_bSuccessed === true) {
			$('#sale-update-telesale-datasheet-modal').modal('hide');
			g_oUserData = p_oEvent.params.getSFSObject("sale_data");
			loadTelesaleManagerTable();
			alert("Cập nhật Data thành công!");
		}
		else {
			alert("Cập nhật Data KHÔNG thành công!");
		}
	}
	else if (p_oEvent.cmd === "sale_create_folder") {
		var _bSuccessed = p_oEvent.params.getBool("successed");
		if (_bSuccessed === true) {
			$('#sale-create-folder-modal').modal('hide');
			g_oUserData = p_oEvent.params.getSFSObject("sale_data");
			onSaleOpenFolderButtonClick();
			alert("Tạo thư mục thành công!");
		}
		else {
			alert("Tạo thư mục KHÔNG thành công!");
		}
	}
	else if (p_oEvent.cmd === "sale_create_datasheet") {
		var _bSuccessed = p_oEvent.params.getBool("successed");
		if (_bSuccessed === true) {
			$('#sale-create-datasheet-modal').modal('hide');
			g_oUserData = p_oEvent.params.getSFSObject("sale_data");
			onSaleOpenFolderButtonClick();
			alert("Tạo data thành công!");
		}
		else {
			alert("Tạo data KHÔNG thành công!");
		}
	}
	else if (p_oEvent.cmd === "sale_rename_datasheet") {
		var _bSuccessed = p_oEvent.params.getBool("successed");
		if (_bSuccessed === true) {
			$('#sale-rename-datasheet-modal').modal('hide');
			g_oUserData = p_oEvent.params.getSFSObject("sale_data");
			onSaleOpenFolderButtonClick();
			alert("Đổi tên thành công!");
		}
		else {
			alert("Đổi tên KHÔNG thành công!");
		}
	}
	else if (p_oEvent.cmd === "sale_delete_datasheet") {
		var _bSuccessed = p_oEvent.params.getBool("successed");
		if (_bSuccessed === true) {
			$('#sale-delete-datasheet-modal').modal('hide');
			g_oUserData = p_oEvent.params.getSFSObject("sale_data");
			onSaleOpenFolderButtonClick();
			alert("Xóa thành công!");
		}
		else {
			alert("Xóa KHÔNG thành công!");
		}
	}
	else if (p_oEvent.cmd === "sale_open_datasheet") {
		g_arViewingDatasheet = [];
		var _arViewingDatasheet = p_oEvent.params.getSFSArray("customer");
		for (let i = 0; i < _arViewingDatasheet.size(); i++) {
			g_arViewingDatasheet.push(_arViewingDatasheet.getSFSObject(i).getUtfString("customer"));
		}
		
		var _nAmout = g_arViewingDatasheet.length;
		var _nViettel = 0;
		var _nVinaphone = 0;
		var _nMobiphone = 0;
		for (let i = 0; i < g_arViewingDatasheet.length; i++) {
			var _sHead = g_arViewingDatasheet[i].substring(0, 3);
			if (g_arViettel.includes(_sHead) === true) {
				_nViettel++;
			}
			if (g_arVinaphone.includes(_sHead) === true) {
				_nVinaphone++;
			}
			if (g_arMobiphone.includes(_sHead) === true) {
				_nMobiphone++;
			}
		}
		var _nOther = _nAmout - _nViettel - _nVinaphone - _nMobiphone;

		$('#sale-datasheet-manager-amount').text(_nAmout);
		$('#sale-datasheet-manager-viettel').text(_nViettel);
		$('#sale-datasheet-manager-vinaphone').text(_nVinaphone);
		$('#sale-datasheet-manager-mobiphone').text(_nMobiphone);
		$('#sale-datasheet-manager-other').text(_nOther);

		$('#sale-datasheet-manager').show();
		$('#sale-data-manager-table').hide();
		$('#sale-create-data-controller').hide();
	}
	else if (p_oEvent.cmd === "sale_upload_datasheet") {
		var _bSuccessed = p_oEvent.params.getBool("successed");
		if (_bSuccessed === true) {
			$('#sale-upload-datasheet-modal').modal('hide');
			g_oUserData = p_oEvent.params.getSFSObject("sale_data");
			onSaleOpenFolderButtonClick();
			loadTelesaleManagerTable();
			alert("Tải lên thành công!");
		}
		else {
			alert("Tải lên KHÔNG thành công!");
		}
	}
	else if (p_oEvent.cmd === "sale_create_project") {
		var _bSuccessed = p_oEvent.params.getBool("successed");
		if (_bSuccessed === true) {
			$('#sale-create-project-modal').modal('hide');
			g_oUserData = p_oEvent.params.getSFSObject("sale_data");
			loadProjectManagerTable();
			alert("Tạo Dự án mới thành công!");
		}
		else {
			alert("Tạo Dự án mới KHÔNG thành công!");
		}
	}
	else if (p_oEvent.cmd === "sale_rename_project") {
		var _bSuccessed = p_oEvent.params.getBool("successed");
		if (_bSuccessed === true) {
			$('#sale-rename-project-modal').modal('hide');
			g_oUserData = p_oEvent.params.getSFSObject("sale_data");
			loadProjectManagerTable();
			alert("Đổi tên thành công!");
		}
		else {
			alert("Đổi tên KHÔNG thành công!");
		}
	}
}

//====================================================================================================
//====================================================================================================
// functions
function onSaleDeleteTelesaleClick(p_nTelesale) {
	g_nDeletingTelesale = p_nTelesale;
	$("#sale-delete-telesale-modal").modal('show');
}

function onClickUpdateTelesaleProject(p_nTelesale) {
	g_nUpdatingTelesale = p_nTelesale;
	$("#sale-update-telesale-project-modal").modal('show');
	$("#sale-update-telesale-project").val('');
}

function onClickUpdateTelesaleDatasheet(p_nTelesale) {
	g_nUpdatingTelesale = p_nTelesale;
	$("#sale-update-telesale-datasheet-modal").modal('show');
	$("#sale-update-telesale-datasheet").val('');
}

function loadTelesaleManagerTable() {
	var _arListTelesale = g_oUserData.getSFSArray("list_telesale");
	$("#sale-telesale-manager-table > tbody").empty();
	for (let i = 0; i < _arListTelesale.size(); i++) {
		var _oTelesale = _arListTelesale.getSFSObject(i);
		var _nID = _oTelesale.getInt("id");
		var _sName = _oTelesale.getUtfString("name");
		var _sUserName = _oTelesale.getUtfString("user_name");
		var _nNumberPhoneNumber = _oTelesale.getInt("number_phone_number");
		var _nProject = _oTelesale.getInt("project");
		var _sProject = "Chưa chọn";
		if (_nProject !== 0) {
			_sProject = saleGetProjectName(_nProject);
		}
		var _nDatasheet = _oTelesale.getInt("datasheet");
		var _sDatasheet = "Chưa chọn";
		if (_nDatasheet !== 0) {
			_sDatasheet = saleGetDatasheetName(_nDatasheet);
		}
		var _nNetwork = _oTelesale.getInt("network");
		var _arNetwork = [ "Tất cả", "Viettel", "Vinaphone", "Mobiphone" ];
		var _sNetwork = _arNetwork[_nNetwork];
		var _sTelesale =
			'<tr>' +
				'<td>' + _sName + '</br>' + '<h6>' + _sUserName + '</h6>' + '</td>' +
				'<td>' + _nNumberPhoneNumber + '</td>' +
				'<td onclick="onClickUpdateTelesaleProject(' + _nID + ')">' + _sProject + '</td>' +
				'<td onclick="onClickUpdateTelesaleDatasheet(' + _nID + ')">' + _sDatasheet + '</td>' +
				'<td>' + _sNetwork + '</td>' +
				'<td>Chưa gọi lần nào</td>' +
				'<td>' +
					'<button type="button" class="btn btn-danger btn-xs" onclick="onSaleDeleteTelesaleClick(' + _nID + ')">' +
						'<span class="glyphicon glyphicon-trash"></span>' +
					'</button>' +
				'</td>' +
			'</tr>';
		$('#sale-telesale-manager-table > tbody').append(_sTelesale);
	}
}

function loadProjectManagerTable() {
	var _arListProject = g_oUserData.getSFSArray("list_project");
	$("#sale-project-manager-table > tbody").empty();
	for (let i = 0; i < _arListProject.size(); i++) {
		var _oProject = _arListProject.getSFSObject(i);
		var _nID = _oProject.getInt("id");
		var _sName = _oProject.getUtfString("name");
		var _sProject =
			'<tr>' +
				'<td>' +
					'<span class="glyphicon glyphicon-hand-right" style="margin-right: 7px;"></span>' + _sName + ' (Mã Dự án: ' + _nID + ')' +
				'</td>' +
				'<td class="text-right">' +
					'<button type="button" class="btn btn-primary btn-xs" style="margin-right: 5px;" onclick="onRenameProjectClick(' + _nID + ')">' +
						'<span class="glyphicon glyphicon-pencil"></span>' +
					'</button>' +
				'</td>' +
			'</tr>';
			$('#sale-project-manager-table > tbody').append(_sProject);
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

function onToggleAdminUpdatePasswordClick() {
	$("#admin-update-password-old").attr("type", $("#admin-toggle-update-password").prop('checked') === true ? "text" : "password");
	$("#admin-update-password-new").attr("type", $("#admin-toggle-update-password").prop('checked') === true ? "text" : "password");
	$("#admin-update-password-new-repeat").attr("type", $("#admin-toggle-update-password").prop('checked') === true ? "text" : "password");
}

function onToggleLeaderUpdatePasswordClick() {
	$("#leader-update-password-old").attr("type", $("#leader-toggle-update-password").prop('checked') === true ? "text" : "password");
	$("#leader-update-password-new").attr("type", $("#leader-toggle-update-password").prop('checked') === true ? "text" : "password");
	$("#leader-update-password-new-repeat").attr("type", $("#leader-toggle-update-password").prop('checked') === true ? "text" : "password");
}

function onToggleSaleUpdatePasswordClick() {
	$("#sale-update-password-old").attr("type", $("#sale-toggle-update-password").prop('checked') === true ? "text" : "password");
	$("#sale-update-password-new").attr("type", $("#sale-toggle-update-password").prop('checked') === true ? "text" : "password");
	$("#sale-update-password-new-repeat").attr("type", $("#sale-toggle-update-password").prop('checked') === true ? "text" : "password");
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

function onAdminCreateLeaderButtonClick() {
	var _nLocation = $('#admin-create-leader-location').prop('selectedIndex')
	var _nRoom = $('#admin-create-leader-room').prop('selectedIndex')
	var _nGroup = $('#admin-create-leader-group').prop('selectedIndex')
	var _sUserName = $("#admin-create-leader-username").val();
	var _sName = $("#admin-create-leader-name").val();
	if (_nLocation === 0) {
		alert("Bạn chưa chọn chi nhánh!");
		return;
	}
	if (_nRoom === 0) {
		alert("Bạn chưa chọn phòng!");
		return;
	}
	if (_nGroup === 0) {
		alert("Bạn chưa chọn khối!");
		return;
	}
	if (_sUserName === "") {
		alert("Bạn chưa nhập tên đăng nhập!");
		return;
	}
	if (_sName === "") {
		alert("Bạn chưa nhập tên hiển thị!");
		return;
	}
	var _oRequestParams = new SFS2X.SFSObject()
	_oRequestParams.putInt("location", _nLocation);
	_oRequestParams.putInt("room", _nRoom);
	_oRequestParams.putInt("group", _nGroup);
	_oRequestParams.putUtfString("user_name", _sUserName);
	_oRequestParams.putUtfString("name", _sName);
	g_oSFS.send(new SFS2X.ExtensionRequest("lobby.admin_create_leader", _oRequestParams, g_oCurrentRoom));
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
		return;
	}
	var _sHashOldPassword = CryptoJS.MD5(_sOldPassword).toString();
	var _sHashNewPassword = CryptoJS.MD5(_sNewPassword).toString();
	var _oRequestParams = new SFS2X.SFSObject()
	_oRequestParams.putInt("id", g_oUserData.getInt("id"));
	_oRequestParams.putUtfString("old_password", _sHashOldPassword);
	_oRequestParams.putUtfString("new_password", _sHashNewPassword);
	g_oSFS.send(new SFS2X.ExtensionRequest("zone.update_password", _oRequestParams, null));
}

//==========
//==========
// leader

function onLeaderHomePageTabClick() {
	showSingleSidePanelLeader($("#tab-leader-home-page"), $("#side-panel-leader-home-page"));
}

function onLeaderCreateSaleTabClick() {
	showSingleSidePanelLeader($("#tab-leader-create-sale"), $("#side-panel-leader-create-sale"));
}

function onLeaderChangePasswordTabClick() {
	showSingleSidePanelLeader($("#tab-leader-change-password"), $("#side-panel-leader-change-password"));
}

function onLeaderGetDataButtonClick() {
	try {
		var _oFrom = moment($('#leader-get-data-from').val(), "DD-MM-YYYY").toDate();
		var _oTo = moment($('#leader-get-data-to').val(), "DD-MM-YYYY").toDate();
		var _sFrom = _oFrom.getFullYear() + "-" + (_oFrom.getMonth() + 1) + "-" + _oFrom.getDate() + " 00:00:00";
		var _sTo = _oTo.getFullYear() + "-" + (_oTo.getMonth() + 1) + "-" + _oTo.getDate() + " 23:59:59";
		var _oRequestParams = new SFS2X.SFSObject()
		_oRequestParams.putUtfString("from", _sFrom);
		_oRequestParams.putUtfString("to", _sTo);
		g_oSFS.send(new SFS2X.ExtensionRequest("telesale.leader_get_data", _oRequestParams, g_oCurrentRoom));
	}
	catch (p_oError) {
		alert("Lỗi nhập ngày truy xuất dữ liệu!");
	}
}

function onLeaderCreateSaleButtonClick() {
	var _sUserName = $("#leader-create-sale-username").val();
	var _sName = $("#leader-create-sale-name").val();
	var _oRequestParams = new SFS2X.SFSObject()
	_oRequestParams.putUtfString("user_name", _sUserName);
	_oRequestParams.putUtfString("name", _sName);
	g_oSFS.send(new SFS2X.ExtensionRequest("telesale.leader_create_sale", _oRequestParams, g_oCurrentRoom));

}

function onLeaderUpdatePasswordButtonClick() {
	var _sOldPassword = $("#leader-update-password-old").val();
	var _sNewPassword = $("#leader-update-password-new").val();
	var _sNewPasswordRepeat = $("#leader-update-password-new-repeat").val();
	if (_sNewPassword !== _sNewPasswordRepeat) {
		alert("Nhập lại mật khẩu chưa chính xác!");
		return;
	}
	var _sHashOldPassword = CryptoJS.MD5(_sOldPassword).toString();
	var _sHashNewPassword = CryptoJS.MD5(_sNewPassword).toString();
	var _oRequestParams = new SFS2X.SFSObject()
	_oRequestParams.putInt("id", g_oUserData.getInt("id"));
	_oRequestParams.putUtfString("old_password", _sHashOldPassword);
	_oRequestParams.putUtfString("new_password", _sHashNewPassword);
	g_oSFS.send(new SFS2X.ExtensionRequest("zone.update_password", _oRequestParams, null));
}

//==========
//==========
// sale
function onSaleTelesaleManagerTabClick() {
	showSingleSidePanelSale($("#tab-sale-telesale-manager"), $("#side-panel-sale-telesale-manager"));
}

function onSaleDataManagerTabClick() {
	showSingleSidePanelSale($("#tab-sale-data-manager"), $("#side-panel-sale-data-manager"));
}

function onSaleProjectManagerTabClick() {
	showSingleSidePanelSale($("#tab-sale-project-manager"), $("#side-panel-sale-project-manager"));
}

function onSaleChangePasswordTabClick() {
	showSingleSidePanelSale($("#tab-sale-change-password"), $("#side-panel-sale-change-password"));
}

function onSaleCreateTelesaleButtonClick() {
	var _sUserName = $("#sale-create-telesale-username").val();
	var _sName = $("#sale-create-telesale-name").val();
	if (_sUserName === "") {
		alert("Bạn chưa nhập Tên đăng nhập");
		return;
	}
	if (_sUserName === "") {
		alert("Bạn chưa nhập Tên nhân viên");
		return;
	}
	var _oRequestParams = new SFS2X.SFSObject()
	_oRequestParams.putInt("owner", g_oUserData.getInt("id"));
	_oRequestParams.putUtfString("user_name", _sUserName);
	_oRequestParams.putUtfString("name", _sName);
	g_oSFS.send(new SFS2X.ExtensionRequest("telesale.sale_create_telesale", _oRequestParams, g_oCurrentRoom));
}

function onSaleDeleteTelesaleButtonClick() {
	var _oRequestParams = new SFS2X.SFSObject()
	_oRequestParams.putInt("owner", g_oUserData.getInt("id"));
	_oRequestParams.putInt("telesale", g_nDeletingTelesale);
	g_oSFS.send(new SFS2X.ExtensionRequest("telesale.sale_delete_telesale", _oRequestParams, g_oCurrentRoom));
}

function onSaleUpdateTelesaleProjectButtonClick() {
	var _sProject = $("#sale-update-telesale-project").val();
	var _nProject = parseInt(_sProject);
	var _bExisted = isProjectExisted(_nProject);
	if (_bExisted === false) {
		alert("Bạn không có mã Dự án này, vui lòng kiểm tra lại.");
		return;
	}
	var _oRequestParams = new SFS2X.SFSObject()
	_oRequestParams.putInt("owner", g_oUserData.getInt("id"));
	_oRequestParams.putInt("telesale", g_nUpdatingTelesale);
	_oRequestParams.putInt("project", _nProject);
	g_oSFS.send(new SFS2X.ExtensionRequest("telesale.sale_update_telesale_project", _oRequestParams, g_oCurrentRoom));
}

function onSaleUpdateTelesaleDatasheetButtonClick() {
	var _sDatasheet = $("#sale-update-telesale-datasheet").val();
	var _nDatasheet = parseInt(_sDatasheet);
	var _bExisted = isDatasheetExisted(_nDatasheet);
	if (_bExisted === false) {
		alert("Bạn không có mã Data này, vui lòng kiểm tra lại.");
		return;
	}
	var _oRequestParams = new SFS2X.SFSObject()
	_oRequestParams.putInt("owner", g_oUserData.getInt("id"));
	_oRequestParams.putInt("telesale", g_nUpdatingTelesale);
	_oRequestParams.putInt("datasheet", _nDatasheet);
	g_oSFS.send(new SFS2X.ExtensionRequest("telesale.sale_update_telesale_datasheet", _oRequestParams, g_oCurrentRoom));
}

function onSaleOpenFolderButtonClick() {
	$("#sale-data-manager-table > tbody").empty();
	var _arListDatasheet = g_oUserData.getSFSArray("list_datasheet");
	for (let i = 0; i < _arListDatasheet.size(); i++) {
		var _oDatasheet = _arListDatasheet.getSFSObject(i);
		var _nParent = _oDatasheet.getInt("parent");
		if (_nParent === g_nViewingFolder) {
			var _nID = _oDatasheet.getInt("id");
			var _nIsFolder = _oDatasheet.getInt("is_folder");
			var _sName = _oDatasheet.getUtfString("name");
			var _sDatasheet = '';
			if (_nIsFolder === 0) {
				_sDatasheet +=
					'<tr>' +
						'<td onclick="onDatasheetClick(' + _nID + ',\'' + _sName + '\')">' +
							'<span class="glyphicon glyphicon-file" style="margin-right: 7px;"></span>' + _sName + ' (Mã data: ' + _nID + ')' +
						'</td>';
			}
			else {
				_sDatasheet +=
					'<tr>' +
						'<td onclick="onFolderClick(' + _nID + ',\'' + _sName + '\')">' +
							'<span class="glyphicon glyphicon-folder-open" style="color:red;margin-right: 7px;"></span>' + _sName +
						'</td>';
			}
			_sDatasheet +=
				'<td class="text-right">' +
					'<button type="button" class="btn btn-primary btn-xs" style="margin-right: 5px;" onclick="onRenameDatasheetClick(' + _nID + ')">' +
						'<span class="glyphicon glyphicon-pencil"></span>' +
					'</button>' +
					'<button type="button" class="btn btn-danger btn-xs" onclick="onDeleteDatasheetClick(' + _nID + ')">' +
						'<span class="glyphicon glyphicon-trash"></span>' +
					'</button>' +
				'</td>' +
			'</tr>';
			$('#sale-data-manager-table > tbody').append(_sDatasheet);
		}
	}
}

function onFolderClick(p_nID, p_sName) {
	g_nViewingFolder = p_nID;
	$("#sale-data-manager-back-button").text(p_sName);
	onSaleOpenFolderButtonClick();
}

function onOpenParentFolder() {
	if (g_nViewingFolder === 0) {
		return;
	}
	$('#sale-datasheet-manager').hide();
	$('#sale-data-manager-table').show();
	$('#sale-create-data-controller').show();
	var _nID = saleGetDatasheetParentID(g_nViewingFolder);
	var _sName = saleGetDatasheetName(_nID);
	g_nViewingFolder = _nID;
	$("#sale-data-manager-back-button").text(_sName);
	onSaleOpenFolderButtonClick();
}

function onDatasheetClick(p_nID, p_sName) {
	g_nViewingFolder = p_nID;
	$("#sale-data-manager-back-button").text(p_sName);
	$('#sale-datasheet-manager-id').text("Mã data: " + p_nID);

	var _oRequestParams = new SFS2X.SFSObject()
	_oRequestParams.putInt("datasheet", p_nID);
	g_oSFS.send(new SFS2X.ExtensionRequest("telesale.sale_open_datasheet", _oRequestParams, g_oCurrentRoom));
}

function onSaleCreateFolderButtonClick() {
	var _sFolderName = $("#sale-create-folder-name").val();
	var _oRequestParams = new SFS2X.SFSObject()
	_oRequestParams.putInt("parent", g_nViewingFolder);
	_oRequestParams.putInt("owner", g_oUserData.getInt("id"));
	_oRequestParams.putUtfString("name", _sFolderName);
	g_oSFS.send(new SFS2X.ExtensionRequest("telesale.sale_create_folder", _oRequestParams, g_oCurrentRoom));
}

function onSaleCreateDatasheetButtonClick() {
	var _sDatasheetName = $("#sale-create-datasheet-name").val();
	var _oRequestParams = new SFS2X.SFSObject()
	_oRequestParams.putInt("parent", g_nViewingFolder);
	_oRequestParams.putInt("owner", g_oUserData.getInt("id"));
	_oRequestParams.putUtfString("name", _sDatasheetName);
	g_oSFS.send(new SFS2X.ExtensionRequest("telesale.sale_create_datasheet", _oRequestParams, g_oCurrentRoom));
}

function onRenameDatasheetClick(p_nDatasheetID) {
	g_nRenamingDatasheet = p_nDatasheetID;
	$('#sale-rename-datasheet-modal').modal('show');
}

function onSaleRenameDatasheetButtonClick() {
	var _sNewName = $("#sale-rename-datasheet-name").val();
	if (_sNewName === "") {
		alert("Bạn chưa nhập tên mới!");
		return;
	}
	$("#sale-rename-datasheet-name").val("");
	var _oRequestParams = new SFS2X.SFSObject()
	_oRequestParams.putInt("datasheet", g_nRenamingDatasheet);
	_oRequestParams.putUtfString("name", _sNewName);
	_oRequestParams.putInt("owner", g_oUserData.getInt("id"));
	g_oSFS.send(new SFS2X.ExtensionRequest("telesale.sale_rename_datasheet", _oRequestParams, g_oCurrentRoom));
}

function onDeleteDatasheetClick(p_nDatasheetID) {
	g_nDeletingDatasheet = p_nDatasheetID;
	$('#sale-delete-datasheet-modal').modal('show');
}

function onSaleDeleteDatasheetButtonClick() {
	var _oRequestParams = new SFS2X.SFSObject()
	_oRequestParams.putInt("datasheet", g_nDeletingDatasheet);
	_oRequestParams.putInt("owner", g_oUserData.getInt("id"));
	g_oSFS.send(new SFS2X.ExtensionRequest("telesale.sale_delete_datasheet", _oRequestParams, g_oCurrentRoom));
}

function onSaleUploadDataButtonClick() {
	g_arUploadingDatasheet = [];
	navigator.clipboard.readText().then((_sClipboard) => {
		var _arListPhoneNumber = _sClipboard.split(/\r?\n/);
		for (let i = 0; i < _arListPhoneNumber.length; i++) {
			var _sPhoneNumber = _arListPhoneNumber[i];
			var _sCorrectedPhoneNumber = correctPhoneNumber(_sPhoneNumber);
			if (_sCorrectedPhoneNumber !== "") {
				if (g_arViewingDatasheet.includes(_sCorrectedPhoneNumber) === false) {
					if (g_arUploadingDatasheet.includes(_sCorrectedPhoneNumber) === false) {
						g_arUploadingDatasheet.push(_sCorrectedPhoneNumber);
					}
				}
			}
		}
		if (g_arUploadingDatasheet.length === 0) {
			alert("Bạn chưa Copy sđt cần tải lên hoặc tất cả sđt đã có trong Data này!");
		}
		else if (g_arViewingDatasheet.length + g_arUploadingDatasheet.length > 5000) {
			alert("Data không thể chứa quá 5000 sđt!");
		}
		else {
			$('#sale-upload-datasheet-content').text("Xác nhận tải lên " + g_arUploadingDatasheet.length + " sđt mới?");
			$('#sale-upload-datasheet-modal').modal('show');
		}
	});
}

function onSaleUploadDatasheetButtonClick() {
	var _arCustomer = new SFS2X.SFSArray();
	for (let i = 0; i < g_arUploadingDatasheet.length; i++) {
		_arCustomer.addUtfString(g_arUploadingDatasheet[i]);
	}
	var _oRequestParams = new SFS2X.SFSObject();
	_oRequestParams.putSFSArray("customer", _arCustomer);
	_oRequestParams.putInt("datasheet", g_nViewingFolder);
	_oRequestParams.putInt("owner", g_oUserData.getInt("id"));
	g_oSFS.send(new SFS2X.ExtensionRequest("telesale.sale_upload_datasheet", _oRequestParams, g_oCurrentRoom));
}

function onSaleUpdatePasswordButtonClick() {
	var _sOldPassword = $("#sale-update-password-old").val();
	var _sNewPassword = $("#sale-update-password-new").val();
	var _sNewPasswordRepeat = $("#sale-update-password-new-repeat").val();
	if (_sNewPassword !== _sNewPasswordRepeat) {
		alert("Nhập lại mật khẩu chưa chính xác!");
		return;
	}
	var _sHashOldPassword = CryptoJS.MD5(_sOldPassword).toString();
	var _sHashNewPassword = CryptoJS.MD5(_sNewPassword).toString();
	var _oRequestParams = new SFS2X.SFSObject()
	_oRequestParams.putInt("id", g_oUserData.getInt("id"));
	_oRequestParams.putUtfString("old_password", _sHashOldPassword);
	_oRequestParams.putUtfString("new_password", _sHashNewPassword);
	g_oSFS.send(new SFS2X.ExtensionRequest("zone.update_password", _oRequestParams, null));
}

function onSaleCreateProjectButtonClick() {
	var _sProjectName = $("#sale-create-project-name").val();
	var _oRequestParams = new SFS2X.SFSObject()
	_oRequestParams.putInt("owner", g_oUserData.getInt("id"));
	_oRequestParams.putUtfString("name", _sProjectName);
	g_oSFS.send(new SFS2X.ExtensionRequest("telesale.sale_create_project", _oRequestParams, g_oCurrentRoom));
}

function onRenameProjectClick(p_nID) {
	g_nRenamingProject = p_nID;
	$('#sale-rename-project-modal').modal('show');
}

function onSaleRenameProjectButtonClick() {
	var _sNewName = $("#sale-rename-project-name").val();
	if (_sNewName === "") {
		alert("Bạn chưa nhập tên mới!");
		return;
	}
	$("#sale-rename-project-name").val("");
	var _oRequestParams = new SFS2X.SFSObject()
	_oRequestParams.putInt("project", g_nRenamingProject);
	_oRequestParams.putUtfString("name", _sNewName);
	_oRequestParams.putInt("owner", g_oUserData.getInt("id"));
	g_oSFS.send(new SFS2X.ExtensionRequest("telesale.sale_rename_project", _oRequestParams, g_oCurrentRoom));
}

//====================================================================================================
//====================================================================================================
// others

$(function() {
  $('#leader-get-data-from-picker').datetimepicker({
    format: 'DD-MM-YYYY',
	});
  $('#leader-get-data-to-picker').datetimepicker({
    format: 'DD-MM-YYYY'
	});
});

function loadLocalStorage() {
	var server = localStorage.getItem("server") === undefined ? "127.0.0.1" : localStorage.getItem("server");
	var port = localStorage.getItem("port") === undefined ? "8080" : localStorage.getItem("port");
	$("#server").val(server);
	$("#port").val(port);

	var username = localStorage.getItem("login_username") === undefined ? "" : localStorage.getItem("login_username");
	var password = localStorage.getItem("login_password") === undefined ? "" : localStorage.getItem("login_password");
	$("#login-username").val(username);
	$("#login-password").val(password);
}

function saleGetProjectName(p_nProject) {
	var _arListProject = g_oUserData.getSFSArray("list_project");
	for (let i = 0; i < _arListProject.size(); i++) {
		var _oProject = _arListProject.getSFSObject(i);
		var _nID = _oProject.getInt("id");
		if (_nID === p_nProject) {
			var _sName = _oProject.getUtfString("name");
			return _sName;
		}
	}
	return "Không tìm thấy";
}

function saleGetDatasheetName(p_nID) {
	var _arListDatasheet = g_oUserData.getSFSArray("list_datasheet");
	for (let i = 0; i < _arListDatasheet.size(); i++) {
		var _oDatasheet = _arListDatasheet.getSFSObject(i);
		var _nID = _oDatasheet.getInt("id");
		if (_nID === p_nID) {
			var _sName = _oDatasheet.getUtfString("name");
			return _sName;
		}
	}
	return "Không tìm thấy";
}

function isProjectExisted(p_nProject) {
	var _arListProject = g_oUserData.getSFSArray("list_project");
	for (let i = 0; i < _arListProject.size(); i++) {
		var _oProject = _arListProject.getSFSObject(i);
		var _nID = _oProject.getInt("id");
		if (_nID === p_nProject) {
			return true;
		}
	}
	return false;
}

function isDatasheetExisted(p_nDatasheet) {
	var _arListDatasheet = g_oUserData.getSFSArray("list_datasheet");
	for (let i = 0; i < _arListDatasheet.size(); i++) {
		var _oDatasheet = _arListDatasheet.getSFSObject(i);
		var _nID = _oDatasheet.getInt("id");
		if (_nID === p_nDatasheet) {
			return true;
		}
	}
	return false;
}

function saleGetDatasheetParentID(p_nID) {
	var _arListDatasheet = g_oUserData.getSFSArray("list_datasheet");
	for (let i = 0; i < _arListDatasheet.size(); i++) {
		var _oDatasheet = _arListDatasheet.getSFSObject(i);
		var _nID = _oDatasheet.getInt("id");
		if (_nID === p_nID) {
			var _nParentID = _oDatasheet.getInt("parent");
			return _nParentID;
		}
	}
	return 0;
}

function saleGetDatasheetName(p_nID) {
	var _arListDatasheet = g_oUserData.getSFSArray("list_datasheet");
	for (let i = 0; i < _arListDatasheet.size(); i++) {
		var _oDatasheet = _arListDatasheet.getSFSObject(i);
		var _nID = _oDatasheet.getInt("id");
		if (_nID === p_nID) {
			var _sName = _oDatasheet.getUtfString("name");
			return _sName;
		}
	}
	return "Thư mục gốc";
}

function correctPhoneNumber(p_sPhoneNumber) {
	var _arCorrectedPhoneNumber = p_sPhoneNumber.match(/(\d+)/);
	if (_arCorrectedPhoneNumber === null) {
		return "";
	}
	var _sCorrectedPhoneNumber = _arCorrectedPhoneNumber[0];
	if (_sCorrectedPhoneNumber.length < 9) {
			return "";
	}
	if (_sCorrectedPhoneNumber.substring(0, 2) === "84") {
		_sCorrectedPhoneNumber = "0" + _sCorrectedPhoneNumber.substring(2, 12);
	}
	if (_sCorrectedPhoneNumber.substring(0, 1) === "0") {
		if (_sCorrectedPhoneNumber.substring(0, 2) === "016") {
			_sCorrectedPhoneNumber = "03" + _sCorrectedPhoneNumber.substring(2, 9);
		}
		else {
			if (_sCorrectedPhoneNumber.substring(0, 4) === "0120") {
				_sCorrectedPhoneNumber = "07" + _sCorrectedPhoneNumber.substring(3, 11);
			}
			else if (_sCorrectedPhoneNumber.substring(0, 4) === "0121") {
				_sCorrectedPhoneNumber = "07" + _sCorrectedPhoneNumber.substring(3, 11);
			}
			else if (_sCorrectedPhoneNumber.substring(0, 4) === "0122") {
				_sCorrectedPhoneNumber = "07" + _sCorrectedPhoneNumber.substring(3, 11);
			}
			else if (_sCorrectedPhoneNumber.substring(0, 4) === "0126") {
				_sCorrectedPhoneNumber = "07" + _sCorrectedPhoneNumber.substring(3, 11);
			}
			else if (_sCorrectedPhoneNumber.substring(0, 4) === "0128") {
				_sCorrectedPhoneNumber = "07" + _sCorrectedPhoneNumber.substring(3, 11);
			}
			else if (_sCorrectedPhoneNumber.substring(0, 4) === "0123") {
				_sCorrectedPhoneNumber = "08" + _sCorrectedPhoneNumber.substring(3, 11);
			}
			else if (_sCorrectedPhoneNumber.substring(0, 4) === "0124") {
				_sCorrectedPhoneNumber = "08" + _sCorrectedPhoneNumber.substring(3, 11);
			}
			else if (_sCorrectedPhoneNumber.substring(0, 4) === "0125") {
				_sCorrectedPhoneNumber = "08" + _sCorrectedPhoneNumber.substring(3, 11);
			}
			else if (_sCorrectedPhoneNumber.substring(0, 4) === "0127") {
				_sCorrectedPhoneNumber = "08" + _sCorrectedPhoneNumber.substring(3, 11);
			}
			else if (_sCorrectedPhoneNumber.substring(0, 4) === "0129") {
				_sCorrectedPhoneNumber = "08" + _sCorrectedPhoneNumber.substring(3, 11);
			}
		}
	}
	if (_sCorrectedPhoneNumber.length !== 10) {
		_sCorrectedPhoneNumber = "";
	}
	return _sCorrectedPhoneNumber;
}

function showSinglePanel(panel) {
	if (panel.is(":hidden") === false) {
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
	if (sidePanel.is(":hidden") === false) {
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

function showSingleSidePanelLeader(tab, sidePanel) {
	if (sidePanel.is(":hidden") === false) {
		return;
	}
	$("#tab-leader-home-page").removeClass("active");
	$("#tab-leader-create-sale").removeClass("active");
	$("#tab-leader-change-password").removeClass("active");
	tab.addClass("active");
	$("#side-panel-leader-home-page").hide();
	$("#side-panel-leader-create-sale").hide();
	$("#side-panel-leader-change-password").hide();
	sidePanel.fadeIn(300);
}

function showSingleSidePanelSale(tab, sidePanel) {
	if (sidePanel.is(":hidden") === false) {
		return;
	}
	$("#tab-sale-telesale-manager").removeClass("active");
	$("#tab-sale-data-manager").removeClass("active");
	$("#tab-sale-project-manager").removeClass("active");
	$("#tab-sale-change-password").removeClass("active");
	tab.addClass("active");
	$("#side-panel-sale-telesale-manager").hide();
	$("#side-panel-sale-data-manager").hide();
	$("#side-panel-sale-project-manager").hide();
	$("#side-panel-sale-change-password").hide();
	sidePanel.fadeIn(300);
}