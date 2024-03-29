'use strict';
const https = require('https');
const fs = require('fs');
const FormData = require('form-data');
const myConsts = require('./myConstants.js');

function Artwork()
{
	var basePath = "/volume1/main/Google_Drive/WD_lis-media/";
	fs.readdir(basePath, { withFileTypes: true }, (err, files) => {
		try {
			myConsts.getSeed(true, 1)
			.then(
				function(randomFloat) {
					const filteredFiles = files
					.filter(dirent => dirent.isFile() && !(dirent.name.endsWith('.ini') || dirent.name.endsWith('.db') || dirent.name.endsWith('.webp')))
					.map(dirent => dirent.name);
					//filteredFiles.sort();
					var selectedImg = filteredFiles[Math.floor(randomFloat[0] * filteredFiles.length)];
					var fullPath = basePath + selectedImg;
					if (selectedImg.startsWith("JohnsonBlazkowicz"))
					{
						Shame(fullPath, selectedImg);
					}
					else
					{
						//Perform post to Discord
						var formData = new FormData();
						formData.append('content', 'Random fan art: ' + selectedImg);
						formData.append('file', fs.createReadStream(fullPath), { filename: selectedImg});
						formData.submit(`https://discordapp.com/api/webhooks/${myConsts.PL}`, (err, res) => {
							console.log("[" + new Date().toLocaleString() + "]\r\nSelected Image: " + fullPath + "\r\nResponse code: " + res.statusCode + "\r\nErrors: " + err + "\r\n");
						});
						//Question: Does the submit function fully dispose the object?
						//Answer: Yes
						var formData = new FormData();
						formData.append('content', 'Random fan art: ' + selectedImg);
						formData.append('file', fs.createReadStream(fullPath), { filename: selectedImg});
						formData.submit(`https://discord.com/api/webhooks/${myConsts.WD}`);
					}
				},
				function(anError) {
					console.log(anError);
				});
				
			}
			catch(err) {
					var errLog = fs.createWriteStream('error.log');
					errLog.write(err.name + ": " + err.message + "\r\n");
			}
	});
}


function Shame(fpath, fname, s)
{
	myConsts.getSeed(true, 1)
	.then(
		function(seed)
		{
			var val = Math.ceil(seed[0] * 4);
			//var val = 4;
			switch (val)
			{
				case 1:
				var formData = new FormData();
				formData.append('file', fs.createReadStream(fpath), { filename: fname});
				formData.append('content','Looking Good for a dead guy John 😆🤣');
				formData.submit(`https://discordapp.com/api/webhooks/${myConsts.PL}`, (err, res) => {
						console.log("[" + new Date().toLocaleString() + "]\r\nShame for " + fname + "!!!\r\nResponse code: " + res.statusCode + "\r\nErrors: " + err + "\r\n");
				});
				var formData = new FormData();
				formData.append('file', fs.createReadStream(fpath), { filename: fname});
				formData.append('content','Looking Good for a dead guy John 😆🤣');
				formData.submit(`https://discordapp.com/api/webhooks/${myConsts.WD}`, (err, res) => {
						console.log("[" + new Date().toLocaleString() + "]\r\nShame for " + fname + "!!!\r\nResponse code: " + res.statusCode + "\r\nErrors: " + err + "\r\n");
				});
				break;
				
				case 2:
				var formData = new FormData();
				formData.append('file', fs.createReadStream(fpath), { filename: fname});
				formData.append('content','Posting artwork?? He\'s supposed to be dead!!!');
				formData.submit(`https://discordapp.com/api/webhooks/${myConsts.PL}`, (err, res) => {
						console.log("[" + new Date().toLocaleString() + "]\r\nShame for " + fname + "!!!\r\nResponse code: " + res.statusCode + "\r\nErrors: " + err + "\r\n");
				});
				var formData = new FormData();
				formData.append('file', fs.createReadStream(fpath), { filename: fname});
				formData.append('content','Posting artwork?? He\'s supposed to be dead!!!');
				formData.submit(`https://discordapp.com/api/webhooks/${myConsts.WD}`, (err, res) => {
						console.log("[" + new Date().toLocaleString() + "]\r\nShame for " + fname + "!!!\r\nResponse code: " + res.statusCode + "\r\nErrors: " + err + "\r\n");
				});
				break;
				
				case 3:
				var formData = new FormData();
				formData.append('file[0]', fs.createReadStream(fpath), { filename: fname});
				formData.append('file[1]', fs.createReadStream('shame.gif'), { filename: 'shame.gif'});
				formData.submit(`https://discordapp.com/api/webhooks/${myConsts.PL}`, (err, res) => {
						console.log("[" + new Date().toLocaleString() + "]\r\nShame for " + fname + "!!!\r\nResponse code: " + res.statusCode + "\r\nErrors: " + err + "\r\n");
				});
				var formData = new FormData();
				formData.append('file[0]', fs.createReadStream(fpath), { filename: fname});
				formData.append('file[1]', fs.createReadStream('shame.gif'), { filename: 'shame.gif'});
				formData.submit(`https://discordapp.com/api/webhooks/${myConsts.WD}`, (err, res) => {
						console.log("[" + new Date().toLocaleString() + "]\r\nShame for " + fname + "!!!\r\nResponse code: " + res.statusCode + "\r\nErrors: " + err + "\r\n");
				});
				break;
				
				case 4:
				default:
				var formData = new FormData();
				formData.append('file[0]', fs.createReadStream(fpath), { filename: fname});
				formData.append('content','I would call it shamefully incompetent, but I don\'t think he gave a fuck tbh');
				formData.append('file[1]', fs.createReadStream('jb_death_cert.jpg'), { filename: 'jb_death_cert.jpg'});
				formData.submit(`https://discordapp.com/api/webhooks/${myConsts.PL}`, (err, res) => {
						console.log("[" + new Date().toLocaleString() + "]\r\nShame for " + fname + "!!!\r\nResponse code: " + res.statusCode + "\r\nErrors: " + err + "\r\n");
				});
				var formData = new FormData();
				formData.append('file[0]', fs.createReadStream(fpath), { filename: fname});
				formData.append('content','I would call it shamefully incompetent, but I don\'t think he gave a fuck tbh');
				formData.append('file[1]', fs.createReadStream('jb_death_cert.jpg'), { filename: 'jb_death_cert.jpg'});
				formData.submit(`https://discordapp.com/api/webhooks/${myConsts.WD}`, (err, res) => {
						console.log("[" + new Date().toLocaleString() + "]\r\nShame for " + fname + "!!!\r\nResponse code: " + res.statusCode + "\r\nErrors: " + err + "\r\n");
				});
				break;
			}
		},
		function(err) { console.log(JSON.stringify(err)); }
	);
}
Artwork();
//Shame('/volume1/main/Google_Drive/WD_lis-media/JohnsonBlazkowicz (53).jpg','JohnsonBlazkowicz (53).jpg');