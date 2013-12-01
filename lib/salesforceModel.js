(function() {
  var RSpine;

  RSpine = this.RSpine || require('rspine');

  if (!RSpine.salesforceModels) {
    RSpine.salesforceModels = [];
  }

  RSpine.Model.SalesforceModel = {
    initialize: function() {
      var model, _i, _len, _ref, _results;
      _ref = RSpine.salesforceModels;
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
      return klass.extend(RSpine.Model.SalesforceModel);
    },
    extended: function() {
      var _this = this;
      RSpine.salesforceModels.push(this);
      this.include({
        sobjectFormat: function(includeId) {
          var key, object, value, _ref;
          if (includeId == null) {
            includeId = false;
          }
          object = {};
          _ref = this.attributes();
          for (key in _ref) {
            value = _ref[key];
            if (this.constructor.avoidInsertList.indexOf(key) > -1) {

            } else if (key === "id") {
              if (includeId) {
                object["Id"] = this[key];
              }
            } else {
              object[key] = this[key];
            }
          }
          return object;
        },
        toJSON: function(includeId) {
          var obj, type;
          if (includeId == null) {
            includeId = false;
          }
          type = this.constructor.className;
          obj = {
            fields: this.sobjectFormat(includeId),
            id: this.id,
            objtype: type
          };
          return obj;
        }
      });
      return this.extend({
        filters: typeof this.filters === "undefined" ? {} : this.filters,
        autoQuery: typeof this.autoQuery === "undefined" ? false : this.autoQuery,
        avoidQueryList: typeof this.avoidQueryList === "undefined" ? [] : this.avoidQueryList,
        avoidInsertList: typeof this.avoidInsertList === "undefined" ? [] : this.avoidInsertList,
        querySinceLastUpdate: typeof this.querySinceLastUpdate === "undefined" ? false : this.querySinceLastUpdate,
        useDefaultSession: typeof this.useDefaultSession === "undefined" ? false : this.useDefaultSession,
        overrideClassName: typeof this.overrideClassName === "undefined" ? null : this.overrideClassName,
        lastUpdate: new Date(1000),
        salesforceFormat: function(items, includeId) {
          var item, objects, _i, _len;
          if (includeId == null) {
            includeId = false;
          }
          if (!RSpine.isArray(items)) {
            items = [items];
          }
          objects = [];
          for (_i = 0, _len = items.length; _i < _len; _i++) {
            item = items[_i];
            objects.push(item.sobjectFormat(includeId));
          }
          return objects;
        },
        fromJSON: function(objects) {
          var cDate, obj, value, _i, _len, _results;
          if (!objects) {
            return;
          }
          if (typeof objects === 'string') {
            objects = objects.replace(new RegExp("Id", 'g'), "id");
            objects = JSON.parse(objects);
          }
          if (objects.records) {
            objects = objects.records;
          }
          if (RSpine.isArray(objects)) {
            _results = [];
            for (_i = 0, _len = objects.length; _i < _len; _i++) {
              value = objects[_i];
              if (value.Id) {
                value.id = value.Id;
              }
              cDate = value.LastModifiedDate ? new Date(value.LastModifiedDate) : new Date(1000);
              if (cDate > this.lastUpdate.getTime()) {
                this.lastUpdate = cDate;
              }
              obj = new this(value);
              _results.push(obj);
            }
            return _results;
          } else {
            if (value.Id) {
              value.id = value.Id;
            }
            return new this(objects);
          }
        },
        getQuery: function(options) {
          if (options == null) {
            options = {
              "": true
            };
          }
          if (!RSpine.isArray(options)) {
            options = [options];
          }
          return _this.queryString() + _this.getQueryCondition(options);
        },
        getQueryCondition: function(conditions) {
          var filter, filterKey, key, orderFilterString, queryFilterString, querySinceLastUpdate, querySinceLastUpdated, stringFilters, thisFilter, _i, _j, _len, _len1, _ref;
          if (Object.keys(this.filters).length === 0) {
            return "";
          }
          stringFilters = [];
          queryFilterString = "";
          orderFilterString = "";
          querySinceLastUpdated = this.querySinceLastUpdate;
          for (_i = 0, _len = conditions.length; _i < _len; _i++) {
            filter = conditions[_i];
            if (!filter.junction) {
              filter.junction = "and";
            }
            if (stringFilters.length === 0) {
              filter.junction = "where";
            }
            filterKey = "";
            _ref = Object.keys(filter);
            for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
              key = _ref[_j];
              if (key !== "junction") {
                filterKey = key;
              }
            }
            if (key === "sinceLastUpdate") {
              querySinceLastUpdate = true;
            }
            if (key === "avoidLastUpdate") {
              querySinceLastUpdate = false;
            }
            if (filterKey !== "orderBy" && filterKey !== "sinceLastUpdate" && key !== "avoidLastUpdate") {
              thisFilter = this.filters[filterKey];
              thisFilter = thisFilter.replace("?", filter[filterKey]);
              stringFilters.push(thisFilter);
              queryFilterString += " " + filter.junction + " " + thisFilter;
            } else if (filterKey === "orderBy") {
              orderFilterString = " ORDER " + filter[filterKey];
            }
          }
          if (querySinceLastUpdated) {
            queryFilterString = " and LastModifiedDate >= " + this.lastUpdate;
          }
          return queryFilterString + orderFilterString;
        },
        queryString: function() {
          var attribute, query, _i, _len, _ref, _ref1;
          query = "select ";
          _ref = _this.attributes;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            attribute = _ref[_i];
            if (((_ref1 = _this.avoidQueryList) != null ? _ref1.indexOf(attribute) : void 0) === -1) {
              query += attribute + ",";
            }
          }
          query += "Id  ";
          query += "from " + _this.className;
          query += " ";
          return query;
        }
      });
    }
  };

  if (typeof module !== "undefined" && module !== null) {
    module.exports = RSpine.Model.SalesforceModel;
  }

}).call(this);
