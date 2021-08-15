'use strict';
const https = require('https');
const fs = require('fs');
const FormData = require('form-data');
const MersenneTwister = require('mersennetwister');
const myConsts = require('./myConstants.js');
// Stage Get request to retrieve data from either dad jokes or facts API
function pickRemote(num) {
	const getOptions = {
			hostname: 'inspirobot.me',
			path: '/api?generate=true',
			method: 'GET',
			headers: {
			  'User-Agent': myConsts.UA
			}
		  };

	//Perform GET request with specified options.
	let imgData = '';
	https.request(getOptions, (addr_res) => {
		addr_res.on('data', (imgAddr) => { imgData += imgAddr; });
			addr_res.on('end', () => {
			
			var myImage = new Object();
			myImage.url = imgData;
			var myEmbed = new Object();
			myEmbed.image = myImage;
			myEmbed.title = "InspiroBot says...";
			myEmbed.color = Math.floor(num * 16777215); // Discord spec requires hexadecimal codes converted to a literal decimal value (anything random between black and white)  
			var myRoot = new Object();
			myRoot.embeds = new Array();
			myRoot.embeds.push(myEmbed);
			var embedString = JSON.stringify(myRoot);
			console.log(embedString);
			const discordOptions = {
				hostname: 'discord.com',
				path: `/api/webhooks/${myConsts.DND}`,
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Content-Length': Buffer.byteLength(embedString)
				}
			}
			const discordReq = https.request(discordOptions);
			discordReq.write(embedString);
			discordReq.end();
		});
	}).end();
}

function pickLocal(num) {
	// Navigate to and retrieve random file.
	var basePath = "/var/services/web/webhooks/inspirobot_local/";
	fs.readdir(basePath, (err, files) => {
		try {
			//files.sort();
			var selectedImg = files[Math.floor(num * files.length)];
			//Perform post to Discord
			var formData = new FormData();
			formData.append('content', 'InspiroBot once said...');
			formData.append('file', fs.createReadStream(basePath + selectedImg), { filename: selectedImg});
			formData.submit(`https://discord.com/api/webhooks/${myConsts.DND}`, (err, res) => {
				var myLog = fs.createWriteStream('log.txt');
				myLog.write("Response code: " + res.statusCode + "\r\n" + err);
			});
		}
		catch(err) {
			var errLog = fs.createWriteStream('error.log');
			errLog.write(err.name + ": " + err.message + "\r\n");
		}
	});
}

function GetTweet(num) {
	const getOptions = {
				hostname: 'api.twitter.com',
				path: '/2/users/951221693682339840/tweets?max_results=5&expansions=attachments.media_keys&media.fields=url,preview_image_url',
				method: 'GET',
				headers: {
				  'User-Agent': myConsts.UA,
				  'Authorization':`Bearer ${myConsts.BIRD}`
				}
	};
	console.log(getOptions.path);
	//Perform GET request with specified options.
	let imgData = '';
	//let account = accounts[Math.floor(num * accounts.length)];
	https.request(getOptions, (addr_res) => {
		addr_res.on('data', (imgAddr) => { imgData += imgAddr; });
			addr_res.on('end', () => {
			var birdData = JSON.parse(imgData);
			var selectedTweet = birdData.data[0];
			var birdMedia = birdData.includes.media;
			var myEmbed = new Object();
			var myImage = new Object();
			
			if ((typeof selectedTweet.attachments) != "undefined")
			{
				var selectedAttachmentKeyIndex =  selectedTweet.attachments.media_keys.length > 1 ? Math.floor(num * selectedTweet.attachments.media_keys.length) : 0;
				var selectedMediaIndex = birdMedia.findIndex(media => media.media_key == selectedTweet.attachments.media_keys[selectedAttachmentKeyIndex]);
				myImage.url = birdMedia[selectedMediaIndex].type == 'photo' ? birdMedia[selectedMediaIndex].url : birdMedia[selectedMediaIndex].preview_image_url;
				myEmbed.image = myImage;
			}
			
			myEmbed.color = Math.floor(num * 16777215); // Discord spec requires hexadecimal codes converted to a literal decimal value (anything random between black and white)
			myEmbed.title = "Daily InspiroBot";
			
			//Account for cases where either the URL ends the Tweet or is absent.
			if (!selectedTweet.text.startsWith("https"))
			{
				var urlPos = selectedTweet.text.indexOf("https");
				if (urlPos < 0)
				{
					myEmbed.description = selectedTweet.text;
				}
				else
				{
					myEmbed.url = selectedTweet.text.substring(urlPos);
					myEmbed.description = selectedTweet.text.substring(0, urlPos);
				}
			}
			else
			{
				myEmbed.url = selectedTweet.text;
			}
			
			var myRoot = new Object();
			myRoot.embeds = new Array();
			myRoot.embeds.push(myEmbed);
			var embedString = JSON.stringify(myRoot);
			console.log(embedString);
			const PL_Options = {
				hostname: 'discord.com',
				path: `/api/webhooks/${myConsts.DND}`,
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Content-Length': Buffer.byteLength(embedString)
				}
			}
			const PL_Req = https.request(PL_Options);
			PL_Req.write(embedString);
			PL_Req.end();
		});
	}).end();	
}
var val = MersenneTwister.random();
if (process.argv.length == 3 && process.argv[2].toLowerCase() == "tweet")
	GetTweet(val);
else
	pickRemote(val);
/***
var decision = MersenneTwister.random();
pickLocal(decision);
if (Math.floor(decision * 10) % 2 == 1) {
	pickLocal(decision);
}
else {
	pickRemote();
}
***/

