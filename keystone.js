'use strict';
const mariadb = require('mariadb');
const myConsts = require('./myConstants.js');
const pool = mariadb.createPool({
     host: myConsts.conn.host, 
     user: myConsts.conn.user, 
     password: myConsts.conn.password,
	 port: myConsts.conn.port,
	 database: myConsts.conn.database,
     connectionLimit: myConsts.conn.connectionLimit
});

const http = require('http');
const https = require('https');
const fs = require('fs');
const MersenneTwister = require('mersennetwister');

async function getKeyResponse() {
	 let conn;
	 let promptOut;
	 try
	 {
		 conn = await pool.getConnection();
		 const row = await conn.query('SELECT * from prompts where kind = ? order by rand() limit 1', ['key']);
		 promptOut = row[0].prompt;
	 }
	 catch (err)
	{
		 myConsts.logger(err);
	}
	
	finally { conn.end(); } //NodeJS connector requires that both the connections and the pool be explicitly ended.
	
	var keyStone = new Object();
	keyStone.content = myConsts.GREG + ' ' + promptOut;
	var postString = JSON.stringify(keyStone);
	try {
		  const discordOptions = {
			hostname: 'discord.com',
			path: `/api/webhooks/${myConsts.PL_botspam}`,
			method: 'POST',
			headers: {
			  'Content-Type': 'application/json',
			  'Content-Length': Buffer.byteLength(postString)
			}
		  };

		  const discordReq = https.request(discordOptions, (res) => {
			console.log(`STATUS: ${res.statusCode}`);
			//console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
			res.setEncoding('utf8');

			res.on('data', (chunk) => {
			  //console.log(`BODY: ${chunk}`);
			});
			res.on('end', () => {
			  console.log('No more data in response.');
			});
		  });

		  discordReq.on('error', (e) => {
			console.error(`problem with request: ${e.message}`);
		  });

		  // Write data to request body
		  discordReq.write(postString);
		  //Since the request method is being used here for the post, we're calling end() manually on both request objects.
		  discordReq.end();
		  console.log(postString);
		}
		catch (e) {
		  console.error(e.message);
		}
		//NodeJS connector requires that both the connections and the pool be explicitly ended.
		pool.end();
}

function NatalieDee(comicDate) {
	var myRoot = new Object();
	myRoot.content = `${myConsts.GREG}\r\nhttp://nataliedee.com/${comicDate}`;
	var postString = JSON.stringify(myRoot);
	console.log(postString);
	const discordOptions = {
		hostname: 'discord.com',
		path: `/api/webhooks/${myConsts.PL_botspam}`,
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Content-Length': Buffer.byteLength(postString)
		}
	}
	const discordReq = https.request(discordOptions);
	discordReq.write(postString);
	discordReq.end();
}

function RandomColor(num) {
	var colorInt = Math.floor(num % 16777215);
	var hexColor = colorInt.toString(16);
	
	//Credit to Andreas Zettl (https://azettl.net/) for the hex to RGB conversion.
	var aRgbHex = hexColor.match(/.{1,2}/g);
	var aRgb = [
    parseInt(aRgbHex[0], 16),
    parseInt(aRgbHex[1], 16),
    parseInt(aRgbHex[2], 16)
	];
	
	var rgbStr = " 0d(" + aRgb[0] + "," + aRgb[1] + "," + aRgb[2] + ")";
	
	//Credit to Russell Heimlich (http://www.russellheimlich.com/blog) for the image generator.
	const getOptions = {
			hostname: 'localhost',
			path: "/dummyimage/code.php?x=640x480/" + hexColor + "/FFF/&text=0x" + hexColor + encodeURIComponent(rgbStr),
			method: 'GET',
			headers: {
			  'User-Agent': myConsts.UA
			}
		  };
		  console.log("URI: " + getOptions.hostname + getOptions.path);

	//Perform GET request with specified options.
	var formData = new FormData();
	http.request(getOptions, (addr_res) => {
		var imgOut = fs.createWriteStream("/var/services/web/webhooks/color.png");
		addr_res.pipe(imgOut);
		imgOut.on('finish', () => {
				formData.append('content', `${myConsts.GREG} Random Color!`);
				formData.append('file', fs.createReadStream("/var/services/web/webhooks/color.png"), {filename: 'color.png'});
				formData.submit(`https://discord.com/api/webhooks/${myConsts.PL_botspam}`);
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
			var embedString = JSON.stringify(myRoot);
			console.log(embedString);
			const discordOptions = {
				hostname: 'discord.com',
				path: `/api/webhooks/${myConsts.PL_botspam}`,
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
			var embedString = JSON.stringify(myRoot);
			console.log(embedString);
			const discordOptions = {
				hostname: 'discord.com',
				path: `/api/webhooks/${myConsts.PL_botspam}`,
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
				var embedString = JSON.stringify(myRoot);
				console.log(embedString);
				const discordOptions = {
					hostname: 'discord.com',
					path: `/api/webhooks/${myConsts.PL_botspam}`,
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
			var postString = JSON.stringify(postData);
		  const discordOptions = {
			hostname: 'discord.com',
			path: `/api/webhooks/${myConsts.PL_botspam}`,
			method: 'POST',
			headers: {
			  'Content-Type': 'application/json',
			  'Content-Length': Buffer.byteLength(postString)
			}
		  };

		  const discordReq = https.request(discordOptions, (res) => {
			console.log(`STATUS: ${res.statusCode}`);
			//console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
			res.setEncoding('utf8');

			res.on('data', (chunk) => {
			  //console.log(`BODY: ${chunk}`);
			});
			res.on('end', () => {
			  console.log('No more data in response.' + "\r\nThis is for " + target);
			});
		  });

		  discordReq.on('error', (e) => {
			console.error(`problem with request: ${e.message}`);
		  });

		  // Write data to request body
		  discordReq.write(postString);
		  //Since the request method is being used here for the post, we're calling end() manually on both request objects.
		  discordReq.end();
		  console.log(postString);
		} catch (e) {
		  console.error(e.message);
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
		startDate = new Date(2004,0,4); //per NASA spec, must be after 1995-06-16, the first day APOD was posted
		endDate = new Date(2011,4,25);
		base_msec = startDate.getTime();
		modifier = endDate - startDate;
		random_msec = base_msec + (num % modifier);
		finalDate =  new Date(random_msec).toISOString().slice(0,10);
		break;
		
		case 'opportunity':
		startDate = new Date(2004,0,25); //per NASA spec, must be after 1995-06-16, the first day APOD was posted
		endDate = new Date(2019,1,13);
		base_msec = startDate.getTime();
		modifier = endDate - startDate;
		random_msec = base_msec + (num % modifier);
		finalDate =  new Date(random_msec).toISOString().slice(0,10);
		break;
		
		case 'curiosity':
		startDate = new Date(2012,7,6); //per NASA spec, must be after 1995-06-16, the first day APOD was posted
		endDate = new Date();
		base_msec = startDate.getTime();
		modifier = endDate - startDate;
		random_msec = base_msec + (num % modifier);
		finalDate =  new Date(random_msec).toISOString().slice(0,10);
		break;
	}
	return finalDate;
}

function srand() {
	const seedOptions = {
			hostname: 'api.random.org',
			path: '/json-rpc/4/invoke',
			method: 'POST',
			headers: {
			  'Content-Type': 'application/json',
			  'User-Agent': myConsts.UA
			}
		  };
		  
	  var seedIn = {
		  "jsonrpc": "2.0",
		  "method": "generateIntegers",
		  "params": {
			  "apiKey": myConsts.RAND_ORG,
			  "n": 3,
			  "min": 0,
			  "max": 2000000
			  },
			  "id": 1284
		};
		
		try {
			const seedReq = https.request(seedOptions, (res) => {
			console.log(`STATUS: ${res.statusCode}`);
			//console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
			res.setEncoding('utf8');

			res.on('data', (chunk) => {
				var mySeed = 0;
				console.log("Random.org response: " + chunk);
				let parsedSeed = JSON.parse(chunk);
				if (!(typeof parsedSeed.result === "undefined")) {
					mySeed = Math.round(Math.cbrt(parsedSeed.result.random.data[0] * parsedSeed.result.random.data[1] * parsedSeed.result.random.data[2]));
					console.log("Seed per Random.org (Geometric Mean of 3 elements): " + mySeed);
				}
				else {
					mySeed = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
					console.log("Seed per Math.random(): " + mySeed);
				}
				return mySeed;
			});
			res.on('end', () => {
			  console.log('No more data in response.' + "\r\nThis is for seeding the Mersenne Twister.");
			});
			});

		  seedReq.on('error', (e) => {
			console.error(`problem with request: ${e.message}`);
		  });
		  
		  var postString = JSON.stringify(seedIn);
		  // Write data to request body
		  seedReq.write(postString);
		  //Since the request method is being used here for the post, we're calling end() manually on both request objects.
		  seedReq.end();
		  
		} catch (e) {
		  console.error(e.message);
		}
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
			var postString = JSON.stringify(postData);
		  const discordOptions = {
			hostname: 'discord.com',
			path: `/api/webhooks/${myConsts.PL_botspam}`,
			method: 'POST',
			headers: {
			  'Content-Type': 'application/json',
			  'Content-Length': Buffer.byteLength(postString)
			}
		  };

		  const discordReq = https.request(discordOptions, (res) => {
			console.log(`STATUS: ${res.statusCode}`);
			//console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
			res.setEncoding('utf8');

			res.on('data', (chunk) => {
			  //console.log(`BODY: ${chunk}`);
			});
			res.on('end', () => {
			  console.log('No more data in response.' + "\r\nThis is for Chuck Norris.");
			});
		  });

		  discordReq.on('error', (e) => {
			console.error(`problem with request: ${e.message}`);
		  });

		  // Write data to request body
		  discordReq.write(postString);
		  //Since the request method is being used here for the post, we're calling end() manually on both request objects.
		  discordReq.end();
		  console.log(postString);
		} catch (e) {
		  console.error(e.message);
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
			hostname: 'dog-api.kinduff.com',
			path: '/api/facts',
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
			postData.content = myConsts.GREG + ' ' + parsedData.facts[0];
			var postString = JSON.stringify(postData);
		  const discordOptions = {
			hostname: 'discord.com',
			path: `/api/webhooks/${myConsts.PL_botspam}`,
			method: 'POST',
			headers: {
			  'Content-Type': 'application/json',
			  'Content-Length': Buffer.byteLength(postString)
			}
		  };

		  const discordReq = https.request(discordOptions, (res) => {
			console.log(`STATUS: ${res.statusCode}`);
			//console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
			res.setEncoding('utf8');

			res.on('data', (chunk) => {
			  //console.log(`BODY: ${chunk}`);
			});
			res.on('end', () => {
			  console.log('No more data in response.' + "\r\nThis is for Dog Facts.");
			});
		  });

		  discordReq.on('error', (e) => {
			console.error(`problem with request: ${e.message}`);
		  });

		  // Write data to request body
		  discordReq.write(postString);
		  //Since the request method is being used here for the post, we're calling end() manually on both request objects.
		  discordReq.end();
		  console.log(postString);
		} catch (e) {
		  console.error(e.message);
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
			var postString = JSON.stringify(postData);
		  const discordOptions = {
			hostname: 'discord.com',
			path: `/api/webhooks/${myConsts.PL_botspam}`,
			method: 'POST',
			headers: {
			  'Content-Type': 'application/json',
			  'Content-Length': Buffer.byteLength(postString)
			}
		  };

		  const discordReq = https.request(discordOptions, (res) => {
			console.log(`STATUS: ${res.statusCode}`);
			//console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
			res.setEncoding('utf8');

			res.on('data', (chunk) => {
			  //console.log(`BODY: ${chunk}`);
			});
			res.on('end', () => {
			  console.log('No more data in response.' + "\r\nThis is for Cat Facts.");
			});
		  });

		  discordReq.on('error', (e) => {
			console.error(`problem with request: ${e.message}`);
		  });

		  // Write data to request body
		  discordReq.write(postString);
		  //Since the request method is being used here for the post, we're calling end() manually on both request objects.
		  discordReq.end();
		  console.log(postString);
		} catch (e) {
		  console.error(e.message);
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
			var postString = JSON.stringify(postData);
		  const discordOptions = {
			hostname: 'discord.com',
			path: `/api/webhooks/${myConsts.PL_botspam}`,
			method: 'POST',
			headers: {
			  'Content-Type': 'application/json',
			  'Content-Length': Buffer.byteLength(postString)
			}
		  };

		  const discordReq = https.request(discordOptions, (res) => {
			console.log(`STATUS: ${res.statusCode}`);
			//console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
			res.setEncoding('utf8');

			res.on('data', (chunk) => {
			  //console.log(`BODY: ${chunk}`);
			});
			res.on('end', () => {
			  console.log('No more data in response.' + "\r\nThis is for Jeopardy.");
			});
		  });

		  discordReq.on('error', (e) => {
			console.error(`problem with request: ${e.message}`);
		  });

		  // Write data to request body
		  discordReq.write(postString);
		  //Since the request method is being used here for the post, we're calling end() manually on both request objects.
		  discordReq.end();
		  console.log(postString);
		} catch (e) {
		  console.error(e.message);
		}
	});
	});
	//Using request method for the get too, so calling end() here too.
	contentReq.end();
	contentReq.on('error', (e) => {
	  console.error(`Got error: ${e.message}`);
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
			var postString = JSON.stringify(postData);
		  const discordOptions = {
			hostname: 'discord.com',
			path: `/api/webhooks/${myConsts.PL_botspam}`,
			method: 'POST',
			headers: {
			  'Content-Type': 'application/json',
			  'Content-Length': Buffer.byteLength(postString)
			}
		  };

		  const discordReq = https.request(discordOptions, (res) => {
			console.log(`STATUS: ${res.statusCode}`);
			//console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
			res.setEncoding('utf8');

			res.on('data', (chunk) => {
			  //console.log(`BODY: ${chunk}`);
			});
			res.on('end', () => {
			  console.log('No more data in response.' + "\r\nThis is for This Or That.");
			});
		  });

		  discordReq.on('error', (e) => {
			console.error(`problem with request: ${e.message}`);
		  });

		  // Write data to request body
		  discordReq.write(postString);
		  //Since the request method is being used here for the post, we're calling end() manually on both request objects.
		  discordReq.end();
		  console.log(postString);
		} catch (e) {
		  console.error(e.message);
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
			var postString = JSON.stringify(postData);
		  const discordOptions = {
			hostname: 'discord.com',
			path: `/api/webhooks/${myConsts.PL_botspam}`,
			method: 'POST',
			headers: {
			  'Content-Type': 'application/json',
			  'Content-Length': Buffer.byteLength(postString)
			}
		  };

		  const discordReq = https.request(discordOptions, (res) => {
			console.log(`STATUS: ${res.statusCode}`);
			//console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
			res.setEncoding('utf8');

			res.on('data', (chunk) => {
			  //console.log(`BODY: ${chunk}`);
			});
			res.on('end', () => {
			  console.log('No more data in response.' + "\r\nThis is for Affirmations.");
			});
		  });

		  discordReq.on('error', (e) => {
			console.error(`problem with request: ${e.message}`);
		  });

		  // Write data to request body
		  discordReq.write(postString);
		  //Since the request method is being used here for the post, we're calling end() manually on both request objects.
		  discordReq.end();
		  console.log(postString);
		} catch (e) {
		  console.error(e.message);
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
			var postString = JSON.stringify(postData);
		  const discordOptions = {
			hostname: 'discord.com',
			path: `/api/webhooks/${myConsts.PL_botspam}`,
			method: 'POST',
			headers: {
			  'Content-Type': 'application/json',
			  'Content-Length': Buffer.byteLength(postString)
			}
		  };

		  const discordReq = https.request(discordOptions, (res) => {
			console.log(`STATUS: ${res.statusCode}`);
			//console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
			res.setEncoding('utf8');

			res.on('data', (chunk) => {
			  //console.log(`BODY: ${chunk}`);
			});
			res.on('end', () => {
			  console.log('No more data in response.' + "\r\nThis is for Advice Slip.");
			});
		  });

		  discordReq.on('error', (e) => {
			console.error(`problem with request: ${e.message}`);
		  });

		  // Write data to request body
		  discordReq.write(postString);
		  //Since the request method is being used here for the post, we're calling end() manually on both request objects.
		  discordReq.end();
		  console.log(postString);
		} catch (e) {
		  console.error(e.message);
		}
	});
	});
	//Using request method for the get too, so calling end() here too.
	contentReq.end();
	contentReq.on('error', (e) => {
	  console.error(`Got error: ${e.message}`);
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
			var embedString = JSON.stringify(myRoot);
		  const discordOptions = {
			hostname: 'discord.com',
			path: `/api/webhooks/${myConsts.PL_botspam}`,
			method: 'POST',
			headers: {
			  'Content-Type': 'application/json',
			  'Content-Length': Buffer.byteLength(embedString)
			}
		  };

		  const discordReq = https.request(discordOptions, (res) => {
			console.log(`STATUS: ${res.statusCode}`);
			//console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
			res.setEncoding('utf8');

			res.on('data', (chunk) => {
			  //console.log(`BODY: ${chunk}`);
			});
			res.on('end', () => {
			  console.log('No more data in response.' + "\r\nThis is for the NASA APOD");
			});
		  });

		  discordReq.on('error', (e) => {
			console.error(`problem with request: ${e.message}`);
		  });

		  // Write data to request body
		  discordReq.write(embedString);
		  //Since the request method is being used here for the post, we're calling end() manually on both request objects.
		  discordReq.end();
		  console.log(embedString);
		  console.log("Using date: " + apodDate.toString());
		} catch (e) {
		  console.error(e.message);
		}
	});
	});
	//Using request method for the get too, so calling end() here too.
	contentReq.end();
	contentReq.on('error', (e) => {
	  console.error(`Got error: ${e.message}`);
	});
}

function NasaMRover(num) {
	const rovers = ['curiosity','opportunity','spirit'];
	
	var selectRover = rovers[num % rovers.length];
	const contentOptions = {
			hostname: 'api.nasa.gov',
			path: `/mars-photos/api/v1/rovers/${selectRover}/photos/?earth_date=${selectDate(num, selectRover)}&api_key=${myConsts.NASA}`,
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
				var embedString = JSON.stringify(myRoot);
			  const discordOptions = {
				hostname: 'discord.com',
				path: `/api/webhooks/${myConsts.PL_botspam}`,
				method: 'POST',
				headers: {
				  'Content-Type': 'application/json',
				  'Content-Length': Buffer.byteLength(embedString)
				}
			  };

			  const discordReq = https.request(discordOptions, (res) => {
				console.log(`STATUS: ${res.statusCode}`);
				//console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
				res.setEncoding('utf8');

				res.on('data', (chunk) => {
				  //console.log(`BODY: ${chunk}`);
				});
				res.on('end', () => {
				  console.log('No more data in response.' + "\r\nThis is for the NASA Mars Rovers");
				});
			  });

			  discordReq.on('error', (e) => {
				console.error(`problem with request: ${e.message}`);
			  });

			  // Write data to request body
			  discordReq.write(embedString);
			  //Since the request method is being used here for the post, we're calling end() manually on both request objects.
			  discordReq.end();
			  console.log(embedString);
			}
			else
			{
				console.log("\r\nEmpty response from Mars Rover, serving cats instead!\r\n");
				CatAsService(num);
			}
		}
		catch (e) {
			console.error(e.message);
		}
	});
	});
	//Using request method for the get too, so calling end() here too.
	contentReq.end();
	contentReq.on('error', (e) => {
	  console.error(`Got error: ${e.message}`);
	});
}

function Pokemon(num) {
	const contentOptions = {
			hostname: 'pokeapi.co',
			path: `/api/v2/pokemon/${num % 898}`,
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
			var embedString = JSON.stringify(myRoot);
		  const discordOptions = {
			hostname: 'discord.com',
			path: `/api/webhooks/${myConsts.PL_botspam}`,
			method: 'POST',
			headers: {
			  'Content-Type': 'application/json',
			  'Content-Length': Buffer.byteLength(embedString)
			}
		  };

		  const discordReq = https.request(discordOptions, (res) => {
			console.log(`STATUS: ${res.statusCode}`);
			//console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
			res.setEncoding('utf8');

			res.on('data', (chunk) => {
			  //console.log(`BODY: ${chunk}`);
			});
			res.on('end', () => {
			  console.log('No more data in response.' + "\r\nThis is Pokemon");
			});
		  });

		  discordReq.on('error', (e) => {
			console.error(`problem with request: ${e.message}`);
		  });

		  // Write data to request body
		  discordReq.write(embedString);
		  //Since the request method is being used here for the post, we're calling end() manually on both request objects.
		  discordReq.end();
		  console.log(embedString);
		} catch (e) {
		  console.error(e.message);
		}
	});
	});
	//Using request method for the get too, so calling end() here too.
	contentReq.end();
	contentReq.on('error', (e) => {
	  console.error(`Got error: ${e.message}`);
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
			var embedString = JSON.stringify(myRoot);
		  const discordOptions = {
			hostname: 'discord.com',
			path: `/api/webhooks/${myConsts.PL_botspam}`,
			method: 'POST',
			headers: {
			  'Content-Type': 'application/json',
			  'Content-Length': Buffer.byteLength(embedString)
			}
		  };

		  const discordReq = https.request(discordOptions, (res) => {
			console.log(`STATUS: ${res.statusCode}`);
			//console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
			res.setEncoding('utf8');

			res.on('data', (chunk) => {
			  //console.log(`BODY: ${chunk}`);
			});
			res.on('end', () => {
			  console.log('No more data in response.' + "\r\nThis is Unsplash");
			});
		  });

		  discordReq.on('error', (e) => {
			console.error(`problem with request: ${e.message}`);
		  });

		  // Write data to request body
		  discordReq.write(embedString);
		  //Since the request method is being used here for the post, we're calling end() manually on both request objects.
		  discordReq.end();
		  console.log(embedString);
		} catch (e) {
		  console.error(e.message);
		}
	});
	});
	//Using request method for the get too, so calling end() here too.
	contentReq.end();
	contentReq.on('error', (e) => {
	  console.error(`Got error: ${e.message}`);
	});
}
//var mt = new MersenneTwister(srand());
var val = Math.round(MersenneTwister.random() * Number.MAX_SAFE_INTEGER);
var task = -1;
if (process.argv.length == 3)
	task = process.argv[2];
else
	task = val;
console.log(`Main value: ${val}\r\nTask value: ${task}`);
switch (task % 19) {
//switch (debugVal) {
	case 0:
	//console.log('JOKE!!!');
	pullStuff(false, 'icanhazdadjoke.com', '');
	break;
	
	case 1:
	//console.log('ROCK FACT!!!');
	pullStuff(true, 'uselessfacts.jsph.pl', '/random.txt?language=en');
	break;
	
	case 2:
	//console.log('FORM RESPONSE!!!');
	getKeyResponse(val);
	break;
	
	case 3:
	NasaAPOD(selectDate(val, "apod"), val);
	break;
	
	case 4:
	JeopardyQ();
	break;
	
	case 5:
	AdviceSlip();
	break;
	
	case 6:
	Pokemon(val);
	break;
	
	case 7:
	if (Math.round(MersenneTwister.random()) == 1)
		ChuckNorris();
	else
		CatAsService();
	break;
	
	case 8:
	ThisOrThat();
	break;
	
	case 9:
	Affirm();
	break;
	
	case 10:
	Unsplash(val);
	break;
	
	case 11:
	InspiroBot(val);
	break;
	
	case 12:
	RandomColor(val);
	break;
	
	case 13:
	NasaMRover(val);
	break;
	
	case 14:
	DogAsService(val);
	break;
	
	case 15:
	DogFact();
	break;
	
	case 16:
	CatAsService(val);
	break;
	
	case 17:
	CatFact();
	break;
	
	default:
	if (Math.round(MersenneTwister.random()) == 1)
		NatalieDee(selectDate(val, "nat"));
	else
		CatAsService();
	break;
}