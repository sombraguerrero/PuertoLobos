const {Client, Intents, MessageEmbed} = require("discord.js");
const config = require("./config.json");
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
		{ name: 'pull', value: 'Replies with a random prompt from the database.', inline: true },
		{ name: 'push <prompt>', value: 'Adds *prompt* to the database and returns the new ID.', inline: true },
		{ name: 'marco', value: 'Responds, "POLO!!"', inline: true },
		{ name: 'sean, daniel, finn, comfort', value: 'Responds with a random Tweet from the daily character accounts.', inline: true },
		{ name: 'inspiro, inspirobot', value: 'Pulls a random meme from InspiroBot!', inline: true }
		
	);
	
const debugImg = new MessageEmbed()
.setColor('#0099ff')
	.setTitle('Image URL Test')
	.setDescription('The image url value gets read as an object when it is not.')
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
	throw err;
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
	throw err;
  } finally {
	if (conn)
		conn.end();
	return promptOut;	
  }
}

function InspiroBot(msg) {
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
			myEmbed.color = Math.floor(Math.random() * 16777215); // Discord spec requires hexadecimal codes converted to a literal decimal value (anything random between black and white) 
			
			var embedString = JSON.stringify(myEmbed);
			console.log(embedString);
			msg.channel.send({embeds: [myEmbed]})
		});
	}).end();
}

function getTweet(msg, account) {
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
	https.request(getOptions, (addr_res) => {
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
			msg.channel.send({embeds: [myEmbed]});
		});
	}).end();
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
  const arg = message.content.indexOf(' ') >= 0 ? message.content.slice(message.content.indexOf(' ') + 1) : "";
  //console.log(command + '\r\n' + arg);
  
  switch (command.toLowerCase())
  {
	  case "push":
	  var msgTxt = await postPrompt(arg);
	  message.reply(`I added the prompt with ID ${msgTxt}.`);
	  break;
	  
	  case "pull":
	  message.reply(await getPrompt());
	  break;
	  
	  case "marco":
	  message.channel.send("POLO!!");
	  break;
	  
	  case 'sean':
	  case 'daniel':
	  case 'finn':
	  case 'comfort':
	  getTweet(message, command);
	  break;
	  
	  case 'debug':
	  message.channel.send({embeds: [debugImg]});
	  break;
	  
	  case 'inspiro':
	  case 'inspirobot':
	  InspiroBot(message);
	  break;
	  
	  default:
	  message.channel.send({embeds: [helpEmbed]});
	  break;
  }
});

client.once('ready', () => {
	console.log('Ready!');
});

client.login(config.BOT_TOKEN);
