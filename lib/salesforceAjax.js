(function() {
  var $, Ajax, Base, Collection, Extend, Include, Model, Queue, RSpine, Singleton,
    __slice = [].slice,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  RSpine = this.RSpine || require('rspine');

  $ = RSpine.$;

  Model = RSpine.Model;

  Queue = $({});

  Ajax = {
    getURL: function(object) {
      return (typeof object.url === "function" ? object.url() : void 0) || object.url;
    },
    getCollectionURL: function(object) {
      if (object) {
        if (typeof object.url === "function") {
          return this.generateURL(object);
        } else {
          return object.url;
        }
      }
    },
    getScope: function(object) {
      return (typeof object.scope === "function" ? object.scope() : void 0) || object.scope;
    },
    generateURL: function() {
      var args, collection, object, path, scope;
      object = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      if (object.className) {
        collection = object.className.toLowerCase() + 's';
        scope = Ajax.getScope(object);
      } else {
        if (typeof object.constructor.url === 'string') {
          collection = object.constructor.url;
        } else {
          collection = object.constructor.className.toLowerCase() + 's';
        }
        scope = Ajax.getScope(object) || Ajax.getScope(object.constructor);
      }
      args.unshift(collection);
      args.unshift(scope);
      path = args.join('/');
      path = path.replace(/(\/\/)/g, "/");
      path = path.replace(/^\/|\/$/g, "");
      if (path.indexOf("../") !== 0) {
        return Model.salesforceHost + "/sobjects/" + path;
      } else {
        return path;
      }
    },
    enabled: true,
    disable: function(callback) {
      var e;
      if (this.enabled) {
        this.enabled = false;
        try {
          return callback();
        } catch (_error) {
          e = _error;
          throw e;
        } finally {
          this.enabled = true;
        }
      } else {
        return callback();
      }
    },
    queue: function(request) {
      if (request) {
        return Queue.queue(request);
      } else {
        return Queue.queue();
      }
    },
    clearQueue: function() {
      return this.queue([]);
    }
  };

  Base = (function() {
    function Base() {}

    Base.prototype.defaults = {
      processData: false,
      xhrFields: {
        withCredentials: true
      },
      crossDomain: true,
      headers: {
        'X-Requested-With': 'XMLHttpRequest'
      }
    };

    Base.prototype.queue = Ajax.queue;

    Base.prototype.ajax = function(params, defaults) {
      return $.ajax(this.ajaxSettings(params, defaults));
    };

    Base.prototype.ajaxQueue = function(params, defaults, record) {
      var deferred, jqXHR, promise, request, settings;
      jqXHR = null;
      deferred = $.Deferred();
      promise = deferred.promise();
      if (!Ajax.enabled) {
        return promise;
      }
      settings = this.ajaxSettings(params, defaults);
      request = function(next) {
        var _ref;
        if ((record != null ? record.id : void 0) != null) {
          if (settings.url == null) {
            settings.url = Ajax.getURL(record);
          }
          if ((_ref = settings.data) != null) {
            _ref.id = record.id;
          }
        }
        settings.data = JSON.stringify(settings.data);
        return jqXHR = $.ajax(settings).done(deferred.resolve).fail(deferred.reject).then(next, next);
      };
      promise.abort = function(statusText) {
        var index;
        if (jqXHR) {
          return jqXHR.abort(statusText);
        }
        index = $.inArray(request, this.queue());
        if (index > -1) {
          this.queue().splice(index, 1);
        }
        deferred.rejectWith(settings.context || settings, [promise, statusText, '']);
        return promise;
      };
      this.queue(request);
      return promise;
    };

    Base.prototype.ajaxSettings = function(params, defaults) {
      return $.extend({}, this.defaults, defaults, params);
    };

    return Base;

  })();

  Collection = (function(_super) {
    __extends(Collection, _super);

    function Collection(model) {
      this.model = model;
      this.failResponse = __bind(this.failResponse, this);
      this.recordsResponse = __bind(this.recordsResponse, this);
    }

    Collection.prototype.query = function(params, options) {
      var queryString,
        _this = this;
      if (params == null) {
        params = {};
      }
      if (options == null) {
        options = {};
      }
      queryString = options.queryString ? options.queryString : this.model.getQuery(params, options);
      return this.ajax(params, {
        type: 'GET',
        url: Model.salesforceHost + ("/sobjects?soql=" + queryString)
      }).done(this.recordsResponse).fail(this.failResponse).done(function(records) {
        _this.model.trigger("querySuccess");
        return _this.model.refresh(records, options);
      });
    };

    Collection.prototype.api = function(params, options) {
      var _this = this;
      if (params == null) {
        params = {};
      }
      if (options == null) {
        options = {};
      }
      params.dataType = "json";
      return this.ajax(params, {
        type: 'GET',
        url: Model.salesforceHost + "/api?path=" + options.endpoint
      }).done(this.recordsResponse).fail(this.failResponse).done(function(results) {
        return _this.model.trigger("apiSuccess", results);
      });
    };

    Collection.prototype.recordsResponse = function(data, status, xhr) {
      return this.model.trigger('ajaxSuccess', null, status, xhr);
    };

    Collection.prototype.failResponse = function(xhr, statusText, error) {
      if (xhr.status === 503) {
        RSpine.trigger("platform:login_invalid");
      }
      return this.model.trigger('ajaxError', null, xhr, statusText, error);
    };

    return Collection;

  })(Base);

  Singleton = (function(_super) {
    __extends(Singleton, _super);

    function Singleton(record) {
      this.record = record;
      this.failResponse = __bind(this.failResponse, this);
      this.recordResponse = __bind(this.recordResponse, this);
      this.model = this.record.constructor;
    }

    Singleton.prototype.reload = function(params, options) {
      if (options == null) {
        options = {};
      }
      return this.ajaxQueue(params, {
        type: 'GET',
        url: options.url
      }, this.record).done(this.recordResponse(options)).fail(this.failResponse(options));
    };

    Singleton.prototype.create = function(params, options) {
      if (options == null) {
        options = {};
      }
      return this.ajaxQueue(params, {
        type: 'POST',
        contentType: 'application/json',
        data: this.record.toJSON(),
        url: options.url || Ajax.getCollectionURL(this.record)
      }).done(this.recordResponse(options)).fail(this.failResponse(options));
    };

    Singleton.prototype.update = function(params, options) {
      if (options == null) {
        options = {};
      }
      return this.ajaxQueue(params, {
        type: 'PUT',
        contentType: 'application/json',
        data: this.record.toJSON(),
        url: options.url || Ajax.getCollectionURL(this.record)
      }, this.record).done(this.recordResponse(options)).fail(this.failResponse(options));
    };

    Singleton.prototype.destroy = function(params, options) {
      if (options == null) {
        options = {};
      }
      return this.ajaxQueue(params, {
        type: 'DELETE',
        url: options.url
      }, this.record).done(this.recordResponse(options)).fail(this.failResponse(options));
    };

    Singleton.prototype.recordResponse = function(options) {
      var _this = this;
      if (options == null) {
        options = {};
      }
      return function(data, status, xhr) {
        var _ref, _ref1;
        Ajax.disable(function() {
          if (!(RSpine.isBlank(data) || _this.record.destroyed)) {
            if (data.id && _this.record.id !== data.id) {
              _this.record.changeID(data.id);
            }
            return _this.record.refresh(data);
          }
        });
        _this.record.trigger('ajaxSuccess', data, status, xhr);
        if ((_ref = options.success) != null) {
          _ref.apply(_this.record);
        }
        return (_ref1 = options.done) != null ? _ref1.apply(_this.record) : void 0;
      };
    };

    Singleton.prototype.failResponse = function(options) {
      var _this = this;
      if (options == null) {
        options = {};
      }
      return function(xhr, statusText, error) {
        var _ref, _ref1;
        _this.record.trigger('ajaxError', xhr, statusText, error);
        if ((_ref = options.error) != null) {
          _ref.apply(_this.record);
        }
        return (_ref1 = options.fail) != null ? _ref1.apply(_this.record) : void 0;
      };
    };

    return Singleton;

  })(Base);

  Model.host = '';

  Model.salesforceHost = RSpine.apiServer + "/sobjects";

  Include = {
    ajax: function() {
      return new Singleton(this);
    },
    url: function() {
      var args;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      args.unshift(encodeURIComponent(this.id));
      return Ajax.generateURL.apply(Ajax, [this].concat(__slice.call(args)));
    }
  };

  Extend = {
    ajax: function() {
      return new Collection(this);
    },
    url: function() {
      var args;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return Ajax.generateURL.apply(Ajax, [this].concat(__slice.call(args)));
    }
  };

  Model.SalesforceAjax = {
    extended: function() {
      var _this = this;
      this.fetch(this.ajaxFetch);
      this.query = function() {
        var _ref;
        return (_ref = _this.ajax()).query.apply(_ref, arguments);
      };
      this.api = function() {
        var _ref;
        return (_ref = _this.ajax()).api.apply(_ref, arguments);
      };
      this.change(this.ajaxChange);
      this.extend(Extend);
      return this.include(Include);
    },
    ajaxFetch: function() {
      var _ref;
      return (_ref = this.ajax()).fetch.apply(_ref, arguments);
    },
    ajaxChange: function(record, type, options) {
      if (options == null) {
        options = {};
      }
      if (options.ajax === false) {
        return;
      }
      return record.ajax()[type](options.ajax, options);
    }
  };

  Model.SalesforceAjax.Methods = {
    extended: function() {
      this.extend(Extend);
      return this.include(Include);
    }
  };

  Ajax.defaults = Base.prototype.defaults;

  Ajax.Base = Base;

  Ajax.Singleton = Singleton;

  Ajax.Collection = Collection;

  RSpine.SalesforceAjax = Ajax;

  if (typeof module !== "undefined" && module !== null) {
    module.exports = Ajax;
  }

}).call(this);
