(function() {
  var RSpine;

  RSpine = this.RSpine || require('rspine');

  if (!RSpine.parseModels) {
    RSpine.parseModels = [];
  }

  RSpine.Model.ParseModel = {
    initialize: function() {
      var model, _i, _len, _ref, _results;
      _ref = RSpine.parseModels;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        model = _ref[_i];
        if (model.autoQuery) {
          _results.push(model.fetch());
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
      return klass.extend(RSpine.Model.ParseModel);
    },
    extended: function() {
      return this.extend({
        lastUpdate: new Date(1000),
        fromJSON: function(objects) {
          var cDate, lastChange, obj, value, _i, _len, _results;
          if (!objects) {
            return;
          }
          if (typeof objects === 'string') {
            objects = JSON.parse(objects);
          }
          if (objects.results) {
            objects = objects.results;
          }
          if (RSpine.isArray(objects)) {
            _results = [];
            for (_i = 0, _len = objects.length; _i < _len; _i++) {
              value = objects[_i];
              if (value.objectId) {
                value.id = value.objectId;
              }
              lastChange = value.updatedAt || value.createdAt;
              cDate = lastChange ? new Date(lastChange) : new Date(1000);
              if (cDate > this.lastUpdate.getTime()) {
                this.lastUpdate = cDate;
              }
              obj = new this(value);
              _results.push(obj);
            }
            return _results;
          } else {
            if (value.objectId) {
              value.id = value.objectId;
            }
            return new this(objects);
          }
        }
      });
    }
  };

  if (typeof module !== "undefined" && module !== null) {
    module.exports = RSpine.Model.ParseModel;
  }

}).call(this);
