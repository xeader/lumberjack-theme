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
/* eslint-disable no-undef */
const { VueLoaderPlugin } = require("vue-loader");
const projectPath = require("@xeader/blendid-plus/gulpfile.js/lib/projectPath");
const util = require("util");
const globule = require("globule");
const path = require("path");
const fs = require("fs");
const types = require("node-sass").types;
const slugify = require("@xeader/blendid-plus/gulpfile.js/lib/slugify");
const realFavicon = require("gulp-real-favicon");
const realFaviconConfig = require("./realFavicon.json");

const svg = function(buffer) {
  let svg = buffer
    .toString()
    .replace(/\n/g, "")
    .replace(/\r/g, "")
    .replace(/#/g, "%23")
    .replace(/"/g, "'");

  return '"data:image/svg+xml;utf8,' + encodeURIComponent(svg) + '"';
};

const img = function(buffer, ext) {
  return '"data:image/' + ext + ";base64," + buffer.toString("base64") + '"';
};

const tree = function(pattern) {
  let tree = [];
  let files = globule.find(pattern);
  let groups = [];
  files.forEach(filePath => {
    let filename = path.basename(filePath);
    let html = filename.replace("njk", "html");
    let name = slugify(filename.replace(".njk", ""));

    if (html[0] === "_") return;

    let group = "";
    if (filename.indexOf("--") >= 0) {
      group = slugify(filename.split("--")[0]);
      // name = slugify(filename.split('--')[1].replace('.njk', ''));
      if (groups.indexOf(group) === -1) {
        groups.push(group);
      }
    }

    tree.push({
      name: name,
      path: filePath,
      group: group,
      fileName: filename,
      html: html
    });
  });

  tree.forEach((file, index) => {
    if (groups.indexOf(file.name) !== -1) {
      tree[index].group = file.name;
    }
  });

  return tree;
};

module.exports = {
  html: {
    // eslint-disable-next-line no-unused-vars
    dataFunction: function(file) {
      const dataPath = projectPath(
        PATH_CONFIG.src,
        PATH_CONFIG.html.src,
        TASK_CONFIG.html.dataFile
      );
      let data = JSON.parse(fs.readFileSync(dataPath, "utf8"));
      data.__project = {
        PATH_CONFIG: util.inspect(PATH_CONFIG),
        TASK_CONFIG: util.inspect(TASK_CONFIG),
        PACKAGE: require("../package.json"),
        TREE: tree(projectPath(PATH_CONFIG.src, PATH_CONFIG.html.src, "*.njk"))
      };
      return data;
    },
    nunjucksRender: {
      manageEnv: function(env) {
        require(projectPath(
          PATH_CONFIG.src,
          PATH_CONFIG.html.src,
          "./nunjucks"
        ))(env);
      }
    },
    htmlmin: false
  },
  images: true,
  fonts: true,
  static: true,
  svgSprite: true,
  ghPages: true,
  stylesheets: {
    autoprefixer: {
      grid: true
    },
    sass: {
      indentedSyntax: false,
      includePaths: ["./node_modules"],
      functions: {
        "inline-image($file)": function(file) {
          const relativePath = "./" + file.getValue(),
            filePath = projectPath(PATH_CONFIG.src, relativePath),
            ext = filePath.split(".").pop(),
            data = fs.readFileSync(filePath),
            buffer = new Buffer(data),
            str = ext === "svg" ? svg(buffer, ext) : img(buffer, ext);

          return types.String(str);
        }
      }
    }
  },

  javascripts: {
    entry: {
      // files paths are relative to
      // javascripts.dest in path-config.json
      app: ["./app.js"]
    },
    loaders: [
      {
        enforce: "pre",
        test: /\.js$/,
        exclude: /node_modules/,
        loader: "eslint-loader"
      },
      {
        test: /\.vue$/,
        use: [
          { loader: "vue-loader" },
          { loader: "vue-style-loader" },
          { loader: "vue-template-compiler" }
        ]
      }
    ],
    // eslint-disable-next-line no-unused-vars
    customizeWebpackConfig: function(webpackConfig, env, webpack) {
      webpackConfig.plugins.push(new VueLoaderPlugin());

      return webpackConfig;
    }
  },

  browserSync: {
    server: {
      // should match `dest` in
      // path-config.json
      baseDir: "public"
    }
  },

  production: {
    rev: false
  },

  additionalTasks: {
    initialize(gulp, PATH_CONFIG, TASK_CONFIG) {
      realFaviconConfig.masterPicture = projectPath(
        PATH_CONFIG.src,
        PATH_CONFIG.images.src,
        realFaviconConfig.masterPicture
      );
      realFaviconConfig.dest = projectPath(
        PATH_CONFIG.dest,
        PATH_CONFIG.images.src,
        realFaviconConfig.dest
      );
      realFaviconConfig.markupFile = projectPath(
        PATH_CONFIG.dest,
        PATH_CONFIG.images.src,
        realFaviconConfig.dest + "/faviconData.json"
      );
      gulp.task("generate-favicon", function(done) {
        realFavicon.generateFavicon(realFaviconConfig, function() {
          done();
        });
      });

      gulp.task("wordpress-hot", function(done) {
        PATH_CONFIG.dest = "./../assets";
        TASK_CONFIG.browserSync = {
          proxy: "xeader.lumberjack",
          files: ["./src/**/*"]
        };
        TASK_CONFIG.javascripts.publicPath =
          "/app/themes/lumberjack-theme/assets/javascripts";

        const gulpSequence = require("gulp-sequence");
        const getEnabledTasks = require("@xeader/blendid-plus/gulpfile.js/lib/getEnabledTasks");

        let tasks = getEnabledTasks("watch");
        console.log(tasks);
        const htmlIndex = tasks.codeTasks.indexOf("html");
        if (htmlIndex !== -1) tasks.codeTasks.splice(htmlIndex, 1);
        console.log(tasks);
        const { prebuild, postbuild } = TASK_CONFIG.additionalTasks.development;
        gulpSequence(
          "clean",
          prebuild,
          tasks.assetTasks,
          tasks.codeTasks,
          postbuild,
          "watch",
          done
        );
      });

      gulp.task("wordpress-watch", ["wordpress-hot", "default"]);

      gulp.task("wordpress-assets", function(done) {
        gulp
          .src([projectPath(PATH_CONFIG.dest, PATH_CONFIG.fonts.dest, "**/*")])
          .pipe(
            gulp.dest(
              projectPath(
                PATH_CONFIG.dest + "/../../assets",
                PATH_CONFIG.fonts.dest
              )
            )
          );
        gulp
          .src([projectPath(PATH_CONFIG.dest, PATH_CONFIG.images.dest, "**/*")])
          .pipe(
            gulp.dest(
              projectPath(
                PATH_CONFIG.dest + "/../../assets",
                PATH_CONFIG.images.dest
              )
            )
          );
        gulp
          .src([projectPath(PATH_CONFIG.src, PATH_CONFIG.icons.src, "**/*")])
          .pipe(
            gulp.dest(
              projectPath(
                PATH_CONFIG.dest + "/../../assets",
                PATH_CONFIG.icons.src
              )
            )
          );
        gulp
          .src([
            projectPath(PATH_CONFIG.dest, PATH_CONFIG.javascripts.dest, "**/*")
          ])
          .pipe(
            gulp.dest(
              projectPath(
                PATH_CONFIG.dest + "/../../assets",
                PATH_CONFIG.javascripts.dest
              )
            )
          );
        gulp
          .src([
            projectPath(PATH_CONFIG.dest, PATH_CONFIG.stylesheets.dest, "**/*")
          ])
          .pipe(
            gulp.dest(
              projectPath(
                PATH_CONFIG.dest + "/../../assets",
                PATH_CONFIG.stylesheets.dest
              )
            )
          );
        done();
      });

      gulp.task("wordpress", function(done) {
        TASK_CONFIG.javascripts.publicPath =
          "/app/themes/amrefshop/assets/javascripts";
        // const gulp = require("gulp");
        const gulpSequence = require("gulp-sequence");
        const getEnabledTasks = require("@xeader/blendid-plus/gulpfile.js/lib/getEnabledTasks");
        const os = require("os");
        const fs = require("fs");
        const del = require("del");
        const path = require("path");
        const projectPath = require("@xeader/blendid-plus/gulpfile.js/lib/projectPath");

        global.production = true;

        // Build to a temporary directory, then move compiled files as a last step
        PATH_CONFIG.finalDest = PATH_CONFIG.dest;
        PATH_CONFIG.dest = PATH_CONFIG.temp
          ? projectPath(PATH_CONFIG.temp)
          : path.join(os.tmpdir(), "gulp-starter");

        // Make sure the temp directory exists and is empty
        del.sync(PATH_CONFIG.dest, { force: true });
        fs.mkdirSync(PATH_CONFIG.dest);

        const tasks = getEnabledTasks("production");
        const rev = TASK_CONFIG.production.rev ? "rev" : false;
        const _static = TASK_CONFIG.static ? "static" : false;
        const { prebuild, postbuild } = TASK_CONFIG.additionalTasks.production;

        gulpSequence(
          prebuild,
          tasks.assetTasks,
          tasks.codeTasks,
          rev,
          "size-report",
          _static,
          postbuild,
          "replaceFiles",
          done
        );
      });

      // Inject the favicon markups in your HTML pages. You should run
      // this task whenever you modify a page. You can keep this task
      // as is or refactor your existing HTML pipeline.
      gulp.task("inject-favicon-markups", function() {
        return gulp
          .src(["public/*.html"])
          .pipe(
            realFavicon.injectFaviconMarkups(
              JSON.parse(fs.readFileSync(realFaviconConfig.markupFile)).favicon
                .html_code
            )
          )
          .pipe(gulp.dest("public"));
      });

      // Install realFavicon to realFavicon nunjucks template
      gulp.task("install-favicon-template", function() {
        const htmlCode = JSON.parse(
          fs.readFileSync(realFaviconConfig.markupFile)
        ).favicon.html_code;

        const appIconsPath = projectPath(
          PATH_CONFIG.src,
          PATH_CONFIG.html.src,
          "shared/app-icons.njk"
        );

        fs.writeFileSync(appIconsPath, htmlCode);
      });
    },
    development: {
      prebuild: null,
      postbuild: null
    },
    production: {
      prebuild: null,
      postbuild: null
    }
  }
};
