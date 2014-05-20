!function($) {
  var START_EVENT = 'mousedown touchstart MSPointerDown pointerdown'
    , END_EVENT   = 'mouseup touchend MSPointerUp pointerup'

  function translate(el, x, y) {
    vendorify('transform', el, 'translate(' + x + 'px, ' + y + 'px)')
  }

  function transition(el, val) {
    vendorify('transition', el, val)
  }

  function vendorify(property, el, val) {
    property = property.toLowerCase()
    var titleCased = property.charAt(0).toUpperCase() + property.substr(1)
    var vendorPrefixes = ['webkit', 'Moz', 'ms', 'O']
    var properties = vendorPrefixes.map(function(prefix) {
      return prefix + titleCased
    }).concat('transform')
    for (var i = 0, len = properties.length; i < len; ++i) {
      if (properties[i] in el.style) {
        if (val !== undefined) el.style[properties[i]] = val
        else return el.style[properties[i]]
        break
      }
    }
  }

  var nextId = 0
  var Dragging = function() {
    this.eventHandler = $('<div />')
    this.parent = this.el = null
    this.origin = { x: 0, y: 0, transition: null, translate: null, offset: { x: 0, y: 0 } }
    this.lastEntered = this.currentTarget = null
    this.lastX = this.lastY = this.lastDirection = null

    var placeholder
    Object.defineProperty(this, 'placeholder', {
      get: function() { return placeholder },
      set: function(val) {
        if (placeholder === val) return
        if (placeholder) placeholder.remove()
        placeholder = val
      }
    })
  }

  Dragging.prototype.on = function() {
    this.eventHandler.on.apply(this.eventHandler, Array.prototype.slice.call(arguments))
    return this
  }

  Dragging.prototype.off = function() {
    this.eventHandler.off.apply(this.eventHandler, Array.prototype.slice.call(arguments))
    return this
  }

  Dragging.prototype.start = function(parent, el, e) {
    this.parent = parent
    this.el = el
    this.el.css('-ms-touch-action', 'none').css('touch-action', 'none')
    this.origin.x = window.event && window.event.changedTouches && event.changedTouches[0].pageX || e.pageX
    this.origin.y = window.event && window.event.changedTouches && event.changedTouches[0].pageY || e.pageY
    this.origin.transform  = vendorify('transform', this.el[0])
    this.origin.transition = vendorify('transition', this.el[0])
    var rect = this.el[0].getBoundingClientRect()
    this.origin.offset.x = rect.left - this.origin.x
    this.origin.offset.y = rect.top - this.origin.y
    // the draged element is going to stick right under the cursor
    // setting the css property `pointer-events` to `none` will let
    // the pointer events fire on the elements underneath the helper
    this.el[0].style.pointerEvents = 'none'
    $(document).on('mousemove touchmove MSPointerMove pointermove', $.proxy(this.move, this))
    transition(this.el[0], '')
    this.eventHandler.trigger('dragging:start')
    return this.el
  }

  Dragging.prototype.stop = function(e, revert) {
    if (this.last) {
      var last = this.last
      this.last = null
      $(last).trigger('dragging:drop', e)
    }
    if (!this.el) return
    if (revert === undefined) revert = true
    if (revert) {
      transition(this.el[0], 'all 0.5s ease-in-out 0s')
      setTimeout(vendorify.bind(null, 'transition', this.el[0], this.origin.transition), 500)
    }
    vendorify('transform', this.el[0], this.origin.transform || 'translate(0, 0)')
    this.el[0].style.pointerEvents = 'auto'
    $(document).off('mousemove touchmove MSPointerMove pointermove', this.move)
    this.eventHandler.trigger('dragging:stop')
    this.parent = this.el = this.placeholder = null
  }

  Dragging.prototype.move = function(e) {
    if (!this.el) return

    var clientX = e.clientX || window.event.touches[0].clientX
      , clientY = e.clientY || window.event.touches[0].clientY
    var over = document.elementFromPoint(clientX, clientY)

    var deltaX = this.lastX - clientX
      , deltaY = this.lastY - clientY
      , direction = Math.abs(deltaX) > Math.abs(deltaY) && deltaX > 0 && 'left'
                 || Math.abs(deltaX) > Math.abs(deltaY) && deltaX < 0 && 'right'
                 || Math.abs(deltaY) > Math.abs(deltaX) && deltaY > 0 && 'up'
                 || 'down'
    if (over !== this.last && $(over).trigger('dragging:identify') && this.lastEntered !== this.currentTarget) {
      $(this.currentTarget).trigger('dragging:enter')
      $(this.lastEntered).trigger('dragging:leave')
      this.lastEntered = this.currentTarget
    } else if (direction !== this.lastDirection) {
      if (!this.currentTarget) $(over).trigger('dragging:identify')
      $(this.currentTarget).trigger('dragging:diverted')
    }
    this.last = over
    this.currentTarget = null
    this.lastDirection = direction
    this.lastX = clientX
    this.lastY = clientY

    var deltaX = (window.event && window.event.changedTouches && event.changedTouches[0].pageX || e.pageX) - this.origin.x
      , deltaY = (window.event && window.event.changedTouches && event.changedTouches[0].pageY || e.pageY) - this.origin.y
    translate(this.el[0], deltaX, deltaY)
  }

  Dragging.prototype.setCurrent = function(target) {
    this.currentTarget = target
  }

  var dragging = $.dragging = parent.$.dragging || new Dragging()

  // from https://github.com/rkusa/jquery-observe
  var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver
  var Observer = function(target, selector, onAdded, onRemoved) {
    var self    = this
    this.target = target

    var childsOnly = selector[0] === '>'
      , search = childsOnly ? selector.substr(1) : selector

    function apply(nodes, callback) {
      Array.prototype.slice.call(nodes).forEach(function(node) {
        if (childsOnly && self.target[0] !== $(node).parent()[0]) return
        if ($(node).is(search)) callback.call(node)
        if (childsOnly) return
        $(selector, node).each(function() {
          callback.call(this)
        })
      })
    }

    this.observer = new MutationObserver(function(mutations) {
      self.disconnect()

      mutations.forEach(function(mutation) {
        if (onAdded)   apply(mutation.addedNodes,   onAdded)
        if (onRemoved) apply(mutation.removedNodes, onRemoved)
      })

      self.observe()
    })

    // call onAdded for existing elements
    $(selector, target).each(function() {
      onAdded.call(this)
    })

    this.observe()
  }

  Observer.prototype.disconnect = function() {
    this.observer.disconnect()
  }

  Observer.prototype.observe = function() {
    this.observer.observe(this.target[0], { childList: true, subtree: true })
  }

  var Draggable = function(element, opts) {
    this.id     = nextId++
    this.el     = $(element)
    this.opts   = opts
    this.cancel = opts.handle !== false

    this.connectedWith = []
    if (this.opts.connectWith) {
      this.connectWith(this.opts.connectWith)
    }
  }

  Draggable.prototype.connectWith = function(connectWith) {
    var self = this
    $(connectWith).each(function() {
      var el = $(this)
      if (el[0] === self.el[0]) return
      var instance = el.data('sortable') || el.data('droppable')
      if (instance) instance.connectedWith.push(self.id)
      else {
        el.one('sortable:create droppable:create', function(e, instance) {
          instance.connectedWith.push(self.id)
        })
      }
    })
  }

  Draggable.prototype.create = function() {
    this.el
    .on(START_EVENT, $.proxy(this.start, this))

    var self = this
    setTimeout(function() {
      self.el.trigger('draggable:create', self)
    })
  }

  Draggable.prototype.destroy = function() {
    this.el.off(START_EVENT, this.start)
  }

  Draggable.prototype.enable = function() {
    this.opts.disabled = false
  }

  Draggable.prototype.disable = function() {
    this.opts.disabled = true
  }

  Draggable.prototype.start = function(e) {
    if (this.opts.disabled) return false

    e = e.originalEvent || e // zepto <> jquery compatibility
    e.preventDefault() // prevent text selection

    if (this.opts.cancel) {
      var target = $(e.target)
      while (target[0] !== this.el[0]) {
        if (target.is(this.opts.cancel)) return false
        target = target.parent()
      }
    }

    if (this.opts.handle) {
      var target = $(e.target), isHandle = false
      while (target[0] !== this.el[0]) {
        if (target.is(this.opts.handle)) {
          isHandle = true
          break
        }
        target = target.parent()
      }
      if (!isHandle) return false
    }

    var el = this.el;
    if (this.opts.clone) {
      el = el.clone();
      el.insertAfter(this.el);
    }

    dragging.start(this, el, e)
    $(document).on(END_EVENT, $.proxy(this.end, this))
  }

  Draggable.prototype.end = function(e) {
    // e.stopPropagation()
    // e.preventDefault()

    // revert
    $(document).off(END_EVENT, this.end)
    dragging.stop(e)
  }

  var Droppable = function(element, opts) {
    this.id            = nextId++
    this.el            = $(element)
    this.opts          = opts
    this.accept        = false
    this.connectedWith = []
  }

  Droppable.prototype.create = function() {
    this.el
    .on('dragging:enter', $.proxy(this.enter, this))
    .on('dragging:leave', $.proxy(this.leave, this))
    .on('dragging:drop',  $.proxy(this.drop, this))

    dragging
    .on('dragging:start', $.proxy(this.activate, this))
    .on('dragging:stop',  $.proxy(this.reset, this))

    var self = this
    setTimeout(function() {
      self.el.trigger('droppable:create', self)
    })
  }

  Droppable.prototype.destroy = function() {
    this.el
    .off('dragging:enter', this.enter)
    .off('dragging:leave', this.leave)
    .off('dragging:drop',  this.drop)

    // Todo: Fix Zepto Bug
    // dragging
    // .off('dragging:start', this.activate)
    // .off('dragging:stop',  this.reset)
  }

  Droppable.prototype.enable = function() {
    this.opts.disabled = false
  }

  Droppable.prototype.disable = function() {
    this.opts.disabled = true
  }

  Droppable.prototype.activate = function(e) {
    this.accept = this.connectedWith.indexOf(dragging.parent.id) !== -1
    if (!this.accept) {
      var accept = this.opts.accept === '*'
                || (typeof this.opts.accept === 'function' ? this.opts.accept.call(this.el[0], dragging.el)
                                                           : dragging.el.is(this.opts.accept))
      if (this.opts.scope !== 'default') {
        this.accept = dragging.parent.opts.scope === this.opts.scope
        if (!this.accept && this.opts.accept !== '*') this.accept = accept
      } else this.accept = accept
    }

    if (!this.accept) return
    if (this.opts.activeClass)
      this.el.addClass(this.opts.activeClass)

    this.el.trigger('droppable:activate', { item: dragging.el })
  }

  Droppable.prototype.reset = function(e) {
    if (!this.accept) return
    if (this.opts.activeClass) this.el.removeClass(this.opts.activeClass)
    if (this.opts.hoverClass)  this.el.removeClass(this.opts.hoverClass)

    this.el.trigger('droppable:deactivate', { item: dragging.el })
  }

  Droppable.prototype.enter = function(e) {
    if (this.opts.disabled) return false

    e.stopPropagation()

    // hide placeholder, if set (e.g. enter the droppable after
    // entering a sortable)
    if (dragging.placeholder) dragging.placeholder.hide()

    if (!this.accept) return

    if (this.opts.hoverClass)
      this.el.addClass(this.opts.hoverClass)

    this.el.trigger('droppable:over', { item: dragging.el })
  }

  Droppable.prototype.leave = function(e) {
    if (this.opts.disabled) return false
    // e.stopPropagation()

    if (this.opts.hoverClass && this.accept)
      this.el.removeClass(this.opts.hoverClass)

    this.el.trigger('droppable:out', { item: dragging.el })
  }

  Droppable.prototype.drop = function(e, originalEvent) {
    if (this.opts.disabled || !this.accept) return false

    if (!dragging.el) return

    // zepto <> jquery compatibility
    var el = dragging.el
    dragging.stop(originalEvent, false)

    var item = this.opts.clone ? el.clone() : el
    $(this.el).append(item)

    this.el.trigger('droppable:drop', { item: item, draggable: el })
  }

  var Sortable = function(element, opts) {
    this.id   = nextId++
    this.el   = element
    this.opts = opts

    var tag
    try {
      tag = this.el.find(this.opts.items)[0].tagName
    } catch(e) {
      tag = /^ul|ol$/i.test(this.el.tagName) ? 'li' : 'div'
    }

    this.placeholder = $('<' + tag + ' class="' + this.opts.placeholder + '" />')

    this.accept = this.index = this.direction = null
    this.connectedWith = []
    if (this.opts.connectWith) {
      this.connectWith(this.opts.connectWith)
    }
  }

  Sortable.prototype.connectWith = Draggable.prototype.connectWith

  Sortable.prototype.create = function() {
    this.el
    .on(START_EVENT,         this.opts.items, $.proxy(this.start, this))
    .on('dragging:identify', this.opts.items, $.proxy(this.identify, this))
    .on('dragging:enter',    this.opts.items, $.proxy(this.enter, this))
    .on('dragging:diverted', this.opts.items, $.proxy(this.diverted, this))
    .on('dragging:drop',     this.opts.items, $.proxy(this.drop, this))

    this.el
    .on('dragging:identify', $.proxy(this.identify, this))
    .on('dragging:enter',    $.proxy(this.enter, this))
    .on('dragging:diverted', $.proxy(this.diverted, this))
    .on('dragging:drop',     $.proxy(this.drop, this))

    dragging
    .on('dragging:start', $.proxy(this.activate, this))
    .on('dragging:stop',  $.proxy(this.reset, this))

    var self = this
    setTimeout(function() {
      self.el.trigger('sortable:create', self)
    })

    this.observer = new Observer(this.el, this.opts.items, function() {
    }, function() {
      if (this === self.placeholder[0] || (dragging.el && this === dragging.el[0])) return
      var item = $(this)
      self.el.trigger('sortable:change', { item: item })
      self.el.trigger('sortable:update', { item: item, index: -1 })
    })
  }

  Sortable.prototype.destroy = function() {
    this.el
    .off(START_EVENT,         this.opts.items, this.start)
    .off('dragging:identify', this.opts.items, this.identify)
    .off('dragging:enter',    this.opts.items, this.enter)
    .off('dragging:diverted', this.opts.items, this.diverted)
    .off('dragging:drop',     this.opts.items, this.drop)

    this.el
    .off('dragging:identify', this.identify)
    .off('dragging:enter',    this.enter)
    .off('dragging:diverted', this.diverted)
    .off('dragging:drop',     this.drop)

    // Todo: Fix Zepto Bug
    // dragging
    // .off('dragging:start', this.activate)
    // .off('dragging:stop',  this.reset)

    this.observer.disconnect()
  }

  Sortable.prototype.enable = function() {
    this.opts.disabled = false
  }

  Sortable.prototype.disable = function() {
    this.opts.disabled = true
  }

  Sortable.prototype.activate = function(e) {
    this.accept  = dragging.parent.id === this.id
                   || !!~this.connectedWith.indexOf(dragging.parent.id)
    this.isEmpty = this.el.find(this.opts.items).length === 0

    if (!this.accept) return

    this.accept = dragging.parent.id === this.id
      || this.opts.accept === '*'
      || (typeof this.opts.accept === 'function'
        ? this.opts.accept.call(this.el[0], dragging.el)
        : dragging.el.is(this.opts.accept))

    if (!this.accept) return

    if (this.opts.activeClass)
      this.el.addClass(this.opts.activeClass)

    this.el.trigger('sortable:activate', dragging.el)
  }

  Sortable.prototype.reset = function(e) {
    if (!this.accept) return
    if (this.opts.activeClass) this.el.removeClass(this.opts.activeClass)

    this.el.trigger('sortable:deactivate', dragging.el)
  }

  Sortable.prototype.start = function(e) {
    if (this.opts.disabled) return

    if (this.opts.cancel) {
      var target = $(e.target)
      while (target[0] !== this.el[0]) {
        if (target.is(this.opts.cancel)) return
        target = target.parent()
      }
    }

    if (this.opts.handle) {
      var target = $(e.target), isHandle = false
      while (target[0] !== this.el[0]) {
        if (target.is(this.opts.handle)) {
          isHandle = true
          break
        }
        target = target.parent()
      }
      if (!isHandle) return
    }

    e.stopPropagation()
    e.preventDefault() // prevent text selection

    // use e.currentTarget instead of e.target because we want the target
    // the event is bound to, not the target (child) the event is triggered from
    dragging.start(this, $(e.currentTarget), e)
    $(document).on(END_EVENT, $.proxy(this.end, this))

    this.index = dragging.el.index()

    if (this.opts.forcePlaceholderSize) {
      this.placeholder.height(dragging.el.height())
      this.placeholder.width(dragging.el.width())
    }

    this.el.trigger('sortable:start', { item: dragging.el })
  }

  Sortable.prototype.identify = function(e) {
    if (dragging.currentTarget) return
    dragging.setCurrent(e.currentTarget)
  }

  Sortable.prototype.enter = function(e) {
    if (!this.accept || this.opts.disabled) return

    e.stopPropagation()

    // stop if event is fired on the placeholder
    var child = e.currentTarget, isContainer = child === this.el[0]
    if (child === this.placeholder[0]) return
    child = $(child)

    // the container fallback is only necessary for empty sortables
    if (isContainer && !this.isEmpty && this.placeholder.parent().length)
      return

    if (this.opts.forcePlaceholderSize) {
      this.placeholder.height(dragging.el.height())
      // this.placeholder.width(dragging.el.width())
    }

    var initialized = true
    if (!this.placeholder.parent().length) {
      initialized = false
      this.el.append(dragging.placeholder = this.placeholder)

      // if dragging an item that belongs to the current list, hide it while
      // it is being dragged
      if (this.index !== null) {
        this.el.append(dragging.el)
      }
    }

    if (!isContainer) {
      // insert the placeholder according to the dragging direction
      this.direction = this.placeholder.show().index() < child.index() ? 'down' : 'up'
      child[this.direction === 'down' ? 'after' : 'before'](this.placeholder)

      translate(dragging.el[0], 0, 0)
      var rect = dragging.el[0].getBoundingClientRect()
      dragging.origin.x = rect.left - dragging.origin.offset.x
      dragging.origin.y = rect.top  - dragging.origin.offset.y
      var deltaX = e.pageX - dragging.origin.x
        , deltaY = e.pageY - dragging.origin.y
      translate(dragging.el[0], deltaX, deltaY)
    } else {
      this.el.append(this.placeholder)
    }

    if (!initialized) return

    this.el.trigger('sortable:change', { item: dragging.el })
  }

  Sortable.prototype.diverted = function(e) {
    e.stopPropagation()

    var child = $(e.currentTarget), isContainer = child[0] === this.el[0]
    if (isContainer) return

    // insert the placeholder according to the dragging direction
    this.direction = this.placeholder.show().index() < child.index() ? 'down' : 'up'
    child[this.direction === 'down' ? 'after' : 'before'](this.placeholder)

    translate(dragging.el[0], 0, 0)
    var rect = dragging.el[0].getBoundingClientRect()
    dragging.origin.x = rect.left - dragging.origin.offset.x
    dragging.origin.y = rect.top  - dragging.origin.offset.y
    var deltaX = e.pageX - dragging.origin.x
      , deltaY = e.pageY - dragging.origin.y
    translate(dragging.el[0], deltaX, deltaY)
  }

  Sortable.prototype.end = function(e) {
    e.stopPropagation()
    e.preventDefault()

    if (!dragging.el) return

    this.el.trigger('sortable:beforeStop', { item: dragging.el })

    // revert
    dragging.el.insertBefore(this.el.find(this.opts.items).get(this.index))
    $(document).off(END_EVENT, this.end)
    dragging.stop(e)
    this.el.trigger('dragging:stop')

    this.index = null
  }

  Sortable.prototype.drop = function(e, originalEvent) {
    if (!this.accept || this.opts.disabled) return

    e.stopPropagation()
    e.preventDefault()

    if (!dragging.el) return

    this.observer.disconnect()

    dragging.el.insertBefore(this.placeholder).show()

    // remove placeholder to be able to calculate new index
    dragging.placeholder = null

    // if the dropped element belongs to another list, trigger the receive event
    var newIndex = dragging.el.index()
    if (this.index === null) { // dropped element belongs to another list
      // if (dragging.parent instanceof Draggable)
      //   dragging.parent.destroy()

      this.el.trigger('sortable:receive', { item: dragging.el })
      this.el.trigger('sortable:update', { item: dragging.el, index: newIndex })
    }
    // if the index changed, trigger the update event
    else if (newIndex !== this.index) {
      this.el.trigger('sortable:update', { item: dragging.el, index: newIndex })
    }

    this.el.trigger('sortable:beforeStop', { item: dragging.el })
    if (dragging.parent instanceof Sortable) {
      dragging.parent.index = null
      dragging.parent.el.trigger('dragging:stop')
    }

    // revert
    $(document).off(END_EVENT, this.end)
    dragging.stop(originalEvent, false)
    this.el.trigger('dragging:stop')

    this.observer.observe()
  }

  Sortable.prototype.toArray = function(opts) {
    if (!opts) opts = {}
    var attr = opts.attribute || 'id', attrs = []
    this.el.find(this.opts.items).each(function() {
      attrs.push($(this).prop(attr))
    })
    return attrs
  }

  function generic(constructor, identifier, defaults) {
    return function(opts, name, value) {
      var result = []
      this.each(function() {
        var instance = $(this).data(identifier)
        if (typeof opts === 'string') {
          if (typeof instance === 'undefined')
            throw new Error(identifier + ' not defined')
          switch (opts) {
          case 'enable':  instance.enable();  break
          case 'disable': instance.disable(); break
          case 'destroy':
            instance.destroy()
            $(this).removeData(identifier)
            break
          case 'option':
            // set
            if (value !== undefined)
              instance.opts[name] = value
            else if (typeof name === 'object')
              instance.opts = $.extend(instance.opts, name)
            // get
            else if (name)
              result.push(instance.opts[name])
            else
              result.push(instance.opts)
            break
          // case 'serialize':
          //   if (identifier !== 'sortable') return
          //   result.push(instance.serialize())
          //   break
          case 'toArray':
            if (identifier !== 'sortable') return
            result.push(instance.toArray(name))
            break
          }
        } else {
          if (instance) {
            $.extend(instance.opts, opts) // merge options
            return this
          }
          instance = new constructor($(this), $.extend({}, defaults, opts))
          instance.create()
          $(this).data(identifier, instance)
        }
      })

      if (result.length)
        return result.length === 1 ? result[0] : result
      else
        return this
    }
  }

  $.fn.draggable = generic(Draggable, 'draggable', {
    cancel: 'input, textarea, button, select, option',
    connectWith: false,
    cursor: 'auto',
    disabled: false,
    handle: false,
    initialized: false,
    clone: false,
    scope: 'default'
  })

  $.fn.droppable = generic(Droppable, 'droppable', {
    accept: '*',
    activeClass: false,
    disabled: false,
    hoverClass: false,
    initialized: false,
    clone: false,
    scope: 'default'
  })

  $.fn.sortable = generic(Sortable, 'sortable', {
    accept: '*',
    activeClass: false,
    cancel: 'input, textarea, button, select, option',
    connectWith: false,
    disabled: false,
    forcePlaceholderSize: false,
    handle: false,
    initialized: false,
    items: 'li, div',
    placeholder: 'placeholder'
  })
}(window.Zepto || window.jQuery)