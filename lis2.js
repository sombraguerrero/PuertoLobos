'use strict';
const https = require('https');
const fs = require('fs');
const FormData = require('form-data');
const MersenneTwister = require('mersennetwister');
const myConsts = require('./myConstants.js');
function Artwork(num) {
	var basePath = "/var/services/homes/bobertdos/Google_Drive/WD_lis-media/";
	if (Math.floor(num * 10) % 2 == 1) {
		basePath += "/le-louvre-de-lis2/"
	}
	fs.readdir(basePath, { withFileTypes: true }, (err, files) => {
		try {
			const filteredFiles = files
			.filter(dirent => dirent.isFile())
			.map(dirent => dirent.name);
			//filteredFiles.sort();
			var selectedImg = filteredFiles[Math.floor(num * filteredFiles.length)];
			//Perform post to Discord
			var formData = new FormData();
			formData.append('content', 'Random fan art: ' + selectedImg);
			formData.append('file', fs.createReadStream(basePath + selectedImg), { filename: selectedImg});
			formData.submit(`https://discordapp.com/api/webhooks/${myConsts.PL}`, (err, res) => {
					var myLog = fs.createWriteStream('log.txt', { flags: 'w'});
					myLog.write("[" + new Date().toLocaleString() + "]\r\nSelected Image: " + basePath + selectedImg + "\r\nResponse code: " + res.statusCode + "\r\nErrors: " + err + "\r\n");
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

function getTweet(num) {
	const accounts = [
		{
			"name": "LiS2Comfort",
			"id" : '1408937956577062912'
		},
		{
			"name": "Daily Finn",
			"id": '1417389468978405381'
		},
		{
			"name": "Daily Sean",
			"id": '1417198402601902083'
		},
		{
			"name": "Daily Daniel",
			"id": '1417252091945435136'
		}
	];
	let account = accounts[Math.floor(num * accounts.length)];
	const getOptions = {
				hostname: 'api.twitter.com',
				path: `/2/users/${account.id}/tweets?max_results=100&expansions=attachments.media_keys&media.fields=url,preview_image_url`,
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
			var selectedTweet = birdData.data[Math.round(birdData.data.length * num)];
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
			myEmbed.title = account.name;
			
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
				path: `/api/webhooks/${myConsts.PL}`,
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Content-Length': Buffer.byteLength(embedString)
				}
			}
			const PL_Req = https.request(PL_Options);
			PL_Req.write(embedString);
			PL_Req.end();
			
			const WD_Options = {
				hostname: 'discord.com',
				path: `/api/webhooks/${myConsts.WD}`,
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Content-Length': Buffer.byteLength(embedString)
				}
			}
			const WD_Req = https.request(WD_Options);
			WD_Req.write(embedString);
			WD_Req.end();
		});
	}).end();	
}

// Navigate to and retrieve random file.
var val = MersenneTwister.random();
Artwork(val);
