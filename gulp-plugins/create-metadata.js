'use strict';

// TODO: extract innerHTML also

let read = require('fs').readFileSync;
let cheerio = require('cheerio');
let through = require('through2');
let PluginError = require('gulp-util').PluginError;

let PLUGIN_NAME = 'create-metadata';

function toCamelCase(dash) {
  return dash.replace(/-([a-z])/g, function(m) {
    return m[1].toUpperCase();
  });
}

module.exports = function() {
  return through.obj(function (file, enc, cb) {
    if (file.isBuffer()) {
      let json = JSON.parse(file.contents);
      let metadata = {};
      let elements = json.elements.map(el => {
        el.demoFilePath = `bower_components/${el.name}/demo/index.html`;
        el.propertyFilePath = `bower_components/${el.name}/property.json`;

        return el;
      });

      elements.push({
        name: 't-form',
        demoFilePath: 'app/elements/t-stage.html',
        propertyFilePath: 'bower_components/t-form/property.json'
      });

      elements.push({
        name: 't-page',
        demoFilePath: 'app/elements/t-stage.html',
        propertyFilePath: 'bower_components/t-page/property.json'
      });

      elements.forEach(el => {
        let $ = cheerio.load(read(el.demoFilePath, 'utf-8'));
        let property = JSON.parse(read(el.propertyFilePath, 'utf-8'));
        let parsedElement = $(el.name)[0];
        let innerHTML = $(el.name).html() || '';
        let elementMetadata = { attributes: {}, property: property };
        elementMetadata.innerHTML = innerHTML;

        if (!parsedElement) {
          this.emit('error', new PluginError(PLUGIN_NAME, `No component found in demo file ${demoFilePath}`));
          return;
        }

        Object.keys(parsedElement.attribs || {}).forEach(function(attr) {
          attr = toCamelCase(attr);
          let attrVal = parsedElement.attribs[attr];
          elementMetadata.attributes[attr] = attrVal;
        });

        metadata[el.name] = elementMetadata;
      });

      // we don't want innerHTML for builders
      metadata['t-form'].innerHTML = '';
      metadata['t-page'].innerHTML = '';

      file.path = file.path.replace('-manifest', '');
      file.contents = new Buffer(JSON.stringify(metadata, null, 4));
      cb(null, file);
    } else if (file.isStream()) {
      this.emit('error', new PluginError(PLUGIN_NAME, 'Streams not supported!'));
    }
  });
};
