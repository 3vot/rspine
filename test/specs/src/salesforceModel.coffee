describe "Salesforce Model", ->
  User = null;

  beforeEach ->
    User = RSpine.Model.setup("User", ["first", "last"]);

  it "can extend an object in runtime", ->
    RSpine.Model.SalesforceModel.decorate( [ User ] )
    expect(User.getQuery).toBeDefined()
    expect(RSpine.salesforceModels.length).toEqual 1
    User.autoQuery = true
    
    spyOn(User, "fetch")
    RSpine.Model.SalesforceModel.initialize()
    expect(User.fetch).toHaveBeenCalled()

describe "Salesforce Model", ->
  User = null;


  beforeEach ->
 
    User = RSpine.Model.setup("User", ["first", "last"]);
    User.extend(RSpine.Model.SalesforceModel);

    User.filters=
      ""         : "IsContable__c = 'true' and IsContado__c = false" 
      "conSaldo" : "Con_Saldo__c = 'true'"
      "clienteId": "Cliente__c = '?'"

  it "can parse to JSON", ->
    user = User.create first: "first", last: "last"
    jsonString =  JSON.stringify user.toJSON()
    expect(jsonString).toEqual('{"fields":{"first__c":"first","last__c":"last"},"id":"c-0","objtype":"User__c"}');

  it "can parse from single JSON " , ->
    users = User.fromJSON({"first":"first","last":"last"})
    expect(users.toString().indexOf("first")).toBeGreaterThan(0)
    
  it "can parse from arrayJSON " , ->
    users = User.fromJSON([{"first":"first","last":"last"}, {"first":"first2","last":"last2"} ])
    expect(users.toString().indexOf("first")).toBeGreaterThan(0)
    expect(users.toString().indexOf("first2")).toBeGreaterThan(0)
    
  it "can get a Default QueryString ", ->
    filter = User.getQuery();
    expect(filter).toEqual("select first__c,last__c,Id  from User__c  where IsContable__c = 'true' and IsContado__c = false");

  it "can get a QueryString with and and or", ->
    filter = User.getQuery([{"":true},{ conSaldo: true }, {clienteId:3,junction:"or"} ]);
    expect(filter).toEqual("select first__c,last__c,Id  from User__c  where IsContable__c = 'true' and IsContado__c = false and Con_Saldo__c = 'true' or Cliente__c = '3'");

  it "can get a QueryString with and and or and order", ->
    filter = User.getQuery([{"":true},{ conSaldo: true, junction: "and" }, {clienteId:3,junction:"or"}, {orderBy: "Cliente__c DESC"} ]);
    expect(filter).toEqual("select first__c,last__c,Id  from User__c  where IsContable__c = 'true' and IsContado__c = false and Con_Saldo__c = 'true' or Cliente__c = '3' ORDER Cliente__c DESC");

  it "can format as SObject", -> 
    user = User.create( { first: "roberto" } );
    formated = JSON.stringify(user.sobjectFormat());
    index = formated.indexOf("roberto")
    expect(index > -1).toBeTruthy();


  it "can format as SObject with ID", ->
    user = User.create( { first: "roberto" } );
    formated = JSON.stringify(user.sobjectFormat(true));
    index = formated.indexOf("Id")
    expect(index > -1).toBeTruthy();

  
  it "can format SOBJECT JSON ", ->
    user = User.create( { first: "roberto" } );
    formated =  JSON.stringify(user.toJSON()) ;
    index = formated.indexOf("roberto")
    expect(index > -1).toBeTruthy();


  it "can format SOBJECT JSON with ID", ->
    user = User.create( { first: "roberto" } );
    formated =  JSON.stringify(user.toJSON(true)) ;
    index = formated.indexOf("Id")
    expect(index > -1).toBeTruthy();

