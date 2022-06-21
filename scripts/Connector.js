class Connector {
  constructor() {
    this.sfs = null;
  };

  initConnector(serverAddress, port) {
    var config = {};
    config.host = serverAddress;
    config.port = port;
    config.useSSL = port == 8443 ? true : false;
    config.zone = "BasicExamples";
  
    this.sfs = new SFS2X.SmartFox(config);
    
    this.sfs.addEventListener(SFS2X.SFSEvent.CONNECTION, this.onConnection, this);
    this.sfs.addEventListener(SFS2X.SFSEvent.CONNECTION_LOST, this.onConnectionLost, this);
  
    this.sfs.connect();
  };

  resetConnector() {
    this.sfs.removeEventListener(SFS2X.SFSEvent.CONNECTION, this.onConnection);
    this.sfs.removeEventListener(SFS2X.SFSEvent.CONNECTION_LOST, this.onConnectionLost);

    this.sfs = null;
  };

  onConnection(event) {
    if (event.success) {
      console.log("Connected to SmartFoxServer 2X!<br>SFS2X API version: " + this.sfs.version);
      onConnectionSuccessed();
    }
    else {
      console.log("Connection failed: " + (event.errorMessage ? event.errorMessage + " (" + event.errorCode + ")" : "Is the server running at all?"));
      onConnectionFailed();
      this.resetConnector();
    }
  };

  onConnectionLost(event) {
    console.log("Disconnection occurred; reason is: " + event.reason);
    this.resetConnector();
  };
};
