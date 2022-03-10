class Loading {
  constructor() {
    this.loadingCommand = [];
  };

  addLoading(command) {
    if (this.loadingCommand.includes(command) == false) {
      this.loadingCommand.push(command);
      document.getElementById("loading").style.display = "block";
      if (command == "alo") {
        
      }
    }
  };

  removeLoading(command) {
    if (this.loadingCommand.includes(command) == true) {
      this.loadingCommand = this.loadingCommand.filter(item => item !== command)
      if (this.loadingCommand.length == 0) {
        document.getElementById("loading").style.display = "none";
      }
      else {
        document.getElementById("loading").style.display = "block";
      }
    }
  };
};