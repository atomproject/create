(function(document) {
  'use strict';
  let statesFireRef = new Firebase('https://atom-builder.firebaseio.com/states');

  /*** url manipulation helpers ***/
  function parseUrlSearch(search) {
    search = search[0] === '?' ? search.slice(1) : search;
    let params = search.split('&');

    if (!params) {
      return {};
    }

    search = {};
    params.forEach(param => {
      param.replace(/([^=]+)=(.+)$/, (m, key, val) => search[key] = val);
    });

    return search;
  }

  function getQueryParam(key) {
    return parseUrlSearch(window.location.search)[key];
  }

  function setQueryParam(key, value) {
    let search = parseUrlSearch(window.location.search);
    search[key] = value;

    let searchStr = Object.keys(search)
      .map(key => key && search[key] ? `${key}=${search[key]}` : '')
      .join('&');

    searchStr = searchStr ? `?${searchStr}` : '';

    let parser = document.createElement('a');
    parser.href = window.location.href;
    parser.search = searchStr;

    return parser.href;
  }
  /********************************/

  function recreateStage(stage, stateFile) {
    if (!stage) {
      return;
    }

    stage.reset();
    stage.recreateBuilder(stateFile);
  }

  function getStateFile(stage) {
    if (!stage) {
      return;
    }

    let builderState = stage.builderState;
    let states = stage._elementSateList;

    return stage.getStateFile(builderState, states);
  }

  function showToast(str) {
    app.$.toast.text = str.toString();
    app.$.toast.open();
  }

  function setupStageEventListeners() {
    let stage = document.querySelector('t-stage');
    let codePreview = document.querySelector('code-preview');

    stage.addEventListener('builder-name-changed', event => {
      $('.headerText').text(event.detail.name);
    });

    stage.addEventListener('component-panel-changed', event => {
      let name = event.detail.name;
      let panelSettings = document.getElementById('panelSettings');

      panelSettings.disabled = (name === 't-page' || name === 't-form');
    });

    function disableSave() {
      $('#saveState')[0].disabled  = !stage.isDirty;
    }

    function disablePreview() {
      codePreview.disabled = stage.isEmpty;
    }

    disableSave();
    disablePreview();

    stage.addEventListener('is-dirty-changed', disableSave);
    stage.addEventListener('is-empty-changed', disablePreview);
  }

  function setupToolbarEventListeners() {
    let stage = document.querySelector('t-stage');

    // trigger the click on the input element with `type='file'`
    $('#uploadJson').on('click', function() {
      $('#uploadInput')[0].click();
    });

    $('#saveState').on('click', function() {
      Promise.resolve(getStateFile(stage))
        .then(stateFile => stateFile && statesFireRef.push(stateFile))
        .then(newDataRef => {
          let url = setQueryParam('id', newDataRef.key());
          window.history.pushState({}, '', url);
          stage.resetDirty();
        });
    });

    $('#canvasRefresh').on('click', function() {
      try {
        let stateFile = getStateFile(stage);
        localStorage.setItem('atom-refresh', stateFile);
      } catch (exception) {
      } finally {
        window.location.reload();
      }
    });

    // triggered when user selects a file, read the file and reset the builder
    $('#uploadInput').on('change', function() {
      let files = Array.from(this.files);
      let stateFile = files.find(file => file.name.match(/^[^\.]+\.json/i));

      if (!stateFile) {
        showToast('Not a json file. You can only upload a json file.');

        return;
      }

      let reader = new FileReader();
      let statusText = 'Builder restored to the state.json successfully.';
      reader.addEventListener('load', function(ev) {
        try {
          recreateStage(stage, ev.target.result);
        } catch (exception) {
          statusText = 'The syntax of state file is not valid.';
        }

        showToast(statusText);
      });

      reader.readAsText(stateFile);
    });


    // create the zip file and and download it
    $('#downloadZip').on('click', function() {
      let zip = new JSZip();

      if (!stage) {
        return;
      }

      stage.getDownloadFiles()
        .then(files => {
          zip.file(files.name, files.builderFile);
          zip.file('state.json', files.stateFile);
          zip.file('bower.json', files.bowerFile);

          if (files.demoFile) {
            zip.folder('demo').file('index.html', files.demoFile);
          }

          let content = zip.generate({ type: 'blob' });
          saveAs(content, files.name.replace('.html', '.zip'));
        })
        .catch(reason => showToast(reason));
    });

    $('#downloadJson').on('click', function() {
      try {
        let stateFile = getStateFile(stage);
        let content = new Blob([stateFile], {type: 'text/plain;charset=utf-8'});
        saveAs(content, 'state.json');
      } catch (exception) {
        showToast(exception.toString());
      }
    });

    $('#panelSettings').on('click', function() {
      stage.showPanelForBuilder();
    });
  }

  function setupHeaderEventListeners() {
    let stage = document.querySelector('t-stage');

    $('.headerText').on('keydown', function(e) {
      if (e.which === 13) {
        $(this).blur();
        // workaround for webkit's bug
        window.getSelection().removeAllRanges();
      }
    });

    // select the header text on focus
    $('.headerText').on('focus', function() {
      let el = this;

      function selectElementContents(el) {
        let range = document.createRange();
        range.selectNodeContents(el);
        let sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      }

      $(this).removeClass('inactive');
      requestAnimationFrame(() => selectElementContents(el));
    });

    // update the builder attributes on focus out and reset the text
    $('.headerText').on('blur', function() {
      let heading = $(this).text().trim();
      let name = heading.toLowerCase().replace(/\s+/g, '-');
      let $this = $(this);

      if (heading.length === 0) {
        if ($this.hasClass('form-header')) {
          $this.text('Untitled Form');
        } else {
          $this.text('Untitled Page');
        }
      } else {
        stage.updatePath({path: 'heading', value: heading, useBuilder: true});
        stage.updatePath({path: 'name', value: name, useBuilder: true});
      }

      this.scrollLeft = 0;
      $this.addClass('inactive');
    });
  }

  function setupMenuEventListeners() {
    let stage = document.querySelector('t-stage');

    // draggable menu items setup
    $('.control').draggable({
      addClasses: false,
      scroll: false,
      appendTo: 'body',
      helper: 'clone',
      cursor: 'move',
      revert: 'invalid'
    });

    // append form elements to form on click
    $('body').on('click', '.control', function(event) {
      let category = event.currentTarget.getAttribute('data-category');
      let name = event.currentTarget.getAttribute('data-component');

      stage.addToBuilder(name, category);
    });

    // TODO: what does this do?
    $('.component-list').on('click', 'paper-item.menu-item', function() {
      $('.component-list').toggleClass('active');
    });
  }

  function restoreStageState() {
    let stage = document.querySelector('t-stage');
    let codePreview = document.querySelector('code-preview');
    let stateId = getQueryParam('id');
    let stateFile = localStorage.getItem('atom-refresh');
    let statePromise;

    codePreview.stage = stage;
    localStorage.removeItem('atom-refresh');

    if (stateFile) {
      recreateStage(stage, stateFile);
    }
    else if (stateId) {
      statePromise = statesFireRef.child(stateId).once('value')
        .then(newDataRef => recreateStage(stage, newDataRef.val()));
    }
    else if (localStorage.getItem('atom-preview')) {
      stateFile = localStorage.getItem('atom-preview');
      recreateStage(stage, stateFile);
      localStorage.removeItem('atom-preview');
    }

    // Okay, so we want the id in url, if it is there, to remain
    // there until user __actually__ changes something. Now since
    // component panel generates change events even for initial values
    // (the values from property.json) we have to distinguish between
    // user interactions and other auto generated events. So, we only
    // consider removing the id in url once the state to be restored has
    // been resolved.
    (statePromise || Promise.resolve())
      .catch(() => {})
      .then(() => {
        // now we have the state to which the canvas/stage will be restored to
        stage.resetDirty();

        // remove the id from url if state has changed (this is indicated
        // by the `stage.isDirty` variable)
        function removeId() {
          if (stage.isDirty && getQueryParam('id')) {
            let url = setQueryParam('id');
            window.history.pushState({}, '', url);
          }
        }

        function setupRemoveId() {
          removeId();
          // consider removing the id when state becomes dirty
          stage.addEventListener('is-dirty-changed', removeId);
        }

        // don't do any id removal and its setup until some user
        // interaction is detected
        $('body').one('click', setupRemoveId);

        // the colorpicker in component panel doesn't allow the click
        // events in it to bubble so we have to wait until the colorpicker
        // is available in dom (random timeout of `100ms`) and then setup
        // listenere directly on it
        setTimeout(() => {
          $('.sp-preview').one('click', setupRemoveId);
        }, 100);
      });

    window.onbeforeunload = () => {
      if (stage.isDirty &&
        !localStorage.getItem('atom-refresh') &&
        !localStorage.getItem('atom-preview')) {

        return 'All changes will be lost!';
      }
    };
  }

  function setupEventListeners() {
    setupStageEventListeners();
    setupToolbarEventListeners();
    setupHeaderEventListeners();
    setupMenuEventListeners();
    restoreStageState();
  }


  // Grab a reference to our auto-binding template
  // and give it some initial binding values
  // Learn more about auto-binding templates at http://goo.gl/Dx1u2g
  let pathname = window.location.pathname.replace('/create', '');

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
    app.tab ='page';
    app.route ='canvas';
  } else if (pathname === '/form') {
    app.builderType ='t-form';
    app.isPage = false;
    app.builderUrl = 'form-manifest.json';
    app.canvasName = 'Untitled Form';
    app.tab ='form';
    app.route ='canvas';

  } else if (pathname === '/') {
    app.tab ='form';
    app.route ='browser';
  }

  // Get elements for menu for a given category
  app._getElementsInCategory = function(category) {
    var elements = app.menu.elements.filter(element => {
      return element.category === category.name;
    });

    return elements;
  };

  app.filterComponents = function(searchTerm, category) {
    let filtered;

    if (!searchTerm) {
      return null;
    }

    if (!$('.component-list').hasClass('active')) {
      $('.component-list').addClass('active');
      $('#allElements').addClass('active');
    }

    if (!category) {
      filtered = app.menu.elements;
    } else {
      filtered = app.menu.elements.filter(el => el.category === category);
    }

    searchTerm = searchTerm.toLowerCase();

    return function(el) {
      let name = el.displayName.toLowerCase();

      return name.indexOf(searchTerm) !== -1;
    };
  };

  app._getIcon = function(icon) {
    return icon ? `fusion:${icon}` : 'fusion-b:atom-logo';
  };

  app._getPropertySource = function(){
    return `bower_components/${app.builderType}/property.json`;
  };

  //toggle accordion for menu
  app.toggleAccordion = function(e) {
    let currentElement = e.currentTarget;
    let activeItem = document.querySelector('.menu-item.active');

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
    setTimeout(setupEventListeners);
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
    if (!app.$.manifestAjax) {
      return;
    }

    app.$.manifestAjax.generateRequest();
  });

  // See https://github.com/Polymer/polymer/issues/1381
  window.addEventListener('WebComponentsReady', function() {
    var panel = $('t-component-panel')[0];
    var stage = $('t-stage')[0];

    stage.componentPanel = panel;
  });
})(document);
