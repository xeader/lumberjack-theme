/*
 * Xeader Studios
 *
 * NOTICE OF LICENCE
 *
 * This source file is subject to the EULA
 * that is bundled with this package in the file LICENSE.txt
 * It is also available through th world-wide-web at this URL:
 * https://xeader.com/LICENCE-CE.txt
 *
 * @category blendid-plus
 * @package blendid-plus
 *
 * @author Antonio Gatta <a.gatta@xeader.com>
 * @url http://xeader.com
 * @copyright Copyright (c) 2019 Xeader Studios
 * @license All right reserved
 */
const projectPath = require('@xeader/blendid-plus/gulpfile.js/lib/projectPath');
const globule = require('globule');
const path = require('path');
const log = require('fancy-log');
const colors = require('ansi-colors');

module.exports = function(env) {
  // Add Global Functions
  const globals = globule.find(
    projectPath(
      PATH_CONFIG.src,
      PATH_CONFIG.html.src,
      './nunjucks/globals/*.js',
    ),
  );
  globals.forEach(filePath => {
    let functionName = path.basename(filePath).replace('.js', '');
    log(colors.green('Nunjucks additional global Function: ' + functionName));
    env.addGlobal(functionName, require(filePath));
  });

  // Add Filters
  const filters = globule.find(
    projectPath(
      PATH_CONFIG.src,
      PATH_CONFIG.html.src,
      './nunjucks/filters/*.js',
    ),
  );
  filters.forEach(filePath => {
    let filterName = path.basename(filePath).replace('.js', '');
    log(colors.green('Nunjucks additional filter: ' + filterName));
    env.addFilter(filterName, require(filePath));
  });
};
