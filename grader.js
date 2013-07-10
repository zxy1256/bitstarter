#!/usr/bin/env node

var fs = require('fs');
var program = require('commander');
var rest = require('restler'); 
var cheerio = require('cheerio');
var HTMLFILE_DEFAULT = "index.html";
var CHECKFILE_DEFAULT = "checks.json";

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if (!fs.existSync(instr)) {
        console.log("%s does not exist. Exiting.", instr);
        process.exit(1);
    }
    return instr;
};

var cheerioHtmlFile = function(htmltext) {
    return cheerio.load(htmltext);
};

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtmlFile = function(htmltext, checksfile) {
    $ = cheerioHtmlFile(htmltext);
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for(var ii in checks) {
        var present = $(checks[ii]).length > 0;
        out[checks[ii]] = present;
    }
    return out;
};

var clone = function(fn) {
    return fn.bind({})
};

var buildfn = function(checks) {
    var onURLGetComplete = function(result, response) {
        if (result instanceof Error) {
            console.error('Error: ' + util.format(response.message));
        } else {
            check(result, checks);
        }
    }
    return onURLGetComplete;
}

var check = function(htmltext, checks) {
    var checkJson = checkHtmlFile(htmltext, checks);
    var outJson = JSON.stringify(checkJson, null, 4);
    console.log(outJson);
}

if (require.main == module) {
    program
        .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKFILE_DEFAULT)
        .option('-u, --url <url>', 'URL to checked web page')
        .option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists), HTMLFILE_DEFAULT)
        .parse(process.argv);

    if (program.url) {
        var onURLGetComplete = buildfn(program.checks);
        rest.get(program.url).on('complete', onURLGetComplete);
    } else {
        check(fs.readFileSync(program.file), program.checks);
    }
} else {
    exports.checkHtmlFile = checkHtmlFile;
}
