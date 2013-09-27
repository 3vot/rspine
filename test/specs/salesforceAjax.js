(function() {
  describe("Ajax", function() {
    var User, jqXHR;
    User = void 0;
    jqXHR = void 0;
    beforeEach(function() {
      RSpine.Ajax.clearQueue();
      User = RSpine.Model.setup("User", ["first", "last"]);
      User.extend(RSpine.Model.Ajax);
      User.extend(RSpine.Model.SalesforceModel);
      jqXHR = $.Deferred();
      return $.extend(jqXHR, {
        readyState: 0,
        setRequestHeader: function() {
          return this;
        },
        getAllResponseHeaders: function() {},
        getResponseHeader: function() {},
        overrideMimeType: function() {
          return this;
        },
        abort: function() {
          this.reject(arguments);
          return this;
        },
        success: jqXHR.done,
        error: jqXHR.fail,
        complete: jqXHR.done
      });
    });
    it("can QUERY a collection on fetch", function() {
      spyOn(jQuery, "ajax").andReturn(jqXHR);
      User.fetch({}, {
        query: true
      });
      return expect(jQuery.ajax).toHaveBeenCalledWith({
        type: "GET",
        headers: {
          "X-Requested-With": "XMLHttpRequest"
        },
        dataType: "json",
        url: "/users",
        processData: false
      });
    });
    it("can GET a collection on fetch", function() {
      spyOn(jQuery, "ajax").andReturn(jqXHR);
      User.fetch();
      return expect(jQuery.ajax).toHaveBeenCalledWith({
        type: "GET",
        headers: {
          "X-Requested-With": "XMLHttpRequest"
        },
        dataType: "json",
        url: "/users",
        processData: false
      });
    });
    it("can GET a record on fetch", function() {
      User.refresh([
        {
          first: "John",
          last: "Williams",
          id: "IDD"
        }
      ]);
      spyOn(jQuery, "ajax").andReturn(jqXHR);
      User.fetch({
        id: "IDD"
      });
      return expect(jQuery.ajax).toHaveBeenCalledWith({
        type: "GET",
        headers: {
          "X-Requested-With": "XMLHttpRequest"
        },
        dataType: "json",
        url: "/users/IDD",
        processData: false
      });
    });
    it("allows undeclared attributes from server", function() {
      User.refresh([
        {
          id: "12345",
          first: "Hans",
          last: "Zimmer",
          created_by: "rspine_user",
          created_at: "2013-07-14T14:00:00-04:00",
          updated_at: "2013-07-14T14:00:00-04:00"
        }
      ]);
      return expect(User.first().created_by).toEqual("rspine_user");
    });
    it("should send POST on create", function() {
      spyOn(jQuery, "ajax").andReturn(jqXHR);
      User.create({
        first: "Hans",
        last: "Zimmer",
        id: "IDD"
      });
      return expect(jQuery.ajax).toHaveBeenCalledWith({
        type: "POST",
        headers: {
          "X-Requested-With": "XMLHttpRequest"
        },
        contentType: "application/json",
        dataType: "json",
        data: '{"fields":{"first__c":"Hans","last__c":"Zimmer"},"id":"IDD","objtype":"User__c"}',
        url: "/users",
        processData: false
      });
    });
    it("should send PUT on update", function() {
      User.refresh([
        {
          first: "John",
          last: "Williams",
          id: "IDD"
        }
      ]);
      spyOn(jQuery, "ajax").andReturn(jqXHR);
      User.first().updateAttributes({
        first: "John2",
        last: "Williams2"
      });
      return expect(jQuery.ajax).toHaveBeenCalledWith({
        type: "PUT",
        headers: {
          "X-Requested-With": "XMLHttpRequest"
        },
        contentType: "application/json",
        dataType: "json",
        data: '{"fields":{"first__c":"John2","last__c":"Williams2"},"id":"IDD","objtype":"User__c"}',
        url: "/users/IDD",
        processData: false
      });
    });
    it("should send DELETE on destroy", function() {
      User.refresh([
        {
          first: "John",
          last: "Williams",
          id: "IDD"
        }
      ]);
      spyOn(jQuery, "ajax").andReturn(jqXHR);
      User.first().destroy();
      return expect(jQuery.ajax).toHaveBeenCalledWith({
        headers: {
          "X-Requested-With": "XMLHttpRequest"
        },
        dataType: "json",
        processData: false,
        type: "DELETE",
        url: "/users/IDD"
      });
    });
    it("should update record after PUT/POST", function() {
      var newAtts;
      spyOn(jQuery, "ajax").andReturn(jqXHR);
      User.create({
        first: "Hans",
        last: "Zimmer",
        id: "IDD"
      });
      newAtts = {
        first: "Hans2",
        last: "Zimmer2",
        id: "IDD"
      };
      jqXHR.resolve(newAtts);
      return expect(User.first().attributes()).toEqual(newAtts);
    });
    it("should update record with undeclared attributes from server", function() {
      var serverAttrs;
      spyOn(jQuery, "ajax").andReturn(jqXHR);
      User.create({
        first: "Hans",
        last: "Zimmer"
      });
      serverAttrs = {
        id: "12345",
        first: "Hans",
        last: "Zimmer",
        created_by: "rspine_user",
        created_at: "2013-07-14T14:00:00-04:00",
        updated_at: "2013-07-14T14:00:00-04:00"
      };
      jqXHR.resolve(serverAttrs);
      return expect(User.first().created_by).toEqual("rspine_user");
    });
    it("should change record ID after PUT/POST", function() {
      var newAtts;
      spyOn(jQuery, "ajax").andReturn(jqXHR);
      User.create({
        id: "IDD"
      });
      newAtts = {
        id: "IDD2"
      };
      jqXHR.resolve(newAtts);
      expect(User.first().id).toEqual("IDD2");
      return expect(User.irecords["IDD2"]).toEqual(User.first());
    });
    it("can update record IDs for already queued requests", function() {
      var newAtts, u, updateAjaxRequest;
      spyOn(jQuery, "ajax").andReturn(jqXHR);
      u = User.create();
      u.first = "Todd";
      u.last = "Shaw";
      u.save();
      newAtts = {
        id: "IDD"
      };
      jqXHR.resolve(newAtts);
      updateAjaxRequest = jQuery.ajax.mostRecentCall.args[0];
      return expect(updateAjaxRequest.url).toBe("/users/IDD");
    });
    it("should not recreate records after DELETE", function() {
      User.refresh([
        {
          first: "Phillip",
          last: "Fry",
          id: "MYID"
        }
      ]);
      spyOn(jQuery, "ajax").andReturn(jqXHR);
      User.first().destroy();
      expect(User.count()).toEqual(0);
      jqXHR.resolve({
        id: "MYID",
        name: "Phillip",
        last: "Fry"
      });
      return expect(User.count()).toEqual(0);
    });
    it("should send requests syncronously", function() {
      spyOn(jQuery, "ajax").andReturn(jqXHR);
      User.create({
        first: "First"
      });
      expect(jQuery.ajax).toHaveBeenCalled();
      jQuery.ajax.reset();
      User.create({
        first: "Second"
      });
      expect(jQuery.ajax).not.toHaveBeenCalled();
      jqXHR.resolve();
      return expect(jQuery.ajax).toHaveBeenCalled();
    });
    it("should return promise objects", function() {
      var noop, spy, user;
      spyOn(jQuery, "ajax").andReturn(jqXHR);
      User.refresh([
        {
          first: "John",
          last: "Williams",
          id: "IDD"
        }
      ]);
      user = User.find("IDD");
      noop = {
        spy: function() {}
      };
      spyOn(noop, "spy");
      spy = noop.spy;
      user.ajax().update().done(spy);
      jqXHR.resolve();
      return expect(spy).toHaveBeenCalled();
    });
    it("should allow promise objects to abort the request and dequeue", function() {
      var noop, spy, user;
      spyOn(jQuery, "ajax").andReturn(jqXHR);
      User.refresh([
        {
          first: "John",
          last: "Williams",
          id: "IDD"
        }
      ]);
      user = User.find("IDD");
      noop = {
        spy: function() {}
      };
      spyOn(noop, "spy");
      spy = noop.spy;
      user.ajax().update().fail(spy);
      expect(RSpine.Ajax.queue().length).toEqual(1);
      jqXHR.abort();
      expect(RSpine.Ajax.queue().length).toEqual(0);
      return expect(spy).toHaveBeenCalled();
    });
    it("should not replace AJAX results when dequeue", function() {
      User.refresh([], {
        clear: true
      });
      spyOn(jQuery, "ajax").andReturn(jqXHR);
      jqXHR.resolve([
        {
          id: "IDD"
        }
      ]);
      User.fetch();
      return expect(User.exists("IDD")).toBeTruthy();
    });
    it("should have success callbacks", function() {
      var noop, spy;
      spyOn(jQuery, "ajax").andReturn(jqXHR);
      noop = {
        spy: function() {}
      };
      spyOn(noop, "spy");
      spy = noop.spy;
      User.create({
        first: "Second"
      }, {
        success: spy
      });
      jqXHR.resolve();
      return expect(spy).toHaveBeenCalled();
    });
    it("should have error callbacks", function() {
      var noop, spy;
      spyOn(jQuery, "ajax").andReturn(jqXHR);
      noop = {
        spy: function() {}
      };
      spyOn(noop, "spy");
      spy = noop.spy;
      User.create({
        first: "Second"
      }, {
        error: spy
      });
      jqXHR.reject();
      return expect(spy).toHaveBeenCalled();
    });
    it("should cancel ajax on change", function() {
      spyOn(jQuery, "ajax").andReturn(jqXHR);
      User.create({
        first: "Second"
      }, {
        ajax: false
      });
      jqXHR.resolve();
      return expect(jQuery.ajax).not.toHaveBeenCalled();
    });
    it("should expose the defaults object", function() {
      return expect(RSpine.Ajax.defaults).toBeDefined();
    });
    it("can get a url property with optional host from a model and model instances", function() {
      var user;
      User.url = "/people";
      expect(RSpine.Ajax.getURL(User)).toBe("/people");
      user = new User({
        id: 1
      });
      expect(user.url()).toBe("/people/1");
      expect(user.url("custom")).toBe("/people/1/custom");
      RSpine.Model.host = "http://example.com";
      return expect(user.url()).toBe("http://example.com/people/1");
    });
    it("can override POST url with options on create", function() {
      spyOn(jQuery, "ajax").andReturn(jqXHR);
      User.create({
        first: "Adam",
        id: "123"
      }, {
        url: "/people"
      });
      return expect(jQuery.ajax).toHaveBeenCalledWith({
        type: "POST",
        headers: {
          "X-Requested-With": "XMLHttpRequest"
        },
        dataType: "json",
        data: '{"fields":{"first__c":"Adam"},"id":"123","objtype":"User__c"}',
        contentType: "application/json",
        url: "/people",
        processData: false
      });
    });
    it("can override GET url with options on fetch", function() {
      spyOn(jQuery, "ajax").andReturn(jqXHR);
      User.fetch({
        url: "/people"
      });
      return expect(jQuery.ajax).toHaveBeenCalledWith({
        type: "GET",
        headers: {
          "X-Requested-With": "XMLHttpRequest"
        },
        dataType: "json",
        url: "/people",
        processData: false
      });
    });
    it("can override PUT url with options on update", function() {
      var user;
      spyOn(jQuery, "ajax").andReturn(jqXHR);
      user = User.create({
        first: "Adam",
        id: "123"
      }, {
        ajax: false
      });
      user.updateAttributes({
        first: "Odam"
      }, {
        url: "/people"
      });
      return expect(jQuery.ajax).toHaveBeenCalledWith({
        type: "PUT",
        headers: {
          "X-Requested-With": "XMLHttpRequest"
        },
        dataType: "json",
        data: '{"fields":{"first__c":"Odam"},"id":"123","objtype":"User__c"}',
        contentType: "application/json",
        url: "/people",
        processData: false
      });
    });
    it("can override DELETE url with options on destroy", function() {
      var user;
      spyOn(jQuery, "ajax").andReturn(jqXHR);
      user = User.create({
        first: "Adam",
        id: "123"
      }, {
        ajax: false
      });
      user.destroy({
        url: "/people"
      });
      return expect(jQuery.ajax).toHaveBeenCalledWith({
        type: "DELETE",
        headers: {
          "X-Requested-With": "XMLHttpRequest"
        },
        dataType: "json",
        url: "/people",
        processData: false
      });
    });
    it("should have a url function", function() {
      var user;
      RSpine.Model.host = "";
      expect(User.url()).toBe("/users");
      expect(User.url("search")).toBe("/users/search");
      user = new User({
        id: 1
      });
      expect(user.url()).toBe("/users/1");
      expect(user.url("custom")).toBe("/users/1/custom");
      RSpine.Model.host = "http://example.com";
      expect(User.url()).toBe("http://example.com/users");
      return expect(user.url()).toBe("http://example.com/users/1");
    });
    it("can gather scope for the url from the model", function() {
      var user;
      RSpine.Model.host = "";
      User.scope = "admin";
      expect(User.url()).toBe("/admin/users");
      expect(User.url("custom")).toBe("/admin/users/custom");
      user = new User({
        id: 1
      });
      expect(user.url()).toBe("/admin/users/1");
      User.scope = function() {
        return "/roots/1";
      };
      expect(User.url()).toBe("/roots/1/users");
      expect(user.url()).toBe("/roots/1/users/1");
      expect(user.url("custom")).toBe("/roots/1/users/1/custom");
      RSpine.Model.host = "http://example.com";
      expect(User.url()).toBe("http://example.com/roots/1/users");
      return expect(user.url()).toBe("http://example.com/roots/1/users/1");
    });
    it("can gather scope for the url from a model instance", function() {
      var user;
      RSpine.Model.host = "";
      expect(User.url()).toBe("/users");
      user = new User({
        id: 1
      });
      user.scope = "admin";
      expect(user.url()).toBe("/admin/users/1");
      user.scope = function() {
        return "/roots/1";
      };
      expect(User.url()).toBe("/users");
      expect(user.url()).toBe("/roots/1/users/1");
      expect(user.url("custom")).toBe("/roots/1/users/1/custom");
      RSpine.Model.host = "http://example.com";
      expect(User.url()).toBe("http://example.com/users");
      return expect(user.url()).toBe("http://example.com/roots/1/users/1");
    });
    it("should allow the scope for url on model to be superseeded by an instance", function() {
      var user;
      RSpine.Model.host = "";
      User.scope = "admin";
      expect(User.url()).toBe("/admin/users");
      user = new User({
        id: 1
      });
      expect(user.url()).toBe("/admin/users/1");
      user.scope = function() {
        return "/roots/1";
      };
      expect(User.url()).toBe("/admin/users");
      expect(user.url()).toBe("/roots/1/users/1");
      RSpine.Model.host = "http://example.com";
      expect(User.url()).toBe("http://example.com/admin/users");
      return expect(user.url()).toBe("http://example.com/roots/1/users/1");
    });
    it("should work with relative urls", function() {
      var user;
      User.url = "../api/user";
      expect(RSpine.Ajax.getURL(User)).toBe("../api/user");
      user = new User({
        id: 1
      });
      return expect(RSpine.Ajax.getURL(user)).toBe("../api/user/1");
    });
    return it("should get the collection url from the model instance", function() {
      var user;
      RSpine.Model.host = "";
      User.scope = "admin";
      user = new User({
        id: 1
      });
      expect(RSpine.Ajax.getCollectionURL(user)).toBe("/admin/users");
      user.scope = "/root";
      expect(RSpine.Ajax.getCollectionURL(user)).toBe("/root/users");
      user.scope = function() {
        return "/roots/" + this.id;
      };
      return expect(RSpine.Ajax.getCollectionURL(user)).toBe("/roots/1/users");
    });
  });

}).call(this);
