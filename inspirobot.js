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

function genImgFlip(num, textArray) {
	var myEmbed = new Object();
	var myImage = new Object();
	var selectedMeme  = '';
		const getOptions = {
					hostname: 'api.imgflip.com',
					path: '/get_memes',
					method: 'GET',
					headers: {
					  'User-Agent': myConsts.UA
					}
		};
		//console.log(getOptions.path);
		//Perform GET request with specified options.
		let allMemeData = '';
		
		return new Promise(function(myResolve, myReject) {
			
			try {
				if (textArray.length <= 5)
				{
					const getMemeReq = https.request(getOptions, (addr_res) => {
						addr_res.on('data', (memeIn) => { allMemeData += memeIn; });
							addr_res.on('end', () => {
							var allMemeDataOut = JSON.parse(allMemeData);
							if (allMemeDataOut.success)
							{
								var targetLength = textArray.length >= 3 ? textArray.length : 2;
								var filteredMemes = allMemeDataOut.data.memes.filter(m => m.box_count == targetLength);
								selectedMeme = filteredMemes[Math.round(filteredMemes.length * num)];
								//console.log("Selected: " + selectedMeme.id);
							}
							
							var kvCollection = [['template_id', selectedMeme.id],['username', myConsts.imgFlip_usr],['password', myConsts.imgFlip_pwd]];
							
							//Because Greg likes undefined things!
							if (targetLength <= 2)
							{
								kvCollection.push(['text0', textArray[0]],['text1', textArray[1]]);
							}
							else
							{
								for (var i = 0; i < targetLength; i++)
								{
									// The imgflip API doc is horribly non-descript about this. The example shows the "boxes" parameter as JSON
									// but since this request format is form-urlencoded, what it actually means is that it wants each boxes "element"
									//represented as an array entry with an associative key for each 'property' being used. Only using 'text' in my case.
									kvCollection.push([`boxes[${i}][text]`, textArray[i]]);
								}
							}
							var imgFlipRequestStr = new URLSearchParams(kvCollection).toString();
							
							const genOptions = {
								hostname: 'api.imgflip.com',
								path: '/caption_image',
								method: 'POST',
								headers: {
								  'User-Agent': myConsts.UA,
								  'Content-Type' : 'application/x-www-form-urlencoded'
								}
							};
							
							var someData = '';
							const genReq = https.request(genOptions, (res) => {
									res.on('data', (chunk) => { someData += chunk; });
									res.on('end', () => {
										//console.log("LOOK HERE FOR DATA: " + someData);
									var myMeme = JSON.parse(someData);
									myEmbed.title = selectedMeme.name;
									myEmbed.color = num % 16777215; // Discord spec requires hexadecimal codes converted to a literal decimal value (anything random between black and white)
									if (myMeme.success) {
										myEmbed.url = myMeme.data.page_url;
										myImage.url = myMeme.data.url;
									}
									myEmbed.image = myImage;
									var myRoot = {"embeds" : [myEmbed]}
									myResolve(JSON.stringify(myRoot));
								});
								res.on('error', (err) => {
									myConsts.logger(err);
									myReject(err);
								});
							});
							//console.log("This is what should be sent: " + imgFlipRequestStr);
							genReq.write(imgFlipRequestStr);
							genReq.end();
						});
						
						addr_res.on('error', (err) => {
							myConsts.logger(err);
							myReject(err);
						});
					}).end();
				}
				else
				{
					myReject("Maximum allowed text boxes is 5!");
				}
			}
			catch (e)
			{
				myConsts.logger(e.message);
				myReject(e.message);
			}
		})
	}

function CallImgFlip(num) {
	/***
	const getOptions = {
			hostname: 'my.api.mockaroo.com',
			path: `/phrases.json?qty=${Math.floor(num * 3) + 2}`,
			method: 'GET',
			headers: {
			  'User-Agent': myConsts.UA,
			  'x-api-key': myConsts.MOCKAROO
			}
		  };
	**/
	var someLength = Math.floor(num * 3) + 2;
	var someYear = Math.round(num * 2021);
	var period = '';
	if (someYear >= 1500)
	{
		period = someYear;
	}
	else {
		if (someYear > 1399 && someYear <= 1499)
			period = '15th%20century';
		else if (someYear > 1299 && someYear <= 1399)
			period = '14th%20century';
		else if (someYear > 1199 && someYear <= 1299)
			period = '13th%20century';
		else if (someYear > 1099 && someYear <= 1199)
			period = '12th%20century';
		else
			period = 'before%2012th%20century';
	}
	console.log(period);
	const getOptions = {
			hostname: 'www.merriam-webster.com',
			path: `/lapi/v1/mwol-search/ety-explorer/date/${period}`,
			method: 'GET',
			headers: {
			  'User-Agent': myConsts.UA
			}
		  };
		  
	let textData = '';
	https.request(getOptions, (textReq) => {
		textReq.on('data', (textIn) => { textData += textIn; });
			textReq.on('end', () => {
				var boxTextSrc = JSON.parse(textData);
				var boxText = new Array();
				for (var x = 0; x < someLength; x++)
				{
					boxText.push(boxTextSrc.words[Math.floor(MersenneTwister.random() * boxTextSrc.total)].toUpperCase());
				}
				
			const discordOptions = {
				hostname: 'discord.com',
				path: `/api/webhooks/${myConsts.DND}`,
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				}
			}
			const discordReq = https.request(discordOptions);
			genImgFlip(num, boxText).then(
					function(resp) { discordReq.write(resp); discordReq.end(); console.log(resp); },
					function(err) { myConsts.logger(err); console.log(err); discordReq.end(); }
				);
		});
	}).end();
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
			
			myEmbed.color = num % 16777215; // Discord spec requires hexadecimal codes converted to a literal decimal value (anything random between black and white)
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

function Face(num) {
	let now = new Date().getTime() / 1000.0;
	let epoch = `${Math.floor(now)}.jpg`;
	const getOptions = {
			hostname: 'this-person-does-not-exist.com',
			path: '/en?new',
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
				let faceData = JSON.parse(imgData);
				console.log(imgData);
				if (faceData.generated) {
					console.log("It has been generated!\r\n");
					const filePath = fs.createWriteStream(`faces/${epoch}`);
					const getFace = https.get(`https://this-person-does-not-exist.com/img/${faceData.name}`, function(response) {
						response.pipe(filePath);
					});
					filePath.on('finish',() => {
						filePath.close();
						var formData = new FormData();
						formData.append('content', 'This person does not exist!');
						formData.append('file', fs.createReadStream(`faces/${epoch}`), { filename: epoch});
						formData.submit(`https://discord.com/api/webhooks/${myConsts.DND}`);
					});
				}
			});
	}).end();
}

function postFace(e) {
	var formData = new FormData();
	formData.append('content', 'This person does not exist!');
	formData.append('file', fs.createReadStream(`faces/${e}`), { filename: e});
	formData.submit(`https://discord.com/api/webhooks/${myConsts.DND}`);
}

var val = MersenneTwister.random() * Number.MAX_SAFE_INTEGER;
//var val = 1;
if (process.argv.length == 3 && process.argv[2].toLowerCase() == "tweet")
	GetTweet(val);
else switch (val % 3)
{
	case 2:
	CallImgFlip(val);
	break;
	case 1:
	Face(val);
	break;
	case 0:
	default:
	pickRemote(val);
}
//CallImgFlip(val);
