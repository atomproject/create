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

window.dragAndDropSetup = () => {
  let statesFireRef = new Firebase('https://atom-builder.firebaseio.com/states');
  let stage = document.querySelector('t-stage');
  let codePreview = document.querySelector('code-preview');

  /*** evennt handlers for stage ***/
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

  function removeId() {
    if (stage.isDirty && getQueryParam('id')) {
      let url = setQueryParam('id');
      window.history.pushState({}, '', url);
    }
  }

  function dirtyChanged() {
    disableSave();
    removeId();
  }

  dirtyChanged();
  disablePreview();

  stage.addEventListener('is-dirty-changed', dirtyChanged);
  stage.addEventListener('is-empty-changed', disablePreview);
  /*********************************/

  // draggable menu items setup
  $('.control').draggable({
    addClasses: false,
    scroll: false,
    appendTo: 'body',
    helper: 'clone',
    cursor: 'move',
    revert: 'invalid'
  });

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

  /*** restore state of stage ***/
  let stateId = getQueryParam('id');
  let stateFile = localStorage.getItem('atom-refresh');

  codePreview.stage = stage;
  localStorage.removeItem('atom-refresh');

  if (stateFile) {
    recreateStage(stage, stateFile);
  }
  else if (stateId) {
    statesFireRef.child(stateId).once('value')
      .then(newDataRef => recreateStage(stage, newDataRef.val()));
  }
  else if (localStorage.getItem('atom-preview')) {
    stateFile = localStorage.getItem('atom-preview');
    recreateStage(stage, stateFile);
    localStorage.removeItem('atom-preview');
  }

  window.onbeforeunload = () => {
    if (stage.isDirty &&
      !localStorage.getItem('atom-refresh') &&
      !localStorage.getItem('atom-preview')) {

      return 'All changes will be lost!';
    }
  };
  /******************************/
};
