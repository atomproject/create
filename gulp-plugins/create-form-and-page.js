'use strict';

let through = require('through2');
let PluginError = require('gulp-util').PluginError;
let File = require('gulp-util').File;

let PLUGIN_NAME = 'create-form-and-page';

module.exports = function() {
  return through.obj(function (file, enc, cb) {
    let form, page;

    if (file.isBuffer()) {
      form = new File(file);
      page = new File(file);

      form.path = form.path.replace('index', 'form');
      page.path = page.path.replace('index', 'page');

      this.push(form);
      this.push(page);

      cb();
    } else if (file.isStream()) {
      this.emit('error', new PluginError(PLUGIN_NAME, 'Streams not supported!'));
    }
  });
};
