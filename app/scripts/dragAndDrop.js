var dragAndDropSetup = function () {
  // draggable menu items setup
  $('.control').draggable({
    addClasses: false,
    scroll: false,
    appendTo: 'body',
    helper: 'clone',
    cursor: 'move',
    revert: 'invalid'
  });

  // trigger the click on the input element with `type="file"`
  $('#uploadJson').on('click', function () {
    document.querySelector('#uploadInput').click();
  });

  // triggered when user selects a file, read the file and reset the builder
  $('#uploadInput').on('change', function() {
    var stage = document.querySelector('t-stage');
    var files = this.files;
    var reader = new FileReader();
    var stateFile;

    files = Array.prototype.slice.call(files);
    stateFile = files.find(function(file) {
      return file.name === 'state.json';
    });

    if (!stateFile) {
      app.$.toast.text = 'Not state.json file. You can only upload state.json file.';
      app.$.toast.open();
      return;
    }

    reader.addEventListener('load', function(ev) {
      stage.reset();
      // TODO: what happens if the file uploaded file is not a valid state file?
      stage.recreateBuilder(ev.target.result);
      app.$.toast.text = 'Builder restored to the state.json successfully.';
      app.$.toast.open();
    });

    reader.readAsText(stateFile);
  });


  // create the zip file and and download it
  $('#downloadZip').on('click', function () {
    var zip = new JSZip();
    var stage = document.querySelector('t-stage');

    if (!stage) {
      return;
    }

    stage.getDownloadFiles()
      .then(function(files) {
        var content;

        zip.file(files.name, files.contents);
        zip.file(files.stateFileName, files.stateFile);

        content = zip.generate({ type: 'blob' });
        saveAs(content, files.name.replace('.html', '.zip'));
      });
  });

  $('#downloadJson').on('click', function () {
    var stage = document.querySelector('t-stage');
    var stateFile, content;

    if (!stage) {
      return;
    }

    stateFile = stage.getStateFile(stage.builderState, stage._elementSateList);
    content = new Blob([stateFile], {type: "text/plain;charset=utf-8"});
    saveAs(content, "state.json");
  });

  $('#panelSettings').on('click', function() {
    var stage = document.querySelector('t-stage');

    stage.showPanelForBuilder();
  });

  // append form elements to form on click
  $('body').on('click', '.control', function (event) {
    var stage = document.querySelector('t-stage');
    var category = event.currentTarget.getAttribute('data-category');
    var name = event.currentTarget.getAttribute('data-component');

    stage.addToBuilder(name, category);
  });

  // TODO: what does this do?
  $('.component-list').on('click', 'paper-item.menu-item', function () {
    $('.component-list').toggleClass('active');
  });

  $('t-stage').on('builder-name-changed', function(ev) {
    $('.headerText').text(ev.originalEvent.detail);
  });

  $('.headerText').on('keydown', function (e) {
    if (e.which === 13) {
      $(this).blur();
      // workaround for webkit's bug
      window.getSelection().removeAllRanges();
    }
  });

  // select the header text on focus
  $('.headerText').on('focus', function () {
    var el = this;

    function selectElementContents(el) {
      var range = document.createRange();
      range.selectNodeContents(el);
      var sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    }

    $(this).removeClass('inactive');
    requestAnimationFrame(function () {
      selectElementContents(el);
    });
  });

  // update the builder attributes on focus out and reset the text
  $('.headerText').on('blur', function () {
    var stage = document.querySelector('t-stage');
    var heading = $(this).text().trim();
    var name = heading.toLowerCase().replace(/\s+/, '-');
    var $this = $(this);

    if (heading.length === 0) {
      if ($this.hasClass('form-header')) {
        $this.text("Untitled Form");
      } else {
        $this.text("Untitled Page");
      }
    } else {
      stage.updateBuilderState('heading', heading);
      stage.updateBuilderState('name', name);
    }

    this.scrollLeft = 0;
    $this.addClass('inactive');
  });

  // //code to disable the default behaviour of the tab
  // $(document).on('keydown', '#componentSearch',function (objEvent) {
  //   if (objEvent.keyCode === 9) {  //tab pressed
  //     objEvent.preventDefault();
  //   }
  // });
  // document.addEventListener('adjust-dom',function () {
  //   var form = document.querySelector('.form');
  //   $('.form').html(Polymer.dom(form).innerHTML);
  // });

  // //event listener for elements autosuggest
  // document.addEventListener('on-autosuggest-select', function (event) {
  //   var component = event.detail;
  //   draggedControl = component.selectedItem.Name;

  //   attachControlToForm(component.selectedItem.Category);

  //   //clear autoggest and remove focus from there after attaching
  //   component.$.autoSuggest.value = "";
  //   component.$.autoSuggest.blur();
  //   event.stopPropagation();
  // });
};
