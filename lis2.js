'use strict';
const https = require('https');
const fs = require('fs');
const mariadb = require('mariadb');
const FormData = require('form-data');
const myConsts = require('./myConstants.js');

async function Artwork(target)
{
	var basePath = "/volume1/homes/bobertdos/Google_Drive/WD_lis-media/";
	fs.readdir(basePath, { withFileTypes: true }, (err, files) => {
		try
		{
			myConsts.getSeed(true, 1)
			.then(
				function(randomFloat) {
					const filteredFiles = files
					.filter(dirent => dirent.isFile() && !(dirent.name.endsWith('.ini') || dirent.name.endsWith('.db') || dirent.name.endsWith('.webp')))
					.map(dirent => dirent.name);
					var selectedImg = filteredFiles[Math.floor(randomFloat[0] * filteredFiles.length)];
					var fullPath = basePath + selectedImg;
					if (selectedImg.toLowerCase().includes("blazkowicz") && target == myConsts.PL)
					{
						Shame(fullPath, selectedImg);
						return 0;
					}
					else
					{
						//Perform post to Discord
						var formData = new FormData();
						formData.append('content', 'Random fan art: ' + selectedImg);
						formData.append('file', fs.createReadStream(fullPath), { filename: selectedImg});
						formData.submit(`https://discordapp.com/api/webhooks/${target}`, (err, res) => {
							console.log("[" + new Date().toLocaleString() + "]\r\nSelected Image: " + fullPath + "\r\nResponse code: " + res.statusCode + "\r\nErrors: " + err + "\r\n");
							res.resume();
						});
					}
				},
				function(anError) {
					console.log(anError);
				});
				
			}
			catch(err)
			{
				var errLog = fs.createWriteStream('error.log');
				errLog.write(err.name + ": " + err.message + "\r\n");
			}
	});
}

function Shame(fpath, fname, s)
{
	var imgPath = 'shame/'
	try
	{
		mariadb.createConnection({
			host: myConsts.conn.host, 
			user: myConsts.conn.user, 
			password: myConsts.conn.password,
			port: myConsts.conn.port,
			database: myConsts.conn.database
		}).then(conn => {
			conn.query('SELECT * from shame_demotivation order by rand() limit 1').then(row => {
				var formData = new FormData();
				if (row[0].id == 100)
				{
					formData.append('file[0]', fs.createReadStream(fpath), { filename: fname});
					formData.append('content', `${row[0].quote}\n -- ${row[0].author}`);
					formData.append('file[1]', fs.createReadStream(imgPath + 'jb_death_cert.jpg'), { filename: 'jb_death_cert.jpg'});
					formData.submit(`https://discordapp.com/api/webhooks/${myConsts.PL}`, (err, res) => {
						console.log("[" + new Date().toLocaleString() + "]\r\nShame for " + fname + "!!!\r\nResponse code: " + res.statusCode + "\r\nErrors: " + err + "\r\n");
						res.resume();
						conn.end()
					});
				}
				else if (row[0].author == 'img')
				{
					formData.append('file[0]', fs.createReadStream(fpath), { filename: fname});
					formData.append('file[1]', fs.createReadStream(imgPath + row[0].quote), { filename: row[0].quote});
					formData.submit(`https://discordapp.com/api/webhooks/${myConsts.PL}`, (err, res) => {
						console.log("[" + new Date().toLocaleString() + "]\r\nShame for " + fname + "!!!\r\nResponse code: " + res.statusCode + "\r\nErrors: " + err + "\r\n");
						res.resume();
						conn.end()
					});
				}
				else
				{
					formData.append('file', fs.createReadStream(fpath), { filename: fname});
					formData.append('content',`${row[0].quote}\n -- ${row[0].author}`);
					formData.submit(`https://discordapp.com/api/webhooks/${myConsts.PL}`, (err, res) => {
						console.log("[" + new Date().toLocaleString() + "]\r\nShame for " + fname + "!!!\r\nResponse code: " + res.statusCode + "\r\nErrors: " + err + "\r\n");
						res.resume();
						conn.end()
					});
				}
			});
		});
	}
	catch (err)
	{
		myConsts.logger(err);
	}
}

//Artwork(myConsts.PL);
Artwork(myConsts.WD);
//Shame('/volume1/homes/bobertdos/Google_Drive/WD_lis-media/JohnsonBlazkowicz (53).jpg','JohnsonBlazkowicz (53).jpg');