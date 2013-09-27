RSpine  = @RSpine or require('rspine')
$      = RSpine.$

class RSpine.Manager extends RSpine.Module
  @include RSpine.Events

  constructor: ->
    @controllers = []
    @bind 'change', @change
    @add(arguments...)

  add: (controllers...) ->
    @addOne(cont) for cont in controllers

  addOne: (controller) ->
    controller.bind 'active', (args...) =>
      @trigger('change', controller, args...)
    controller.bind 'release', =>
      @controllers.splice(@controllers.indexOf(controller), 1)

    @controllers.push(controller)

  deactivate: ->
    @trigger('change', false, arguments...)

  # Private

  change: (current, args...) ->
    for cont in @controllers when cont isnt current
      cont.deactivate(args...)

    current.activate(args...) if current

RSpine.Controller.include
  active: (args...) ->
    if typeof args[0] is 'function'
      @bind('active', args[0])
    else
      args.unshift('active')
      @trigger(args...)
    @

  isActive: ->
    @el.hasClass('active')

  activate: ->
    @el.addClass('active')
    @

  deactivate: ->
    @el.removeClass('active')
    @

class RSpine.Stack extends RSpine.Controller
  controllers: {}
  routes: {}

  className: 'rspine stack'

  constructor: ->
    super

    @manager = new RSpine.Manager

    for key, value of @controllers
      throw Error "'@#{ key }' already assigned - choose a different name" if @[key]?
      @[key] = new value(stack: @)
      @add(@[key])

    for key, value of @routes
      do (key, value) =>
        callback = value if typeof value is 'function'
        callback or= => @[value].active(arguments...)
        @route(key, callback)

    @[@default].active() if @default

  add: (controller) ->
    @manager.add(controller)
    @append(controller)

module?.exports = RSpine.Manager
module?.exports.Stack = RSpine.Stack
