const https = require('https');
const fs = require('fs');
const myConsts = require('./patreon_constants.js');
// Import the Secret Manager client and instantiate it:
const {SecretManagerServiceClient} = require('@google-cloud/secret-manager');
const client = new SecretManagerServiceClient();

/***
When using a Google Compute VM, and also assuming the GCloud CLI
environment is set up correctly, the application's service account
will automatically take care of Google API authentication credentials,
but it is still necessary to make sure the VM itself is defined with the
appropriate OAUTH scopes for any Google APIs being used. IAMs can be used
to filter access down as appropriate.
***/
async function getCredentials() {
	return new Promise(async function(myRes, myRej) {
		var secretName = 'client_id';
		var rootPath1 = 'projects/687367382416/secrets/';
		var rootPath2 = '/versions/latest';

		const [cIdRequest] = await client.accessSecretVersion({
			name: rootPath1 + secretName + rootPath2
  		});

		secretName = 'client_secret';
        	const [cSecRequest] = await client.accessSecretVersion({
                	name: rootPath1 + secretName + rootPath2
        	});
		secretName = 'access_token';
        	const [atRequest] = await client.accessSecretVersion({
                	name: rootPath1 + secretName + rootPath2
        	});
		secretName = 'refresh_token';
        	const [refRequest] = await client.accessSecretVersion({
                	name: rootPath1 + secretName + rootPath2
        	});
		secretName = 'webhook_url';
                const [whRequest] = await client.accessSecretVersion({
                        name: rootPath1 + secretName + rootPath2
                });

		const cIdResponse = cIdRequest.payload.data.toString('utf8');
		const cSecResponse = cSecRequest.payload.data.toString('utf8');
		const atResponse = atRequest.payload.data.toString('utf8');
		const refResponse = refRequest.payload.data.toString('utf8');
		const whResponse = whRequest.payload.data.toString('utf8');
		if(cIdResponse != null && cSecResponse != null && atResponse != null && refResponse != null && whResponse != null)
			myRes({client_id: cIdResponse, client_secret: cSecResponse, access_token: atResponse, refresh_token: refResponse, webhook_url: whResponse});
		else
			myRej('Something went wrong with the secret retrieval!');
	});
}

function getPosts(myCreds)
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
					path: `/api/webhooks/${myCreds.webhook_url}`,
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'Content-Length': Buffer.byteLength(embedString)
					}
				}
				const discordReq = https.request(discordOptions);
				discordReq.write(embedString);
				console.log(discordReq);
				discordReq.end();
			}
		});
		res.on('error', (err) => {
			myConsts.logger(err);
		});
	}).end();
}

function Refresh(myCreds)
{
	var myParams = {
		grant_type: 'refresh_token',
		refresh_token: myCreds.refresh_token,
		client_id: myCreds.client_id,
		client_secret: myCreds.client_secret
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
			var myLog = fs.createWriteStream('credentials.json');
                        myLog.write(authData);
		});
		res.on('error', (err) => {
			var myLog = fs.createWriteStream('log.txt');
			myLog.write(err);
		});
	});
	authReq.write(new URLSearchParams(myParams).toString());
	console.log(authReq);
	authReq.end();
}

getCredentials().then(
	function(c) {
		console.log(JSON.stringify(c)); 
		if (process.argv.length == 3 && process.argv[2].toLowerCase() == '--refresh')
		{
			Refresh(c);
		}
		else
		{
			getPosts(c);
		}
	},
	function(err) { var myLog = fs.createWriteStream('log.txt'); myLog.write(err); }
	);

