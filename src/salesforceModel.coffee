RSpine  = @RSpine or require('rspine')
RSpine.salesforceModels = [] if !RSpine.salesforceModels

RSpine.Model.SalesforceModel =
      
  initialize: ->
    for model in RSpine.salesforceModels 
      model.fetch() if model.autoQuery

  decorate: (klassOrKlasses) ->
    klassOrKlasses = [klassOrKlasses] if Object::toString.call(klassOrKlasses) is not '[object Array]'
    @performDecoration(klass) for klass in klassOrKlasses

  performDecoration: (klass) ->
    klass.extend RSpine.Model.SalesforceModel

  extended: ->
    RSpine.salesforceModels.push @

    @include
      
      sobjectFormat: (includeId=false) ->
        object = {}

        for key, value of @attributes()
          if @constructor.avoidInsertList.indexOf(key) > -1
            #Avoid sending key
          else if key == "id"
            object["Id"] = @[key] if includeId # normally we don't send key with fields ( SF )
          else
            object[key] = @[key] 
            
        return object
      
      toJSON: (includeId=false) ->
        type = @constructor.className
        obj = 
           fields: @sobjectFormat(includeId)
           id: @id
           objtype: type

        obj

    @extend
      filters               :  if typeof @filters == "undefined" then {} else @filters
      autoQuery             :  if typeof @autoQuery == "undefined" then false else @autoQuery
      avoidQueryList        :  if typeof @avoidQueryList == "undefined" then [] else @avoidQueryList
      avoidInsertList       :  if typeof @avoidInsertList == "undefined" then [] else @avoidInsertList
      querySinceLastUpdate  :  if typeof @querySinceLastUpdate == "undefined" then false else @querySinceLastUpdate
      useDefaultSession     :  if typeof @useDefaultSession == "undefined" then false else @useDefaultSession
      overrideClassName     :  if typeof @overrideClassName == "undefined" then null else @overrideClassName
      lastUpdate            :  new Date(1000)

      salesforceFormat: (items,includeId = false) =>
        items = [items] if !RSpine.isArray(items)
        objects = []
        for item in items
          objects.push item.sobjectFormat(includeId)
        objects

      fromJSON: (objects) ->
        return unless objects

        objects = JSON.parse(objects) if typeof objects is 'string'
        objects = objects.records if objects.records

        if RSpine.isArray(objects)
          for value in objects
            value.id = value.Id if value.Id
            cDate = if value.LastModifiedDate then new Date(value.LastModifiedDate) else new Date(1000)
            @lastUpdate = cDate if cDate > @lastUpdate.getTime()
            obj = new @(value)
            obj
        else
          value.id = value.Id if value.Id
          new @(objects)

      getQuery: (options = {"": true} ) =>
        options = [options] if !RSpine.isArray(options)
        
        #add Conditions based on Options
        return @queryString() + @getQueryCondition(options) 

      #each condition should be an object
      #condition values: {key:value , juntion: "and|or"} or { orderBy: "columnd DESC|ASC" }
      getQueryCondition: (conditions) ->
        return "" if Object.keys(@filters).length == 0

        stringFilters = []
        queryFilterString = ""
        orderFilterString = ""
        querySinceLastUpdated = @querySinceLastUpdate

        for filter in conditions
          filter.junction = "and" if !filter.junction
          filter.junction = "where" if stringFilters.length ==0
          
          filterKey= ""
          for key in Object.keys(filter)
            filterKey = key if key != "junction"
          
          querySinceLastUpdate = true if key == "sinceLastUpdate"
          querySinceLastUpdate = false if key == "avoidLastUpdate"

          if filterKey != "orderBy" and filterKey != "sinceLastUpdate" and key != "avoidLastUpdate"
            thisFilter = @filters[filterKey]
            thisFilter = thisFilter.replace("?",filter[filterKey]);
            stringFilters.push thisFilter
            queryFilterString += " #{filter.junction} #{thisFilter}"
          else if filterKey == "orderBy"
            orderFilterString = " ORDER #{filter[filterKey]}"

        queryFilterString = " and LastModifiedDate >= #{@lastUpdate}" if querySinceLastUpdated
        queryFilterString + orderFilterString
            
      queryString: () =>
        query = "select "
        for attribute in @attributes
          query += attribute + "," if @avoidQueryList?.indexOf(attribute) == -1            
            
        query += "Id  "
        query +=  "from #{@className}" 
        query += " "
        query


module?.exports = RSpine.Model.SalesforceModel