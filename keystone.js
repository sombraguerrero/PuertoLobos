'use strict';
const mariadb = require('mariadb');
const myConsts = require('./myConstants.js');
const http = require('http');
const https = require('https');
const fs = require('fs');
const FormData = require('form-data');

function getKeyResponse() {
	 let conn;
	 let promptOut = 'test';
	 try
	 {
		 mariadb.createConnection({
			 host: myConsts.conn.host, 
			 user: myConsts.conn.user, 
			 password: myConsts.conn.password,
			 port: myConsts.conn.port,
			 database: myConsts.conn.database,
			 connectionLimit: myConsts.conn.connectionLimit
		 })
		.then(conn => {
			conn.query('SELECT * from prompts where kind = ? order by rand() limit 1', ['gregResponse'])
			.then(row => {
				var survey = { "content": `${myConsts.GREG} ${row[0].prompt}` }
				writeToDiscord(survey, 'Survey Response');
				conn.end();
			})
			.catch(err => {
				myConsts.logger("data error: " + err);
			});
		})
		.catch(err => {
			myConsts.logger("not connected due to error: " + err);
		});
	 }
	 catch (ex)
	 {
		 myConsts.logger(ex);
	 }
	 
}

function writeToDiscord(objIn, activity) {
	var postString = JSON.stringify(objIn);
		  var discordOptions = {
			hostname: 'discord.com',
			path: `/api/webhooks/${myConsts.PL_botspam}`,
			method: 'POST',
			headers: {
			  'Content-Type': 'application/json',
			  'Content-Length': Buffer.byteLength(postString)
			}
		  };
		  
		  if (process.argv.length == 3 && process.argv[2] == '--countdown')
		  {
			  discordOptions.path = `/api/webhooks/${myConsts.Countdown}`;
		  }
		  
		  const discordReq = https.request(discordOptions, (res) => {
			console.log(`STATUS: ${res.statusCode}`);
			//console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
			res.setEncoding('utf8');

			res.on('data', (chunk) => {
			  console.log(`BODY: ${chunk}\r\n`);
			});
			res.on('end', () => {
			  console.log(`Activity: ${activity}\r\nStatus Code & Message: ${res.statusCode} - ${res.statusMessage}`);
			});
			res.on('error', () => {
			  console.log(`Activity: ${activity}\r\nStatus Code & Message: ${res.statusCode} - ${res.statusMessage}`);
			});
		  });

		  discordReq.on('error', (e) => {
			console.error(`problem with request: ${e.message}`);
		  });

		  // Write data to request body
		  discordReq.write(postString);
		  //Since the request method is being used here for the post, we're calling end() manually on both request objects.
		  discordReq.end();
		  //console.log(postString);
}

function GetDalle(num) {
	const getOptions = {
				hostname: 'api.twitter.com',
				path: '/2/users/1492677599390322689/tweets?max_results=5&expansions=attachments.media_keys&media.fields=url,preview_image_url',
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
			var selectedTweet = birdData.data[Math.round(num % birdData.data.length)];
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
			myEmbed.title = "Weird DALL-E";
			
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
			writeToDiscord(myRoot, 'Weird DALL-E');
			
		});
	}).end();	
}

function NatalieDee(comicDate) {
	var myRoot = new Object();
	myRoot.content = `${myConsts.GREG}\r\nhttp://nataliedee.com/${comicDate}`;
	writeToDiscord(myRoot, `Natalie Dee (${comicDate})`);
}

function RandomColor(num, target) {
	var colorInt = Math.floor(num % 16777215);
	var hexColor = colorInt.toString(16);
	
	//Credit to Andreas Zettl (https://azettl.net/) for the hex to RGB conversion.
	var aRgbHex = hexColor.match(/.{1,2}/g);
	var aRgb = [
    parseInt(aRgbHex[0], 16),
    parseInt(aRgbHex[1], 16),
    parseInt(aRgbHex[2], 16)
	];
	
	var rgbStr = `(${aRgb[0]}, ${aRgb[1]}, ${aRgb[2]})`;
	var textOutput = `Hex: #${hexColor.toUpperCase()} RGB: ${rgbStr}`;
	//Credit to Russell Heimlich (http://www.russellheimlich.com/blog) for the image generator.
	const getOptions = {
			hostname: 'localhost',
			path: `/dummyimage/code.php?x=640x480/${hexColor}/FFF/`,
			method: 'GET',
			headers: {
			  'User-Agent': myConsts.UA
			}
		  };
		  console.log("URI: " + getOptions.hostname + getOptions.path);

	//Perform GET request with specified options.
	var formData = new FormData();
	http.request(getOptions, (addr_res) => {
		var imgOut = fs.createWriteStream("/volume1/homes/bobertdos/webhooks/color.png");
		addr_res.pipe(imgOut);
		imgOut.on('finish', () => {
				formData.append('content', `${myConsts.GREG} \r\nRandom Color Code!\r\n${textOutput}`);
				formData.append('file', fs.createReadStream("/volume1/homes/bobertdos/webhooks/color.png"), {filename: 'color.png'});
				formData.submit(`https://discord.com/api/webhooks/${target}`);
		});
	}).end();
}

function InspiroBot(num) {
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
			myEmbed.color = Math.floor(num % 16777215); // Discord spec requires hexadecimal codes converted to a literal decimal value (anything random between black and white)  
			var myRoot = new Object();
			myRoot.embeds = new Array();
			myRoot.embeds.push(myEmbed);
			myRoot.content = myConsts.GREG;
			writeToDiscord(myRoot, 'InspiroBot');
		});
	}).end();
}

function Face(num, target) {
	let now = Math.floor(new Date().getTime() / 1000.0);
	let epoch = `${now}.jpg`;
		  
	// thispersondoesnotexist.com
	if (myConsts.FACES == 2)
	{
		const getOptions = {
				hostname: 'thispersondoesnotexist.com',
				path: '/image',
				method: 'GET',
				headers: {
				  'User-Agent': myConsts.UA
				}
		};
		let imgData = '';
		https.request(getOptions, (res) => {
			const filePath = fs.createWriteStream(`/volume1/homes/bobertdos/webhooks/faces/${epoch}`);
			res.pipe(filePath);
			filePath.on('finish',() => {
				filePath.close();
				var formData = new FormData();
				formData.append('content', myConsts.GREG +' This person does not exist!');
				formData.append('file', fs.createReadStream(`/volume1/homes/bobertdos/webhooks/faces/${epoch}`), { filename: epoch});
				formData.submit(`https://discord.com/api/webhooks/${target}`);
			});
		}).end();
	}
	else
	{
	
		// this-person-does-not-exist.com
		const getOptions = {
				hostname: 'this-person-does-not-exist.com',
				path: `/new?time=${now}&gender=all&age=all&etnic=all`,
				method: 'GET',
				headers: {
				  'User-Agent': myConsts.UA
				}
		};
		
		let imgData = '';
		https.request(getOptions, (addr_res) => {
			addr_res.on('data', (imgAddr) => { imgData += imgAddr; });
				addr_res.on('end', () => {
					let faceData = JSON.parse(imgData);
					console.log(imgData);
					if (faceData.generated) {
						console.log("It has been generated!\r\n");
						const filePath = fs.createWriteStream(`/volume1/homes/bobertdos/webhooks/faces/${epoch}`);
						const getFace = https.get(`https://this-person-does-not-exist.com/img/${faceData.name}`, function(response) {
							response.pipe(filePath);
						});
						filePath.on('finish',() => {
							filePath.close();
							var formData = new FormData();
							formData.append('content', myConsts.GREG +' This person does not exist!');
							formData.append('file', fs.createReadStream(`/volume1/homes/bobertdos/webhooks/faces/${epoch}`), { filename: epoch});
							formData.submit(`https://discord.com/api/webhooks/${target}`);
						});
					};
				});
		}).end();
	}
}

function CatAsService(num) {
	const getOptions = {
			hostname: 'api.thecatapi.com',
			path: '/v1/images/search',
			method: 'GET',
			headers: {
			  'User-Agent': myConsts.UA,
			  'x-api-key': myConsts.CAT
			}
		  };

	//Perform GET request with specified options.
	let imgData = '';
	https.request(getOptions, (addr_res) => {
		addr_res.on('data', (catData) => { imgData += catData; });
			addr_res.on('end', () => {
			var parsedData = JSON.parse(imgData);
			var myImage = new Object();
			myImage.url = parsedData[0].url;
			var myEmbed = new Object();
			myEmbed.image = myImage;
			myEmbed.title = "Random Cat!";
			myEmbed.color = Math.floor(num % 16777215); // Discord spec requires hexadecimal codes converted to a literal decimal value (anything random between black and white)  
			var myRoot = new Object();
			myRoot.embeds = new Array();
			myRoot.embeds.push(myEmbed);
			myRoot.content = myConsts.GREG
			writeToDiscord(myRoot, 'Random cat!');
		});
	}).end();
}

function DogAsService(num) {
	const getOptions = {
			hostname: 'api.thedogapi.com',
			path: '/v1/images/search',
			method: 'GET',
			headers: {
			  'User-Agent': myConsts.UA,
			  'x-api-key': myConsts.DOG
			}
		  };

	//Perform GET request with specified options.
	let imgData = '';
	https.request(getOptions, (addr_res) => {
		addr_res.on('data', (dogData) => { imgData += dogData; });
			addr_res.on('end', () => {
				var parsedData = JSON.parse(imgData);
				//console.log(imgData[0]);
				var myImage = new Object();
				myImage.url = parsedData[0].url;
				//console.log(myImage);
				var myEmbed = new Object();
				myEmbed.image = myImage;
				myEmbed.title = "Random Dog!";
				myEmbed.color = Math.floor(num % 16777215); // Discord spec requires hexadecimal codes converted to a literal decimal value (anything random between black and white)  
				var myRoot = new Object();
				myRoot.embeds = new Array();
				myRoot.embeds.push(myEmbed);
				myRoot.content = myConsts.GREG
				writeToDiscord(myRoot, 'Random dog!');
			});
	}).end();
}

function pullStuff(rockFact, target, targetpath) {
	const contentOptions = {
			hostname: target,
			path: targetpath,
			method: 'GET',
			headers: {
			  'Accept': 'text/plain',
			  'User-Agent': myConsts.UA
			}
		  };
		  //console.log(contentOptions);

	//Perform GET request with specified options. (Note that the aliased functions automatically call end() on the request object.)
	const contentReq = https.request(contentOptions, (res) => {
	  const { statusCode } = res;
	  const contentType = res.headers['content-type'];

	  // Stage POST request to Discord Webhook
	  res.setEncoding('utf8');
	  let rawData = '';
	  res.on('data', (chunk) => { rawData += chunk; });
	  res.on('end', () => {
		try {
			var postData = new Object();
			postData.content = myConsts.GREG + ' ' + rawData;
			if (rockFact) {
				var rockFactLines = rawData.split(/\r?\n/);
				postData.content = myConsts.GREG + ' ' + rockFactLines[0].slice(2).replace(/`/g, '\'');
			}
			var srcActivity = rockFact ? 'Random fact!' : 'Dad Joke!';
			writeToDiscord(postData, srcActivity);
	}
	 catch (e) {
		  console.error(`${res.statusCode}: ${res.statusMessage}`);
		}
	  });
	});
	//Using request method for the get too, so calling end() here too.
	contentReq.end();
	contentReq.on('error', (e) => {
	  console.error(`Got error: ${e.message}`);
	});
}

function selectDate(num, mode) {
	//Month is zero-indexed in JS!
	var startDate = null;
	var endDate = null;
	
	var modifier = 0;
	var base_msec = 0;
	var random_msec = base_msec + (num % modifier);
	var finalDate = null;
	switch (mode)
	{
		case 'nat':
		startDate = new Date(2005,0,30);
		endDate = new Date(2013,11,4);
		base_msec = startDate.getTime();
		modifier = endDate - startDate;
		random_msec = base_msec + (num % modifier);
		var opts = new Object();
		opts.month = opts.day = opts.year = "2-digit";
		finalDate = new Date(random_msec).toLocaleDateString("en-US", opts).replace(/\//g, ''); // RegEx is wrapped in /.../ so \ is needed to escape the target /; (g)lobal modifier
		break;
		
		case 'apod':
		startDate = new Date(1995,5,17); //per NASA spec, must be after 1995-06-16, the first day APOD was posted
		endDate = new Date();
		base_msec = startDate.getTime();
		modifier = endDate - startDate;
		random_msec = base_msec + (num % modifier);
		finalDate =  new Date(random_msec).toISOString().slice(0,10);
		break;
		
		case 'spirit':
		startDate = new Date(2004,0,4);
		endDate = new Date(2011,4,25);
		base_msec = startDate.getTime();
		modifier = endDate - startDate;
		random_msec = base_msec + (num % modifier);
		finalDate =  new Date(random_msec).toISOString().slice(0,10);
		break;
		
		case 'opportunity':
		startDate = new Date(2004,0,25);
		endDate = new Date(2019,1,13);
		base_msec = startDate.getTime();
		modifier = endDate - startDate;
		random_msec = base_msec + (num % modifier);
		finalDate =  new Date(random_msec).toISOString().slice(0,10);
		break;
		
		case 'curiosity':
		startDate = new Date(2012,7,6);
		endDate = new Date();
		base_msec = startDate.getTime();
		modifier = endDate - startDate;
		random_msec = base_msec + (num % modifier);
		finalDate =  new Date(random_msec).toISOString().slice(0,10);
		break;
	}
	console.log(`${mode} date being returned: ${finalDate}`);
	return finalDate;
}

function ChuckNorris() {
	const contentOptions = {
			hostname: 'api.chucknorris.io',
			path: '/jokes/random',
			method: 'GET',
			headers: {
			  'Accept': 'application/json',
			  'User-Agent': myConsts.UA
			}
		  };
		  //console.log(contentOptions);

	//Perform GET request with specified options. (Note that the aliased functions automatically call end() on the request object.)
	const contentReq = https.request(contentOptions, (res) => {
	  const { statusCode } = res;
	  const contentType = res.headers['content-type'];

	  // Stage POST request to Discord Webhook
	  res.setEncoding('utf8');
	  let rawData = '';
	  res.on('data', (chunk) => { rawData += chunk; });
	  res.on('end', () => {
		try {
			var parsedData = JSON.parse(rawData);
			//console.log("My Content\r\n" + parsedData);
			var postData = new Object();
			postData.content = myConsts.GREG + ' ' + parsedData.value;
			writeToDiscord(postData, 'Chuck Norris!!!');
		} catch (e) {
		  console.error(`${res.statusCode}: ${res.statusMessage}`);
		}
	});
	});
	//Using request method for the get too, so calling end() here too.
	contentReq.end();
	contentReq.on('error', (e) => {
	  console.error(`Got error: ${e.message}`);
	});
}

function DogFact() {
	const contentOptions = {
			hostname: 'dogapi.dog',
			path: '/api/v2/facts',
			method: 'GET',
			headers: {
			  'Accept': 'application/json',
			  'User-Agent': myConsts.UA
			}
		  };
		  //console.log(contentOptions);

	//Perform GET request with specified options. (Note that the aliased functions automatically call end() on the request object.)
	const contentReq = https.request(contentOptions, (res) => {
	  const { statusCode } = res;
	  const contentType = res.headers['content-type'];

	  // Stage POST request to Discord Webhook
	  res.setEncoding('utf8');
	  let rawData = '';
	  res.on('data', (chunk) => { rawData += chunk; });
	  res.on('end', () => {
		try {
			var parsedData = JSON.parse(rawData);
			//console.log("My Content\r\n" + parsedData);
			var postData = new Object();
			postData.content = myConsts.GREG + ' ' + parsedData.data[0].attributes.body;
			writeToDiscord(postData, 'Dog fact!!!');
		} catch (e) {
		  console.error(`${res.statusCode}: ${res.statusMessage}`);
		}
	});
	});
	//Using request method for the get too, so calling end() here too.
	contentReq.end();
	contentReq.on('error', (e) => {
	  console.error(`Got error: ${e.message}`);
	});
}

function CatFact() {
	const contentOptions = {
			hostname: 'catfact.ninja',
			path: '/fact',
			method: 'GET',
			headers: {
			  'Accept': 'application/json',
			  'User-Agent': myConsts.UA
			}
		  };
		  //console.log(contentOptions);

	//Perform GET request with specified options. (Note that the aliased functions automatically call end() on the request object.)
	const contentReq = https.request(contentOptions, (res) => {
	  const { statusCode } = res;
	  const contentType = res.headers['content-type'];

	  // Stage POST request to Discord Webhook
	  res.setEncoding('utf8');
	  let rawData = '';
	  res.on('data', (chunk) => { rawData += chunk; });
	  res.on('end', () => {
		try {
			var parsedData = JSON.parse(rawData);
			//console.log("My Content\r\n" + parsedData);
			var postData = new Object();
			postData.content = myConsts.GREG + ' ' + parsedData.fact;
			writeToDiscord(postData, 'Cat fact!');
		} catch (e) {
		  console.error(`${res.statusCode}: ${res.statusMessage}`);
		}
	});
	});
	//Using request method for the get too, so calling end() here too.
	contentReq.end();
	contentReq.on('error', (e) => {
	  console.error(`Got error: ${e.message}`);
	});
}

function JeopardyQ() {
	const contentOptions = {
			hostname: 'jservice.io',
			path: '/api/random',
			method: 'GET',
			headers: {
			  'Accept': 'application/json',
			  'User-Agent': myConsts.UA
			}
		  };
		  //console.log(contentOptions);

	//Perform GET request with specified options. (Note that the aliased functions automatically call end() on the request object.)
	const contentReq = https.request(contentOptions, (res) => {
	  const { statusCode } = res;
	  const contentType = res.headers['content-type'];

	  // Stage POST request to Discord Webhook
	  res.setEncoding('utf8');
	  let rawData = '';
	  res.on('data', (chunk) => { rawData += chunk; });
	  res.on('end', () => {
		try {
			var parsedData = JSON.parse(rawData);
			//console.log("My Content\r\n" + parsedData);
			var postData = new Object();
			var textOut = parsedData[0].value != null ? myConsts.GREG + "\r\n" + parsedData[0].category.title + " for $" + parsedData[0].value + "\r\nQ: " + parsedData[0].question + '\r\n\r\nA: ||' + parsedData[0].answer.replace("<i>", "*").replace("</i>", "*") + '||' : "<@540850957131579413>\r\n" + parsedData[0].category.title + "\r\nQ: " + parsedData[0].question + '\r\n\r\nA: ||' + parsedData[0].answer.replace("<i>", "*").replace("</i>", "*") + '||';
			postData.content = textOut;
			writeToDiscord(postData, 'Trivia!');
		} catch (e) {
		  console.error(`${res.statusCode}: ${res.statusMessage}`);
		}
	});
	});
	//Using request method for the get too, so calling end() here too.
	contentReq.end();
	contentReq.on('error', (e) => {
	  console.error(`Got error: ${e.message}`);
	});
}

function ShibesImages(target, rand) {
	const animals = ['shibes','cats','birds'];
	var pickAnimal = animals[Math.floor(rand * animals.length)];
	var basePath = `prompt-bot/${pickAnimal}/`;
	fs.readdir(basePath, { withFileTypes: true }, (err, files) => {
		const filteredFiles = files
		.filter(dirent => dirent.isFile() && !(dirent.name.endsWith('.ini') || dirent.name.endsWith('.db') || dirent.name.endsWith('.webp')))
		.map(dirent => dirent.name);
		var selectedImg = filteredFiles[Math.floor(rand * filteredFiles.length)];
		var fullPath = basePath + selectedImg;
		//Perform post to Discord
		var formData = new FormData();
		formData.append('content', `Random ${pickAnimal}`);
		formData.append('file', fs.createReadStream(fullPath), { filename: selectedImg});
		formData.submit(`https://discordapp.com/api/webhooks/${target}`, (err, res) => {
			console.log("[" + new Date().toLocaleString() + "]\r\nSelected Image: " + fullPath + "\r\nResponse code: " + res.statusCode + "\r\nErrors: " + err + "\r\n");
			res.resume();
		});
	});
}

function ThisOrThat() {
	const contentOptions = {
			hostname: 'itsthisforthat.com',
			path: '/api.php?json',
			method: 'GET',
			headers: {
			  'Accept': 'application/json',
			  'User-Agent': myConsts.UA
			}
		  };
		  //console.log(contentOptions);

	//Perform GET request with specified options. (Note that the aliased functions automatically call end() on the request object.)
	const contentReq = https.request(contentOptions, (res) => {
	  const { statusCode } = res;
	  const contentType = res.headers['content-type'];

	  // Stage POST request to Discord Webhook
	  res.setEncoding('utf8');
	  let rawData = '';
	  res.on('data', (chunk) => { rawData += chunk; });
	  res.on('end', () => {
		try {
			var parsedData = JSON.parse(rawData);
			//console.log("My Content\r\n" + parsedData);
			var postData = new Object();
			postData.content = `${myConsts.GREG} ${parsedData.this} or ${parsedData.that}?`;
			writeToDiscord(postData, 'This or That!');
		} catch (e) {
		  console.error(`${res.statusCode}: ${res.statusMessage}`);
		}
	});
	});
	//Using request method for the get too, so calling end() here too.
	contentReq.end();
	contentReq.on('error', (e) => {
	  console.error(`Got error: ${e.message}`);
	});
}

function Affirm() {
	const contentOptions = {
			hostname: 'www.affirmations.dev',
			path: '/',
			method: 'GET',
			headers: {
			  'Accept': 'application/json',
			  'User-Agent': myConsts.UA
			}
		  };
		  //console.log(contentOptions);

	//Perform GET request with specified options. (Note that the aliased functions automatically call end() on the request object.)
	const contentReq = https.request(contentOptions, (res) => {
	  const { statusCode } = res;
	  const contentType = res.headers['content-type'];

	  // Stage POST request to Discord Webhook
	  res.setEncoding('utf8');
	  let rawData = '';
	  res.on('data', (chunk) => { rawData += chunk; });
	  res.on('end', () => {
		try {
			//console.log(rawData);
			var parsedData = JSON.parse(rawData);
			//console.log("My Content\r\n" + parsedData);
			var postData = new Object();
			postData.content = myConsts.GREG + ' ' + parsedData.affirmation;
			writeToDiscord(postData, 'Affirmations!');
		} catch (e) {
		  console.error(`${res.statusCode}: ${res.statusMessage}`);
		}
	});
	});
	//Using request method for the get too, so calling end() here too.
	contentReq.end();
	contentReq.on('error', (e) => {
	  console.error(`Got error: ${e.message}`);
	});
}

function AdviceSlip() {
	const contentOptions = {
			hostname: 'api.adviceslip.com',
			path: '/advice',
			method: 'GET',
			headers: {
			  'Accept': 'application/json',
			  'User-Agent': myConsts.UA
			}
		  };
		  //console.log(contentOptions);

	//Perform GET request with specified options. (Note that the aliased functions automatically call end() on the request object.)
	const contentReq = https.request(contentOptions, (res) => {
	  const { statusCode } = res;
	  const contentType = res.headers['content-type'];

	  // Stage POST request to Discord Webhook
	  res.setEncoding('utf8');
	  let rawData = '';
	  res.on('data', (chunk) => { rawData += chunk; });
	  res.on('end', () => {
		try {
			var parsedData = JSON.parse(rawData);
			//console.log("My Content\r\n" + parsedData);
			var postData = new Object();
			postData.content = myConsts.GREG + ' ' + parsedData.slip.advice;
			writeToDiscord(postData, 'Advice');
		} catch (e) {
		  console.error(e.message);
		}
	});
	});
	//Using request method for the get too, so calling end() here too.
	contentReq.end();
	contentReq.on('error', (e) => {
	  console.error(`${res.statusCode}: ${res.statusMessage}`);
	});
}

function NasaAPOD(apodDate, num) {
	const contentOptions = {
			hostname: 'api.nasa.gov',
			path: `/planetary/apod?date=${apodDate}&api_key=${myConsts.NASA}`,
			method: 'GET',
			headers: {
			  'Accept': 'application/json',
			  'User-Agent': myConsts.UA
			}
		  };
		  //console.log(contentOptions);

	//Perform GET request with specified options. (Note that the aliased functions automatically call end() on the request object.)
	const contentReq = https.request(contentOptions, (res) => {
	  const { statusCode } = res;
	  const contentType = res.headers['content-type'];

	  // Stage POST request to Discord Webhook
	  res.setEncoding('utf8');
	  let rawData = '';
	  res.on('data', (chunk) => { rawData += chunk; });
	  res.on('end', () => {
		try {
			var parsedData = JSON.parse(rawData);
			//console.log("My Content\r\n" + parsedData);
			var myImage = new Object();
			myImage.url = parsedData.url;
			var myProvider = new Object();
			myProvider.name = 'NASA';
			myProvider.url = 'https://api.nasa.gov/';
			var myAuthor = new Object();
			myAuthor.name = parsedData.copyright;
			var myFooter = new Object();
			myFooter.text = 'Posted: ' + parsedData.date;
			var myEmbed = new Object();
			myEmbed.image = myImage;
			myEmbed.author = myAuthor;
			myEmbed.provider = myProvider;
			myEmbed.footer = myFooter;
			myEmbed.title = parsedData.title;
			myEmbed.description = parsedData.explanation;
			//myEmbed.color = 52479;
			myEmbed.color = num % 16777215; // Discord spec requires hexadecimal codes converted to a literal decimal value (anything random between black and white)
			var myRoot = new Object();
			myRoot.content = myConsts.GREG + '\r\n';
			myRoot.embeds = new Array();
			myRoot.embeds.push(myEmbed);
			writeToDiscord(myRoot, `Nasa APOD (${apodDate})`);
		} catch (e) {
			console.error(`${res.statusCode}: ${res.statusMessage}`);
		}
	});
	});
	//Using request method for the get too, so calling end() here too.
	contentReq.end();
	contentReq.on('error', (e) => {
	  console.error(`Got error: ${e.message}`);
	});
}

function getArtWork() {
	 try
	 {
		 mariadb.createConnection({
			 host: myConsts.conn.host, 
			 user: myConsts.conn.user, 
			 password: myConsts.conn.password,
			 port: myConsts.conn.port,
			 database: myConsts.conn.database,
			 connectionLimit: myConsts.conn.connectionLimit
		 })
		.then(conn => {
			conn.query('CALL `getDiscordEmbed`()')
			.then(row => {
				//console.log('Sending to gen function: ' + row[0])
				writeToDiscord(genArtworkEmbed(row[0]), 'ARTIC');
				//console.log(JSON.stringify(genArtworkEmbed(row[0])))
				conn.end();
			},
			err => { console.log(err) }
			);
		});
	}
	catch(e)
	{
		myConsts.logger("not connected due to error: " + e);
	}
}

function genArtworkEmbed(artDS)
{
	try
		{
			var myImage = new Object();
			var myRoot = new Object();
			console.log('A value: ' + artDS[0].discordColor)
			myImage.url = artDS[0].img_url;
			var myProvider = new Object();
			myProvider.name = 'Art Institute of Chicago';
			myProvider.url = 'https://www.artic.edu';
			var myAuthor = new Object();
			myAuthor.name = artDS[0].artist_display;
			var myFooter = new Object();
			myFooter.text = `${artDS[0].date_display} - ${artDS[0].place_of_origin}\r\n${artDS[0].medium_display}`;
			var myEmbed = new Object();
			myEmbed.image = myImage;
			myEmbed.author = myAuthor;
			myEmbed.provider = myProvider;
			myEmbed.footer = myFooter;
			myEmbed.title = artDS[0].artwork_title != '' ? artDS[0].artwork_title : artDS[0].img_title;
			myEmbed.description = `${artDS[0].description} \r\n${artDS[0].inscriptions} `;
			myEmbed.url = 'https://www.artic.edu';
			myEmbed.color =  artDS[0].discordColor; // Discord spec requires hexadecimal codes converted to a literal decimal value (anything random between black and white)
			myRoot.embeds = new Array();
			myRoot.embeds.push(myEmbed);
			return myRoot;
		}
		catch (e)
		{
			myConsts.logger(e);
		}
}

function NasaMRover(num) {
	const rovers = ['curiosity','opportunity','spirit'];
	
	var selectRover = rovers[num % rovers.length];
	var selectedDate = selectDate(num, selectRover);
	const contentOptions = {
			hostname: 'api.nasa.gov',
			path: `/mars-photos/api/v1/rovers/${selectRover}/photos/?earth_date=${selectedDate}&api_key=${myConsts.NASA}`,
			method: 'GET',
			headers: {
			  'Accept': 'application/json',
			  'User-Agent': myConsts.UA
			}
		  };
		  console.log(contentOptions);

	//Perform GET request with specified options. (Note that the aliased functions automatically call end() on the request object.)
	const contentReq = https.request(contentOptions, (res) => {
	  const { statusCode } = res;
	  const contentType = res.headers['content-type'];

	  // Stage POST request to Discord Webhook
	  res.setEncoding('utf8');
	  let rawData = '';
	  res.on('data', (chunk) => { rawData += chunk; });
	  res.on('end', () => {
		try
		{
			var parsedData = JSON.parse(rawData);
			var selectedPhoto = parsedData.photos[num % parsedData.photos.length];
			if ((typeof selectedPhoto) != "undefined")
			{
				//console.log("My Content\r\n" + parsedData);
				var myImage = new Object();
				myImage.url = selectedPhoto.img_src;
				var myProvider = new Object();
				myProvider.name = 'NASA';
				myProvider.url = 'https://api.nasa.gov/';
				var myAuthor = new Object();
				myAuthor.name = selectedPhoto.rover.name + ' - ' + selectedPhoto.camera.full_name;
				var myFooter = new Object();
				myFooter.text = 'Taken ' + selectedPhoto.earth_date + " (Sol " + selectedPhoto.sol + ')';
				var myEmbed = new Object();
				myEmbed.image = myImage;
				myEmbed.author = myAuthor;
				myEmbed.provider = myProvider;
				myEmbed.footer = myFooter;
				myEmbed.title = "Mars Rover Photo";
				//myEmbed.color = 52479;
				myEmbed.color = num % 16777215; // Discord spec requires hexadecimal codes converted to a literal decimal value (anything random between black and white)
				var myRoot = new Object();
				myRoot.content = myConsts.GREG + '\r\n';
				myRoot.embeds = new Array();
				myRoot.embeds.push(myEmbed);
				writeToDiscord(myRoot, `Nasa Mars Rover (${selectedDate})`);
			}
			else
			{
				console.log("\r\nEmpty response from Mars Rover, serving cats instead!\r\n");
				CatAsService(num);
			}
		}
		catch (e) {
			console.error(`${res.statusCode}: ${res.statusMessage}`);
		}
	});
	});
	//Using request method for the get too, so calling end() here too.
	contentReq.end();
	contentReq.on('error', (e) => {
	  console.error(e.message);
	});
}

function Pokemon(num) {
	const contentOptions = {
			hostname: 'pokeapi.co',
			path: `/api/v2/pokemon/${num % 1015}`,
			method: 'GET',
			headers: {
			  'Accept': 'application/json',
			  'User-Agent': myConsts.UA
			}
		  };
		  //console.log(contentOptions);

	//Perform GET request with specified options. (Note that the aliased functions automatically call end() on the request object.)
	const contentReq = https.request(contentOptions, (res) => {
	  const { statusCode } = res;
	  const contentType = res.headers['content-type'];

	  // Stage POST request to Discord Webhook
	  res.setEncoding('utf8');
	  let rawData = '';
	  res.on('data', (chunk) => { rawData += chunk; });
	  res.on('end', () => {
		try {
			//console.log(rawData);
			var parsedData = JSON.parse(rawData);
			//console.log("My Content\r\n" + parsedData);
			var myImage = new Object();
			myImage.url = parsedData.sprites.front_default;
			var myProvider = new Object();
			myProvider.name = 'PokéAPI';
			myProvider.url = 'https://pokeapi.co/';
			var typesStr = "";
			for (let t of parsedData.types) {
				typesStr += t.type.name + '/';
			}
			
			var cmHeight = (parsedData.height * 10);
			var kgWeight = (parsedData.weight / 10);
			var imperial = cmHeight * 0.39370079;
			var ft = Math.floor(imperial / 12);
			var inches = Math.round(imperial % 12);
			if (inches == 12)
			{
				ft++;
				inches = 0;
			}
			var lbs = Math.round(kgWeight * 2.20462262);
			var myFields = new Array(
				{name: "Height", value: ft + "\' " + inches + "\" (" + cmHeight + "cm)", inline: true}, //original value in decimeters
				{name: "Weight", value: lbs + "lbs (" + kgWeight + "kg)", inline: true}, // original value in hectograms
				{name: "Type", value: typesStr, inline: true}
			);
			
			var myEmbed = new Object();
			myEmbed.image = myImage;
			myEmbed.provider = myProvider;
			myEmbed.title = parsedData.name[0].toUpperCase() + parsedData.name.substring(1);
			myEmbed.fields = myFields;
			//myEmbed.color = 16711808; // Discord spec requires hexadecimal codes converted to a literal decimal value (#ff0080)
			myEmbed.color = num % 16777215; // Discord spec requires hexadecimal codes converted to a literal decimal value (anything random between black and white)
			var myRoot = new Object();
			myRoot.content = `${myConsts.GREG} Random Pokémon!\r\n`;
			myRoot.embeds = new Array();
			myRoot.embeds.push(myEmbed);
			writeToDiscord(myRoot, 'Random Pokémon');
		} catch (e) {
		  console.error(`${res.statusCode}: ${res.statusMessage}`);
		}
	});
	});
	//Using request method for the get too, so calling end() here too.
	contentReq.end();
	contentReq.on('error', (e) => {
	  console.log(`Got error: ${e.message}`);
	});
}

function Unsplash(num) {
	const contentOptions = {
			hostname: 'api.unsplash.com',
			path: "/photos/random",
			method: 'GET',
			headers: {
			  'Accept': 'application/json',
			  'User-Agent': myConsts.UA,
			  'Authorization': `Client-ID ${myConsts.UNSPLASH}`
			}
		  };
		  //console.log(contentOptions);

	//Perform GET request with specified options. (Note that the aliased functions automatically call end() on the request object.)
	const contentReq = https.request(contentOptions, (res) => {
	  const { statusCode } = res;
	  const contentType = res.headers['content-type'];

	  // Stage POST request to Discord Webhook
	  res.setEncoding('utf8');
	  let rawData = '';
	  res.on('data', (chunk) => { rawData += chunk; });
	  res.on('end', () => {
		try {
			//console.log(rawData);
			var parsedData = JSON.parse(rawData);
			//console.log("My Content\r\n" + parsedData);
			var myImage = new Object();
			myImage.url = parsedData.urls.regular;
			var myProvider = new Object();
			myProvider.name = 'Unspash';
			myProvider.url = parsedData.links.html;
			var myAuthor = new Object();
			myAuthor.name = parsedData.user.portfolio_url != null ? parsedData.user.name + " (" + parsedData.user.portfolio_url + ")" : parsedData.user.name;
			var myFooter = new Object();
			myFooter.text = parsedData.location.title != null ? 'Created: ' + parsedData.created_at + " (" + parsedData.location.title + ")" : 'Created: ' + parsedData.created_at;
			
			var myEmbed = new Object();
			myEmbed.image = myImage;
			myEmbed.provider = myProvider;
			myEmbed.footer = myFooter;
			myEmbed.author = myAuthor;
			myEmbed.title = parsedData.alt_description;
			myEmbed.description = parsedData.description;
			//myEmbed.color = 16711808; // Discord spec requires hexadecimal codes converted to a literal decimal value (#ff0080)
			myEmbed.color = parsedData.color != null ? parseInt(parsedData.color.substring(1), 16) : num % 16777215;
			var myRoot = new Object();
			myRoot.content = `${myConsts.GREG} Random Photo!\r\n`;
			myRoot.embeds = new Array();
			myRoot.embeds.push(myEmbed);
			writeToDiscord(myRoot, 'Unsplash');
		} catch (e) {
		  console.error(`${res.statusCode}: ${res.statusMessage}`);
		}
	});
	});
	//Using request method for the get too, so calling end() here too.
	contentReq.end();
	contentReq.on('error', (e) => {
	  console.error(`Got error: ${e.message}`);
	});
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
								selectedMeme = filteredMemes[num % filteredMemes.length];
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
									myEmbed.color = Math.floor(num % 16777215); // Discord spec requires hexadecimal codes converted to a literal decimal value (anything random between black and white)
									if (myMeme.success) {
										myEmbed.url = myMeme.data.page_url;
										myImage.url = myMeme.data.url;
									}
									myEmbed.image = myImage;
									var myRoot = {"embeds" : [myEmbed]}
									myResolve(myRoot);
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
		return new Promise(function(myResolve) {
			myConsts.getSeed(true, 7)
			.then(
				function(seeds)
				{
					var boxText = new Array();
					var someLength = Math.floor(seeds[0] * 3) + 2;
					var someYear = Math.round(seeds[1] * new Date().getFullYear() - 1);
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
									for (var x = 2; x <= someLength; x++)
									{
										boxText.push(boxTextSrc.words[Math.floor(seeds[x] * boxTextSrc.total)].toUpperCase());
									}
									genImgFlip(num, boxText).then(
										function(resp) { writeToDiscord(resp, 'ImgFlip'); console.log(resp); },
										function(err) { myConsts.logger(err); console.log(err); });
							});
						}).end();
				});
		});
	}

myConsts.getSeed(true, 1)
.then(
	async function(r)
	{
		var formDataTarget = myConsts.PL_botspam;
		var val = Math.round(r[0] * Number.MAX_SAFE_INTEGER);
		var task = -1;
		if (process.argv.length == 3 && process.argv[2] != "--countdown")
			task = process.argv[2];
		else if (process.argv.length == 4) {
			task = process.argv[2];
			val = parseInt(process.argv[3])
		}
		else
		{
			task = val;
			if (process.argv[2] == '--countdown')
			{
				formDataTarget = myConsts.Countdown;
			}
		}
		console.log(`Main value: ${val}\r\nTask value: ${task}`);
		switch (task % 20)
		{
		//switch (debugVal) {
			case 0:
			console.log('Dad Joke selected.\n');
			pullStuff(false, 'icanhazdadjoke.com', '');
			break;
			
			case 1:
			console.log('Useless Fact selected.\n');
			pullStuff(true, 'uselessfacts.jsph.pl', '/api/v2/facts/random?language=en');
			break;
			
			case 2:
			console.log('Key Responses selected.\n');
			getKeyResponse();
			break;
			
			case 3:
			console.log('NASA APOD selected.\n');
			NasaAPOD(selectDate(val, "apod"), val);
			break;
			
			case 4:
			console.log('Shibes selected.\n');
			ShibesImages(formDataTarget, r);
			break;
			
			case 5:
			console.log('Advice selected.\n');
			AdviceSlip();
			break;
			
			case 6:
			console.log('Random Pokemon selected.\n');
			Pokemon(val);
			break;
			
			case 7:
			if (Math.round(myConsts.getSeed(false)) == 1) {
				console.log('Chuck Norris won the coin toss in option 7, because he\'s Chuck Norris!!!\n');
				ChuckNorris();
			}
			else {
				console.log('A random cat won the coin toss in option 7, because cat!\n');
				CatAsService(val);
			}
			break;
			
			case 8:
			console.log('This Or That selected.\n');
			ThisOrThat();
			break;
			
			case 9:
			console.log('Affirmations selected.\n');
			Affirm();
			break;
			
			case 10:
			console.log('Unsplash selected. (10)\n');
			Unsplash(val);
			break;
			
			case 11:
			console.log('InspiroBot selected.\n');
			InspiroBot(val);
			break;
			
			case 12:
			console.log('Random color selected.\n');
			RandomColor(val, formDataTarget);
			break;
			
			case 13:
			getArtWork();
			console.log('ARTIC selected.');
			break;
			
			case 14:
			console.log('Random Dog selected.\n');
			DogAsService(val);
			break;
			
			case 15:
			console.log('Random Dog Fact selected.\n');
			DogFact();
			break;
			
			case 16:
			console.log('Random Cat selected.\n');
			CatAsService(val);
			break;
			
			case 17:
			console.log('Random Cat Fact selected.\n');
			CatFact();
			break;
			
			case 18:
			console.log('ImgFlip selected.\n');
			CallImgFlip(val);
			break;
			
			case 19:
			console.log('This person does not exist!');
			Face(val, formDataTarget);
			//CatAsService(val);
			break;
			
			default:
			if (Math.round(myConsts.getSeed(false)) == 1) {
				console.log('NatalieDee selected.\n');
				NatalieDee(selectDate(val, "nat"));
			}
			else {
				console.log('Random cat beat NatalieDee in a coin toss, because cat!\n');
				CatAsService(val);
			}
			break;
		}
	},
	function(anError) {
		console.log(anError);
	});
