----- getURL -----
BEGIN
SET @baseurl = 'https://www.artic.edu/iiif/2/';
SELECT img_id, width INTO @img, @w FROM aic_img WHERE ID = idSel;
IF @w < 843 THEN
RETURN CONCAT(@baseurl, @img, '/full/', @w, ',/0/default.jpg');
ELSE
RETURN CONCAT(@baseurl, @img, '/full/843,/0/default.jpg');
END IF;
END
-----------------

----- vw_aic_embeds -----
SELECT `i`.`id`                            AS `ID`,
       Coalesce(`a`.`id`, 0)               AS `artwork_id`,
       `i`.`discordcolor`                  AS `discordColor`,
       Coalesce(`a`.`place_of_origin`, '') AS `place_of_origin`,
       Coalesce(`a`.`title`, '')           AS `artwork_title`,
       Coalesce(`i`.`title`, '')           AS `img_title`,
       Coalesce(`a`.`date_display`, '')    AS `date_display`,
       Coalesce(`a`.`artist_display`, '')  AS `artist_display`,
       Coalesce(`a`.`medium_display`, '')  AS `medium_display`,
       Coalesce(`a`.`inscriptions`, '')    AS `inscriptions`,
       Coalesce(`a`.`description`, '')     AS `description`
FROM   (`aic_img` `i`
        LEFT JOIN `aic_artwork` `a`
               ON( `i`.`artwork_id` = `a`.`id` )) 
-----------------------

----- GetDiscordEmbed -----
BEGIN
SELECT ID INTO @sel FROM vw_aic_embeds ORDER BY RAND() LIMIT 1;
SELECT getURL(ID) AS img_url, discordColor, artist_display, date_display, medium_display, img_title, artwork_title, place_of_origin, `description`, inscriptions FROM vw_aic_embeds WHERE ID = @sel;
END
---------------------------
