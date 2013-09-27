(function() {
  var Collection, Instance, RSpine, Singleton, association, isArray, require, singularize, underscore,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  RSpine = this.RSpine || require('rspine');

  isArray = RSpine.isArray;

  require = this.require || (function(value) {
    return eval(value);
  });

  Collection = (function(_super) {
    __extends(Collection, _super);

    function Collection(options) {
      var key, value;
      if (options == null) {
        options = {};
      }
      for (key in options) {
        value = options[key];
        this[key] = value;
      }
    }

    Collection.prototype.all = function() {
      var _this = this;
      return this.model.select(function(rec) {
        return _this.associated(rec);
      });
    };

    Collection.prototype.first = function() {
      return this.all()[0];
    };

    Collection.prototype.last = function() {
      var values;
      values = this.all();
      return values[values.length - 1];
    };

    Collection.prototype.count = function() {
      return this.all().length;
    };

    Collection.prototype.find = function(id) {
      var records,
        _this = this;
      records = this.select(function(rec) {
        return ("" + rec.id) === ("" + id);
      });
      if (!records[0]) {
        throw new Error("\"" + this.model.className + "\" model could not find a record for the ID \"" + id + "\"");
      }
      return records[0];
    };

    Collection.prototype.findAllByAttribute = function(name, value) {
      var _this = this;
      return this.model.select(function(rec) {
        return _this.associated(rec) && rec[name] === value;
      });
    };

    Collection.prototype.findByAttribute = function(name, value) {
      return this.findAllByAttribute(name, value)[0];
    };

    Collection.prototype.select = function(cb) {
      var _this = this;
      return this.model.select(function(rec) {
        return _this.associated(rec) && cb(rec);
      });
    };

    Collection.prototype.refresh = function(values) {
      var i, match, record, _i, _j, _k, _len, _len1, _len2, _ref, _ref1;
      if (values == null) {
        return this;
      }
      _ref = this.all();
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        record = _ref[_i];
        delete this.model.irecords[record.id];
        _ref1 = this.model.records;
        for (i = _j = 0, _len1 = _ref1.length; _j < _len1; i = ++_j) {
          match = _ref1[i];
          if (!(match.id === record.id)) {
            continue;
          }
          this.model.records.splice(i, 1);
          break;
        }
      }
      if (!isArray(values)) {
        values = [values];
      }
      for (_k = 0, _len2 = values.length; _k < _len2; _k++) {
        record = values[_k];
        record.newRecord = false;
        record[this.fkey] = this.record.id;
      }
      this.model.refresh(values);
      return this;
    };

    Collection.prototype.create = function(record, options) {
      record[this.fkey] = this.record.id;
      return this.model.create(record, options);
    };

    Collection.prototype.add = function(record, options) {
      return record.updateAttribute(this.fkey, this.record.id, options);
    };

    Collection.prototype.remove = function(record, options) {
      return record.updateAttribute(this.fkey, null, options);
    };

    Collection.prototype.associated = function(record) {
      return record[this.fkey] === this.record.id;
    };

    return Collection;

  })(RSpine.Module);

  Instance = (function(_super) {
    __extends(Instance, _super);

    function Instance(options) {
      var key, value;
      if (options == null) {
        options = {};
      }
      for (key in options) {
        value = options[key];
        this[key] = value;
      }
    }

    Instance.prototype.exists = function() {
      if (this.record[this.fkey]) {
        return this.model.exists(this.record[this.fkey]);
      } else {
        return false;
      }
    };

    Instance.prototype.update = function(value) {
      if (value == null) {
        return this;
      }
      if (!(value instanceof this.model)) {
        value = new this.model(value);
      }
      if (value.isNew()) {
        value.save();
      }
      this.record[this.fkey] = value && value.id;
      return this;
    };

    return Instance;

  })(RSpine.Module);

  Singleton = (function(_super) {
    __extends(Singleton, _super);

    function Singleton(options) {
      var key, value;
      if (options == null) {
        options = {};
      }
      for (key in options) {
        value = options[key];
        this[key] = value;
      }
    }

    Singleton.prototype.find = function() {
      return this.record.id && this.model.findByAttribute(this.fkey, this.record.id);
    };

    Singleton.prototype.update = function(value) {
      if (value == null) {
        return this;
      }
      if (!(value instanceof this.model)) {
        value = this.model.fromJSON(value);
      }
      value[this.fkey] = this.record.id;
      value.save();
      return this;
    };

    return Singleton;

  })(RSpine.Module);

  singularize = function(str) {
    return str.replace(/s$/, '');
  };

  underscore = function(str) {
    return str.replace(/::/g, '/').replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2').replace(/([a-z\d])([A-Z])/g, '$1_$2').replace(/-/g, '_').toLowerCase();
  };

  association = function(name, model, record, fkey, Ctor) {
    if (typeof model === 'string') {
      model = require(model);
    }
    return new Ctor({
      name: name,
      model: model,
      record: record,
      fkey: fkey
    });
  };

  RSpine.Model.extend({
    hasMany: function(name, model, fkey) {
      if (fkey == null) {
        fkey = "" + (underscore(this.className)) + "_id";
      }
      return this.prototype[name] = function(value) {
        return association(name, model, this, fkey, Collection).refresh(value);
      };
    },
    belongsTo: function(name, model, fkey) {
      if (fkey == null) {
        fkey = "" + (underscore(singularize(name))) + "_id";
      }
      this.prototype[name] = function(value) {
        return association(name, model, this, fkey, Instance).update(value).exists();
      };
      return this.attributes.push(fkey);
    },
    hasOne: function(name, model, fkey) {
      if (fkey == null) {
        fkey = "" + (underscore(this.className)) + "_id";
      }
      return this.prototype[name] = function(value) {
        return association(name, model, this, fkey, Singleton).update(value).find();
      };
    }
  });

  RSpine.Collection = Collection;

  RSpine.Singleton = Singleton;

  RSpine.Instance = Instance;

}).call(this);