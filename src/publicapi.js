/*********************************************************
 * The actual jQuery plugin and document ready handlers.
 ********************************************************/

//The publicy exposed method of jQuery.prototype, available (and meant to be
//called) on jQuery-wrapped HTML DOM elements.
jQuery.fn.mathquill = function(cmd, latex) {
  switch (cmd) {
  case 'redraw':
    return this.each(function() {
      var blockId = $(this).attr(mqBlockId),
        rootBlock = blockId && MathElement[blockId];
      if (rootBlock) {
        (function postOrderRedraw(el) {
          el.eachChild(postOrderRedraw);
          if (el.redraw) el.redraw();
        }(rootBlock));
      }
    });
  case 'revert':
    return this.each(function() {
      var blockId = $(this).attr(mqBlockId),
        block = blockId && MathElement[blockId];
      if (block && block.revert)
        block.revert();
    });
  case 'latex':
    if (arguments.length > 1) {
      //HACK support mathbb. 
      //TODO: It may not a good fix. Rethink of this.
      //-*- start
      latex = transform(latex);
      //-*- end
      return this.each(function() {
        var blockId = $(this).attr(mqBlockId),
          block = blockId && MathElement[blockId];
        if (block)
          block.renderLatex(latex);
      });
    }

    var blockId = $(this).attr(mqBlockId),
      block = blockId && MathElement[blockId];
    return block && block.latex();
  case 'text':
    var blockId = $(this).attr(mqBlockId),
      block = blockId && MathElement[blockId];
    return block && block.text();
  case 'html':
    return this.html().replace(/ ?hasCursor|hasCursor /, '')
      .replace(/ class=(""|(?= |>))/g, '')
      .replace(/<span class="?cursor( blink)?"?><\/span>/i, '')
      .replace(/<span class="?textarea"?><textarea><\/textarea><\/span>/i, '');
  case 'write':
    if (arguments.length > 1)
      return this.each(function() {
        var blockId = $(this).attr(mqBlockId),
          block = blockId && MathElement[blockId],
          cursor = block && block.cursor;

        if (cursor)
          cursor.writeLatex(latex).parent.blur();
      });
  case 'cmd':
    if (arguments.length > 1)
      return this.each(function() {
        var blockId = $(this).attr(mqBlockId),
          block = blockId && MathElement[blockId],
          cursor = block && block.cursor;

        if (cursor) {
          var seln = cursor.prepareWrite();
          if (/^\\[a-z]+$/i.test(latex)) cursor.insertCmd(latex.slice(1), seln);
          else cursor.insertCh(latex, seln);
          cursor.hide().parent.blur();
        }
      });
  //HACK - provide method to select all math blocks--
  //[Bug][Calculate tab] Step should remain in input editor
  //https://redmine.orientsoftware.net/issues/9189
  //add start
  case 'selectAll':
    return this.each(function() {
      var blockId = $(this).attr(mqBlockId), block = blockId && MathElement[blockId], cursor = block && block.cursor;
      if (cursor) {
        if (block !== block.cursor.root)
          return;
        block.cursor.prepareMove().insAtRightEnd(block);
        while (block.cursor[L])
          block.cursor.selectLeft(); 
      }
    }); 
  case 'backspace':
    return this.each(function() {
      var blockId = $(this).attr(mqBlockId), block = blockId && MathElement[blockId];
      block.cursor.backspace(); 
    });
  case 'clear':
    return this.each(function() {
      var blockId = $(this).attr(mqBlockId), rootBlock = blockId && MathElement[blockId];
      if (rootBlock) {
        rootBlock.cursor.backspace();
      }
  });
  case 'showCursorAfter':
    return this.each(function(){
      var blockId = $(this).attr(mqBlockId),
        block = blockId && MathElement[blockId],
        cursor = block && block.cursor;
        if (latex == "end"){
          block.cursor.prepareMove().insAtRightEnd(block);
          return;
        } else if (latex == "start"){
          block.cursor.prepareMove().insAtLeftEnd(block);
          return;
        }
        block.cursor.prepareMove().insAtLeftEnd(block);
        while (cursor[R]){
          cursor = cursor[R];
          if (cursor.ctrlSeq == latex){
            block.cursor.seek(cursor.jQ);
            return;
          }
        }
  });
  // for purpose: do something after a key is pressed
  case 'setOnKeyDownFn' :
    this.each(function() {
      var blockId = $(this).attr(mqBlockId), block = blockId && MathElement[blockId];
      block.onKeyDownFns = latex;
    }); 
    return ;
  //add end 
  // for purpose: do something after the inputed text changes
  case 'setOnTextCallBackFns' :
    this.each(function() {
      var blockId = $(this).attr(mqBlockId), block = blockId && MathElement[blockId];
      block.onTextCallBackFns = latex;
    }); 
    return ;
  //add end 
  case 'multilanguage':
    switch(latex){
      case 'cdot':
        CharCmds['*'] = LatexCmds.sdot = LatexCmds.cdot = bind(BinaryOperator, '\\cdot ', '&middot;');
        LatexCmds[':'] = LatexCmds['÷'] = LatexCmds.div = LatexCmds.divide = LatexCmds.divides = bind(BinaryOperator, ':', ':', '[/]');
        break;
      default :
        CharCmds['*'] = LatexCmds.times = bind(BinaryOperator, '\\times ', '&times;', '[x]');
        LatexCmds[':'] = LatexCmds['÷'] = LatexCmds.div = LatexCmds.divide = LatexCmds.divides = bind(BinaryOperator, '\\div ', '&divide;', '[/]');
    }
    break;
  case 'getCursor':
    var blockId = $(this).attr(mqBlockId), block = blockId && MathElement[blockId];
    var times = latex;
    return block.cursor;
  //add end    
  default:
    var textbox = cmd === 'textbox',
      editable = textbox || cmd === 'editable',
      RootBlock = textbox ? RootTextBlock : RootMathBlock;
    return this.each(function() {
      createRoot($(this), RootBlock(), textbox, editable);
    });
  }
};

//on document ready, mathquill-ify all `<tag class="mathquill-*">latex</tag>`
//elements according to their CSS class.
jQuery(function() {
  jQuery('.mathquill-editable:not(.mathquill-rendered-math)').mathquill('editable');
  jQuery('.mathquill-textbox:not(.mathquill-rendered-math)').mathquill('textbox');
  jQuery('.mathquill-embedded-latex').mathquill();
});

