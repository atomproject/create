var dragAndDropSetup = function () {

    // declared variables
    var $form = $('.form');
    var $subject = $('.canvas');
    var draggedControl = null;

    //draggable menu items setup
    $('.control').draggable({
        addClasses: false,
        scroll: false,
        appendTo: 'body',
        helper: 'clone',
        cursor: 'move',
        revert: 'invalid',
        drag: function (event, ui) {
            draggedControl = ui.helper.attr('data-component');
        }
    });

    //form set as droppable container
    $form.droppable({
        drop: function (event, ui) {
            if (!ui.draggable.hasClass('ui-sortable-helper')) {
                draggedControl = ui.draggable[0].getAttribute('data-component');
                attachControlToForm(ui.draggable[0].getAttribute('data-category'));
            }
        }
    });

    //sortable fields setup
    $form.nestedSortable({
        placeholder: ' flex placeholder-highlight',
        maxLevels: 2,
        tabSize:0,
        scroll:false,
        tolerance: 'pointer',
        branchClass: 'grouped',
        hoveringClass: 'placeholder-highlight',
        listType: 'ul',
        sort: function (e, ui) {
            ui.placeholder.height(ui.helper.height());
        },
        relocate: function (e, ui) {
            if (!ui.item.parent().hasClass('form')) {
                ui.item.unwrap();
                ui.item.children('.overlap').remove();
                ui.item.addClass('flex');
                ui.item.parent('li').addClass('grouped');
                ui.item = ui.item.children('.fieldset').unwrap();
                ui.item.html(Polymer.dom(ui.item[0]).innerHTML);
            } else {
                ui.item.children('.fieldset')[0].innerHTML = (Polymer.dom(ui.item.children('.fieldset')[0]).innerHTML);
            }
            autoSave();
        },
        beforeStop: function (e, ui) {
            ui.item.children('.fieldset')[0].innerHTML = (Polymer.dom(ui.item.children('.fieldset')[0]).innerHTML);
            return true;
        },
        isAllowed: function (parentItem, level, levels) {
            return true;
        }
    });

    document.addEventListener('adjust-dom',function () {
        var form = document.querySelector('.form');
        $('.form').html(Polymer.dom(form).innerHTML);
    });

    //remove field when clicked on remove icon in top right panel
    function removeField(e) {
        var component = $subject[0];
        $(e.target).closest('.field-container').remove();
        var category = 'formComponents';
        if (component.classList.contains('page'))
            category = 'pageComponents';
        showComponentPanel(component.tagName, component, category);
        if ($('.form').children('.field-container').length === 0)
            $('.canvas').addClass('empty');
        e.stopImmediatePropagation();

        setTimeout(function () {
            $subject[0].setFields();
          
        }, 0);
        setTimeout(function () {
            autoSave();
        }, 0);

    }

    //duplicate fieldset 
    function duplicate(e) {
        var field = $(e.target).closest('.field-container');
        var markup = Polymer.dom(field[0]).innerHTML;
        var wrapper = '<li title="Click to Edit. Drag to Reorder." class="horizontal flex layout field-container">';
        if (field.hasClass('grouped'))
            wrapper = '<li title="Click to Edit. Drag to Reorder." class="horizontal grouped flex layout field-container">';
        markup = wrapper + markup + '</li>';
        field.after(markup);
        setTimeout(function () {
            autoSave();
        }, 0);
    }

    //unmerge merged fields
    function unmerge(e) {
        var field = $(e.target).closest('.field-container');
        var subElements = field.children('.fieldset');
        var hoverPanel = '<div class="hover-panel"><iron-icon class="unmerge" title="Unmerge this item" icon="communication:call-split"></iron-icon><iron-icon class="duplicate" title="Clone this item" icon="content-copy"></iron-icon><iron-icon class="close" title="Remove this item" icon="close"></iron-icon></div>';
        var overlay = '<div class="overlap">' + hoverPanel + '</div>';
        var numberOfElements = subElements.length;
        subElements.each(function (index) {
            var category = subElements[numberOfElements - index - 1].getAttribute('data-category');
            var markup = '<li class="horizontal flex layout field-container">' + overlay + '<div class="fieldset flex" data-category="' + category + '">' + Polymer.dom(subElements[numberOfElements - index - 1]).innerHTML + '</div></li>';
            field.after(markup);
        });
        field.remove();
        setTimeout(function () {
            autoSave();
        }, 0);
    }

    //appends dragged, clicked control on to the form
    function attachControlToForm(category) {

        if ($('.canvas').hasClass('empty')) {
            $('.canvas').removeClass('empty');
        }

        var ajaxComponent = document.querySelector('#controlCall');

        $.ajax({
            url: 'bower_components/' + draggedControl + '/demo/metadata.html',
            crossDomain: true
        }).done(function (e) {
            renderElement(e, category);
        }).fail(function (e) {
            // do some error handling
            alert('Error while connecting to server');
        });

    }

    //generate component panel
    function showComponentPanel(componentName, targetComponent, category) {
        var componentPanel = document.querySelector('t-component-panel');
        componentPanel.component = componentName;
        componentPanel.targetComponent = targetComponent;
        setName(targetComponent);
        componentPanel.propertySource = 'bower_components/' + componentName.toLowerCase() + '/property.json';
        componentPanel.setPanel();
        if ((componentName.toLowerCase() !== 't-form' && componentName.toLowerCase() !== 't-page') || $('.canvas .fieldset').length === 0) {
            //$('#preview').hide();
            //$('#download').hide();
            $('.property-panel-Header').hide();
        }
        else {
            //    $('#preview').show();
            //    $('#download').show();
            $('.property-panel-Header').show();
        }

        var pdp = document.getElementById('propertyDrawerPanel');
        if (pdp.selected === 'main') {
            pdp.togglePanel();
        }
        
    }

    function setName(targetComponent) {
        if (targetComponent.name === '') {
            var component = targetComponent.tagName.toLowerCase().slice(2);
            targetComponent.name = (component + $subject[0].querySelectorAll(targetComponent.tagName).length).toLowerCase();
        }
    }

    //render element on canvas
    function renderElement(component, category) {
        if (component != null) {
            var container = document.createElement('li');
            container.title = 'Click to Edit. Drag to Reorder.';
            container.className = 'horizontal flex layout field-container';

            var fieldSet = document.createElement('div');
            fieldSet.className = 'flex fieldset ';
            fieldSet.setAttribute('data-category', category);
            fieldSet.innerHTML = component;
            var hoverPanel = '<div class="hover-panel"><iron-icon class="unmerge" title="Unmerge this item" icon="communication:call-split"></iron-icon><iron-icon class="duplicate" title="Clone this item" icon="content-copy"></iron-icon><iron-icon class="close" title="Remove this item" icon="close"></iron-icon></div>';
            $(container).append('<div class="overlap">' + hoverPanel + '</div>');
            container.appendChild(fieldSet);
            $form.append(container);
            if ($subject[0].tagName.toLowerCase() === 't-form')
            {
                setTimeout(function () {
                    $subject[0].setFields();
                }, 0);
            }
            $(fieldSet).trigger('click');
        }
        //save the form
        autoSave();

    };

    //auto save on every change

    function autoSave() {
        setTimeout(function () {

            var form = document.querySelector('.canvas');
            var code = refactorCode(Polymer.dom(form.parentNode).innerHTML);
            code = code.replace(new RegExp("\n", 'g'), "");
            $('#markup').val(btoa(code));

        }, 1000);
    }

    function refactorCode(code) {
        code = code = code.replace("\n", "");
        code = code.replace(new RegExp('<div title="Click to Edit. Drag to Reorder." class="page canvas vertical layout flex">', 'g'), "");
        code = code.replace(new RegExp('<span class="dextop">Click on an element or drag it here to start building your form.</span>', 'g'), "");
        code = code.replace(new RegExp('<span class="mobile">Browse elements using the button above to start building your form.</span>', 'g'), "");
        code = code.replace(new RegExp('<span class="dextop">Click on an element or drag it here to start building your page.</span>', 'g'), "");
        code = code.replace(new RegExp('<span class="mobile">Browse elements using the button above to start building your page.</span>', 'g'), "");
        //code = code.replace(new RegExp('<h2 class="drag-text">Click on an element or drag it here to start building your page</h2>', 'g'), "");
        code = code.replace(new RegExp('<h2 class="drag-text">', 'g'), "");
        code = code.replace(new RegExp('</h2>', 'g'), "");
        code = code.replace(new RegExp("<ul", 'g'), "<div");
        code = code.replace(new RegExp("ul>", 'g'), "div>");
        code = code.replace(new RegExp("<li", 'g'), "<div");
        code = code.replace(new RegExp("li>", 'g'), "div>");
        code = code.replace(new RegExp("x-scope", 'g'), "");
        code = code.replace(new RegExp("iron-icon-0", 'g'), "");
        code = code.replace(new RegExp("  ", 'g'), "");
        code = code.replace(new RegExp('<div class="hover-panel"><iron-icon class="unmerge" title="Unmerge this item" icon="communication:call-split"></iron-icon><iron-icon class="duplicate" title="Clone this item" icon="content-copy"></iron-icon><iron-icon class="close" title="Remove this item" icon="close"></iron-icon></div>', 'g'), "");
        code = code.replace(new RegExp('<div class="overlap" style="z-index: 10;"></div>', 'g'), "");
        code = code.replace(new RegExp('<div class="overlap"></div>', 'g'), "");
        code = code.replace(new RegExp('title="Click to Edit. Drag to Reorder."', 'g'), "");
        code = code.replace(new RegExp('title="Click to edit form properties."', 'g'), "");
        code = code.replace(new RegExp("sortable empty connectedSortable field-container ui-droppable ui-sortable", 'g'), "");
        code = code.replace(new RegExp('field-container', 'g'), "");
        code = code.replace(new RegExp('t-page', 'g'), "div");
        return code;
    }

    function download() {
        var subject = $subject[0];
        var code = refactorCode(Polymer.dom(subject.parentNode).innerHTML);
        if (subject.tagName.toLowerCase() === 't-form') {
            code = wrapInPolymer(code, subject.name);
            var indexFile = getDemoFile(code, subject.name, true);
            var metadataFile = getDemoFile(code, subject.name, false);
        }
        else {
            code = '<html><head>' + '<link rel="import" href="' + atomBaseUrl + '"app/elements.html"><link rel="import" href="theme.html">' + '</head><body>' + code + '</body></html>';
        }
        var zip = new JSZip();
        $.get('content/theme.html').then(function (responseData) {
            zip.file('theme.html', responseData);
            zip.file(subject.name + '.html', code);
            if (subject.tagName.toLowerCase() === 't-form') {
                zip.folder('demo').file('index.html', indexFile);
                zip.folder('demo').file('metadata.html', metadataFile);
            }
            var content = zip.generate({ type: 'blob' });
            saveAs(content, subject.name + '.zip');
        });


    };

    function getDemoFile(code, componentName, isIndex) {
        if (isIndex) {
            return '<html><head>' + '<link rel="import" href="../theme.html"><link rel="import" href="../' + componentName + '.html">' + '</head><body><' + componentName + '></' + componentName + '></body></html>';
        }
        return "<" + componentName + "></" + componentName + ">";
    }

    function wrapInPolymer(code, componentName) {
        var imports = '<link rel="import" href="' + atomUrl + 'bower_components/polymer/polymer.html"></link><link rel="import" href="' + atomBaseUrl + '"formComponents/t-form/t-form.html"></link>';
        var componentTemplate = '<dom-module id="' + componentName + '"><template>' + code + '</template></dom-module>';
        var polymerScript = '<script>Polymer({is: "' + componentName + '})</script>';
        return imports + componentTemplate + polymerScript;
    }

    //event listener for elements autosuggest
    document.addEventListener('on-autosuggest-select', function (event) {
        var component = event.detail;
        draggedControl = component.selectedItem.Name;

        attachControlToForm(component.selectedItem.Category);

        //clear autoggest and remove focus from there after attaching
        component.$.autoSuggest.value = "";
        component.$.autoSuggest.blur();
        event.stopPropagation();
    });

    //form click events
    $form.on('click', '.fieldset', function (event) {
        var targetComponent = event.currentTarget.children[0];
        var componentName = targetComponent.tagName.toLowerCase();
        var category = this.getAttribute('data-category');
        showComponentPanel(componentName, targetComponent, category);
        event.stopImmediatePropagation();
    });

    $form.on('click', '.overlap', function (e) {
        $('.overlap').css('z-index', '0');
        $(document.elementFromPoint(e.pageX, e.pageY)).closest('.fieldset').click();
        $('.overlap').css('z-index', '10');
        e.stopImmediatePropagation();
    });

    $form.on('click', '.close', function (e) {
        removeField(e);
    });

    $form.on('click', '.duplicate', function (e) {
        duplicate(e);
        e.stopImmediatePropagation();
    });

    $form.on('click', '.unmerge', function (e) {
        unmerge(e);
        e.stopImmediatePropagation();
        e.preventDefault();
    });

    $('#preview').on('click', function () {
        var form = $('#htmlContent');
        form.attr('target', '_blank');
        $('#htmlContent').submit();
        event.preventDefault();
    });

    $('#download').on('click', function () {
        download();
    });

    //other click events

    //append form elements to form on click
    $('body').on('click', '.control', function (event) {
        draggedControl = event.currentTarget.getAttribute('data-component');
        attachControlToForm(event.currentTarget.getAttribute('data-category'));
    });

    $('.component-list').on('click', 'paper-item.menuitem', function () {
        $(this).add('.component-list').toggleClass('active');
    });

    $('.main-body , .form').on('click', function (e) {
        var component = $subject[0];
        var category = 'formComponents';
        if (component.classList.contains('page'))
            category = 'pageComponents';
        showComponentPanel(component.tagName, component, category);
        e.stopImmediatePropagation();
    });

    $('.paper-header').on('click', function (e) {
        var component = $subject[0];
        var category = 'formComponents';
        if (component.classList.contains('page'))
            category = 'pageComponents';
        showComponentPanel(component.tagName, component, category);

        $('.property-panel-Header').show();
        //$('#preview').show();
        //$('#download').show();
        e.stopImmediatePropagation();
    });

    //Start code for header functionality..

    $('.headerText').on('keydown', function (e) {
        if (e.which === 13) {
            $(this).blur();
            // Workaround for webkit's bug
            window.getSelection().removeAllRanges();
        }
    });
    $('.headerText').on('focus', function () {
        $(this).removeClass('inactive');
        var el = this;
        requestAnimationFrame(function () {
            selectElementContents(el);
        });
        function selectElementContents(el) {
            var range = document.createRange();
            range.selectNodeContents(el);
            var sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        }
    });

    $('.headerText').on('blur', function () {
        if ($(this).text().trim().length === 0) {
            if ($(this).hasClass('form-header')) {
                $(this).text("Untitled Form");
            } else {
                $(this).text("Untitled Page");
            }

        }
        this.scrollLeft = 0;
        $(this).addClass('inactive');
    });
    //end code for header functionality..

    //code to disable the default behaviour of the tab
    $(document).on('keydown', '#componentSearch',function (objEvent) {
        if (objEvent.keyCode === 9) {  //tab pressed
            objEvent.preventDefault();
        }
    });

    //Event listener
    document.addEventListener('property-changed', function () {
        autoSave();
    });

};