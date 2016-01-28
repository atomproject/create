'use strict';

// TODO: extract innerHTML also

let path = require('path');
let read = require('fs').readFileSync;
let write = require('fs').writeFileSync;
let cheerio = require('cheerio');
let through = require('through2');
let PluginError = require('gulp-util').PluginError;

let PLUGIN_NAME = 'create-metadata';

module.exports = function() {
  return through.obj(function (file, enc, cb) {
    if (file.isBuffer()) {
      let json = JSON.parse(file.contents);
      let metadata = {};

      json.elements.forEach(el => {
        let demoFilePath = `bower_components/${el.name}/demo/index.html`;
        let propertyFilePath = `bower_components/${el.name}/property.json`;
        let $ = cheerio.load(read(demoFilePath, 'utf-8'));
        let property = JSON.parse(read(propertyFilePath, 'utf-8'));
        let parsedElement = $(el.name)[0];
        let elementMetadata = { attributes: {}, property: property };

        if (!parsedElement) {
          this.emit('error', new PluginError(PLUGIN_NAME, `No component found in demo file ${demoFilePath}`));
          return;
        }

        Object.keys(parsedElement.attribs || {}).forEach(function(attr) {
          let attrVal = parsedElement.attribs[attr];
          elementMetadata.attributes[attr] = attrVal;
        });

        metadata[el.name] = elementMetadata;
      });

      file.path = file.path.replace('-manifest', '');
      file.contents = new Buffer(JSON.stringify(metadata, null, 4));
      cb(null, file);
    } else if (file.isStream()) {
      this.emit('error', new PluginError(PLUGIN_NAME, 'Streams not supported!'));
    }
  });
};