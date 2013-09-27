(function() {
  describe("Salesforce Model", function() {
    var User;
    User = null;
    beforeEach(function() {
      return User = RSpine.Model.setup("User", ["first", "last"]);
    });
    return it("can extend an object in runtime", function() {
      RSpine.Model.SalesforceModel.decorate([User]);
      expect(User.getQuery).toBeDefined();
      expect(RSpine.salesforceModels.length).toEqual(1);
      User.autoQuery = true;
      spyOn(User, "fetch");
      RSpine.Model.SalesforceModel.initialize();
      return expect(User.fetch).toHaveBeenCalled();
    });
  });

  describe("Salesforce Model", function() {
    var User;
    User = null;
    beforeEach(function() {
      User = RSpine.Model.setup("User", ["first", "last"]);
      User.extend(RSpine.Model.SalesforceModel);
      return User.filters = {
        "": "IsContable__c = 'true' and IsContado__c = false",
        "conSaldo": "Con_Saldo__c = 'true'",
        "clienteId": "Cliente__c = '?'"
      };
    });
    it("can parse to JSON", function() {
      var jsonString, user;
      user = User.create({
        first: "first",
        last: "last"
      });
      jsonString = JSON.stringify(user.toJSON());
      return expect(jsonString).toEqual('{"fields":{"first__c":"first","last__c":"last"},"id":"c-0","objtype":"User__c"}');
    });
    it("can parse from single JSON ", function() {
      var users;
      users = User.fromJSON({
        "first": "first",
        "last": "last"
      });
      return expect(users.toString().indexOf("first")).toBeGreaterThan(0);
    });
    it("can parse from arrayJSON ", function() {
      var users;
      users = User.fromJSON([
        {
          "first": "first",
          "last": "last"
        }, {
          "first": "first2",
          "last": "last2"
        }
      ]);
      expect(users.toString().indexOf("first")).toBeGreaterThan(0);
      return expect(users.toString().indexOf("first2")).toBeGreaterThan(0);
    });
    it("can get a Default QueryString ", function() {
      var filter;
      filter = User.getQuery();
      return expect(filter).toEqual("select first__c,last__c,Id  from User__c  where IsContable__c = 'true' and IsContado__c = false");
    });
    it("can get a QueryString with and and or", function() {
      var filter;
      filter = User.getQuery([
        {
          "": true
        }, {
          conSaldo: true
        }, {
          clienteId: 3,
          junction: "or"
        }
      ]);
      return expect(filter).toEqual("select first__c,last__c,Id  from User__c  where IsContable__c = 'true' and IsContado__c = false and Con_Saldo__c = 'true' or Cliente__c = '3'");
    });
    it("can get a QueryString with and and or and order", function() {
      var filter;
      filter = User.getQuery([
        {
          "": true
        }, {
          conSaldo: true,
          junction: "and"
        }, {
          clienteId: 3,
          junction: "or"
        }, {
          orderBy: "Cliente__c DESC"
        }
      ]);
      return expect(filter).toEqual("select first__c,last__c,Id  from User__c  where IsContable__c = 'true' and IsContado__c = false and Con_Saldo__c = 'true' or Cliente__c = '3' ORDER Cliente__c DESC");
    });
    it("can format as SObject", function() {
      var formated, index, user;
      user = User.create({
        first: "roberto"
      });
      formated = JSON.stringify(user.sobjectFormat());
      index = formated.indexOf("roberto");
      return expect(index > -1).toBeTruthy();
    });
    it("can format as SObject with ID", function() {
      var formated, index, user;
      user = User.create({
        first: "roberto"
      });
      formated = JSON.stringify(user.sobjectFormat(true));
      index = formated.indexOf("Id");
      return expect(index > -1).toBeTruthy();
    });
    it("can format SOBJECT JSON ", function() {
      var formated, index, user;
      user = User.create({
        first: "roberto"
      });
      formated = JSON.stringify(user.toJSON());
      index = formated.indexOf("roberto");
      return expect(index > -1).toBeTruthy();
    });
    return it("can format SOBJECT JSON with ID", function() {
      var formated, index, user;
      user = User.create({
        first: "roberto"
      });
      formated = JSON.stringify(user.toJSON(true));
      index = formated.indexOf("Id");
      return expect(index > -1).toBeTruthy();
    });
  });

}).call(this);
