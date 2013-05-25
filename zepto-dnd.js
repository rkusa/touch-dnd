!function($) {  
  var Dragging = function() {
    this.eventHandler = $('<div />')
    this.origin = this.element = null
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
    this.element = el
    this.eventHandler.trigger('start')
    return this.element
  }
  
  Dragging.prototype.stop = function() {
    this.origin = this.element = null
    this.eventHandler.trigger('stop')
  }
  
  var dragging = new Dragging()
  
  var Draggable = function(element, opts) {
    this.element  = $(element)
    this.opts     = opts
    this.cancel   = opts.handle !== false
  }
  
  Draggable.prototype.create = function() {
    this.element
    .on('dragstart', $.proxy(this.start, this))
    .on('dragend', $.proxy(this.end, this))
    .prop('draggable', true)

    // Prevents dragging from starting on specified elements.
    this.element
    .on('mouseenter', this.opts.cancel, $.proxy(this.disable, this))
    .on('mouseleave', this.opts.cancel, $.proxy(this.enable, this))
    
    if (this.opts.handle) {
      this.element
      .on('mouseenter', this.opts.handle, $.proxy(this.enable, this))
      .on('mouseleave', this.opts.handle, $.proxy(this.disable, this))
    }
    
    this.element.trigger('create')
  }
  
  Draggable.prototype.destroy = function() {
    this.element
    .off('dragstart', this.start)
    .off('dragend', this.end)
    .prop('draggable', false)
    
    this.element
    .on('mouseenter', this.opts.cancel, this.disable)
    .on('mouseleave', this.opts.cancel, this.enable)
    
    if (this.opts.handle) {
      this.element
      .on('mouseenter', this.opts.handle, this.enable)
      .on('mouseleave', this.opts.handle, this.disable)
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
    
    e.dataTransfer.effectAllowed = 'copy'
    
    dragging.start(this, this.element).addClass('dragging')
  }
  
  Draggable.prototype.end = function(e) {
    e.stopPropagation()
    e.preventDefault()
    
    if (!dragging.element) return
    
    // revert
    this.element.removeClass('dragging')
    dragging.stop()
    // state.placeholder = state.dragging = null
  }
  
  var Droppable = function(element, opts) {
    this.element = $(element)
    this.opts    = opts
    this.accept  = false
  }
  
  Droppable.prototype.create = function() {
    this.element
    .on('dragover',  $.proxy(this.over, this))
    .on('dragenter', $.proxy(this.enter, this))
    .on('dragleave', $.proxy(this.leave, this))
    .on('drop',      $.proxy(this.drop, this))
    
    dragging
    .on('start', $.proxy(this.activate, this))
    .on('stop',  $.proxy(this.reset, this))
    
    this.element.trigger('create')
  }
  
  Droppable.prototype.destroy = function() {
    this.element
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
              || (typeof this.opts.accept === 'function' ? this.opts.accept(dragging.element)
                                                         : dragging.element.is(this.opts.accept))
    if (this.opts.scope !== 'default') {
      this.accept = dragging.origin.opts.scope === this.opts.scope
      if (!this.accept && this.opts.accept !== '*') this.accept = accept
    } else this.accept = accept
    
    if (!this.accept) return
    if (this.opts.activeClass)
      this.element.addClass(this.opts.activeClass)
    
    this.element.trigger('activate', dragging.element)
  }
  
  Droppable.prototype.reset = function(e) {
    if (!this.accept) return
    if (this.opts.activeClass) this.element.removeClass(this.opts.activeClass)
    
    this.element.trigger('deactivate', dragging.element)
  }
  
  Droppable.prototype.enter = function(e) {
    if (this.opts.disabled) return false
    
    e.stopPropagation()
    
    // state.placeholder = null
    
    if (this.opts.hoverClass && this.accept)
      this.element.addClass(this.opts.hoverClass)
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
      this.element.removeClass(this.opts.hoverClass)
  }
  
  Droppable.prototype.drop = function(e) {
    if (this.opts.disabled) return false
    
    e.stopPropagation() // stops the browser from redirecting.
    // e.preventDefault()
    
    if (!dragging.element) return
    
    // $(this).removeClass(opts.hoverClass)
    dragging.element.removeClass('dragging')
    
    if (e.dataTransfer.effectAllowed === 'copy')
      dragging.element = dragging.element.clone()

    $(this.element).append(dragging.element.show())
      
    // that.trigger('receive', { item: dragging })

    dragging.stop()
    // placeholder = dragging = null
  }
  
  function generic(constructor, identifier, defaults) {
    return function(opts, name, value) {
      var result = []
      this.each(function() {
        if (typeof opts === 'string') {
          var instance = $(this).data(identifier)
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
          }
        } else {
          var instance = new constructor($(this), $.extend({}, defaults, opts))
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
}(Zepto || jQuery)