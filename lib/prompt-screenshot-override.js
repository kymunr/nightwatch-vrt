'use strict'
const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs');
const open = require('open');
const cmd=require('node-cmd');
const cors = require('cors');
const assert = require('assert').strict;

function vrtDiff(latestPath, expectedPath, diffPath){

    app.use(express.static('vrtdiff', {
        immutable : true,
        maxAge    : '1h'
    }));

    //app.use(express.urlencoded());

    app.use(express.json());

    const latestFullPath = latestPath.replace(/ /g, '%20');
    const expectedFullPath = expectedPath.replace(/ /g, '%20');
    const diffFullPath = diffPath.replace(/ /g, '%20');
    const exec = require('child_process').exec;
    app.use(cors());

    app.get('/vrtdiff', (req, res) => {
        res.json({ latest:latestFullPath, expected: expectedFullPath, diffp: diffFullPath });
    });

    app.get('/', function (req, res) {
        res.sendFile(path.join(__dirname + '/vrtdiff/index.html'));
    });

    app.post('/exec', function(req, res, next) {
        const cmdfull = req.body.commandparam;
        process.env.VRT = cmdfull;

        console.log('log the global value update ' + process.env.VRT);

    });

    app.listen(process.env.PORT || 3333);

    (async () => {
        await open('http://localhost:3333', { app: ['google chrome', '--incognito'] });
    })();

}


/**
 * Queries the user to override the baseline screenshot and logging the file paths
 * for quick and easy analysis.
 *
 * @param {String} latestPath Path to the latest saved screenshot.
 * @param {String} expectedPath Path to the saved baseline screenshot.
 * @param {String} diffPath Path to the saved diff screenshot.
 * @return {Promise} A promise that resolves successfully if the user agrees to
 * override, or false otherwise. Default response is no.
 */
module.exports = function promptScreenshotOverride(
    latestPath,
    expectedPath,
    diffPath
) {
    return new Promise((resolve, reject) => {

        function compareResponse() {
            let thisCmd = process.env.VRT;

            console.log('logging cmdfull ' + thisCmd);

            if (thisCmd == 'Y') {
                console.log('logging our value 2ndtime ')
                resolve(true)
            } else {
                reject(new Error('User refused to override baseline'))
            }
        }

        vrtDiff(latestPath, expectedPath, diffPath),
            (response) => {}

        (async () => {
            await compareResponse()
        })();

        process.on('unhandledRejection', (err) => {
            console.error(err)
            process.exit(1)
        })

    })
}
