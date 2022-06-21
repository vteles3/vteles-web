var loading = new Loading();
var connector = new Connector();

document.addEventListener("DOMContentLoaded", function() {
	autoConnectToServer();
});

function autoConnectToServer() {
	
}

function onConnectBtClick() {
	var serverAddress = document.getElementById("server_address").value;
	var serverPort = Number(document.getElementById("server_port").value);
	connector.initConnector(serverAddress, serverPort);
	loading.addLoading("connecting");
}

function onConnectionSuccessed() {
	loading.removeLoading("connecting");
};

function onConnectionFailed() {
	loading.removeLoading("connecting");
};
