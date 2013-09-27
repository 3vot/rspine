#Offline Model Init must be called before SalesforceModel

RSpine  = @RSpine or require('rspine')
RSpine.offlineModels = [] if !RSpine.offlineModels

RSpine.Model.OfflineModel =

  initialize: ->
    for model in RSpine.offlineModels
      model.localFetch() if model.autoFetch

  decorate: (klassOrKlasses) ->
    klassOrKlasses = [klassOrKlasses] if Object::toString.call(klassOrKlasses) is not '[object Array]'
    @performDecoration(klass) for klass in klassOrKlasses

  performDecoration: (klass) ->
    klass.extend RSpine.Model.OfflineModel

  extended: ->
    @change @saveLocal
    @bind "querySuccess" , @saveBulkLocal
    RSpine.offlineModels.push @
    
    @extend
      autoFetch   :  if typeof @autoFetch == "undefined" then false else @autoFetch

      localFetch: ->
        RSpine.Model.OfflineModel.loadLocal.call(@)

      localDestroyAll: ->
        localStorage[@className] = []

  saveBulkLocal: ->
    @beforeSaveLocal?()
    result = JSON.stringify(@all())
    localStorage[@className] = result

  saveLocal: ->
    @beforeSaveLocal?()
    result = JSON.stringify(@)
    localStorage[@className] = result

  loadLocal: ->
    result = localStorage[@className]
    @refresh(result or [], clear: true)
    @afterLoadLocal?()

module?.exports = RSpine.Model.OfflineModel
