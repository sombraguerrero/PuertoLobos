const {Client, Intents, MessageEmbed, MessageAttachment} = require("discord.js");
const client = new Client({ intents: ["GUILDS", "GUILD_MESSAGES", "DIRECT_MESSAGES"] });
const mariadb = require('mariadb');
const myConsts = require('./myConstants.js');
const https = require('https');
const http = require('http');
const fs = require('fs');
//const qs = require('querystring');
const pool = mariadb.createPool({
     host: myConsts.conn.host, 
     user: myConsts.conn.user, 
     password: myConsts.conn.password,
	 port: myConsts.conn.port,
	 database: myConsts.conn.database,
     connectionLimit: myConsts.conn.connectionLimit
});
const { randomUUID: uuidv4 } = require('crypto');
const { evaluate } = require('./math.js');

const helpEmbed = new MessageEmbed()
	.setColor('#0099ff')
	.setTitle('Valid Commands')
	.addFields(
		{ name: 'marco', value: 'Responds, "POLO!!"', inline: true },
		{ name: 'inspiro, inspirobot', value: 'Pulls a random meme from InspiroBot!', inline: true },
		{ name: 'guess m=<maximum guess> <your guess>', value: `Guess a positive integer between 0 and m!`, inline: true },
		{ name: 'dadjokes n', value: 'Returns \'n\' dad jokes, 3 is default', inline: true },
		{ name: 'guid, uuid', value: 'DMs the sender a cryptographically secure type 4 UUID.', inline: true },
		{ name: 'time', value: 'Converts the current UTC time to local time in multiple time zones.', inline: true },
		{ name: 'imgflip', value: 'Generates a single-image meme via ImgFlip using completely random text.', inline: true },
		{ name: 'meme', value: 'Generates a single-image meme via ImgFlip.\r\nArguments: p-t: p = panels; t = textboxes.\r\nUse the | character to separate text (max 5 boxes).', inline: true },
		{ name: 'face', value: 'Pulls a random face from \"This person does not exist\".', inline: true },
		{ name: 'calc', value: 'Calculates any arithmetic expression (JavaScript-like functions available to get fancy!)', inline: true },
		{ name: 'chuck, norris', value: 'CHUCK NORRRIIIIIIIIIIIIIIIIISSSS!!!', inline: true },
		{ name: 'unsplash', value: 'Community-provided high-res images.', inline: true },
		{ name: 'apod', value: 'NASA\'s Astronomy Picture of the Day', inline: true },
		{ name: 'bird, birds, birb, birbs, borb, borbs', value: 'Image of random bird', inline: true },
		{ name: 'cat, cats', value: 'Another random cat command', inline: true },
		{ name: 'shibe, shibes', value: 'Random shibe doge', inline: true }
	);
	
const debugImg = new MessageEmbed()
.setColor('#0099ff')
	.setTitle('Image URL Test')
	.setDescription('Test Embed')
	.setImage(new Object().url = 'https://pbs.twimg.com/media/E803PfgXsAMxnni.jpg');
	
var timeRequestOptions = {
	hostname: 'dev.virtualearth.net',
	path: '',
	method: 'GET',
	headers: {
		'User-Agent': myConsts.UA
	}
}

async function getImg(panels, boxes) {
  let conn;
  let promptOut;
  try {
	conn = await pool.getConnection();
	const row = await conn.query('SELECT * from imgflip where panel_count = ? and box_count = ? order by rand() limit 1', [panels, boxes]);
	promptOut = row[0] != null || row.length == 1 ? row[0] : -1284;

  } catch (err) {
	myConsts.logger(err);
  } finally {
	if (conn)
		conn.end();
	return promptOut;	
  }
}

function ChuckNorris() {
	return new Promise(function(myResolve, myReject) {
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
		  
			  try
			  {
				  var parsedData = JSON.parse(rawData);
				  myResolve(parsedData.value);
			  }
			  catch (e) 
			  {
				  myReject(`${res.statusCode}: ${res.statusMessage}`);
			  }
	  });
	 });
	//Using request method for the get too, so calling end() here too.
	contentReq.end();
	contentReq.on('error', (e) => {
	  myReject(`Got error: ${e.message}`);
	});
	});
}

function NasaAPOD(num) {
	return new Promise(function(myResolve, myReject) {
		var startDate = new Date(1995,5,17); //per NASA spec, must be after 1995-06-16, the first day APOD was posted
		var endDate = new Date();
		var base_msec = startDate.getTime();
		var modifier = endDate - startDate;
		var random_msec = base_msec + (num % modifier);
		var apodDate =  new Date(random_msec).toISOString().slice(0,10);
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
			myEmbed.color =  num % 16777215// Discord spec requires hexadecimal codes converted to a literal decimal value (anything random between black and white)
			myResolve(myEmbed);
		} catch (e) {
			myReject(`${res.statusCode}: ${res.statusMessage}`);
		}
	});
	});
	//Using request method for the get too, so calling end() here too.
	contentReq.end();
	contentReq.on('error', (e) => {
	  myReject(`Got error: ${e.message}`);
	});
	});
}

function Unsplash(num) {
	return new Promise(function(myResolve, myReject) {
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
			myResolve(myEmbed);
		} catch (e) {
		  myReject(`${res.statusCode}: ${res.statusMessage}`);
		}
	});
	});
	//Using request method for the get too, so calling end() here too.
	contentReq.end();
	contentReq.on('error', (e) => {
	  myReject(`Got error: ${e.message}`);
	});
	});
}

function NumberGamePromise(m, g) {		
		return new Promise(function(myResolve, myReject) {
			try {
				myConsts.getSeed(true, 1)
				.then(
					function(seed)
					{
						var mySeed = Math.floor(seed[0] * m);
						//myConsts.logger("Random.org response: " + chunk);
						var lowerBound = mySeed - Math.ceil(mySeed * .15);
						console.log("LB: " + lowerBound);
						var upperBound = Math.ceil(mySeed * 1.15);
						console.log("UB: " + upperBound);
						console.log("User Guess: " + g);
						if (g == mySeed)
							myResolve(`It *was* ${mySeed}! Lucky!`);
						else if (g >= lowerBound && g <= upperBound)
							myResolve(`You were close! It was ${mySeed}!`);
						else if (g < lowerBound || g > upperBound)
							myResolve(`Better luck next time! It was ${mySeed}!`);
					},
					function(anError) { console.log(anError); });
				}
				catch (e)
				{
					myConsts.logger(e.message);
					myReject(e.message);
				}
		});
}

function inspiroPromise() {
	return new Promise(function(myResolve, myReject) {
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
		const inspiroReq = https.request(getOptions, (addr_res) => {
			addr_res.on('data', (imgAddr) => { imgData += imgAddr; });
				addr_res.on('end', () => {
				
				var myImage = new Object();
				myImage.url = imgData;
				var myEmbed = new Object();
				myEmbed.image = myImage;
				myEmbed.title = "InspiroBot says...";
				myEmbed.color = Math.floor(myConsts.getSeed(false,1)[0] * 16777215); // Discord spec requires hexadecimal codes converted to a literal decimal value (anything random between black and white) 
				myResolve(myEmbed);
			});
			addr_res.on('error', (err) => {
				myConsts.logger(err);
				myReject('It seems InspiroBot doesn\'t want to talk right now...');
			});
		}).end();
		
		inspiroReq.on('error', (err) => {
			myConsts.logger(err);
			myReject('InspiroBot doesn\'t seem to be in a sharing mood...');
		});
	});
}

function shibesPromise(animal) {
	return new Promise(function(myResolve, myReject) {
		const getOptions = {
				hostname: 'shibe.online',
				path: `/api/${animal}`,
				method: 'GET',
				headers: {
				  'User-Agent': myConsts.UA
				}
			  };

		//Perform GET request with specified options.
		let imgData = '';
		const shibesReq = https.request(getOptions, (addr_res) => {
			addr_res.on('data', (imgAddr) => { imgData += imgAddr; });
				addr_res.on('end', () => {
				var imgOut = JSON.parse(imgData);
				var myImage = new Object();
				myImage.url = imgOut[0];
				var myEmbed = new Object();
				myEmbed.image = myImage;
				myEmbed.title = `Random ${animal.slice(0, -1)}`;
				myEmbed.color = Math.floor(myConsts.getSeed(false,1)[0] * 16777215); // Discord spec requires hexadecimal codes converted to a literal decimal value (anything random between black and white) 
				myResolve(myEmbed);
			});
			addr_res.on('error', (err) => {
				myConsts.logger(err);
				myReject('It seems Shibes doesn\'t want to talk right now...');
			});
		}).end();
		
		shibesReq.on('error', (err) => {
			myConsts.logger(err);
			myReject('Shibes doesn\'t seem to be in a sharing mood...');
		});
	});
}

function facePromise() {
	return new Promise(function(myResolve, myReject) {
		let now = Math.floor(new Date().getTime() / 1000.0);
		let epoch = `${now}.jpg`;
		
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
			
			const faceReq = https.request(getOptions, (res) => {
			const filePath = fs.createWriteStream(`/volume1/homes/bobertdos/webhooks/prompt-bot/faces/${epoch}`);
			res.pipe(filePath);
			filePath.on('finish',() => {
				filePath.close();
				myResolve(`/volume1/homes/bobertdos/webhooks/prompt-bot/faces/${epoch}`);
			});
		}).end();
		
		faceReq.on('error', (err) => {
			myConsts.logger(err);
			myReject('It seems I have no countenance available to bless you!');
		});
		}
		else
		{
			const getOptions = {
					hostname: 'this-person-does-not-exist.com',
					path: `/new?time=${now}&gender=all&age=all&etnic=all`,
					method: 'GET',
					headers: {
					  'User-Agent': myConsts.UA
					}
				  };

			//Perform GET request with specified options.
			let imgData = '';
			const faceReq = https.request(getOptions, (addr_res) => {
				addr_res.on('data', (imgAddr) => { imgData += imgAddr; });
					addr_res.on('end', () => {
					let faceData = JSON.parse(imgData);
					if (faceData.generated) {
						console.log("It has been generated!\r\n");
						const filePath = fs.createWriteStream(`/volume1/homes/bobertdos/webhooks/prompt-bot/faces/${epoch}`);
						const getFace = https.get(`https://this-person-does-not-exist.com/img/${faceData.name}`, function(response) {
							response.pipe(filePath);
						});
						filePath.on('finish',() => {
							filePath.close();
							myResolve(`/volume1/homes/bobertdos/webhooks/prompt-bot/faces/${epoch}`);
						});
					}
					else
					{
						myReject('It seems I have no countenance available to bless you!');
					}
				});
				addr_res.on('error', (err) => {
					myConsts.logger(err);
					myReject('It seems I have no countenance available to bless you!');
				});
			}).end();
		}
	});
}

function dadJokesPromise() {
	return new Promise(function(myResolve, myReject) {
		myConsts.getSeed(true, 4)
		.then(
			function(seed)
			{
				const getOptions = {
				hostname: 'icanhazdadjoke.com',
				path: `/search?limit=30&page=${Math.floor(seed[0] * myConsts.PAGES)}`,
				method: 'GET',
				headers: {
				  'User-Agent': myConsts.UA,
				  'Accept': 'application/json'
				}
			  };

				//Perform GET request with specified options.
				let jokesData = '';
				const jokesReq = https.request(getOptions, (jokeRes) => {
					jokeRes.on('data', (jokes) => { jokesData += jokes; });
						jokeRes.on('end', () => {
						
						var jokesParsed = JSON.parse(jokesData);
						var jokesCollection = jokesParsed.results;
						var jokesStr = '';
						for (i = 1; i <= 3; i++)
						{
							jokesStr += i + '.\t' + jokesCollection[Math.floor(seed[i] * jokesCollection.length)].joke + '\r\n';
						}
						//console.log("String content: " + jokesStr);
						myResolve(jokesStr);
					});
					jokeRes.on('error', (err) => {
						myConsts.logger(err);
						myReject('Apparently, we *cannot* haz dadjokes right now!');
					});
				}).end();
				
				jokesReq.on('error', (err) => {
					myConsts.logger(err);
					myReject('Apparently, we *cannot* haz dadjokes right now!');
				});
			},
			function(anError) { console.log(anError); }
			);
	});
}

async function dadJokeDB(n)
{
	let conn;
	let promptOut;
	try
	{
		conn = await pool.getConnection();
		const rows = await conn.query('SELECT joke FROM dadjokes ORDER BY RAND() LIMIT ?',[n]);
		var jokesStr = '';
		for (i = 0; i < n; i++)
		{
			jokesStr += i+1 + ')\t' + rows[i].joke + '\r\n';
		}
	}
	catch (err)
	{
		myConsts.logger(err);
	}
	finally
	{
		if (conn)
			conn.end();
		return jokesStr;
	}
}

async function getTimePromise() {
	let conn;
	let promptOut;
	try {
		conn = await pool.getConnection();
		let timePromise = new Promise(async function(myResolve) {
				var allTimes = new MessageEmbed()
				.setTitle('Current Time is...')
				.setColor('#0099ff');
				var rows = await conn.query("SELECT CONVERT_TZ(NOW(), @@SESSION.time_zone, 'UTC') AS timeConverted, 'UTC' AS zone UNION SELECT CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/Los_Angeles'), 'Pacific' UNION SELECT CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/Denver'), 'Mountain' UNION SELECT CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/Chicago'), 'Central' UNION SELECT CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York'), 'Eastern' UNION SELECT CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/Sao_Paulo'), 'Brazil' UNION SELECT CONVERT_TZ(NOW(), @@SESSION.time_zone, 'Europe/Dublin'), 'UK' UNION SELECT CONVERT_TZ(NOW(), @@SESSION.time_zone, 'CET'), 'Italy/Slovenia/Switzerland' UNION SELECT CONVERT_TZ(NOW(), @@SESSION.time_zone, 'Europe/Bucharest'), 'Romania' UNION SELECT CONVERT_TZ(NOW(), @@SESSION.time_zone, 'Asia/Manila'), 'Philippines' UNION SELECT CONVERT_TZ(NOW(), @@SESSION.time_zone, 'Australia/Melbourne'), 'Australia'");
				
			rows.forEach(async function(myTime) {
				//allTimes.addField(myTime.zone, myTime.timeConverted.toString(), true);
				allTimes.addFields({ name: myTime.zone, value: myTime.timeConverted.toString(), inline: true });
				//console.log('Entropy!!\r\n');
				//console.log(myTime.zone + '- ' + myTime.timeConverted + '\r\n');
			});
			
				myResolve(allTimes);
		});
		promptOut = timePromise;
	}
	catch (err)
	{
		myConsts.logger(err);
		myReject(err);
	}
	finally
	{
		if (conn)
			conn.end();
		return promptOut;
	}	
}

//This function will return a single promise.
//An array will be built via a loop to then pass to Promise.all
//The resolution of Promise.all will build the embed
function getTimePromise2(timeZone) {
	var now = new Date().toISOString().split('.')[0]+'Z';
	//console.log(now);
	return new Promise(function(myResolve, myReject) {
		timeRequestOptions.path = `/REST/v1/timezone/convert/?desttz=${timeZone}&includeDstRules=true&datetime=${now}&o=json&key=${myConsts.BING}`;
		var timeReq = https.request(timeRequestOptions, (res) => {
		var someData = '';
		try
		{
			res.on('data', (chunk) => { someData += chunk; });
			res.on('end', () => {
				//console.log("LOOK HERE FOR DATA: " + someData);
				var myTime = JSON.parse(someData);
				var timeConverted = myTime.resourceSets[0].resources[0].timeZone.convertedTime.localTime;
				var zoneName = myTime.resourceSets[0].resources[0].timeZone.ianaTimeZoneId;
				//myResolve({"dispName":timeInfo.timeZoneDisplayName, "ctime":timeInfo.localTime});
				myResolve({"dispName":zoneName, "ctime":timeConverted});
				});
		}
		catch(e)
		{
			myReject(`data: ${someData}\r\n${e}`);
		}
		res.on('error', (err) => {
			myReject(err);
		});
		}).end();
	});
}

function BuildTimePromises() {
	var myPromises = new Array();
	return new Promise(function(passingTime, myReject) {
		try
		{
			myConsts.myTZ.forEach(function(time) {
				myPromises.push(getTimePromise2(time));
			});
			passingTime(myPromises);
		}
		catch (e)
		{
			myReject(e);
		}
	});
}

async function genImgFlipDB(memeText, p, t)
{
	var num = myConsts.getSeed(false,1)[0];
	var myEmbed = new Object();
	var myImage = new Object();
	var selectedMeme  = '';
	var myText = memeText.split("|");
	var targetLength = parseInt(t);
	var panels = parseInt(p);
	
	const genOptions = {
		hostname: 'api.imgflip.com',
		path: '/caption_image',
		method: 'POST',
		headers:
		{
			'User-Agent': myConsts.UA,
			'Content-Type' : 'application/x-www-form-urlencoded'
		}};
		
		return new Promise(async function(myResolve, myReject)
		{
			try
			{
				//console.log(`memetext : ${memetext}\r\npanels: ${panels}\r\ntextboxes: ${targetLength}`);
				selectedMeme = await getImg(panels, targetLength);
				if (selectedMeme != -1284)
				{
					var kvCollection = [['template_id', selectedMeme.id],['username', myConsts.imgFlip_usr],['password', myConsts.imgFlip_pwd]];
					if (t <= 2)
					{
						kvCollection.push(['text0', myText[0]],['text1', myText[1]]);
					}
					else
					{
						for (var i = 0; i < targetLength; i++)
						{
							// The imgflip API doc is horribly non-descript about this. The example shows the "boxes" parameter as JSON
							// but since this request format is form-urlencoded, what it actually means is that it wants each boxes "element"
							//represented as an array entry with an associative key for each 'property' being used. Only using 'text' in my case.
							kvCollection.push([`boxes[${i}][text]`, myText[i]]);
						}
					}
					var imgFlipRequestStr = new URLSearchParams(kvCollection).toString();
					
					var someData = '';
					const genReq = https.request(genOptions, (res) => {
							res.on('data', (chunk) => { someData += chunk; });
							res.on('end', () => {
								//console.log("LOOK HERE FOR DATA: " + someData);
							var myMeme = JSON.parse(someData);
							myEmbed.title = selectedMeme.name;
							myEmbed.color = Math.floor(num * 16777215); // Discord spec requires hexadecimal codes converted to a literal decimal value (anything random between black and white)
							if (myMeme.success) {
								myEmbed.url = myMeme.data.page_url;
								myImage.url = myMeme.data.url;
							}
							myEmbed.image = myImage;
							myResolve(myEmbed);
						});
						res.on('error', (err) => {
							myConsts.logger(err);
							myReject(err);
						});
					});
					//console.log("This is what should be sent: " + imgFlipRequestStr);
					genReq.write(imgFlipRequestStr);
					genReq.end();
				}
				else
				{
					myReject("No match found!");
				}
			}
			catch (e)
			{
				myConsts.logger(e.message);
				myReject(e.message);
			}
		});
	}
	
	function CallImgFlip() {
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
									myResolve(boxText);
							});
						}).end();
				});
		});
	}
	function genImgFlip(memeText) {
	var num = myConsts.getSeed(false,1)[0];
	var myEmbed = new Object();
	var myImage = new Object();
	var selectedMeme  = '';
	var targetLength = 0;
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
				if (memeText.length <= 5)
				{
					const getMemeReq = https.request(getOptions, (addr_res) => {
						addr_res.on('data', (memeIn) => { allMemeData += memeIn; });
							addr_res.on('end', () => {
							var allMemeDataOut = JSON.parse(allMemeData);
							if (allMemeDataOut.success)
							{
								targetLength = memeText.length >= 3 ? memeText.length : 2;
								var filteredMemes = allMemeDataOut.data.memes.filter(m => m.box_count == targetLength);
								selectedMeme = filteredMemes[Math.round(filteredMemes.length * num)];
								//console.log("Selected: " + selectedMeme.id);
							}
							
							var kvCollection = [['template_id', selectedMeme.id],['username', myConsts.imgFlip_usr],['password', myConsts.imgFlip_pwd]];
							
							//Because Greg likes undefined things!
							if (targetLength <= 2)
							{
								kvCollection.push(['text0', memeText[0]],['text1', memeText[1]]);
							}
							else
							{
								for (var i = 0; i < targetLength; i++)
								{
									// The imgflip API doc is horribly non-descript about this. The example shows the "boxes" parameter as JSON
									// but since this request format is form-urlencoded, what it actually means is that it wants each boxes "element"
									//represented as an array entry with an associative key for each 'property' being used. Only using 'text' in my case.
									kvCollection.push([`boxes[${i}][text]`, memeText[i]]);
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
									myEmbed.color = Math.floor(num * 16777215); // Discord spec requires hexadecimal codes converted to a literal decimal value (anything random between black and white)
									if (myMeme.success) {
										myEmbed.url = myMeme.data.page_url;
										myImage.url = myMeme.data.url;
									}
									myEmbed.image = myImage;
									myResolve(myEmbed);
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
	
function getUsage()
{
	return new Promise(function(myResolve, myRejection) {
			const usageOptions = {
				hostname: 'api.random.org',
				path: '/json-rpc/4/invoke',
				method: 'POST',
				headers:
				{
					'Content-Type': 'application/json',
					'User-Agent': myConsts.UA
				}
			};
			var usageIn = {
				"jsonrpc": "2.0",
				"method": "getUsage",
				"params": {
					"apiKey": myConsts.RAND_ORG
				},
				"id": 1284
			};
			try {
					const usageReq = https.request(usageOptions, (res) => {
					res.setEncoding('utf8');
					res.on('data', (chunk) => {
						myConsts.logger("Random.org response: " + chunk);
						let parsedUsage = JSON.parse(chunk);
						if (typeof parsedUsage.result !== "undefined") {
							myUsage = parsedUsage.result;
							var usageEmbed = new MessageEmbed()
							.setColor('#0099ff')
							.setTitle('Random.org Usage')
							.addFields(
								{ name: 'Status', value: myUsage.status.toString(), inline: true },
								{ name: 'Creation Time', value: myUsage.creationTime.toString(), inline: true },
								{ name: 'Total Bits', value: myUsage.totalBits.toString(), inline: true },
								{ name: 'Remaining Bits', value: myUsage.bitsLeft.toString(), inline: true },
								{ name: 'Total Requests', value: myUsage.totalRequests.toString(), inline: true },
								{ name: 'Remaining Requests', value: myUsage.requestsLeft.toString(), inline: true }
							);
							myResolve(usageEmbed);
						}
						else {
							myRejection(chunk);
							console.log("Error: " + chunk);
						}
						myResolve(myUsage);
					});
				  });
				  usageReq.on('error', (e) => {
					  myConsts.logger(`problem with request: ${e.message}`);
					  myRejection(`problem with request: ${e.message}`);
				  });
				  var postString = JSON.stringify(usageIn);
				  // Write data to request body
				  usageReq.write(postString);
				  //Since the request method is being used here for the post, we're calling end() manually on both request objects.
				  usageReq.end();
			  }
			  catch (e)
			  {
				  myConsts.logger(e.message);
				  myRejection(e.message);
			  }
	});
}


const prefixes = ['!','?'];

function validatePrefix(p) {
	return prefixes.indexOf(p);
}

client.on("messageCreate", async function(message) {
	try
	{
	  if (message.author.bot)
	  {
		  return;
	  }
	  
	  var prefixFound = validatePrefix(message.content[0]);
	  //console.log('Prefix: ' + prefixes[prefixFound]);
	  if (prefixFound < 0 || !message.content.startsWith(prefixes[prefixFound]))
	  {
		  console.log("No prefix!");
		  return;
	  }
	  
	  var prefix = prefixes[prefixFound];
	  const command = message.content.indexOf(' ') >= 0 ? message.content.slice(prefix.length, message.content.indexOf(' ')) : message.content.slice(prefix.length);
	  const baseArg = message.content.indexOf(' ') >= 0 ? message.content.slice(message.content.indexOf(' ') + 1) : null;
	  var args;
	  //console.log(command + '\r\n' + arg);
	  
	  switch (command.toLowerCase())
	  {
		  
		  case "8ball":
		  message.reply(await getPrompt('answer'));
		  break;
		  
		  case "marco":
		  message.channel.send("POLO!!");
		  break;
		  
		  case 'debug':
		  //message.channel.send({embeds: [debugImg]});
		  message.channel.send("<:doubt:878211423942082580>");
		  break;
		  
		  case 'guess':
		  args = baseArg != null ? baseArg.split(' ') : [];
		  if (args.length == 2 && args[0].startsWith("m="))
		  {
			  var max = parseInt(args[0].substring(2));
			  var userGuess = parseInt(args[1]);
			  if (userGuess <= max)
			  {
				NumberGamePromise(max, userGuess).then(
				function(resp) { message.channel.send(resp); },
				function(err) { message.channel.send(err); }
				);
			  }
			  else
			  {
				  message.channel.send("You can't guess over the maximum!");
			  }
		  }
		 else {
		 	message.channel.send("!guess m=<maximum guess> <your guess>");
		 }
		  break;
		  
		  case 'imgflip':
		  CallImgFlip().then(
			function(resp)
			{
				genImgFlip(resp).then(
					function(resp2) { message.channel.send({embeds: [resp2]}); },
					function(err) { message.channel.send(err); }
				);
				//console.log(resp);
			}
		  );
		  break;
		  
		  case 'calc':
		  //console.log(JSON.stringify(message.author.id));
		  message.channel.send(evaluate(baseArg).toString());
		  break;
		  
		  case 'meme':
		  var imgParamsStr = baseArg.substring(0, baseArg.indexOf(' '));
		  var imgParams = imgParamsStr.split('-');
		  var textContent = baseArg.substring(baseArg.indexOf(' ') + 1);
		  console.log(`text : ${textContent}\r\npanels: ${imgParams[0]}\r\ntextboxes: ${imgParams[1]}`);
		  await genImgFlipDB(textContent, imgParams[0], imgParams[1]).then(
			  function(resp) { message.channel.send({embeds: [resp]}); },
			  function(err) { message.channel.send(err); }
			);
		  break;
			  
		  case 'time':
		  var allTimes = new MessageEmbed()
				.setTitle('The current time is:')
				.setColor('#0099ff');
			  BuildTimePromises().then(
				function(times) {
					Promise.all(times).then(
						function (myTimes) {
							//console.log(myTimes);
							myTimes.forEach(function(time) {
								//allTimes.addField(time.dispName, time.ctime, true);
								allTimes.addFields({ name: time.dispName, value: time.ctime, inline: true });
							});
							message.channel.send({embeds: [allTimes]});
						});
				},
				function(err) { myConsts.logger(err)});
			  break;
		  
		  case 'inspiro':
		  case 'inspirobot':
		  inspiroPromise().then(
			function(img) { message.channel.send({embeds: [img]}); },
			function(err) { message.channel.send(err); }
		  );
		  break;
		  
		  case 'face':
		  facePromise().then(
			function(img) { message.channel.send({content: 'This person does not exist!', files: [img]}); },
			function(err) { message.channel.send(err); }
		  );
		  break;
		  
		  case 'help':
		  message.channel.send({embeds: [helpEmbed]});
		  break;
		  
		  case 'usage':
			  getUsage().then(
			  function(output) { message.author.send({embeds: [output]}); },
			  function(err) { message.author.send(JSON.stringify(err)); }
			  );
		  break;
		  
		  case 'guid':
		  case 'uuid':
			  message.author.send(uuidv4().toUpperCase());
		  break;
		  
		  case 'dadjokes':
		  numJokes = parseInt(baseArg);
		  checkedNum = isNaN(numJokes) ? 3 : numJokes;
		  message.channel.send(await dadJokeDB(checkedNum));
		  /**
		  dadJokesPromise().then(
			function(jokes) { message.channel.send(jokes); },
			function(err) { message.channel.send(err); }
		  );
		  **/
		  break;
		  
		  case 'chuck':
		  case 'norris':
		  ChuckNorris().then(
			function(norris) { message.channel.send(norris); },
			function(err) { message.channel.send(err); }
		  );
		  break;
		  
		  case 'unsplash':
		  Unsplash(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)).then(
			function(img) { message.channel.send({embeds: [img]}); },
			function(err) { message.channel.send(err); }
		  );
		  break;
		  
		  case 'apod':
		  NasaAPOD(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)).then(
			function(img) { message.channel.send({embeds: [img]}); },
			function(err) { message.channel.send(err); }
		  );
		  break;
		  
		  case 'shibe':
		  case 'shibes':
		  shibesPromise('shibes').then(
			function(img) { message.channel.send({embeds: [img]}); },
			function(err) { message.channel.send(err); }
		  );
		  break;
		  
		  case 'cat':
		  case 'cats':
		  shibesPromise('cats').then(
			function(img) { message.channel.send({embeds: [img]}); },
			function(err) { message.channel.send(err); }
		  );
		  break;
		  
		  case 'bird':
		  case 'birds':
		  case 'birb':
		  case 'birbs':
		  case 'borb':
		  case 'borbs':
		  shibesPromise('birds').then(
			function(img) { message.channel.send({embeds: [img]}); },
			function(err) { message.channel.send(err); }
		  );
		  break;
		  
		  default:
		  console.log(command.toLowerCase());
		  return;
	  }
	}
	catch(err)
	{
		myConsts.logger(err);
	}
});

client.on('error', (err) => {
	myConsts.logger(err);
});

client.once('ready', () => {
	console.log('Ready!');
});

client.login(myConsts.PUDDING_TOKEN);
