# zepto-dnd

HTML5 Drag'n'Drop API based Draggable, Droppable and Sortable for [Zepto.js](https://github.com/madrobby/zepto) (and jQuery). For Zepto, you have to include its `data` module.

```json
{ "name": "zepto-dnd",
  "version": "0.2.1" }
```

**Status:** not well tested yet  
**Documentation:** [ma.rkusa.st/zepto-dnd](http://ma.rkusa.st/zepto-dnd)

#### Why?
I often use Draggables, Droppables and Sortables. Besides jQuery UI being way too heavyweight, I want the option to use Zepto. Additionally, I (most of the times) don't care about old/bad browsers. That's the reason why I wrote these native-HTML5-Drag'n'Drop-based Draggable, Droppable and Sortable. The result is sadly not as feature rich as the jQuery UI's counterparts (many - especially helper related - things are not possible using the DnD API) and also not as lightweight as planned. Latter will be improved eventually.

**If you need to support Internet Explorer, you can fall back on jQuery.** Note that conditional comments are no longer supported starting on IE 10, therefor Zepto's documentation recommends the following document.write approach:

```html
<script>
document.write('<script src=' +
('__proto__' in {} ? 'zepto' : 'jquery') +
'.js><\/script>')
</script>
```

## MIT License
Copyright (c) 2013 Markus Ast

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
