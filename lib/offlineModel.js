(function() {
  var RSpine;

  RSpine = this.RSpine || require('rspine');

  if (!RSpine.offlineModels) {
    RSpine.offlineModels = [];
  }

  RSpine.Model.OfflineModel = {
    initialize: function() {
      var model, _i, _len, _ref, _results;
      _ref = RSpine.offlineModels;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        model = _ref[_i];
        if (model.autoFetch) {
          _results.push(model.localFetch());
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    },
    decorate: function(klassOrKlasses) {
      var klass, _i, _len, _results;
      if (Object.prototype.toString.call(klassOrKlasses) === !'[object Array]') {
        klassOrKlasses = [klassOrKlasses];
      }
      _results = [];
      for (_i = 0, _len = klassOrKlasses.length; _i < _len; _i++) {
        klass = klassOrKlasses[_i];
        _results.push(this.performDecoration(klass));
      }
      return _results;
    },
    performDecoration: function(klass) {
      return klass.extend(RSpine.Model.OfflineModel);
    },
    extended: function() {
      this.change(this.saveLocal);
      this.bind("querySuccess", this.saveBulkLocal);
      RSpine.offlineModels.push(this);
      return this.extend({
        autoFetch: typeof this.autoFetch === "undefined" ? false : this.autoFetch,
        localFetch: function() {
          return RSpine.Model.OfflineModel.loadLocal.call(this);
        },
        localDestroyAll: function() {
          return localStorage[this.className] = [];
        }
      });
    },
    saveBulkLocal: function() {
      var result;
      if (typeof this.beforeSaveLocal === "function") {
        this.beforeSaveLocal();
      }
      result = JSON.stringify(this.all());
      return localStorage[this.className] = result;
    },
    saveLocal: function() {
      var result;
      if (typeof this.beforeSaveLocal === "function") {
        this.beforeSaveLocal();
      }
      result = JSON.stringify(this);
      return localStorage[this.className] = result;
    },
    loadLocal: function() {
      var result;
      result = localStorage[this.className];
      this.refresh(result || [], {
        clear: true
      });
      return typeof this.afterLoadLocal === "function" ? this.afterLoadLocal() : void 0;
    }
  };

  if (typeof module !== "undefined" && module !== null) {
    module.exports = RSpine.Model.OfflineModel;
  }

}).call(this);
