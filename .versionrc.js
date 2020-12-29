const { xml2js, js2xml } = require('xml-js');

const packageFiles = [{
  filename: 'package.json',
  type: 'json',
}];

module.exports = {
  packageFiles,
  bumpFiles: [
    ...packageFiles, {
    filename: 'package-lock.json',
    type: 'json',
  }, {
    filename: 'config.xml',
    updater: {
      readVersion(content) {
        return xml2js(content).elements[0].attributes.version;
      },

      writeVersion(content, version) {
        const config = xml2js(content);
        config.elements[0].attributes.version = version;
        return js2xml(config, { spaces: 4 }).replace(/"\/>/g, '" />') + '\n';
      },
    },
  }],
};
