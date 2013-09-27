(function() {
  describe("Offline Model", function() {
    var User;
    User = null;
    beforeEach(function() {
      return User = RSpine.Model.setup("User", ["first", "last"]);
    });
    return it("can extend an object in runtime", function() {
      RSpine.Model.OfflineModel.decorate([User]);
      expect(RSpine.offlineModels.length).toEqual(1);
      User.autoFetch = true;
      spyOn(User, "localFetch");
      RSpine.Model.OfflineModel.initialize();
      return expect(User.localFetch).toHaveBeenCalled();
    });
  });

  describe("Offline Model", function() {
    var User;
    User = null;
    beforeEach(function() {
      User = RSpine.Model.setup("User", ["first", "last"]);
      return User.extend(RSpine.Model.OfflineModel);
    });
    it("can save to localstorage", function() {
      User.create({
        first: "name"
      });
      return expect(localStorage["User"].indexOf("name")).toBeGreaterThan(-1);
    });
    it("can load from localStorage", function() {
      User.destroyAll();
      User.localFetch();
      return expect(User.count()).toEqual(1);
    });
    it("can clean all offline data", function() {
      User.localDestroyAll();
      return expect(User.count()).toEqual(0);
    });
    return it("can can load bulk from query", function() {
      User.destroyAll();
      User.refresh([
        {
          "first": "name1"
        }, {
          "first": "name2"
        }
      ]);
      expect(User.count()).toEqual(2);
      User.trigger("querySuccess");
      expect(localStorage["User"].indexOf("name1")).toBeGreaterThan(-1);
      return expect(localStorage["User"].indexOf("name2")).toBeGreaterThan(-1);
    });
  });

}).call(this);
