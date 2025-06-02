const {Client, Intents, MessageEmbed, MessageAttachment} = require("discord.js");
const client = new Client({ intents: ["GUILDS", "GUILD_MESSAGES", "DIRECT_MESSAGES"] });
const mariadb = require('mariadb');
const myConsts = require('./myConstants.js');
const https = require('https');
const http = require('http');
const fs = require('fs');
const { DateTime } = require('luxon');

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
		{ name: "8ball", value: "Answers binary questions.", inline: true },
		{ name: "art, artic", value: "Random image/artwork from the Art Institute of Chicago.", inline: true },
		{ name: "bestie", value: 'Pulls a gif of Captain Spirit saying, "So true, bestie!"', inline: true },
		{ name: "calc", value: "Calculates any arithmetic expression (JavaScript-like functions available to get fancy!)", inline: true },
		{ name: "dadjokes n", value: "Returns 'n' dad jokes, 3 is default", inline: true },
		{ name: "face", value: "Pulls a random face from \"This person does not exist\".", inline: true },
		{ name: "flat", value: "Pulls a gif of the flat hamster!", inline: true },
		{ name: "guid, uuid", value: "DMs the sender a cryptographically secure type 4 UUID.", inline: true },
		{ name: "guess m=<maximum guess> <your guess>", value: "Guess a positive integer between 0 and m!", inline: true },
		{ name: "height [tallest, shortest, average, nickname] [heightValue (cm)]", value: "Query and update heights of server members. Command alone returns all", inline: true },
		{ name: "imgflip", value: "Generates a single-image meme via ImgFlip using completely random text.", inline: true },
		{ name: "inspiro, inspirobot", value: "Pulls a random meme from InspiroBot!", inline: true },
		{ name: "marco", value: 'Responds, "POLO!!"', inline: true },
		{ name: "meme", value: "Generates a single-image meme via ImgFlip.\r\nArguments: p-t: p = panels; t = textboxes.\r\nUse the | character to separate text (max 5 boxes).", inline: true },
		{ name: "pull <prompt, answer, key>", value: "Pulls random writer's prompt, 8ball answer, or Great Silence response from database.", inline: true },
		{ name: "push <prompt, answer, greg>", value: "Adds random writer's prompt, 8ball answer, or Great Silence response to database. Returns insert ID", inline: true },
		{ name: "rand <q>", value: "Generate q random integers.", inline: true },
		{ name: "time", value: "Converts the current UTC time to local time in multiple time zones.", inline: true }
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

async function postPrompt(msg, kind) {
  let conn;
  var promptResult;
  try {
	  var val = kind === 'greg' ? 'gregResponse' : kind;
	conn = await pool.getConnection();
	const res = await conn.query("INSERT INTO prompts (prompt, kind) values (?,?)", [msg, val]);
	promptResult = res.insertId;
	console.log(res);
  } catch (err) {
	myConsts.logger(err);
  } finally {
	if (conn)
		conn.end();
	return promptResult;
  }
}

async function getPrompt(kind) {
  let conn;
  let promptOut;
  try {
	 var respType = kind == 'key' ? 'gregResponse' : kind;
	conn = await pool.getConnection();
	const row = await conn.query('SELECT * from prompts where kind = ? order by rand() limit 1', [respType]);
	promptOut = row[0].prompt;
	await conn.query("update prompts set dtUsed = now() where ID = ?", [row[0].ID]);

  } catch (err) {
	myConsts.logger(err);
  } finally {
	if (conn)
		conn.end();
	return promptOut;	
  }
}

async function getArtWork() {
  let conn;
  let promptOut;
  try {
	conn = await pool.getConnection();
	const row = await conn.query('CALL `getDiscordEmbed`()');
	promptOut = row[0] != null || row.length == 1 ? row[0] : -1284;

  } catch (err) {
	myConsts.logger(err);
  } finally {
	if (conn)
		conn.end();
	return promptOut;	
  }
}

async function genArtworkEmbed()
{
	return new Promise(async function(myResolve, myReject)
	{
		try
		{
			var artData = await getArtWork();
			//console.log(artData)
			var myImage = new Object();
			myImage.url = artData[0].img_url;
			var myProvider = new Object();
			myProvider.name = 'Art Institute of Chicago';
			myProvider.url = 'https://www.artic.edu';
			var myAuthor = new Object();
			myAuthor.name = artData[0].artist_display;
			var myFooter = new Object();
			myFooter.text = `${artData[0].date_display} - ${artData[0].place_of_origin}\r\n${artData[0].medium_display}`;
			var myEmbed = new Object();
			myEmbed.image = myImage;
			myEmbed.author = myAuthor;
			myEmbed.provider = myProvider;
			myEmbed.footer = myFooter;
			myEmbed.title = artData[0].artwork_title != '' ? artData[0].artwork_title : artData[0].img_title;
			myEmbed.description = `${artData[0].description} \r\n${artData[0].inscriptions} `;
			myEmbed.url = 'https://www.artic.edu';
			myEmbed.color =  artData[0].discordColor // Discord spec requires hexadecimal codes converted to a literal decimal value (anything random between black and white)
			myResolve(myEmbed);
		}
		catch (e)
		{
			myReject(e);
		}
	});
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

function calcImperial(height) {
	var inches = height / 2.54;
	var feet = inches / 12;
	var rem_inches = inches % 12;
	return `${Math.trunc(feet)}'${Math.trunc(rem_inches)}"`;
}

async function processHeight(uname = '', h = 0)
{
	let conn;
	let promptOut;
	var row;
	try
	{
		conn = await pool.getConnection();
		if (h < 1 && uname != '')
		{
			switch (uname.toLowerCase())
			{
				case 'shortest':
				row = await conn.query('SELECT * from pl_height order by metric_height asc limit 1');
				promptOut = `${row[0].name} is the shortest person on the server at ${row[0].metric_height} centimetres or ${calcImperial(row[0].metric_height)}.`;
				break;
				
				case 'tallest':
				row = await conn.query('SELECT * from pl_height order by metric_height desc limit 1');
				promptOut = `${row[0].name} is the tallest person on the server at ${row[0].metric_height} centimetres or ${calcImperial(row[0].metric_height)}.`;
				break;
					
				case 'average':
				row = await conn.query('SELECT AVG(metric_height) as \'average\' FROM pl_height');
				promptOut = `Average height on the server is ${Math.round(row[0].average)} centimetres or ${calcImperial(row[0].average)}.`;
				break;
				
				default:
				row = await conn.query("SELECT * from pl_height where name = ?", [uname.toUpperCase()]);
				promptOut = `${uname.toUpperCase()}'s height is ${row[0].metric_height} centimetres or ${calcImperial(row[0].metric_height)}.`;
				break;
			}
		}
		else if (h >= 1)
		{
			row = await conn.query("INSERT INTO pl_height (name, metric_height) VALUES (?, ?) ON DUPLICATE KEY UPDATE metric_height = VALUES(metric_height)", [uname.toUpperCase(), h]);
			promptOut = `Height has been updated for ${uname.toUpperCase()}.`;
		}
		else if (uname == '')
		{
			let heightPromise = new Promise(async function(myResolve) {
				var allHeights = new MessageEmbed()
				.setTitle('Known server heights')
				.setColor('#0099ff');
				var rows = await conn.query('SELECT * from pl_height order by metric_height desc');
				//console.log('Here ' + rows);
				rows.forEach(async function(h) {
					//allHeights.addField(h.name, `${h.metric_height} cm; ${calcImperial(h.metric_height)}`, true);
					allHeights.addFields({ name: h.name, value: `${h.metric_height} cm; ${calcImperial(h.metric_height)}`, inline: true });
				});
				myResolve(allHeights);
			});
			promptOut = heightPromise;
		}
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

async function getTimePromise() {
	let conn;
	let promptOut;
	try {
		conn = await pool.getConnection();
		let timePromise = new Promise(async function(myResolve) {
				var allTimes = new MessageEmbed()
				.setTitle('Current Time is...')
				.setColor('#0099ff');
				var rows = await conn.query("SELECT CONVERT_TZ(NOW(), @@SESSION.time_zone, 'UTC') AS timeConverted, 'UTC' AS zone UNION ALL SELECT CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/Los_Angeles') AS timeConverted, 'Pacific' AS zone UNION ALL SELECT CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/Denver') AS timeConverted, 'Mountain' AS zone UNION ALL SELECT CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/Chicago') AS timeConverted, 'Central' AS zone UNION ALL SELECT CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York') AS timeConverted, 'Eastern' AS zone UNION ALL SELECT CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/Sao_Paulo') AS timeConverted, 'Brazil' AS zone UNION ALL SELECT CONVERT_TZ(NOW(), @@SESSION.time_zone, 'Europe/Dublin') AS timeConverted, 'UK' AS zone UNION ALL SELECT CONVERT_TZ(NOW(), @@SESSION.time_zone, 'CET') AS timeConverted, 'Italy/Slovenia/Switzerland' AS zone UNION ALL SELECT CONVERT_TZ(NOW(), @@SESSION.time_zone, 'Europe/Bucharest') AS timeConverted, 'Romania' AS zone UNION ALL SELECT CONVERT_TZ(NOW(), @@SESSION.time_zone, 'Asia/Manila') AS timeConverted, 'Philippines' AS zone UNION ALL SELECT CONVERT_TZ(NOW(), @@SESSION.time_zone, 'Australia/Melbourne') AS timeConverted, 'Australia' AS zone;");
	
			allTimes.addFields(
				rows.map((tz) => ({
					name: `🌍 ${tz.zone}`,
					value: `🕒 ${tz.timeConverted}`,
					inline: true
			})));
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

//Using Luxon to perform local time conversions based on zone list
function getTimePromise2() {
	return new Promise(function(myResolve, myReject) {
		var allTimes = new MessageEmbed()
				.setTitle('Current Time is...')
				.setColor('#0099ff');
		allTimes.addFields(
				myConsts.myTZ.map((tz) => ({
					name: `🌍 ${tz}`,
					value: `🕒${DateTime.now().setZone(tz).toFormat("yyyy-MM-dd HH:mm:ss")}`,
					inline: true
			})));
	//console.log(localTimes)
		if (myConsts.myTZ.length > 0)
			myResolve(allTimes);
		else
			myReject("Map of local times is empty!");
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

function goodNightPromise() {
	return new Promise(function(myResolve, myReject) {
		var basePath = "gn/";
		var num = myConsts.getSeed(false,1)[0];
		fs.readdir(basePath, { withFileTypes: true }, (err, files) => {
			try {
				const filteredFiles = files
				.filter(dirent => dirent.isFile())
				.map(dirent => dirent.name);
				//filteredFiles.sort();
				myResolve(fs.createReadStream(basePath + filteredFiles[Math.floor(num * filteredFiles.length)]));
			}
			catch(err) {
				myConsts.logger(err.name + ": " + err.message + "\r\n");
				myReject('Welp, can\'t get an image, so I\'ll just say it myself, good night!');
			}
		});
	});
}

function getImage(img) {
	return new Promise(function(myResolve, myReject)
	{
		try
		{
			myResolve(fs.createReadStream(img));
		}
		catch(err)
		{
			myConsts.logger(err.name + ": " + err.message + "\r\n");
			myReject('Welp, I seem to be having some trouble getting that for you! :slight_frown:');
		}
	});
}

client.on("messageCreate", async function(message) {
	try
	{
	  if (message.author.bot)
	  {
		  return;
	  }
	  
	  else if (message.content.toLowerCase().startsWith('good morning'))
	  {
		  getImage('wakeup.gif').then(
			function(imgStream) { message.channel.send({files: [imgStream]}); },
			function(err) { message.channel.send(err); }
		  );
		  return;
	  }
	  
	  else if (message.content.toLowerCase().startsWith('good night'))
	  {
		  goodNightPromise().then(
			function(imgStream) { message.channel.send({files: [imgStream]}); },
			function(err) { message.channel.send(err); }
		  );
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
		  case "push":
		  arg2Start = baseArg != null ? baseArg.indexOf(' ') : null;
		  arg1 = baseArg.slice(0, arg2Start)
		  arg2 = baseArg.slice(arg2Start + 1);
		  if (arg1.toLowerCase() == 'greg' || arg1.toLowerCase() == 'prompt' || arg1.toLowerCase() == 'answer')
		  {
			  var msgTxt = await postPrompt(arg2, arg1.toLowerCase());
			  message.channel.send(`I added the ${arg1} with ID ${msgTxt}.`);
		  }
		  break;
		  
		  case "pull":
		   if (baseArg.toLowerCase() == 'key' || baseArg.toLowerCase() == 'prompt' || baseArg.toLowerCase() == 'answer')
			  message.channel.send(await getPrompt(baseArg.toLowerCase()));
		  break;
		  
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
		  
		  case 'height':
		  args = baseArg != null ? baseArg.split(' ') : [];
		  if (args.length == 1)
			  message.channel.send(await processHeight(baseArg));
		  else if (args.length == 2) {
			  //myConsts.logger((`Args length is 2\r\nFirst arg: ${args[0]}\r\nSecond arg: ${args[1]}`));
			  message.channel.send(await processHeight(args[0], parseInt(args[1])));
		  }
		  else
		  {
			  processHeight().then(
				function(res) { message.channel.send({embeds: [res]}); },
				function(err) { message.channel.send(err); }
			  );
		  }
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
		  
		  case 'rand':
		  args = baseArg != null ? baseArg.split(' ') : [];
		  if (args.length == 1)
		  {
			  var qty = parseInt(args[0]);
			  myConsts.getInt(qty).then(
				function(resp) { message.channel.send(resp.join()); },
				function(err) { message.channel.send(err); }
			  );
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
		  
		  case 'timedb':
		  getTimePromise().then(
			function(times) { message.channel.send({embeds: [times]}); },
			function(err) { message.channel.send(err); }
		);
		  break;
		  
		  case 'time':
		  getTimePromise2().then(
			function(myTimes) { message.channel.send({embeds: [myTimes]}); },
			function(err) { message.channel.send(err); });
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
		  
		  case 'brad':
		  //message.channel.send('ABAP - All Brads are :pig:');
		  //message.channel.send('ABABAMFS - All Brads are  :sunglasses:');
		  getImage('dance-party.gif').then(
			function(imgStream) { message.channel.send({files: [imgStream]}); },
			function(err) { message.channel.send(err); }
		  );
		  return;
		  break;
		  
		  case 'extrabrad':
		  //message.channel.send('ABAP - All Brads are :pig:');
		  //message.channel.send('ABABAMFS - All Brads are  :sunglasses:');
		  getImage('extrabrad.gif').then(
			function(imgStream) { message.channel.send({files: [imgStream]}); },
			function(err) { message.channel.send(err); }
		  );
		  return;
		  break;
		  
		  case "bestie":
		  getImage('bestie.gif').then(
			function(imgStream) { message.channel.send({files: [imgStream]}); },
			function(err) { message.channel.send(err); }
		  );
		  return;
		  break;
		  
		  case "counter":
		  getImage('zero_days.jpg').then(
			function(imgStream) { message.channel.send({files: [imgStream]}); },
			function(err) { message.channel.send(err); }
		  );
		  return;
		  break;
		  
		  case "flat":
		  getImage('flat.gif').then(
			function(imgStream) { message.channel.send({files: [imgStream]}); },
			function(err) { message.channel.send(err); }
		  );
		  return;
		  break;
		  
		  case 'art':
		  case 'artic':
		  genArtworkEmbed().then(
			function(img) { message.channel.send({embeds: [img]}); },
			function(err) { message.channel.send(err); }
		  );
		  break;
			  
		  default:
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

client.login(myConsts.BOT_TOKEN);
