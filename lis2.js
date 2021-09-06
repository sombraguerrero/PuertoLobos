'use strict';
const https = require('https');
const fs = require('fs');
const FormData = require('form-data');
const MersenneTwister = require('mersennetwister');
const myConsts = require('./myConstants.js');
function Artwork() {
	var basePath = "/var/services/homes/bobertdos/Google_Drive/WD_lis-media/";
	if (Math.round(MersenneTwister.random() * Number.MAX_SAFE_INTEGER) % 2 == 1) {
		basePath += "/le-louvre-de-lis2/"
	}
	fs.readdir(basePath, { withFileTypes: true }, (err, files) => {
		try {
			const filteredFiles = files
			.filter(dirent => dirent.isFile())
			.map(dirent => dirent.name);
			//filteredFiles.sort();
			var selectedImg = filteredFiles[Math.round(MersenneTwister.random() * Number.MAX_SAFE_INTEGER) % filteredFiles.length];
			//Perform post to Discord
			var formData = new FormData();
			formData.append('content', 'Random fan art: ' + selectedImg);
			formData.append('file', fs.createReadStream(basePath + selectedImg), { filename: selectedImg});
			formData.submit(`https://discordapp.com/api/webhooks/${myConsts.PL}`, (err, res) => {
					console.log("[" + new Date().toLocaleString() + "]\r\nSelected Image: " + basePath + selectedImg + "\r\nResponse code: " + res.statusCode + "\r\nErrors: " + err + "\r\n");
			});
			//Question: Does the submit function fully dispose the object?
			//Answer: Yes
			var formData = new FormData();
			formData.append('content', 'Random fan art: ' + selectedImg);
			formData.append('file', fs.createReadStream(basePath + selectedImg), { filename: selectedImg});
			formData.submit(`https://discord.com/api/webhooks/${myConsts.WD}`);
		}
		catch(err) {
			var errLog = fs.createWriteStream('error.log');
			errLog.write(err.name + ": " + err.message + "\r\n");
		}
	});
}

// Navigate to and retrieve random file.
Artwork();
