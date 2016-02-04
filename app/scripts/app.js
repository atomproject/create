
(function(document) {
  'use strict';

  // Grab a reference to our auto-binding template
  // and give it some initial binding values
  // Learn more about auto-binding templates at http://goo.gl/Dx1u2g
  var app = document.querySelector('#app');
  var pathname = window.location.pathname.replace('/create', '');

  // Sets app default base URL
  app.baseUrl = '';
  app.menu = null;


  if (window.location.port === '') {
    app.baseUrl = '/create';
  }

  if (pathname === '/page') {
    app.builderType = 't-page';
    app.isPage = true;
    app.builderUrl = 'page-manifest.json';
    app.canvasName = 'Untitled Page';
    app.tab="page";
    app.route ='canvas';
  } else if (pathname === '/form') {
    app.builderType ='t-form';
    app.isPage = false;
    app.builderUrl = 'form-manifest.json';
    app.canvasName = 'Untitled Form';
    app.tab="form";
    app.route ='canvas';
  } else if (pathname === '/') {
    app.tab="form";
    app.route ='browser';
  }

  // Get elements for menu for a given category
  app._getElementsInCategory = function(category) {
    var elements = app.menu.elements.filter(function(element) {
      return element.category === category.name;
    });
    return elements;
  };

  app._getIcon = function(icon) {
    return icon ? 'fusion:' + icon : 'fusion-b:atom-logo';
  }

  app._getPropertySource = function(builderType){
    return 'bower_components/'+app.builderType+'/property.json';
  };

  //toggle accordion for menu
  app.toggleAccordion = function(e, item, element) {
    var currentElement = e.currentTarget;
    var activeItem = document.querySelector('.menu-item.active');

    if (currentElement.classList.contains('active')) {
      currentElement.classList.remove('active');
    } else {
      currentElement.classList.add('active');
    }

    if (activeItem) {
      activeItem.classList.remove('active');
    }

  };

  app._onElementsReceived = function(event){
    app.menu = event.detail.response;
    setTimeout(dragAndDropSetup);
  };

  app.displayInstalledToast = function() {
    // Check to make sure caching is actually enabled—it won't be in the dev environment.
    if (!Polymer.dom(document).querySelector('platinum-sw-cache').disabled) {
      Polymer.dom(document).querySelector('#caching-complete').show();
    }
  };

  // Listen for template bound event to know when bindings
  // have resolved and content has been stamped to the page
  app.addEventListener('dom-change', function() {
    if (!app.$.manifestAjax) return;
    app.$.manifestAjax.generateRequest();
  });

  // See https://github.com/Polymer/polymer/issues/1381
  window.addEventListener('WebComponentsReady', function() {
    var panel = $('t-component-panel')[0];
    var stage = $('t-stage')[0];

    stage.componentPanel = panel;
  });
})(document);
