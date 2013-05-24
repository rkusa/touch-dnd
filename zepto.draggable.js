!function($) {
  var Draggable = function(element, opts) {
    this.element  = $(element)
    this.opts     = opts
    this.cancel   = opts.handle !== false
    this.dragging = null
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
    
    this.element.addClass('dragging')
  }
  
  Draggable.prototype.end = function(e) {
    e.stopPropagation()
    e.preventDefault()
    
    if (!this.dragging) return
    
    // revert
    this.element.removeClass('dragging')
    // state.placeholder = state.dragging = null
  }
  
  
  var nextId = 0, state = { dragging: null, origin: 0 }
  $.fn.draggable = function(opts, name, value) {
    var result = []
    this.each(function() {
      if (typeof opts === 'string') {
        var draggable = $(this).data('draggable')
        switch (opts) {
        case 'enable':  draggable.enable();  break
        case 'disable': draggable.disable(); break
        case 'destroy':
          draggable.destroy()
          $(this).removeData('draggable')
          break
        case 'option':
          // set
          if (value !== undefined)
            draggable.opts[name] = value  
          else if (typeof name === 'object')
            draggable.opts = $.extend(draggable.opts, name)
          // get
          else if (name)
            result.push(draggable.opts[name])
          else
            result.push(draggable.opts)
          break
        }
      } else {
        var draggable = new Draggable($(this), $.extend({
          cancel: 'input, textarea, button, select, option',
          cursor: 'auto',
          handle: false,
          initialized: false
        }, opts))
        draggable.create()
        $(this).data('draggable', draggable)
      }
    })
    
    if (result.length)
      return result.length === 1 ? result[0] : result
    else
      return this
  }
}(Zepto || jQuery)