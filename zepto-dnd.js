!function($) {
  var nextId = 0
  var Dragging = function() {
    this.eventHandler = $('<div />')
    this.origin = this.el = null

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
  
  Dragging.prototype.start = function(origin, el) {
    this.origin = origin
    this.el = el
    this.eventHandler.trigger('start')
    return this.el
  }
  
  Dragging.prototype.stop = function() {
    this.origin = this.el = this.placeholder = null
    this.eventHandler.trigger('stop')
  }
  
  var dragging = new Dragging()
  
  var Draggable = function(element, opts) {
    this.id       = nextId++
    this.el  = $(element)
    this.opts     = opts
    this.cancel   = opts.handle !== false
    
    this.connectWith = []
    var self = this
    if (this.opts.connectToSortable) {
      $(this.opts.connectToSortable).each(function() {
        var el = $(this)
        var instance = el.data('sortable')
        if (instance) instance.connectWith.push(self.id)
        else {
          el.one('create', function(e, instance) {
            instance.connectWith.push(self.id)
          })
        }
      })
    }
  }
  
  Draggable.prototype.create = function() {
    this.el
    .on('dragstart', $.proxy(this.start, this))
    .on('dragend',   $.proxy(this.end, this))
    .prop('draggable', true)

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
      self.el.trigger('create', self)
    })
  }
  
  Draggable.prototype.destroy = function() {
    this.el
    .off('dragstart', this.start)
    .off('dragend',   this.end)
    .prop('draggable', false)
    
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
    
    e.originalEvent.dataTransfer.effectAllowed = 'copy'
    
    dragging.start(this, this.el).addClass('dragging')
  }
  
  Draggable.prototype.end = function(e) {
    e.stopPropagation()
    e.preventDefault()
    
    if (!dragging.el) return
    
    // revert
    this.el.removeClass('dragging')
    dragging.stop()
  }
  
  var Droppable = function(element, opts) {
    this.id      = nextId++
    this.el = $(element)
    this.opts    = opts
    this.accept  = false
  }
  
  Droppable.prototype.create = function() {
    this.el
    .on('dragover',  $.proxy(this.over, this))
    .on('dragenter', $.proxy(this.enter, this))
    .on('dragleave', $.proxy(this.leave, this))
    .on('drop',      $.proxy(this.drop, this))
    
    dragging
    .on('start', $.proxy(this.activate, this))
    .on('stop',  $.proxy(this.reset, this))
    
    var self = this
    setTimeout(function() {
      self.el.trigger('create', self)
    })
  }
  
  Droppable.prototype.destroy = function() {
    this.el
    .off('dragover',  this.over)
    .off('dragenter', this.enter)
    .off('dragleave', this.leave)
    .off('drop',      this.drop)
    
    // Todo: Fix Zepto Bug
    // dragging
    // .off('start', this.activate)
    // .off('stop',  this.reset)
  }
  
  Droppable.prototype.enable = function() {
    this.opts.disabled = false
  }
  
  Droppable.prototype.disable = function() {
    this.opts.disabled = true
  }
  
  Droppable.prototype.activate = function(e) {
    this.accept = false
    var accept = this.opts.accept === '*'
              || (typeof this.opts.accept === 'function' ? this.opts.accept(dragging.el)
                                                         : dragging.el.is(this.opts.accept))
    if (this.opts.scope !== 'default') {
      this.accept = dragging.origin.opts.scope === this.opts.scope
      if (!this.accept && this.opts.accept !== '*') this.accept = accept
    } else this.accept = accept
    
    if (!this.accept) return
    if (this.opts.activeClass)
      this.el.addClass(this.opts.activeClass)
    
    this.el.trigger('activate', dragging.el)
  }
  
  Droppable.prototype.reset = function(e) {
    if (!this.accept) return
    if (this.opts.activeClass) this.el.removeClass(this.opts.activeClass)
    if (this.opts.hoverClass)  this.el.removeClass(this.opts.hoverClass)
    
    this.el.trigger('deactivate', dragging.el)
  }
  
  Droppable.prototype.enter = function(e) {
    if (this.opts.disabled) return false
    
    e.stopPropagation()
    
    // dragging.placeholder = null
    
    if (this.opts.hoverClass && this.accept)
      this.el.addClass(this.opts.hoverClass)
  }
  
  Droppable.prototype.over = function(e) {
    if (this.opts.disabled) return
    
    e.stopPropagation()
    
    if (this.accept)
      e.preventDefault() // allow drop
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
    // e.preventDefault()
    
    if (!dragging.el) return
    
    dragging.el.removeClass('dragging')
    
    if (e.originalEvent.dataTransfer.effectAllowed === 'copy')
      dragging.el = dragging.el.clone()

    $(this.el).append(dragging.el.show())
      
    this.el.trigger('receive', { item: dragging.el })

    dragging.stop()
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
    this.lastX = this.lastY = this.direction = null
    
    this.connectWith = []
    var self = this
    if (this.opts.connectWith) {
      $(this.opts.connectWith).each(function() {
        var el = $(this)
        var instance = el.data('sortable')
        if (instance) instance.connectWith.push(self.id)
        else {
          el.one('create', function(e, instance) {
            instance.connectWith.push(self.id)
          })
        }
      })
    }
  }
  
  Sortable.prototype.create = function() {
    this.el
    .on('dragstart', this.opts.items, $.proxy(this.start, this))
    .on('dragenter', this.opts.items, $.proxy(this.enter, this))
    .on('dragover',  this.opts.items, $.proxy(this.over, this))
    .on('dragend',   this.opts.items, $.proxy(this.end, this))
    .on('drop',      this.opts.items, $.proxy(this.drop, this))
    .find(this.opts.items).prop('draggable', true)
    
    this.el
    .on('mouseenter', this.opts.cancel, $.proxy(this.disable, this))
    .on('mouseleave', this.opts.cancel, $.proxy(this.enable, this))
    
    if (this.opts.handle) {
      this.el
      .on('mouseenter', this.opts.handle, $.proxy(this.enable, this))
      .on('mouseleave', this.opts.handle, $.proxy(this.disable, this))
    }
    
    dragging
    .on('start', $.proxy(this.activate, this))
    
    var self = this
    setTimeout(function() {
      self.el.trigger('create', self)
    })
  }
  
  Sortable.prototype.destroy = function() {
    this.el
    .off('dragstart', this.opts.items, this.start)
    .off('dragenter', this.opts.items, this.enter)
    .off('dragover',  this.opts.items, this.over)
    .off('dragend',   this.opts.items, this.end)
    .off('drop',      this.opts.items, this.drop)
    .find(this.opts.items).prop('draggable', false)
    
    this.el
    .off('mouseenter', this.opts.cancel, this.disable)
    .off('mouseleave', this.opts.cancel, this.enable)
    
    if (this.opts.handle) {
      this.el
      .off('mouseenter', this.opts.handle, this.enable)
      .off('mouseleave', this.opts.handle, this.disable)
    }
    
    // Todo: Fix Zepto Bug
    // dragging
    // .off('start', this.activate)
  }
  
  Sortable.prototype.enable = function() {
    this.opts.disabled = false
  }
  
  Sortable.prototype.disable = function() {
    this.opts.disabled = true
  }
  
  Sortable.prototype.activate = function(e) {
    this.accept = dragging.origin.id === this.id
               || ~this.connectWith.indexOf(dragging.origin.id)
  }
  
  Sortable.prototype.start = function(e) {
    if (this.opts.disabled) return false
    
    e.stopPropagation()
    
    e.originalEvent.dataTransfer.effectAllowed = 'move'
    
    dragging.start(this, $(e.target)).addClass('dragging')
    this.index = dragging.el.index()
    
    if (this.opts.forcePlaceholderSize) {
      this.placeholder.height(dragging.el.height())
      this.placeholder.width(dragging.el.width())
    }
    
    this.el.trigger('start', { item: dragging.el })
  }
  
  Sortable.prototype.enter = function(e) {
    e.preventDefault()
    e.stopPropagation()
    
    if (!this.accept) return
    
    // stop if event is fired on the placeholder
    var child = e.currentTarget
    if (child === this.placeholder[0]) return
    
    if (this.opts.forcePlaceholderSize) {
      this.placeholder.height(dragging.el.height())
      // this.placeholder.width(dragging.el.width())
    }
    
    e = e.originalEvent
    // check if we entered another element or if we changed the dragging direction
    if (this.lastEntered === child) {
      if ((this.direction === 'down' && (e.clientY < this.lastY || e.clientX < this.lastX))
        || (this.direction === 'up' && (e.clientY > this.lastY || e.clientX > this.lastX)))
        this.lastEntered = null
      else
        return
    }
    this.lastEntered = child
    this.lastX = e.clientX
    this.lastY = e.clientY
    
    dragging.placeholder = this.placeholder.show()
    
    // if dragging an item that belongs to the current list, hide it while
    // it is being dragged
    if (this.index !== null)
      dragging.el.hide()
    
    // insert the placeholder according to the dragging direction
    this.direction = this.placeholder.index() < $(child).index() ? 'down' : 'up'
    $(child)[this.direction === 'down' ? 'after' : 'before'](this.placeholder)
    
    this.el.trigger('sort', { item: dragging.el })
  }
  
  Sortable.prototype.over = function(e) {
    if (!this.accept) return
    // This event specifies where the dragged data can be dropped.
    // Everywhere is fine:
    e.preventDefault()
    e.stopPropagation()
  }
  
  Sortable.prototype.end = function(e) {
    e.stopPropagation()
    e.preventDefault()

    if (!dragging.el) return
    
    this.el.trigger('beforeStop', { item: dragging.el })
    
    // revert
    dragging.el.removeClass('dragging').show()
    dragging.stop()
    
    this.index = null
    this.el.trigger('stop')
  }
  
  Sortable.prototype.drop = function(e) {
    e.stopPropagation()
    e.preventDefault()
    
    if (!dragging.el) return
    dragging.el.removeClass('dragging')
    
    if (e.originalEvent.dataTransfer.effectAllowed === 'copy')
      dragging.el = dragging.el.clone()
    
    dragging.el.insertBefore(this.placeholder).show()
    
    // remove placeholder to be able to calculate new index
    dragging.placeholder = null
    
    // if the dropped element belongs to another list, trigger the receive event
    var newIndex = dragging.el.index()
    if (this.index === null) { // dropped element belongs to another list
      // if (dragging.origin instanceof Draggable)
      //   dragging.origin.destroy()
      
      this.el.trigger('receive', { item: dragging.el })
      this.el.trigger('update', { item: dragging.el, index: newIndex })
      
      // the receive event maybe inserted an element manually
      // if so, find it and make it draggable
      $(this.el.find(this.opts.items).get(newIndex)).prop('draggable', true)
    }
    // if the index changed, trigger the update event
    else if (newIndex !== this.index) {
      this.el.trigger('update', { item: dragging.el, index: newIndex })
    }
    
    this.el.trigger('change', { item: dragging.el })
    
    this.el.trigger('beforeStop', { item: dragging.el })
    if (dragging.origin instanceof Sortable) {
      dragging.origin.index = null
      dragging.origin.el.trigger('stop')
    }
    
    dragging.stop()
    
    this.el.trigger('stop')
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
          case 'refresh':
            if (identifier !== 'sortable') return
            instance.element.find(instance.opts.items).prop('draggable', true)
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
          if (instance) return this // throw new Error(identifier + ' already defined')
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
    connectToSortable: false,
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