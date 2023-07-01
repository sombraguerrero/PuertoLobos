'use strict';
const https = require('https');
const fs = require('fs');
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
			myEmbed.color = num % 16777215; // Discord spec requires hexadecimal codes converted to a literal decimal value (anything random between black and white)  
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

myConsts.getSeed(true,1)
.then(
	function(r) {
		pickRemote(r[0] * Number.MAX_SAFE_INTEGER);
	},
	function(anError) {
		console.log(JSON.stringify(anError));
	});
