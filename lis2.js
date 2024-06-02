'use strict';
const https = require('https');
const fs = require('fs');
const FormData = require('form-data');
const myConsts = require('./myConstants.js');

function Artwork()
{
	var basePath = "/volume1/homes/bobertdos/Google_Drive/WD_lis-media/";
	fs.readdir(basePath, { withFileTypes: true }, (err, files) => {
		try {
			myConsts.getSeed(true, 1)
			.then(
				function(randomFloat) {
					const filteredFiles = files
					.filter(dirent => dirent.isFile() && !(dirent.name.endsWith('.ini') || dirent.name.endsWith('.db') || dirent.name.endsWith('.webp')))
					.map(dirent => dirent.name);
					var selectedImg = filteredFiles[Math.floor(randomFloat[0] * filteredFiles.length)];
					var fullPath = basePath + selectedImg;
					if (selectedImg.toLowerCase().includes("blazkowicz"))
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
					}
				},
				function(anError) {
					console.log(anError);
				});
				
			}
			catch(err)
			{
				var errLog = fs.createWriteStream('error.log');
				errLog.write(err.name + ": " + err.message + "\r\n");
				return 1284;
			}
	});
	return 0;
}


function Shame(fpath, fname, s)
{
	var imgPath = 'shame/'
	try
	{
		myConsts.getSeed(true, 1)
		.then(
			function(seed)
			{
				var val = Math.ceil(seed[0] * 13);
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
					break;
					
					case 2:
					var formData = new FormData();
					formData.append('file', fs.createReadStream(fpath), { filename: fname});
					formData.append('content','Posting artwork?? He\'s supposed to be dead!!!');
					formData.submit(`https://discordapp.com/api/webhooks/${myConsts.PL}`, (err, res) => {
							console.log("[" + new Date().toLocaleString() + "]\r\nShame for " + fname + "!!!\r\nResponse code: " + res.statusCode + "\r\nErrors: " + err + "\r\n");
					});
					break;
					
					case 3:
					var formData = new FormData();
					formData.append('file[0]', fs.createReadStream(fpath), { filename: fname});
					formData.append('file[1]', fs.createReadStream(imgPath + 'shame.gif'), { filename: 'shame.gif'});
					formData.submit(`https://discordapp.com/api/webhooks/${myConsts.PL}`, (err, res) => {
							console.log("[" + new Date().toLocaleString() + "]\r\nShame for " + fname + "!!!\r\nResponse code: " + res.statusCode + "\r\nErrors: " + err + "\r\n");
					});
					break;
					
					case 4:
					var formData = new FormData();
					formData.append('file[0]', fs.createReadStream(fpath), { filename: fname});
					formData.append('content','I would call it shamefully incompetent, but I don\'t think he gave a fuck tbh');
					formData.append('file[1]', fs.createReadStream(imgPath + 'jb_death_cert.jpg'), { filename: 'jb_death_cert.jpg'});
					formData.submit(`https://discordapp.com/api/webhooks/${myConsts.PL}`, (err, res) => {
							console.log("[" + new Date().toLocaleString() + "]\r\nShame for " + fname + "!!!\r\nResponse code: " + res.statusCode + "\r\nErrors: " + err + "\r\n");
					});
					break;
					
					case 5:
					var formData = new FormData();
					formData.append('file[0]', fs.createReadStream(fpath), { filename: fname});
					formData.append('file[1]', fs.createReadStream(imgPath + 'cone.gif'), { filename: 'cone.gif'});
					formData.submit(`https://discordapp.com/api/webhooks/${myConsts.PL}`, (err, res) => {
							console.log("[" + new Date().toLocaleString() + "]\r\nShame for " + fname + "!!!\r\nResponse code: " + res.statusCode + "\r\nErrors: " + err + "\r\n");
					});
					break;
					
					case 6:
					var formData = new FormData();
					formData.append('file[0]', fs.createReadStream(fpath), { filename: fname});
					formData.append('file[1]', fs.createReadStream(imgPath + 'john-krasinski-oh-no.gif'), { filename: 'john-krasinski-oh-no.gif'});
					formData.submit(`https://discordapp.com/api/webhooks/${myConsts.PL}`, (err, res) => {
							console.log("[" + new Date().toLocaleString() + "]\r\nShame for " + fname + "!!!\r\nResponse code: " + res.statusCode + "\r\nErrors: " + err + "\r\n");
					});
					break;
					
					case 7:
					var formData = new FormData();
					formData.append('file[0]', fs.createReadStream(fpath), { filename: fname});
					formData.append('file[1]', fs.createReadStream(imgPath + 'feel_shame.gif'), { filename: 'feel_shame.gif'});
					formData.submit(`https://discordapp.com/api/webhooks/${myConsts.PL}`, (err, res) => {
							console.log("[" + new Date().toLocaleString() + "]\r\nShame for " + fname + "!!!\r\nResponse code: " + res.statusCode + "\r\nErrors: " + err + "\r\n");
					});
					break;
					
					case 8:
					var formData = new FormData();
					formData.append('file[0]', fs.createReadStream(fpath), { filename: fname});
					formData.append('file[1]', fs.createReadStream(imgPath + 'hot-fuzz.gif'), { filename: 'hot-fuzz.gif'});
					formData.submit(`https://discordapp.com/api/webhooks/${myConsts.PL}`, (err, res) => {
							console.log("[" + new Date().toLocaleString() + "]\r\nShame for " + fname + "!!!\r\nResponse code: " + res.statusCode + "\r\nErrors: " + err + "\r\n");
					});
					break;
					
					case 9:
					var formData = new FormData();
					formData.append('file[0]', fs.createReadStream(fpath), { filename: fname});
					formData.append('file[1]', fs.createReadStream(imgPath + 'shame-on-you.gif'), { filename: 'shame-on-you.gif'});
					formData.submit(`https://discordapp.com/api/webhooks/${myConsts.PL}`, (err, res) => {
							console.log("[" + new Date().toLocaleString() + "]\r\nShame for " + fname + "!!!\r\nResponse code: " + res.statusCode + "\r\nErrors: " + err + "\r\n");
					});
					break;
					
					case 10:
					var formData = new FormData();
					formData.append('file[0]', fs.createReadStream(fpath), { filename: fname});
					formData.append('file[1]', fs.createReadStream(imgPath + 'mushu-mulan.gif'), { filename: 'mushu-mulan.gif'});
					formData.submit(`https://discordapp.com/api/webhooks/${myConsts.PL}`, (err, res) => {
							console.log("[" + new Date().toLocaleString() + "]\r\nShame for " + fname + "!!!\r\nResponse code: " + res.statusCode + "\r\nErrors: " + err + "\r\n");
					});
					break;
					
					case 11:
					var formData = new FormData();
					formData.append('file[0]', fs.createReadStream(fpath), { filename: fname});
					formData.append('file[1]', fs.createReadStream(imgPath + 'mulan-matchmaker.gif'), { filename: 'mulan-matchmaker.gif'});
					formData.submit(`https://discordapp.com/api/webhooks/${myConsts.PL}`, (err, res) => {
							console.log("[" + new Date().toLocaleString() + "]\r\nShame for " + fname + "!!!\r\nResponse code: " + res.statusCode + "\r\nErrors: " + err + "\r\n");
					});
					break;
					
					case 12:
					var formData = new FormData();
					formData.append('file', fs.createReadStream(fpath), { filename: fname});
					formData.append('content','Honestly, at this point I think that man could post a pic of a ||prolapsed anus|| and his stans would fawn');
					formData.submit(`https://discordapp.com/api/webhooks/${myConsts.PL}`, (err, res) => {
							console.log("[" + new Date().toLocaleString() + "]\r\nShame for " + fname + "!!!\r\nResponse code: " + res.statusCode + "\r\nErrors: " + err + "\r\n");
					});
					break;
					
					case 13:
					default:
					var formData = new FormData();
					formData.append('file', fs.createReadStream(fpath), { filename: fname});
					formData.append('content','The way this man has fallen SO HARD');
					formData.submit(`https://discordapp.com/api/webhooks/${myConsts.PL}`, (err, res) => {
							console.log("[" + new Date().toLocaleString() + "]\r\nShame for " + fname + "!!!\r\nResponse code: " + res.statusCode + "\r\nErrors: " + err + "\r\n");
					});
					break;
				}
			},
			function(err) { console.log(JSON.stringify(err)); }
		)}
		catch(err)
		{
			var errLog = fs.createWriteStream('error.log');
			errLog.write(err.name + ": " + err.message + "\r\n");
		}
}
return Artwork();

//Shame('/volume1/homes/bobertdos/Google_Drive/WD_lis-media/JohnsonBlazkowicz (53).jpg','JohnsonBlazkowicz (53).jpg');