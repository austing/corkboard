PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE IF NOT EXISTS "__drizzle_migrations" (
				id SERIAL PRIMARY KEY,
				hash text NOT NULL,
				created_at numeric
			);
INSERT INTO __drizzle_migrations VALUES(NULL,'4d70423a575714492b2ba18d3a5f8b15560974797541ac22b9eb651b67de811a',1757328628522);
INSERT INTO __drizzle_migrations VALUES(NULL,'f3970adeb4b8155c9ee5cbd279faf373be277e6e376a63c7f65b2196a90ebd3b',1757330837131);
INSERT INTO __drizzle_migrations VALUES(NULL,'e5cd6acd7021c2f41e8fcda9a64962b8f89af4310d4e56d8fcf8d2558d43e39c',1757511544449);
INSERT INTO __drizzle_migrations VALUES(NULL,'b99a0a501ef75b743300c2e921446008c289a2751c1ab2f52b11c8811588c69d',1759314428555);
CREATE TABLE `accounts` (
	`userId` text NOT NULL,
	`type` text NOT NULL,
	`provider` text NOT NULL,
	`providerAccountId` text NOT NULL,
	`refresh_token` text,
	`access_token` text,
	`expires_at` integer,
	`token_type` text,
	`scope` text,
	`id_token` text,
	`session_state` text,
	PRIMARY KEY(`provider`, `providerAccountId`),
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE TABLE `permissions` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`resource` text NOT NULL,
	`action` text NOT NULL,
	`created_at` integer NOT NULL
);
INSERT INTO permissions VALUES('c90ff9d2-518f-4b60-808f-5a020c030efb','users:create','Create new users','users','create',1757515771541);
INSERT INTO permissions VALUES('5886a84f-561c-443d-a344-1d86a70a08ac','users:read','View users','users','read',1757515771543);
INSERT INTO permissions VALUES('7c13dd8e-43b9-4074-8df0-8b89dd69f58b','users:update','Edit users','users','update',1757515771544);
INSERT INTO permissions VALUES('f3daf8ee-4bdd-4a46-bc58-05b34a2e97db','users:delete','Delete users','users','delete',1757515771545);
INSERT INTO permissions VALUES('e7562c30-e7e4-4a90-9110-cfd2dbe251dc','roles:create','Create new roles','roles','create',1757515771546);
INSERT INTO permissions VALUES('79500bb2-7028-4285-ab52-2e1c303bde2c','roles:read','View roles','roles','read',1757515771547);
INSERT INTO permissions VALUES('065fd016-fe73-4975-bd5d-a4287d3a4ea3','roles:update','Edit roles','roles','update',1757515771547);
INSERT INTO permissions VALUES('4738d667-969b-401b-8734-35d1b1faf64e','roles:delete','Delete roles','roles','delete',1757515771548);
INSERT INTO permissions VALUES('50aaf194-fc61-4609-9ab0-801c923c9219','permissions:read','View permissions','permissions','read',1757515771548);
INSERT INTO permissions VALUES('5c8ee83e-9aab-46cb-b8b9-98b91b66fb07','permissions:assign','Assign permissions to roles','permissions','assign',1757515771549);
INSERT INTO permissions VALUES('2dcb1480-89ca-43eb-9000-ba873d42d471','scraps:create','Create new scraps','scraps','create',1757515771550);
INSERT INTO permissions VALUES('96194cc4-00f8-4a1a-ac11-285d26c7d1c1','scraps:read','View scraps','scraps','read',1757515771550);
INSERT INTO permissions VALUES('3422bbcf-dac5-4af4-898e-bb413ed900bd','scraps:update','Edit scraps','scraps','update',1757515771551);
INSERT INTO permissions VALUES('ee9685de-45fa-457e-9b39-43f04033e434','scraps:delete','Delete scraps','scraps','delete',1757515771551);
INSERT INTO permissions VALUES('8b027489-6d17-4d8f-92df-5e2a802d22d0','scraps:create_for_others','Create scraps for other users','scraps','create_for_others',1757515771552);
INSERT INTO permissions VALUES('3973c4eb-0c2e-4f60-94ba-05a62f0ee64b','scraps:update_others','Edit scraps owned by other users','scraps','update_others',1757515771552);
INSERT INTO permissions VALUES('997c98d4-311c-48b8-9527-c52a439e24f8','scraps:delete_others','Delete scraps owned by other users','scraps','delete_others',1757515771553);
INSERT INTO permissions VALUES('cea1ab5f-f431-4d1d-a0b1-ed5cdd247ece','scraps:view_all','View all scraps regardless of owner','scraps','view_all',1757515771554);
INSERT INTO permissions VALUES('236b2f20-74e4-42d1-af64-2eb5628ed9e9','admin:access','Access admin panel','admin','access',1757515771554);
CREATE TABLE `role_permissions` (
	`role_id` text NOT NULL,
	`permission_id` text NOT NULL,
	`assigned_at` integer NOT NULL,
	PRIMARY KEY(`role_id`, `permission_id`),
	FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON UPDATE no action ON DELETE cascade
);
INSERT INTO role_permissions VALUES('ce13891c-cd18-424f-9157-db94849d1786','c90ff9d2-518f-4b60-808f-5a020c030efb',1757515771555);
INSERT INTO role_permissions VALUES('ce13891c-cd18-424f-9157-db94849d1786','5886a84f-561c-443d-a344-1d86a70a08ac',1757515771556);
INSERT INTO role_permissions VALUES('ce13891c-cd18-424f-9157-db94849d1786','7c13dd8e-43b9-4074-8df0-8b89dd69f58b',1757515771556);
INSERT INTO role_permissions VALUES('ce13891c-cd18-424f-9157-db94849d1786','f3daf8ee-4bdd-4a46-bc58-05b34a2e97db',1757515771556);
INSERT INTO role_permissions VALUES('ce13891c-cd18-424f-9157-db94849d1786','e7562c30-e7e4-4a90-9110-cfd2dbe251dc',1757515771556);
INSERT INTO role_permissions VALUES('ce13891c-cd18-424f-9157-db94849d1786','79500bb2-7028-4285-ab52-2e1c303bde2c',1757515771556);
INSERT INTO role_permissions VALUES('ce13891c-cd18-424f-9157-db94849d1786','065fd016-fe73-4975-bd5d-a4287d3a4ea3',1757515771556);
INSERT INTO role_permissions VALUES('ce13891c-cd18-424f-9157-db94849d1786','4738d667-969b-401b-8734-35d1b1faf64e',1757515771556);
INSERT INTO role_permissions VALUES('ce13891c-cd18-424f-9157-db94849d1786','50aaf194-fc61-4609-9ab0-801c923c9219',1757515771556);
INSERT INTO role_permissions VALUES('ce13891c-cd18-424f-9157-db94849d1786','5c8ee83e-9aab-46cb-b8b9-98b91b66fb07',1757515771556);
INSERT INTO role_permissions VALUES('ce13891c-cd18-424f-9157-db94849d1786','2dcb1480-89ca-43eb-9000-ba873d42d471',1757515771556);
INSERT INTO role_permissions VALUES('ce13891c-cd18-424f-9157-db94849d1786','96194cc4-00f8-4a1a-ac11-285d26c7d1c1',1757515771556);
INSERT INTO role_permissions VALUES('ce13891c-cd18-424f-9157-db94849d1786','3422bbcf-dac5-4af4-898e-bb413ed900bd',1757515771556);
INSERT INTO role_permissions VALUES('ce13891c-cd18-424f-9157-db94849d1786','ee9685de-45fa-457e-9b39-43f04033e434',1757515771556);
INSERT INTO role_permissions VALUES('ce13891c-cd18-424f-9157-db94849d1786','8b027489-6d17-4d8f-92df-5e2a802d22d0',1757515771556);
INSERT INTO role_permissions VALUES('ce13891c-cd18-424f-9157-db94849d1786','3973c4eb-0c2e-4f60-94ba-05a62f0ee64b',1757515771556);
INSERT INTO role_permissions VALUES('ce13891c-cd18-424f-9157-db94849d1786','997c98d4-311c-48b8-9527-c52a439e24f8',1757515771556);
INSERT INTO role_permissions VALUES('ce13891c-cd18-424f-9157-db94849d1786','cea1ab5f-f431-4d1d-a0b1-ed5cdd247ece',1757515771556);
INSERT INTO role_permissions VALUES('ce13891c-cd18-424f-9157-db94849d1786','236b2f20-74e4-42d1-af64-2eb5628ed9e9',1757515771556);
INSERT INTO role_permissions VALUES('6ec1d2a0-454d-4569-bb33-11e52a507ef7','5886a84f-561c-443d-a344-1d86a70a08ac',1757515771556);
INSERT INTO role_permissions VALUES('6ec1d2a0-454d-4569-bb33-11e52a507ef7','7c13dd8e-43b9-4074-8df0-8b89dd69f58b',1757515771556);
INSERT INTO role_permissions VALUES('6ec1d2a0-454d-4569-bb33-11e52a507ef7','236b2f20-74e4-42d1-af64-2eb5628ed9e9',1757515771556);
INSERT INTO role_permissions VALUES('506c56dc-6b07-47f3-aee1-4b8bbd1fead3','5886a84f-561c-443d-a344-1d86a70a08ac',1757515771557);
INSERT INTO role_permissions VALUES('506c56dc-6b07-47f3-aee1-4b8bbd1fead3','79500bb2-7028-4285-ab52-2e1c303bde2c',1757515771557);
INSERT INTO role_permissions VALUES('506c56dc-6b07-47f3-aee1-4b8bbd1fead3','50aaf194-fc61-4609-9ab0-801c923c9219',1757515771557);
INSERT INTO role_permissions VALUES('506c56dc-6b07-47f3-aee1-4b8bbd1fead3','236b2f20-74e4-42d1-af64-2eb5628ed9e9',1757515771557);
INSERT INTO role_permissions VALUES('b0ffd466-71ef-41ec-a930-f89292246ce7','2dcb1480-89ca-43eb-9000-ba873d42d471',1757516753254);
INSERT INTO role_permissions VALUES('b0ffd466-71ef-41ec-a930-f89292246ce7','3422bbcf-dac5-4af4-898e-bb413ed900bd',1757516753254);
INSERT INTO role_permissions VALUES('b0ffd466-71ef-41ec-a930-f89292246ce7','96194cc4-00f8-4a1a-ac11-285d26c7d1c1',1757516753254);
INSERT INTO role_permissions VALUES('b0ffd466-71ef-41ec-a930-f89292246ce7','cea1ab5f-f431-4d1d-a0b1-ed5cdd247ece',1757516753254);
CREATE TABLE `roles` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`created_at` integer NOT NULL
);
INSERT INTO roles VALUES('ce13891c-cd18-424f-9157-db94849d1786','admin','Full system access',1757515771555);
INSERT INTO roles VALUES('6ec1d2a0-454d-4569-bb33-11e52a507ef7','editor','Can create and edit content',1757515771555);
INSERT INTO roles VALUES('506c56dc-6b07-47f3-aee1-4b8bbd1fead3','viewer','Read-only access',1757515771555);
INSERT INTO roles VALUES('b0ffd466-71ef-41ec-a930-f89292246ce7','scrapper','can write and edit scraps of their own and view scraps of others',1757516611498);
CREATE TABLE `sessions` (
	`sessionToken` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`expires` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE TABLE `user_roles` (
	`user_id` text NOT NULL,
	`role_id` text NOT NULL,
	`assigned_at` integer NOT NULL,
	PRIMARY KEY(`user_id`, `role_id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON UPDATE no action ON DELETE cascade
);
INSERT INTO user_roles VALUES('eba77720-87ca-428d-b1e4-23e4b57c9d07','ce13891c-cd18-424f-9157-db94849d1786',1757515772017);
INSERT INTO user_roles VALUES('e86025e5-cc52-4b2e-9333-5902f9d4293a','b0ffd466-71ef-41ec-a930-f89292246ce7',1757516655606);
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text,
	`email` text NOT NULL,
	`emailVerified` integer,
	`image` text,
	`password` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
INSERT INTO users VALUES('eba77720-87ca-428d-b1e4-23e4b57c9d07','Admin User','admin@example.com',NULL,NULL,'$2b$12$rhAT3OvTrsow5iQwvnCfNuyDpWqGYxT/rXuZ5P40rMbbfX/5T2nIq',1757515772016,1757515772016);
INSERT INTO users VALUES('e86025e5-cc52-4b2e-9333-5902f9d4293a','zavvhirondelle','vvhirondelle@gmail.com',NULL,NULL,'$2b$12$pmf6LD4IBxbTRTPo7cRYOu4HLPHr6WLuk0DzTDcbqyY9MMTzZXm0K',1757516198020,1757516789140);
CREATE TABLE `verificationTokens` (
	`identifier` text NOT NULL,
	`token` text NOT NULL,
	`expires` integer NOT NULL,
	PRIMARY KEY(`identifier`, `token`)
);
CREATE TABLE `scraps` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`content` text NOT NULL,
	`x` integer NOT NULL,
	`y` integer NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL, `visible` integer DEFAULT true NOT NULL, `nested_within` text REFERENCES scraps(id),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
INSERT INTO scraps VALUES('2d1111e9-dafa-4dc4-b320-8d4a447118a1','EXQARFD46','<p style="text-align: center;"><strong><span style="color: rgb(235, 107, 86);"><u>1.</u></span></strong></p><ol style="list-style-type: lower-greek;"><li><em>Zwischenmenschliches</em></li><li>not as reciprocity and relation but as distance</li><li>and as a place between where something can be</li><li>and this place as an <em>if</em> <em>then</em>: if <em>words of torah</em> then <em>shekhinah</em> amidst</li><li>amidst, meso, unter</li></ol>',611,1646,'e86025e5-cc52-4b2e-9333-5902f9d4293a',1757516956742,1758102888682,1,NULL);
INSERT INTO scraps VALUES('bfff3d63-3a41-4b24-b90f-297998429754','MT2LGLTOA','<p style="text-align: center;"><strong><span style="color: rgb(243, 121, 52);">2.&nbsp;</span></strong></p><ol style="list-style-type: lower-alpha;"><li>consequences of the <em>z</em><em>wischen</em>.&nbsp;</li><li>Two <em>zwischens</em>: the word between the the <em>shekhinah</em> between</li><li>&quot;If -- then -- ; if not --&quot;</li><li>&quot;disjunctive passion&quot;</li></ol>',613,1862,'e86025e5-cc52-4b2e-9333-5902f9d4293a',1757517160699,1758103012027,1,NULL);
INSERT INTO scraps VALUES('67ea9122-9eea-45ab-988b-7ef3896cba40','B2LU8FDE6','<p style="text-align: center;"><strong><span style="color: rgb(147, 101, 184);"><u>3.</u></span></strong></p><ol style="list-style-type: upper-roman;"><li>two schemas of the foreign<ol><li>outside and horizon and distance<ol><li>(enclosure to give the dimension of the outside: <em>Autre</em><em>&nbsp;chose</em>)</li></ol></li><li>intrusion of an enclosure produces &quot;intruder&quot; as &quot;from-outside&quot;: the foreigner</li></ol></li><li>but also<ol><li>ά&tau;&omicron;&pi;&omicron;&sigmaf;</li></ol></li><li>and also<ol><li>not at home</li></ol></li></ol>',587,2019,'e86025e5-cc52-4b2e-9333-5902f9d4293a',1757517367498,1758103017705,1,NULL);
INSERT INTO scraps VALUES('664e4d3c-9d85-436d-8e80-b41a25bc6b67','713A4URXS','<p style="text-align: center;"><strong><span style="color: rgb(65, 168, 95);"><u>4.</u></span></strong></p><ul><li>Distance other than eschatology, waiting, or the beyond</li><li>You <u>are</u> abroad. The distance isn&#39;t to a beyond. There is distance in your world, in <u>this</u> world and in <u>our</u> practices and between us.</li><li>Pen pals</li><li>Socrates telegrapher</li></ul>',759,2282,'e86025e5-cc52-4b2e-9333-5902f9d4293a',1757517455316,1758103024980,1,NULL);
INSERT INTO scraps VALUES('683dd610-8202-4389-a9a8-1294b06b2f64','GZXOIE5Z9','<p style="text-align: center;"><strong><span style="color: rgb(250, 197, 28);"><u>5.</u></span></strong></p><p style="text-align: center;"><span style="color: rgb(250, 197, 28);"><strong><u>Solidarity</u></strong></span></p>',1042,1920,'e86025e5-cc52-4b2e-9333-5902f9d4293a',1757517622318,1758103040145,1,NULL);
INSERT INTO scraps VALUES('54373bc7-6b04-4c8d-aad0-a3f88a221da7','34CKI0Q49','<p style="text-align: center;"><strong><span style="color: rgb(84, 172, 210);"><u>6. Ontotheosociology</u></span></strong></p><ul><li style="text-align: left;">Feuerbach&#39;s hesitations / ambivalences</li></ul>',1057,2084,'e86025e5-cc52-4b2e-9333-5902f9d4293a',1757517676046,1758103043634,1,NULL);
INSERT INTO scraps VALUES('4ea12658-b8d9-4dbd-b6fc-808dd8dd198a','ICHCPQPGP','<p style="text-align: center;"><strong><u><span style="color: rgb(184, 49, 47);">7. Other Than</span></u></strong></p><p style="text-align: left;"><span style="color: null;">Other than law -- institutions (saint-just), <em>mores</em> (Mommsen)</span></p><p style="text-align: left;"><span style="color: null;">Other than power -- auctoritas, <em>Berathungsrecht</em> (Mommsen), <em>Sittlichkeit</em>, <em>sittliche Substanz*</em> (Hegel)</span></p><p style="text-align: left;"><span style="color: null;">Other than political-economic determinism -- passion? myth? fantasia? (fear?) action? party? asks Gramsci&#39;s Croce, his Sorel, and his Prince</span></p>',1183,2268,'e86025e5-cc52-4b2e-9333-5902f9d4293a',1757517875866,1758102950843,1,NULL);
INSERT INTO scraps VALUES('b65fd118-a390-4ed5-88ff-beb17e76bee9','8VO6X8HS2','<p style="text-align: center;"><strong><span style="color: rgb(61, 142, 185);"><u>8.</u></span></strong></p><ol style="list-style-type: lower-greek;"><li style="text-align: left;">exile</li><li style="text-align: left;">wandering</li><li style="text-align: left;">cosmopolites</li><li style="text-align: left;">resistance -- Christos</li></ol>',1314,1952,'e86025e5-cc52-4b2e-9333-5902f9d4293a',1757517960964,1758103050444,1,NULL);
INSERT INTO scraps VALUES('ab229ab2-bb6a-434c-9f38-17b1d038dd5b','OL2ZLYQXD','<p style="text-align: center;">he said farewell to his father and his son</p><p style="text-align: center;"><u>Ulysses&#39; ocean</u></p>',424,2444,'e86025e5-cc52-4b2e-9333-5902f9d4293a',1757518523845,1758103033786,1,NULL);
INSERT INTO scraps VALUES('003818a1-c35b-433f-9736-9471087217e1','6G25RY3L6','<ul><li>Lefort in <em>Lectures Politiques</em> on La Bo&eacute;tie&#39;s <em>entre-connaissance</em></li><li>La Bo&eacute;tie,&nbsp;<em>Contr&#39;un</em></li></ul>',0,261,'e86025e5-cc52-4b2e-9333-5902f9d4293a',1757925746804,1757925746804,1,NULL);
INSERT INTO scraps VALUES('03a9b1ea-c567-44d3-9c39-c17899a4e9e4','KBOE40QD8','<p>ROUSTANG: [...] et moi je r&eacute;ponds : mais le totalitarisme a l&#39;air de tenir rudement ! Ce truc-l&agrave; tient et tient longtemps. ... ce qu&#39;on m&#39;avait appris quand j&#39;&eacute;tais un enfant, c&#39;&eacute;tait que la v&eacute;rit&eacute; &ccedil;a tenait. [...] Mais ce n&#39;est pas ce qui se passe. Qu&#39;est-ce que &ccedil;a veut dire une imposture ? Quelle v&eacute;rit&eacute; ? C&#39;est absurde !</p><p>LEFORT: [...] Le totalitarisme, vous d&eacute;clarez que c&#39;est seulement un machin qui vous d&eacute;pla&icirc;t. Vous n&#39;aimeriez pas vivre sous ce r&eacute;gime parce que vous ne pourriez pas &ecirc;tre psychanalystes... C&#39;est un peu trop simple ! Vous n&#39;&ecirc;tes pas s&eacute;rieux ! Qu&#39;est-ce qui vous fait sympathiser avec quelqu&#39;un qui se bat contre le totalitarisme ? Pourquoi cela vous importe-t-il que les dissidents refusent la servitude ?</p><p>ROUSTANG: Parce que je ne supporterais pas l&#39;esclavage, moi...</p><p>LEFORT: Alors c&#39;est psychologique !</p><p>ROUSTANG: Ce que vous nous proposez, c&#39;est une nouvelle religion !</p><p><br></p><p>(Source: <em>Psychanalystes&nbsp;</em>n&ordm; 9, octobre 1983, <em>Le mythe de l&#39;Un dans le fantasme et dans la r&eacute;alit&eacute; politique</em>, p. 54)</p>',307,103,'e86025e5-cc52-4b2e-9333-5902f9d4293a',1757926360550,1759511079427,0,NULL);
INSERT INTO scraps VALUES('4de34f2b-2fed-48a2-82e4-44ca769bd6b4','QPMTOPOO2','<p>[...] Il s&#39;agit de mettre en sc&egrave;ne l&#39;invisible et l&#39;indicible, le mythe fondateur d&#39;une soci&eacute;t&eacute;. L&#39;institution comme le b&acirc;timent doit &quot;avoir l&#39;air de se tenir debout&quot; et &quot;l&#39;institutionalit&eacute; pratique un art d&#39;appara&icirc;tre&quot; (LIX, 59). L&#39;institution donne &agrave; croire, mais sans le dire, alors que la religion, elles, l&#39;affirme et l&#39;affiche [...]</p><p>Legendre s&#39;est fix&eacute; un programme &eacute;pist&eacute;mologique: &quot;il faut reconsid&eacute;rer la notion de l&#39;institution&quot; (LII, 31).</p><p><br></p><p>(Source: Pierre Musso, <em>Le concept d&#39;institution, clef de vo&ucirc;te de l&#39;Anthropologie dogmatique de Pierre Legendre</em>, p. 111 in <em>Introductions &agrave; l&#39;&oelig;uvre de Pierre Legendre</em>, &Eacute;ditions Manucius, 2023.&nbsp;</p><p>LIX = <em>Le&ccedil;ons IX. L&#39;Autre Bible de l&#39;Occident. Le monument romano-canonique. &Eacute;tude sur l&#39;architecture dogmatique des soci&eacute;t&eacute;s</em>, Fayard, 2009.&nbsp;</p><p>LII = <em>Le&ccedil;ons II</em>. Le D&eacute;sir politique de Dieu, Fayard, 1988/2005.)</p><p><br></p><p>(Note 2: Nos &eacute;difices institutionnels se succ&egrave;dent, selon des styles changeants, sans d&eacute;voiler le socle. L&rsquo;architecte latin Vitruve l&rsquo;avait not&eacute; : &nbsp;un &eacute;difice doit non seulement tenir debout, mais avoir l&rsquo;air de tenir debout. Une loi qui vaut aussi pour les civilisations. Sur ce terrain de la man&oelig;uvre, l&rsquo;Occident s&rsquo;est construit sur une faille. Ce livre explique pourquoi. P.L.&#39;s back cover to <em>L&#39;Inexplor&eacute;,</em> Conf&eacute;rence &agrave; l&#39;&Eacute;cole nationale des chartes, Ars dogmatica &Eacute;ditions, juin 2020. Online at <a data-fr-linked="true" href="https://youtu.be/8zkdFbCeRLU?si=sdQxeXT4QTql59u4" data-pasted="true">https://youtu.be/8zkdFbCeRLU?si=sdQxeXT4QTql59u4</a>)</p><p><br></p><p>(Note 3: <strong><span style="color: rgb(0, 0, 0);">dogma</span></strong> <strong><span style="color: rgb(209, 72, 65);">dok&eacute;o</span></strong>, <strong><span style="color: rgb(0, 0, 0);">doctrine</span></strong><span style="color: rgb(0, 0, 0);">&nbsp;doctor doceo didici&nbsp;</span><strong><span style="color: rgb(0, 168, 133);">didaskon</span></strong>)</p>',621,611,'e86025e5-cc52-4b2e-9333-5902f9d4293a',1757927703473,1757927703473,1,NULL);
INSERT INTO scraps VALUES('ab4e4111-487a-4fa2-b04e-81421de355b5','WZZZXH3TR','<p style="text-align: center;" data-pasted="true"><span style="color: rgb(65, 168, 95);">Bibliography</span></p><ul><li>Hobbes, Thomas. <em>Leviathan or The Matter, Forme and Power of a Commonwealth Ecclesiasticall and Civil</em> (1651)</li><li>Lebrun, G&eacute;rard. &quot;Hobbes et l&#39;institution de la v&eacute;rit&eacute;&quot; in <em>Manuscrito</em> VI n&ordm; 2, April 1983</li><li>Balibar, &Eacute;tienne. &quot;L&#39;institution de la vérité. Hobbes et Spinoza&quot; in <em>Lieux et noms de la vérité</em> (1994)</li><li>Balibar, &Eacute;tienne. &quot;Gramsci, Marx et le rapport social&quot; (?)</li><li><br></li><li>Lacan, Jacques. Various the <em>lien social&nbsp;</em>(explicitly 1969- as well as &quot;Acte de fondation&quot; (1964), &quot;Proposition de la passe&quot; (1969), <em>Dissolution</em> (1980)</li><li>Mannoni, Maud. <em>De la passion de l&#39;&Ecirc;tre &agrave; la &laquo;Folie&raquo; de savoir</em>. [Perhaps just the d&eacute;dicace: &quot;A la communaut&eacute; des analystes qui a soutenu notre questionnement. 1983-1987&quot;) (1988)</li><li>In Mannoni, Alain Vanier and Patrick Guyomard&#39;s postface, &quot;Les Formations de l&#39;Institution&quot; (1988)</li><li>Favret-Saada&#39;s interview on the role of the ECF as a place for her research.</li><li><br></li><li>Merleau-Ponty, Maurice. <em>L&#39;institution</em> course notes (1954-5)</li><li>Castoriadis, Cornelius. <em>L&#39;Institution imaginaire de la soci&eacute;t&eacute;</em> (1975)</li><li>Lefort, Claude and Marcel Gauchet, &quot;Sur la democratie: Le politique et l&#39;institution du social&quot; in <em>Textures</em>, nos 2-3, 1971</li><li><br></li><li>La Bo&eacute;tie, <em>Contr&#39;un&nbsp;</em>(~1548, published 1576)</li><li data-pasted="true">Lefort, Claude in <em>Lectures Politiques&nbsp;</em>on La Bo&eacute;tie&#39;s &quot;<em>entre-connaissance</em>&quot;</li><li>Montaigne, &quot;De l&#39;amiti&eacute;&quot; (1580?)</li><li>Derrida, Jacques. <em>Politiques de l&#39;amiti&eacute;</em>(1994)<ul><li>Fraternity</li><li>Enemy</li><li>Future: cf. Gramsci/Sorel</li></ul></li><li>Lefort and Roustang&#39;s dialogue in <em>Le mythe de l&#39;Un dans le fantasme et dans la r&eacute;alit&eacute; politique</em>, <em data-pasted="true">Psychanalystes&nbsp;</em>n&ordm; 9, octobre 1983</li><li><br></li><li data-pasted="true">Machiavelli, <em>The Prince&nbsp;</em>(1513) and <em>Discourses on the First Decade of Titus-Livius&nbsp;</em>(1517)</li><li>Althusser, Louis. &quot;Solitude de Machiavel&quot; (1977)</li><li>Saint-Just. &quot;Fragments d&#39;institutions r&eacute;publicaines&quot; (1794)</li><li data-pasted="true">Abensour, Miguel. <em>Le c&oelig;ur de Brutus</em> (2019)</li><li>Abensour, Miguel. <em>Rire des lois, du magistrat et des dieux: l&#39;impulsion Saint-Just</em> (2005)</li><li>Vermeren, Patrice. &quot;Saint-Just contre Saint-Just ? Miguel Abensour, la R&eacute;volution comme &eacute;nigme et le paradoxe de son h&eacute;ros&quot; (2017)</li><li>Hegel, Georg Wilhelm Friedrich. <em>Grundlinien der Philosophie des Rechts</em>, lectures and <em>Encyclopedia.</em> (1817-1830)</li><li>Michelet, Jules and Roland Barthes. <em>Michelet sur lui-m&ecirc;me&nbsp;</em>(1953)</li><li data-pasted="true">Marx, &quot;The 18th Brumaire of of Louis Bonaparte&quot; (1852)</li><li>Marx, &quot;On the Jewish Question&quot; (1844)</li><li>Durkheim, &Eacute;mile. <em>Formes &eacute;lementaires de la vie religieuse: le syst&egrave;me tot&eacute;mique en Australie</em>. (1912)</li><li data-pasted="true">Sorel, &quot;Les th&eacute;ories de M. Durkheim&quot; (in <em>Le Devenir Social&nbsp;</em>1895)</li><li>Sorel, review of Gustave Le Bon&#39;s <em>Psychologie des foules</em> (<em>Le Devenir Social</em>, 1895)</li><li>Gramsci, prison notebook n&ordm; 13, <em>The Modern Prince&nbsp;</em>(~1929-1935)</li><li>Edward Said, <em>Imperialism and Culture</em> (1993)</li><li><br></li><li>Mommsen, Theodor. <em>History of Rome</em>, v. 1, &quot;Die urspr&uuml;ngliche Verfassung Roms&quot; and &quot;Recht und Gericht&quot; on father&#39;s power (&quot;hausherrlicher Gewalt&quot;) on the one hand and custom on the other. [&quot;<em>und durch die Familiensitte ward es durchgesetzt, da&szlig; bei der Aus&uuml;bung der h&auml;uslichen Gerichtsbarkeit der Vater und mehr noch der Ehemann den Spruch &uuml;ber Kind und Frau nicht f&auml;llte, ohne vorher die n&auml;chsten Blutsverwandten, sowohl die seinigen wie die der Frau, zugezogen zu haben. Aber eine rechtliche Minderung der Gewalt lag in der letzteren Einrichtung nicht; denn die bei dem Hausgericht zugezogenen Blutsverwandten hatten nicht zu richten, sondern nur den richtenden Hausvater zu beraten. Es ist die hausherrliche Macht aber nicht blo&szlig; wesentlich unbeschr&auml;nkt und keinem auf der Erde verantwortlich, sondern auch, so lange der Hausherr lebt, unab&auml;nderlich und unzerst&ouml;rlich.</em>&quot;]</li><li>Arendt, &quot;What is Authority?&quot; (1954)</li><li>Arendt <span style="color: rgb(209, 72, 65);">&lt;&gt;</span></li><li>Koselleck <span style="color: rgb(209, 72, 65);">&lt;&gt;&nbsp;</span></li><li><br></li><li>L&eacute;vinas, Emmanuel. <em>Totalit&eacute; et Infini. Essai sur l&#39;ext&eacute;riorit&eacute;</em> (1961)</li><li><br></li><li>Pirkei Avoth &lt;word of torah amidst, presence amidst; no word amidst: disjunctive&gt;</li><li>Hegel on <em>Kultus</em> and the <em>meso&nbsp;</em>of Matthew 18:20</li><li><br></li><li>Schmitt, Carl. <em>Begriff des Politischen</em> (1932)</li><li><br></li><li>Dante. <em>De vulgari eloquentia&nbsp;</em>(~1302-1305)</li><li>Dante. <em>De monarchia&nbsp;</em>(~1312-1313)</li><li>Glissant, <em>Trait&eacute; du Tout-Monde</em> (1997)</li><li>Stuart Hall <span style="color: rgb(226, 80, 65);">&lt;creolization&gt;</span></li><li><br></li><li>D&eacute;tienne, Marcel. <em>Comment &ecirc;tre autochtone. Du pur Ath&eacute;nien au Fran&ccedil;ais racin&eacute;</em> (2003)</li><li>D&eacute;tienne, Marcel. <em>Comparer l&#39;incomparable</em> (2000)</li></ul>',1706,231,'e86025e5-cc52-4b2e-9333-5902f9d4293a',1757937021626,1758119887702,1,NULL);
INSERT INTO scraps VALUES('52f33560-4cfd-459a-8167-76e14d32e230','CQQVU1JCX','<p>Institution</p><p>- temporality thereof</p><p>Sorel&#39;s strike - temporality thereof</p><p>Temporality <u>of the social bonds</u> thus produced</p><p>Time and differentiation, temporality of identity and temporality of differentiation</p><p>(Division of labor)</p><p>Habit, skill, differentiation</p><p>Habit and time</p><p>Virtue, habit and time</p><p>Generational time</p><p>Intergenerational time</p>',1030,958,'e86025e5-cc52-4b2e-9333-5902f9d4293a',1757940810879,1758102987423,1,NULL);
INSERT INTO scraps VALUES('234ba83a-22ba-4317-8b38-8d9e6e8389ef','YK7FSMK9W','<p>Blink blink!</p>',520,394,'e86025e5-cc52-4b2e-9333-5902f9d4293a',1759510563180,1759510563180,1,'2d1111e9-dafa-4dc4-b320-8d4a447118a1');
INSERT INTO scraps VALUES('b1e99457-d67b-408e-9a39-1154fa5f430d','CLRT7OTWF','<p>L&#39;entretien - cf. Zwischenmenschliches, Interval</p><p><br></p><p data-pasted="true">La d&eacute;finition, je veux dire la description la plus simple de la conversation</p><p>la plus simple pourrait &ecirc;tre la suivante : quand deux hommes parlent</p><p>ensemble, ils ne parlent pas ensemble, mais tour &agrave; tour ; l&rsquo;un dit quelque</p><p>chose, puis s&rsquo;arr&ecirc;te, l&rsquo;autre autre chose (ou la m&ecirc;me chose), puis s&rsquo;arr&ecirc;te. Le</p><p>discours coh&eacute;rent qu&rsquo;ils portent est compos&eacute; de s&eacute;quences qui, lorsqu&rsquo;elles</p><p>changent de partenaire, s&rsquo;interrompent, m&ecirc;me si elles s&rsquo;ajustent pour se</p><p>correspondre. Le fait que la parole a besoin de passer de l&rsquo;un &agrave; l&rsquo;autre, soit</p><p>pour se confirmer, soit pour se contredire ou se d&eacute;velopper, montre la</p><p>n&eacute;cessit&eacute; de l&rsquo;intervalle. Le pouvoir de parler s&rsquo;interrompt, et cette</p><p>interruption joue un r&ocirc;le qui semble subalterne, celui, pr&eacute;cis&eacute;ment, d&rsquo;une</p><p>alternance subordonn&eacute;e ; r&ocirc;le cependant si &eacute;nigmatique qu&rsquo;il peut</p><p>s&rsquo;interpr&eacute;ter comme portant l&rsquo;&eacute;nigme m&ecirc;me du langage : pause entre les</p><p>phrases, pause d&rsquo;un interlocuteur &agrave; l&rsquo;autre et pause attentive, celle de</p><p>l&rsquo;entente qui double la puissance de locution.</p><p>Je me demande si l&rsquo;on a suffisamment r&eacute;fl&eacute;chi sur les diverses</p><p>significations de cette pause, laquelle cependant permet seule de constituer la</p><p>parole comme entretien et m&ecirc;me comme parole. Quelqu&rsquo;un qui parle sans</p><p>arr&ecirc;t, on finit par l&rsquo;enfermer. (Rappelons-nous les terribles monologues de</p><p>Hitler, et tout chef d&rsquo;&Eacute;tat, s&rsquo;il jouit d&rsquo;&ecirc;tre seul &agrave; parler et, jouissant de sa</p><p>haute parole solitaire, l&rsquo;impose aux autres, sans g&ecirc;ne, comme une parole</p><p>sup&eacute;rieure et supr&ecirc;me, participe &agrave; la m&ecirc;me violence du dictare, la r&eacute;p&eacute;tition</p><p>du monologue imp&eacute;rieux.)</p><p>(Blanchot, L&#39;entretien infini)</p>',880,2617,'e86025e5-cc52-4b2e-9333-5902f9d4293a',1759516192630,1759516192630,1,NULL);
CREATE UNIQUE INDEX `permissions_name_unique` ON `permissions` (`name`);
CREATE UNIQUE INDEX `roles_name_unique` ON `roles` (`name`);
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);
CREATE UNIQUE INDEX `scraps_code_unique` ON `scraps` (`code`);
COMMIT;
