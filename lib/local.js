(function() {
  var RSpine;

  RSpine = this.RSpine || require('rspine');

  RSpine.Model.Local = {
    extended: function() {
      this.change(this.saveLocal);
      return this.fetch(this.loadLocal);
    },
    saveLocal: function() {
      var result;
      result = JSON.stringify(this);
      return localStorage[this.className] = result;
    },
    loadLocal: function(options) {
      var result;
      if (options == null) {
        options = {};
      }
      if (!options.hasOwnProperty('clear')) {
        options.clear = true;
      }
      result = localStorage[this.className];
      return this.refresh(result || [], options);
    }
  };

  if (typeof module !== "undefined" && module !== null) {
    module.exports = RSpine.Model.Local;
  }

}).call(this);
