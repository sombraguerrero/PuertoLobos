const {Client, Intents, MessageEmbed} = require("discord.js");
const client = new Client({ intents: ["GUILDS", "GUILD_MESSAGES", "DIRECT_MESSAGES"] });
const mariadb = require('mariadb');
const myConsts = require('./myConstants.js');
const https = require('https');
const pool = mariadb.createPool({
     host: myConsts.conn.host, 
     user: myConsts.conn.user, 
     password: myConsts.conn.password,
	 port: myConsts.conn.port,
	 database: myConsts.conn.database,
     connectionLimit: myConsts.conn.connectionLimit
});

const helpEmbed = new MessageEmbed()
	.setColor('#0099ff')
	.setTitle('Valid Commands')
	.addFields(
		{ name: 'pull', value: 'Responds with a random prompt from the database.', inline: true },
		{ name: 'push <prompt>', value: 'Adds *prompt* to the database and returns the new ID.', inline: true },
		{ name: 'marco', value: 'Responds, "POLO!!"', inline: true },
		{ name: 'sean, daniel, finn, comfort, chris', value: 'Responds with a random Tweet from the daily character accounts.', inline: true },
		{ name: 'inspiro, inspirobot', value: 'Pulls a random meme from InspiroBot!', inline: true },
		{ name: 'height [tallest, shortest, nickname] [heightValue (cm)]', value: 'Query and update heights of server members. Command alone returns all', inline: true },
		{ name: 'guess <number>', value: 'See how close you get to a randomly generated number!', inline: true }
		
	);
	
const debugImg = new MessageEmbed()
.setColor('#0099ff')
	.setTitle('Image URL Test')
	.setDescription('Test Embed')
	.setImage(new Object().url = 'https://pbs.twimg.com/media/E803PfgXsAMxnni.jpg');

async function postPrompt(msg) {
  let conn;
  var promptResult;
  try {
	conn = await pool.getConnection();
	const res = await conn.query("INSERT INTO prompts (prompt) values (?)", [msg]);
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

async function getPrompt() {
  let conn;
  let promptOut;
  try {
	conn = await pool.getConnection();
	const row = await conn.query("SELECT * from prompts order by rand() limit 1");
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

function NumberGame(g, guessCB) {
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
					 return guessCB(`You were close! It was ${target}!`);
				 else if (diff > near)
					 return guessCB(`Better luck next time! It was ${target}!`);
				 else
					 return guessCB(`It *was* ${target}! Lucky!`);
			  
			});
			});

		  seedReq.on('error', (e) => {
			myConsts.logger(`problem with request: ${e.message}`);
		  });
		  
		  var postString = JSON.stringify(seedIn);
		  // Write data to request body
		  seedReq.write(postString);
		  //Since the request method is being used here for the post, we're calling end() manually on both request objects.
		  seedReq.end();
		  
		} catch (e) {
		  myConsts.logger(e.message);
		}
}

function InspiroBot(inspiroCB) {
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
			return inspiroCB(myEmbed);
		});
		addr_res.on('error', (err) => {
			myConsts.logger(err);
		});
	}).end();
	
	inspiroReq.on('error', (err) => {
		myConsts.logger(err);
	});
}

function calcImperial(height) {
	var inches = height / 2.54;
	var feet = inches / 12;
	var rem_inches = inches % 12;
	return `${Math.trunc(feet)}'${Math.trunc(rem_inches)}"`;
}

async function processHeight(heightCB, uname = '', h = 0)
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
			var allHeights = new MessageEmbed()
			.setTitle('Known server heights')
			.setColor('#0099ff');
			var rows = await conn.query('SELECT * from pl_height order by metric_height desc');
			//console.log('Here ' + rows);
			rows.forEach(async function(h) {
				allHeights.addField(h.name, `${h.metric_height} cm; ${calcImperial(h.metric_height)}`, true);
			});
			promptOut = heightCB(allHeights);
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
		return promptOut;
	}	
}

function getTweet(account, tweetCB) {
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
			return tweetCB(myEmbed);
		});
		addr_res.on('error', (err) => {
			myConsts.logger(err);
		});
	}).end();
	
	tweeetReq.on('error', (err) => {
		myConsts.logger(err);
	});
}

const prefix = "!";

client.on("messageCreate", async function(message) {
  if (message.author.bot)
  {
	  return;
  }
  
  if (!message.content.startsWith(prefix))
  {
	  console.log("No prefix!");
	  return;
  }
  const command = message.content.indexOf(' ') >= 0 ? message.content.slice(prefix.length, message.content.indexOf(' ')) : message.content.slice(prefix.length);
  const baseArg = message.content.indexOf(' ') >= 0 ? message.content.slice(message.content.indexOf(' ') + 1) : null;
  var args;
  //console.log(command + '\r\n' + arg);
  
  switch (command.toLowerCase())
  {
	  case "push":
	  var msgTxt = await postPrompt(baseArg);
	  message.channel.send(`I added the prompt with ID ${msgTxt}.`);
	  break;
	  
	  case "pull":
	  message.channel.send(await getPrompt());
	  break;
	  
	  case "marco":
	  message.channel.send("POLO!!");
	  break;
	  
	  case 'sean':
	  case 'daniel':
	  case 'finn':
	  case 'comfort':
	  case 'chris':
	  getTweet(command, (resp) => {
		message.channel.send({embeds: [resp]});  
	  });
	  break;
	  
	  case 'debug':
	  message.channel.send({embeds: [debugImg]});
	  break;
	  
	  case 'height':
	  args = baseArg != null ? baseArg.split(' ') : [];
	  if (args.length == 1)
		  message.channel.send(await processHeight(null, baseArg));
	  else if (args.length == 2) {
		  //myConsts.logger((`Args length is 2\r\nFirst arg: ${args[0]}\r\nSecond arg: ${args[1]}`));
		  message.channel.send(await processHeight(null, args[0], parseInt(args[1])));
	  }
	  else
	  {
		  processHeight((resp) => {
			  message.channel.send({embeds: [resp]});
		  });
	  }
	  break;
	  
	  case 'guess':
	  args = baseArg != null ? baseArg.split(' ') : [];
	  if (args.length == 1)
	  {
		  NumberGame(parseInt(args[0]), (resp) => {
			  message.channel.send(resp);
		  });
	  }
	  break;
	  
	  case 'inspiro':
	  case 'inspirobot':
	  InspiroBot((resp) => {
		message.channel.send({embeds: [resp]});	
	  });
	  break;
	  
	  default:
	  message.channel.send({embeds: [helpEmbed]});
	  break;
  }
});

client.once('ready', () => {
	console.log('Ready!');
});

client.login(myConsts.BOT_TOKEN);
