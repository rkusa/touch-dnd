!function($) {
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
    this.origin = { x: 0, y: 0, transition: null, translate: null }

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
    this.origin.x = e.pageX
    this.origin.y = e.pageY
    this.origin.transform  = vendorify('transform', this.el[0])
    this.origin.transition = vendorify('transition', this.el[0])
    // the draged element is going to stick right under the cursor
    // setting the css property `pointer-events` to `none` will let
    // the pointer events fire on the elements underneath the helper
    this.el[0].style.pointerEvents = 'none'
    $(document).on('mousemove touchmove', $.proxy(this.move, this))
    transition(this.el[0], '')
    this.eventHandler.trigger('dragging:start')
    return this.el
  }
  
  Dragging.prototype.stop = function(revert) {
    if (this.last) {
      var last = this.last
      this.last = null
      $(last).trigger('dragging:drop')
    }
    if (!this.el) return
    if (revert === undefined) revert = true
    if (revert) {
      transition(this.el[0], 'all 0.5s ease-in-out 0s')
      setTimeout(vendorify.bind(null, 'transition', this.el[0], this.origin.transition), 500)
    }
    vendorify('transform', this.el[0], this.origin.transform || 'translate(0, 0)')
    this.el[0].style.pointerEvents = 'auto'
    $(document).off('mousemove touchmove', this.move)
    this.parent = this.el = this.placeholder = null
    this.eventHandler.trigger('dragging:stop')
  }

  Dragging.prototype.move = function(e) {
    if (!this.el) return
    var clientX = e.clientX || event.touches[0].clientX
      , clientY = e.clientY || event.touches[0].clientY
    var over = document.elementFromPoint(clientX, clientY)
    if (over !== this.last) {
      $(over).trigger('dragging:enter', clientX, clientY)
      $(this.last).trigger('dragging:leave', clientX, clientY)
    }
    this.last = over
    var deltaX = e.pageX - this.origin.x
      , deltaY = e.pageY - this.origin.y
    translate(this.el[0], deltaX, deltaY)
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
      , target = $(connectWith)
      , context = window
    if (target[0].ownerDocument !== document) {
      context = target[0].ownerDocument.defaultView
    }
    context.$(connectWith).each(function() {
      var el = context.$(this)
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
    .on('mousedown touchstart', $.proxy(this.start, this))

    // Prevents dragging from starting on specified elements.
    this.el
    .on('mouseenter', this.opts.cancel, $.proxy(this.disable, this))
    .on('mouseleave', this.opts.cancel, $.proxy(this.enable, this))
    
    if (this.opts.handle) {
      this.el
      .on('mouseenter', this.opts.handle, $.proxy(this.enable, this))
      .on('mouseleave', this.opts.handle, $.proxy(this.disable, this))
    }
    
    var self = this
    setTimeout(function() {
      self.el.trigger('draggable:create', self)
    })
  }
  
  Draggable.prototype.destroy = function() {
    this.el
    .off('mousedown touchstart', this.start)
    
    this.el
    .off('mouseenter', this.opts.cancel, this.disable)
    .off('mouseleave', this.opts.cancel, this.enable)
    
    if (this.opts.handle) {
      this.el
      .off('mouseenter', this.opts.handle, this.enable)
      .off('mouseleave', this.opts.handle, this.disable)
    }
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
    
    dragging.start(this, this.el, e)
    $(document).on('mouseup touchend', $.proxy(this.end, this))
  }
  
  Draggable.prototype.end = function(e) {
    // e.stopPropagation()
    // e.preventDefault()
    
    // revert
    $(document).off('mouseup touchend', this.end)
    dragging.stop()
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
    
    this.el.trigger('droppable:activate', dragging.el)
  }
  
  Droppable.prototype.reset = function(e) {
    if (!this.accept) return
    if (this.opts.activeClass) this.el.removeClass(this.opts.activeClass)
    if (this.opts.hoverClass)  this.el.removeClass(this.opts.hoverClass)
    
    this.el.trigger('droppable:deactivate', dragging.el)
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
  }
  
  Droppable.prototype.leave = function(e) {
    if (this.opts.disabled) return false
    // e.stopPropagation()
    
    if (this.opts.hoverClass && this.accept)
      this.el.removeClass(this.opts.hoverClass)
  }
  
  Droppable.prototype.drop = function(e) {
    if (this.opts.disabled) return false
    
    e.stopPropagation() // stops the browser from redirecting.
    
    if (!dragging.el) return
    
    // zepto <> jquery compatibility
    var el = dragging.el
    dragging.stop(false)

    $(this.el).append(el.clone())
    
    this.el.trigger('droppable:receive', { item: el })
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
    
    this.accept = this.index = this.lastEntered = null
    this.lastX  = this.lastY = this.direction = null
    this.connectedWith = []
    if (this.opts.connectWith) {
      this.connectWith(this.opts.connectWith)
    }
  }

  Sortable.prototype.connectWith = Draggable.prototype.connectWith
  
  Sortable.prototype.create = function() {
    this.el
    .on('mousedown touchstart', this.opts.items, $.proxy(this.start, this))
    .on('dragging:enter', this.opts.items, $.proxy(this.enter, this))
    .on('dragging:drop',      this.opts.items, $.proxy(this.drop, this))
    .find(this.opts.items).prop('draggable', true)
    
    this.el
    .on('dragging:enter',  $.proxy(this.enter, this))
    .on('dragging:drop',       $.proxy(this.drop, this))
    .on('mouseenter', this.opts.cancel, $.proxy(this.disable, this))
    .on('mouseleave', this.opts.cancel, $.proxy(this.enable, this))
    
    if (this.opts.handle) {
      this.el
      .on('mouseenter', this.opts.handle, $.proxy(this.enable, this))
      .on('mouseleave', this.opts.handle, $.proxy(this.disable, this))
    }
    
    dragging
    .on('dragging:start', $.proxy(this.activate, this))
    .on('dragging:stop',  $.proxy(this.reset, this))
    
    var self = this
    setTimeout(function() {
      self.el.trigger('sortable:create', self)
    })
    
    this.observer = new Observer(this.el, this.opts.items, function() {
      $(this).prop('draggable', true)
    }, function() {
      var item = $(this)
      self.el.trigger('sortable:sort',   { item: item })
      self.el.trigger('sortable:update', { item: item, index: -1 })
      self.el.trigger('sortable:change', { item: item })
    })
  }
  
  Sortable.prototype.destroy = function() {
    this.el
    .off('mousedown touchstart', this.opts.items, this.start)
    .off('dragging:enter', this.opts.items, this.enter)
    .off('dragging:drop',      this.opts.items, this.drop)
    .find(this.opts.items).prop('draggable', false)
    
    this.el
    .off('dragging:enter',  this.enter)
    .off('dragging:drop',       this.drop)
    .off('mouseenter', this.opts.cancel, this.disable)
    .off('mouseleave', this.opts.cancel, this.enable)
    
    if (this.opts.handle) {
      this.el
      .off('mouseenter', this.opts.handle, this.enable)
      .off('mouseleave', this.opts.handle, this.disable)
    }
    
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

    this.accept = this.opts.accept === '*'
                || (typeof this.opts.accept === 'function' ? this.opts.accept.call(this.el[0], dragging.el)
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
    if (this.opts.disabled) return false
    
    e.stopPropagation()
    e.preventDefault() // prevent text selection
    
    dragging.start(this, $(e.target), e)
    $(document).on('mouseup touchend', $.proxy(this.end, this))

    this.index = dragging.el.index()
    
    if (this.opts.forcePlaceholderSize) {
      this.placeholder.height(dragging.el.height())
      this.placeholder.width(dragging.el.width())
    }
    
    this.el.trigger('dragging:start', { item: dragging.el })
  }
  
  Sortable.prototype.enter = function(e, x, y) {
    if (!this.accept || this.opts.disabled) return
    
    e.preventDefault()
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

    if (!this.placeholder.parent().length) {
      this.el.append(dragging.placeholder = this.placeholder.hide())
    }

    // if dragging an item that belongs to the current list, hide it while
    // it is being dragged
    if (this.index !== null) {
      // TODO
      // dragging.el.hide()
    }

    if (!isContainer) {
      // insert the placeholder according to the dragging direction
      this.direction = this.placeholder.show().index() < child.index() ? 'down' : 'up'
      child[this.direction === 'down' ? 'after' : 'before'](this.placeholder)
      if (child.index() <= this.index) {
        dragging.el.css('margin-top', dragging.el.height() * -1)
        dragging.el.css('margin-bottom', '')
      }
      else {
        dragging.el.css('margin-bottom', dragging.el.height() * -1)
        dragging.el.css('margin-top', '')
      }
    } else {
      this.el.append(this.placeholder)
    }

    this.el.trigger('sortable:sort', { item: dragging.el })
  }
  
  Sortable.prototype.end = function(e) {
    e.stopPropagation()
    e.preventDefault()

    if (!dragging.el) return
    
    this.el.trigger('sortable:beforeStop', { item: dragging.el })
    
    // revert
    dragging.el.css('margin-top', '')
    dragging.el.css('margin-bottom', '')
    $(document).off('mouseup touchend', this.end)
    dragging.stop()
    
    this.index = null
    this.el.trigger('dragging:stop')
  }
  
  Sortable.prototype.drop = function(e) {
    e.stopPropagation()
    e.preventDefault()
    
    if (!dragging.el) return
    
    // dragging.el = dragging.el.clone()
    
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
      
      // the receive event maybe inserted an element manually
      // if so, find it and make it draggable
      $(this.el.find(this.opts.items).get(newIndex)).prop('draggable', true)
    }
    // if the index changed, trigger the update event
    else if (newIndex !== this.index) {
      this.el.trigger('sortable:update', { item: dragging.el, index: newIndex })
    }
    
    this.el.trigger('sortable:change', { item: dragging.el })
    
    this.el.trigger('sortable:beforeStop', { item: dragging.el })
    if (dragging.parent instanceof Sortable) {
      dragging.parent.index = null
      dragging.parent.el.trigger('dragging:stop')
    }
    
    // revert
    dragging.el.css('margin-top', '')
    dragging.el.css('margin-bottom', '')
    $(document).off('mouseup touchend', this.end)
    dragging.stop(false)
    
    this.el.trigger('dragging:stop')
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
    connectedWith: false,
    cursor: 'auto',
    disabled: false,
    handle: false,
    initialized: false,
    scope: 'default'
  })
  
  $.fn.droppable = generic(Droppable, 'droppable', {
    accept: '*',
    activeClass: false,
    disabled: false,
    hoverClass: false,
    initialized: false,
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