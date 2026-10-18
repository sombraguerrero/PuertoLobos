BEGIN
SET @ciCommand = LOWER(shopcmd);
set @thisShopper = 'Nikko';
case @ciCommand
	when '+owncat' then UPDATE `shoppoints` SET `points` = `points` + 25 WHERE  Shopper = 'Nikko';
	when '+owncats' then UPDATE `shoppoints` SET `points` = `points` + 25 WHERE  Shopper = 'Nikko';
	when '+othercat' then UPDATE `shoppoints` SET `points` = `points` + 10 WHERE  Shopper = 'Nikko';
	when '+othercats' then UPDATE `shoppoints` SET `points` = `points` + 10 WHERE  Shopper = 'Nikko';
	when '+dog' then UPDATE `shoppoints` SET `points` = `points` + 15 WHERE  Shopper = 'Nikko';
	when '+dogs' then UPDATE `shoppoints` SET `points` = `points` + 15 WHERE  Shopper = 'Nikko';
	when '+goose' then UPDATE `shoppoints` SET `points` = `points` + 15 WHERE  Shopper = 'Nikko';
	when '+geese' then UPDATE `shoppoints` SET `points` = `points` + 15 WHERE  Shopper = 'Nikko';
	when '-meme' then UPDATE `shoppoints` SET `points` = `points` - 25 WHERE  Shopper = 'Nikko';
	when '-memes' then UPDATE `shoppoints` SET `points` = `points` - 25 WHERE  Shopper = 'Nikko';
	when '-desu' then UPDATE `shoppoints` SET `points` = `points` - 25 WHERE  Shopper = 'Nikko';
	when '-cat' then UPDATE `shoppoints` SET `points` = `points` - 20 WHERE  Shopper = 'Nikko';
	when '-cats' then UPDATE `shoppoints` SET `points` = `points` - 20 WHERE  Shopper = 'Nikko';
	when '-joke' then UPDATE `shoppoints` SET `points` = `points` - 10 WHERE  Shopper = 'Nikko';
	when '-jokes' then UPDATE `shoppoints` SET `points` = `points` - 10 WHERE  Shopper = 'Nikko';
	when '-gif' then UPDATE `shoppoints` SET `points` = `points` - 10 WHERE  Shopper = 'Nikko';
	when '-gifs' then UPDATE `shoppoints` SET `points` = `points` - 10 WHERE  Shopper = 'Nikko';
   when '+song' then  set @thisShopper = 'Sheik'; UPDATE `shoppoints` set `points` = `points` + 100 where Shopper = 'Sheik';
   else update `shoppoints` set `points` = `points` + 1 WHERE Shopper = 'Tart';
END CASE;
set currentShopper = @thisShopper;
select `points` into total from `shoppoints` where Shopper = @thisShopper;
end
