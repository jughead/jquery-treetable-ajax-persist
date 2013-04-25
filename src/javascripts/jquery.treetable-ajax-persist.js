(function($){
  $.extend({
    wrapCallbacks: function(){
      var args = [];
      for (var i = 0, l = arguments.length; i < l; i++) {
        if (typeof arguments[i] === "undefined" || arguments[i] === null) continue;
        if (arguments[i] instanceof Array)
          args.push($.wrapCallbacks(arguments[i]));
        else
          args.push(arguments[i]);
      }
      return function() {
        for (var i = 0, l = args.length; i < l; i++)
          args[i].apply(this);
      };
    }
  });
})(jQuery);


(function($){
  var fnc = function(options){
    var default_settings = {
      loadBranches: false, 
      persist: false
    };
    function defined(a) { return typeof a !== "undefined"; }
    options = $.extend(default_settings, options);
    var table = $(this);
    //table.addClass('treeTable');
    var persistStore;
    if (options.persist)
      persistStore = new Persist.Store(options.persistStoreName);

    var _needToExpand = [];
    var _needToCollapse = [];
    function setCollapseOrExpandNodeStateInStore(node, expanded)
    {
        if (!expanded)
          persistStore.remove(node.id);
        else
          persistStore.set(node.id, '1');
    }
    function updateNodeStates()
    {
      for (var i = 0, len = _needToExpand.length; i < len; i++)
        table.treetable("expandNode", _needToExpand[i]);
      for (var i = 0, len = _needToCollapse.length; i < len; i++)
        table.treetable("collapseNode", _needToCollapse[i]);
      _needToExpand.splice();
      _needToCollapse.splice();
    }
    function setCollapseOrExpandNodeStateInTreeTable(node)
    {
      var val = persistStore.get(node.id);
      if (val && !node.expanded())
      {
        if (typeof table.data("treetable") === "undefined")
          _needToExpand.push(node.id);
        else 
        {
          node.initialized = true; // patch
          node.expand();
        }
      }
      else if (val === null && node.expanded())
      {
        if (typeof table.data("treetable") === "undefined")
          _needToCollapse.push(node.id);
        else 
        {
          node.initialized = true; // patch
          node.collapse();
        }
      }
    }
    function onNodeInitialized() {
      if (options.persist)
        setCollapseOrExpandNodeStateInTreeTable(this);
    }
    function onNodeCollapse() {
      var node = this;
      if (options.persist)
        setCollapseOrExpandNodeStateInStore(node, false);
      if (options.loadBranches)
        table.treetable("unloadBranch", node);
    }
    function onNodeExpand() {
      var node = this;
      if (options.persist)
        setCollapseOrExpandNodeStateInStore(node, true);
      // Render loader/spinner while loading
      if (options.loadBranches)
      {
        $.ajax({
          async: false, // Must be false, otherwise loadBranch happens after showChildren?
          url: node.row.data('path')
        }).done(function(html) {
          var rows = $(html).find('tbody>tr');
          table.treetable("loadBranch", node, rows);
        });
      }
    }

    options.onNodeInitialized = $.wrapCallbacks(onNodeInitialized, options.onNodeInitialized);
    options.onNodeExpand = $.wrapCallbacks(onNodeExpand, options.onNodeExpand);
    options.onNodeCollapse = $.wrapCallbacks(onNodeCollapse, options.onNodeCollapse);
    options.onInitialized = $.wrapCallbacks(updateNodeStates, options.onInitialized);
    table.treetable($.extend({
      expandable: true,
    }, options));
    return this;
  };

  $.fn.extend({
    agikiTreeTable: function(options){
      return this.each(function(){ return fnc.call(this, options); });
    }
  });
})(jQuery);
