const https = require('https');
const fs = require('fs');
const myConsts = require('./patreon_constants.js');

var myCreds = JSON.parse(fs.readFileSync('patreon_creds.json'));

function getPosts()
{
	const PatreonOptions = {
		hostname: 'patreon.com',
		path: `/api/oauth2/v2/campaigns/${myConsts.campaign}/posts?fields%5Bpost%5D=app_id,app_status,content,embed_data,embed_url,is_paid,is_public,tiers,published_at,title,url`,
		method: 'GET',
		headers: {
			'Authorization': `Bearer ${myCreds.access_token}`
		}
	}

	var patreonData = '';
	https.request(PatreonOptions, (res) => {
		res.on('data', (postData) => { patreonData += postData; });
		res.on('end', () => {
			//myConsts.logger(patreonData);
			var myData = JSON.parse(patreonData);
			var latestPost = myData.data[myData.data.length - 1];
			//myConsts.logger(latestPost.id);
			//myConsts.logger("isNewPost = " + myConsts.isNewPost(latestPost.id));
			if (myConsts.isNewPost(latestPost.id))
			{
				myConsts.logCurrentPost(latestPost.id);
				var myEmbed = new Object();
				myEmbed.title = latestPost.attributes.title;
				myEmbed.description = latestPost.attributes.content.replace("<p>","").replace("</p>","");
				myEmbed.color = myConsts.cerulean; // Discord spec requires hexadecimal codes converted to a literal decimal value (anything random between black and white)  
				myEmbed.url = 'https://www.patreon.com' + latestPost.attributes.url;
				/**
				if (latestPost.attributes.embed_url != null)
				{
					var myImage = new Object();
					myImage.url = latestPost.attributes.embed_url;
					myEmbed.image = myImage;
				}
				**/
				
				var myRoot = new Object();
				myRoot.embeds = new Array();
				myRoot.embeds.push(myEmbed);
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
			}
		});
		res.on('error', (err) => {
			myConsts.logger(err);
		});
	}).end();
}

function Refresh()
{
	var myParams = {
		grant_type: 'refresh_token',
		refresh_token: myCreds.refresh_token,
		client_id: myConsts.myClientID,
		client_secret: myConsts.myClientSecret
	}
	const AuthOptions = {
		hostname: 'patreon.com',
		path: '/api/oauth2/token',
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded'
		}
	}
	
	var authData = '';
	const authReq = https.request(AuthOptions, (res) => {
		res.on('data', (chunk) => { authData += chunk; });
		res.on('end', () => {
			var myLog = fs.createWriteStream('patreon_creds.json');
			myLog.write(authData);
		});
		res.on('error', (err) => {
			myConsts.logger(err);
		});
	});
	authReq.write(new URLSearchParams(myParams).toString());
	authReq.end();
}

if (process.argv.length == 3 && process.argv[2].toLowerCase() == '--refresh')
{
	Refresh();
}
else
{
	getPosts();
}