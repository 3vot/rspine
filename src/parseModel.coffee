RSpine  = @RSpine or require('rspine')
RSpine.parseModels = [] if !RSpine.parseModels

RSpine.Model.ParseModel =
      
  initialize: ->
    for model in RSpine.parseModels  
      model.fetch() if model.autoQuery

  decorate: (klassOrKlasses) ->
    klassOrKlasses = [klassOrKlasses] if Object::toString.call(klassOrKlasses) is not '[object Array]'
    @performDecoration(klass) for klass in klassOrKlasses

  performDecoration: (klass) ->
    klass.extend RSpine.Model.ParseModel

  extended: ->
    @extend
      lastUpdate            :  new Date(1000)

      fromJSON: (objects) ->
        return unless objects

        objects = JSON.parse(objects) if typeof objects is 'string'
        objects = objects.results if objects.results

        if RSpine.isArray(objects)
          for value in objects
            value.id = value.objectId if value.objectId 
            lastChange = value.updatedAt or value.createdAt
            cDate = if lastChange then new Date(lastChange) else new Date(1000)
            @lastUpdate = cDate if cDate > @lastUpdate.getTime()
            obj = new @(value)
            obj
        else
          value.id = value.objectId if value.objectId
          new @(objects)

module?.exports = RSpine.Model.ParseModel