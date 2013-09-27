describe "Offline Model", ->
  User = null;

  beforeEach ->
    User = RSpine.Model.setup("User", ["first", "last"]);

  it "can extend an object in runtime", ->
    RSpine.Model.OfflineModel.decorate( [ User ] )
    expect(RSpine.offlineModels.length).toEqual 1
    User.autoFetch = true
    
    spyOn(User, "localFetch")
    RSpine.Model.OfflineModel.initialize()
    expect(User.localFetch).toHaveBeenCalled()

describe "Offline Model", ->
  User = null;

  beforeEach ->
 
    User = RSpine.Model.setup("User", ["first", "last"]);
    User.extend(RSpine.Model.OfflineModel);

  it "can save to localstorage" , ->
    User.create(first: "name")
    expect(localStorage["User"].indexOf("name")).toBeGreaterThan(-1)
    
  it "can load from localStorage" , ->
    User.destroyAll()
    User.localFetch()
    expect(User.count()).toEqual 1
  
  it "can clean all offline data" , ->
    User.localDestroyAll()
    expect(User.count()).toEqual 0
    
  it "can can load bulk from query" , ->
    User.destroyAll()
    User.refresh([ {"first":"name1"} , {"first":"name2"} ])
    expect(User.count()).toEqual 2
    User.trigger "querySuccess"
    expect(localStorage["User"].indexOf("name1")).toBeGreaterThan(-1)
    expect(localStorage["User"].indexOf("name2")).toBeGreaterThan(-1)



