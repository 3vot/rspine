RSpine = @RSpine or require('rspine')

RSpine.Model.Local =
  extended: ->
    @change @saveLocal
    @fetch @loadLocal

  saveLocal: ->
    result = JSON.stringify(@)
    localStorage[@className] = result

  loadLocal: (options = {})->
    options.clear = true unless options.hasOwnProperty('clear')
    result = localStorage[@className]
    @refresh(result or [], options)

module?.exports = RSpine.Model.Local