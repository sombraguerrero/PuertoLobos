const {Client, Intents, MessageEmbed} = require("discord.js");
const client = new Client({ intents: ["GUILDS", "GUILD_MESSAGES", "DIRECT_MESSAGES"] });
const mariadb = require('mariadb');
const myConsts = require('./myConstants.js');
const https = require('https');
const http = require('http');
const fs = require('fs');
const pool = mariadb.createPool({
     host: myConsts.conn.host, 
     user: myConsts.conn.user, 
     password: myConsts.conn.password,
	 port: myConsts.conn.port,
	 database: myConsts.conn.database,
     connectionLimit: myConsts.conn.connectionLimit
});
const { randomUUID: uuidv4 } = require('crypto');

const helpEmbed = new MessageEmbed()
	.setColor('#0099ff')
	.setTitle('Valid Commands')
	.addFields(
		{ name: 'pull <prompt, answer, key>', value: 'Pulls random writer\'s prompt, 8ball answer, or Great Silence response from database.', inline: true },
		{ name: '8ball', value: 'Answers binary questions.', inline: true },
		{ name: 'push <prompt, answer, key>', value: 'Adds random writer\'s prompt, 8ball answer, or Great Silence response to database. Returns insert ID', inline: true },
		{ name: 'marco', value: 'Responds, "POLO!!"', inline: true },
		{ name: 'sean, daniel, finn, comfort, chris', value: 'Responds with a random Tweet from the daily character accounts.', inline: true },
		{ name: 'inspiro, inspirobot', value: 'Pulls a random meme from InspiroBot!', inline: true },
		{ name: 'height [tallest, shortest, nickname] [heightValue (cm)]', value: 'Query and update heights of server members. Command alone returns all', inline: true },
		{ name: 'guess <number>', value: 'See how close you get to a randomly generated number!', inline: true },
		{ name: 'dadjokes', value: 'Returns 3 dad jokes (for Nick)', inline: true },
		{ name: 'guid, uuid', value: 'DMs the sender a cryptographically secure type 4 UUID.', inline: true },
		{ name: 'time', value: 'Returns current time (relative to bot\'s local time) in multiple time zones.', inline: true }
		
	);
	
const debugImg = new MessageEmbed()
.setColor('#0099ff')
	.setTitle('Image URL Test')
	.setDescription('Test Embed')
	.setImage(new Object().url = 'https://pbs.twimg.com/media/E803PfgXsAMxnni.jpg');

async function postPrompt(msg, kind) {
  let conn;
  var promptResult;
  try {
	conn = await pool.getConnection();
	const res = await conn.query("INSERT INTO prompts (prompt, kind) values (?,?)", [msg, kind]);
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
	conn = await pool.getConnection();
	const row = await conn.query('SELECT * from prompts where kind = ? order by rand() limit 1', [kind]);
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

function NumberGamePromise(g) {
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
		
		return new Promise(function(myResolve, myReject) {
			try {
				const seedReq = https.request(seedOptions, (res) => {
				res.setEncoding('utf8');

				res.on('data', (chunk) => {
					var mySeed = 0;
					//myConsts.logger("Random.org response: " + chunk);
					let parsedSeed = JSON.parse(chunk);
					if (!(typeof parsedSeed.result === "undefined")) {
						mySeed = Math.round(Math.cbrt(parsedSeed.result.random.data[0] * parsedSeed.result.random.data[1] * parsedSeed.result.random.data[2]));
						//myConsts.logger("Seed per Random.org (Geometric Mean of 3 elements): " + mySeed);
					}
					else {
						mySeed = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
						console.log("Seed per Math.random(): " + mySeed);
					}
					 
					 var userGuess = parseInt(g);
					 var target = (mySeed % userGuess) + 1;
					 //console.log(`Guess: ${userGuess}\r\nVal: ${mySeed}\r\nTarget: ${target}`);
					 var diff = Math.abs(userGuess - target);
					 var near = Math.ceil(target * .15);
					 if (diff > 0 && diff <= near)
						 myResolve(`You were close! It was ${target}!`);
					 else if (diff > near)
						 myResolve(`Better luck next time! It was ${target}!`);
					 else
						 myResolve(`It *was* ${target}! Lucky!`);
				  
				});
				});

			  seedReq.on('error', (e) => {
				myConsts.logger(`problem with request: ${e.message}`);
				myReject(`problem with request: ${e.message}`);
			  });
			  
			  var postString = JSON.stringify(seedIn);
			  // Write data to request body
			  seedReq.write(postString);
			  //Since the request method is being used here for the post, we're calling end() manually on both request objects.
			  seedReq.end();
			  
			} catch (e) {
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
				myEmbed.color = Math.floor(Math.random() * 16777215); // Discord spec requires hexadecimal codes converted to a literal decimal value (anything random between black and white) 
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

function dadJokesPromise() {
	return new Promise(function(myResolve, myReject) {
		const getOptions = {
				hostname: 'icanhazdadjoke.com',
				path: `/search?limit=30&page=${Math.floor(Math.random() * myConsts.PAGES)}`,
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
					jokesStr += i + '.\t' + jokesCollection[Math.floor(Math.random() * jokesCollection.length)].joke + '\r\n';
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
	});
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
					allHeights.addField(h.name, `${h.metric_height} cm; ${calcImperial(h.metric_height)}`, true);
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
				var rows = await conn.query("SELECT CONVERT_TZ(NOW(), @@SESSION.time_zone, 'UTC') AS timeConverted, 'UTC' AS zone UNION SELECT CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/Los_Angeles'), 'Pacific' UNION SELECT CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/Denver'), 'Mountain' UNION SELECT CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/Chicago'), 'Central' UNION SELECT CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York'), 'Eastern' UNION SELECT CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/Sao_Paulo'), 'Brazil' UNION SELECT CONVERT_TZ(NOW(), @@SESSION.time_zone, 'Europe/Dublin'), 'UK' UNION SELECT CONVERT_TZ(NOW(), @@SESSION.time_zone, 'CET'), 'Italy/Slovenia/Switzerland' UNION SELECT CONVERT_TZ(NOW(), @@SESSION.time_zone, 'Europe/Bucharest'), 'Romania' UNION SELECT CONVERT_TZ(NOW(), @@SESSION.time_zone, 'Asia/Manila'), 'Philippines' UNION SELECT CONVERT_TZ(NOW(), @@SESSION.time_zone, 'Australia/Melbourne'), 'Australia'");
				
			rows.forEach(async function(myTime) {
				allTimes.addField(myTime.zone, myTime.timeConverted.toString(), true);
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

function getTweetPromise(account) {
	var num = Math.random();
	var myEmbed = new Object();
	var birdData = new Object();
	var selectedTweet = new Object();
	var birdMedia = new Object();
	var myImage = new Object();
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
		},
		{
			"name": "Daily Chris",
			"id": '1417256090715164675'
		}
	
	];
	var selectedAccount = null;
	switch (account.toLowerCase())
	{
		case "comfort":
		selectedAccount = accounts[0];
		break;
		case "finn":
		selectedAccount = accounts[1];
		break;
		case "daniel":
		selectedAccount = accounts[3];
		break;
		case "chris":
		selectedAccount = accounts[4];
		break;
		case "sean":
		default:
		selectedAccount = accounts[2];
		break;
	}
	
	const getOptions = {
				hostname: 'api.twitter.com',
				path: `/2/users/${selectedAccount.id}/tweets?max_results=100&expansions=attachments.media_keys&media.fields=url,preview_image_url`,
				method: 'GET',
				headers: {
				  'User-Agent': myConsts.UA,
				  'Authorization':`Bearer ${myConsts.BIRD}`
				}
	};
	//console.log(getOptions.path);
	//Perform GET request with specified options.
	let imgData = '';
	
	return new Promise(function(myResolve, myReject) {
	
		//let account = accounts[Math.floor(num * accounts.length)];
		const tweeetReq = https.request(getOptions, (addr_res) => {
			addr_res.on('data', (imgAddr) => { imgData += imgAddr; });
				addr_res.on('end', () => {
				birdData = JSON.parse(imgData);
				selectedTweet = birdData.data[Math.round(birdData.data.length * num)];
				birdMedia = birdData.includes.media;
				myImage = new Object();
				
				if ((typeof selectedTweet.attachments) != "undefined")
				{
					var selectedAttachmentKeyIndex =  selectedTweet.attachments.media_keys.length > 1 ? Math.floor(num * selectedTweet.attachments.media_keys.length) : 0;
					var selectedMediaIndex = birdMedia.findIndex(media => media.media_key == selectedTweet.attachments.media_keys[selectedAttachmentKeyIndex]);
					myImage.url = birdMedia[selectedMediaIndex].type == 'photo' ? birdMedia[selectedMediaIndex].url.toString() : birdMedia[selectedMediaIndex].preview_image_url.toString();
					myEmbed.image = myImage;
				}
				
				myEmbed.color = Math.floor(num * 16777215); // Discord spec requires hexadecimal codes converted to a literal decimal value (anything random between black and white)
				myEmbed.title = selectedAccount.name;
				
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
					myEmbed.description = 'A randomly selected Tweet.';
				}
				myResolve(myEmbed);
			});
			addr_res.on('error', (err) => {
				myConsts.logger(err);
				myReject(err);
			});
		}).end();
		
		tweeetReq.on('error', (err) => {
			myConsts.logger(err);
			myReject(err);
		});
	});
}

const prefixes = ['!','?'];

function validatePrefix(p) {
	return prefixes.indexOf(p);
}

function goodNightPromise() {
	return new Promise(function(myResolve, myReject) {
		var basePath = "./prompt-bot/gn/";
		var num = Math.random();
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
client.on("messageCreate", async function(message) {
	try
	{
	  if (message.author.bot)
	  {
		  return;
	  }
	  
	  else if (message.content.toLowerCase().startsWith('good morning'))
	  {
		  message.channel.send({files: [fs.createReadStream('./prompt-bot/wakeup.gif')]});
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
		  if (arg1.toLowerCase() == 'key' || arg1.toLowerCase() == 'prompt' || arg1.toLowerCase() == 'answer')
		  {
			  var msgTxt = await postPrompt(arg2, arg1.toLowerCase());
			  message.channel.send(`I added the prompt with ID ${msgTxt}.`);
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
		  
		  case 'sean':
		  case 'daniel':
		  case 'finn':
		  case 'comfort':
		  case 'chris':
		  getTweetPromise(command).then(
			function(resp) { message.channel.send({embeds: [resp]}); },
			function(err) { message.channel.send(err); }
		  );
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
		  if (args.length == 1)
		  {
			  NumberGamePromise(parseInt(args[0])).then(
				  function(resp) { message.channel.send(resp); },
				  function(err) { message.channel.send(err); }
			  );
		  }
		  break;
			  
		  case 'time':
			  getTimePromise().then(
				function(res) { message.channel.send({embeds: [res]}); },
				function(err) { message.channel.send(err); }
			  );
			  break;
		  
		  case 'inspiro':
		  case 'inspirobot':
		  inspiroPromise().then(
			function(img) { message.channel.send({embeds: [img]}); },
			function(err) { message.channel.send(err); }
		  );
		  break;
		  
		  case 'help':
		  message.channel.send({embeds: [helpEmbed]});
		  break;
		  
		  case 'guid':
		  case 'uuid':
			  message.author.send(uuidv4().toUpperCase());
		  /*message.author.send(await getGuid());
			uuidPromise().then(
				function(guid) { message.author.send(guid); },
				function(err) { message.channel.send(err); }
		  );
		  */
		  break;
		  
		  case 'dadjokes':
		  dadJokesPromise().then(
			function(jokes) { message.channel.send(jokes); },
			function(err) { message.channel.send(err); }
		  );
		  break;
			  
		  case 'brad':
			  message.channel.send('ABAP - All Brads are :pig:');
			  break;
		  
		  default:
		  return;
		  //message.channel.send("It's for you guys, <@155149108183695360>, <@204255221017214977>!");
		  break;
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
