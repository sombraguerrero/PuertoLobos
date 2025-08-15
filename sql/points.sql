BEGIN
SET @ciCommand = LOWER(shopcmd);
case @ciCommand
	when '+owncats' then UPDATE `shoppoints` SET `points` = `points` + 25 WHERE  Shopper = 'Nikko';
	when '+othercats' then UPDATE `shoppoints` SET `points` = `points` + 10 WHERE  Shopper = 'Nikko';
	when '+dogs' then UPDATE `shoppoints` SET `points` = `points` + 15 WHERE  Shopper = 'Nikko';
	when '+geese' then UPDATE `shoppoints` SET `points` = `points` + 15 WHERE  Shopper = 'Nikko';
	when '-memes' then UPDATE `shoppoints` SET `points` = `points` - 25 WHERE  Shopper = 'Nikko';
	when '-desu' then UPDATE `shoppoints` SET `points` = `points` - 25 WHERE  Shopper = 'Nikko';
	when '-cats' then UPDATE `shoppoints` SET `points` = `points` - 20 WHERE  Shopper = 'Nikko';
	when '-jokes' then UPDATE `shoppoints` SET `points` = `points` - 10 WHERE  Shopper = 'Nikko';
	when '-gifs' then UPDATE `shoppoints` SET `points` = `points` - 10 WHERE  Shopper = 'Nikko';
	ELSE BEGIN END;
  END CASE;
  SELECT `points` INTO total FROM shoppoints WHERE `Shopper` = 'Nikko';
END
