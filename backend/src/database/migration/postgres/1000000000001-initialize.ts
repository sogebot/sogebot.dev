import { MigrationInterface, QueryRunner } from 'typeorm';

export class initialize1000000000001 implements MigrationInterface {
  transaction?: boolean | undefined;
  name = 'initialize1000000000001';

  public async up(queryRunner: QueryRunner): Promise<any> {
    const migrations = await queryRunner.query(`SELECT * FROM "migrations"`);
    if (migrations.length > 0) {
      console.log('Skipping migration zero, migrations are already in bot');
      return;
    }
    await queryRunner.query(`CREATE TABLE "alert" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "updatedAt" character varying(30), "name" character varying NOT NULL, "alertDelayInMs" integer NOT NULL, "profanityFilterType" character varying NOT NULL, "loadStandardProfanityList" json NOT NULL, "parry" json NOT NULL, "tts" json, "fontMessage" json NOT NULL, "font" json NOT NULL, "customProfanityList" character varying NOT NULL, "items" json NOT NULL, CONSTRAINT "PK_ad91cad659a3536465d564a4b2f" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE TABLE "alias" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "alias" character varying NOT NULL, "command" text NOT NULL, "enabled" boolean NOT NULL, "visible" boolean NOT NULL, "permission" character varying, "group" character varying, CONSTRAINT "PK_b1848d04b41d10a5712fc2e673c" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE INDEX "IDX_6a8a594f0a5546f8082b0c405c" ON "alias" ("alias") `);
    await queryRunner.query(`CREATE TABLE "alias_group" ("name" character varying NOT NULL, "options" text NOT NULL, CONSTRAINT "PK_2d40a2a41c8eb8d436b6ce1387c" PRIMARY KEY ("name"))`);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_alias_group_unique_name" ON "alias_group" ("name") `);
    await queryRunner.query(`CREATE TABLE "bets" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" character varying(30) NOT NULL, "endedAt" character varying(30) NOT NULL, "isLocked" boolean NOT NULL DEFAULT false, "arePointsGiven" boolean NOT NULL DEFAULT false, "options" text NOT NULL, "title" character varying NOT NULL, "participants" json NOT NULL, CONSTRAINT "PK_7ca91a6a39623bd5c21722bcedd" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE TABLE "commands" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "command" character varying NOT NULL, "enabled" boolean NOT NULL, "visible" boolean NOT NULL, "group" character varying, "areResponsesRandomized" boolean NOT NULL DEFAULT false, "responses" json NOT NULL, CONSTRAINT "PK_7ac292c3aa19300482b2b190d1e" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE INDEX "IDX_1a8c40f0a581447776c325cb4f" ON "commands" ("command") `);
    await queryRunner.query(`CREATE TABLE "commands_group" ("name" character varying NOT NULL, "options" text NOT NULL, CONSTRAINT "PK_34de021816f3e460bf084d25aba" PRIMARY KEY ("name"))`);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_commands_group_unique_name" ON "commands_group" ("name") `);
    await queryRunner.query(`CREATE TABLE "commands_count" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "command" character varying NOT NULL, "timestamp" character varying(30) NOT NULL, CONSTRAINT "PK_80e221b846abb1a84ab81281a7a" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE INDEX "IDX_2ccf816b1dd74e9a02845c4818" ON "commands_count" ("command") `);
    await queryRunner.query(`CREATE TABLE "cooldown" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "miliseconds" integer NOT NULL, "type" character varying(10) NOT NULL, "timestamp" character varying(30) NOT NULL, "isEnabled" boolean NOT NULL, "isErrorMsgQuiet" boolean NOT NULL, "isOwnerAffected" boolean NOT NULL, "isModeratorAffected" boolean NOT NULL, "isSubscriberAffected" boolean NOT NULL, CONSTRAINT "PK_0f01954311dda5b3d353603c7c5" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_aa85aa267ec6eaddf7f93e3665" ON "cooldown" ("name") `);
    await queryRunner.query(`CREATE TABLE "highlight" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "videoId" character varying NOT NULL, "game" character varying NOT NULL, "title" character varying NOT NULL, "expired" boolean NOT NULL DEFAULT false, "timestamp" json NOT NULL, "createdAt" character varying(30) NOT NULL, CONSTRAINT "PK_0f4191998a1e1e8f8455f1d4adb" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE TABLE "how_long_to_beat_game" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "game" character varying NOT NULL, "startedAt" character varying(30) NOT NULL, "updatedAt" character varying(30) NOT NULL, "gameplayMain" double precision NOT NULL DEFAULT '0', "gameplayMainExtra" double precision NOT NULL DEFAULT '0', "gameplayCompletionist" double precision NOT NULL DEFAULT '0', "offset" bigint NOT NULL DEFAULT '0', "streams" json NOT NULL, CONSTRAINT "PK_c6fbf5fc15e97e46c2659dccea1" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_301758e0e3108fc902d5436527" ON "how_long_to_beat_game" ("game") `);
    await queryRunner.query(`CREATE TABLE "keyword" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "keyword" character varying NOT NULL, "enabled" boolean NOT NULL, "group" character varying, CONSTRAINT "PK_affdb8c8fa5b442900cb3aa21dc" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE INDEX "IDX_35e3ff88225eef1d85c951e229" ON "keyword" ("keyword") `);
    await queryRunner.query(`CREATE TABLE "keyword_responses" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "order" integer NOT NULL, "response" text NOT NULL, "stopIfExecuted" boolean NOT NULL, "permission" character varying, "filter" character varying NOT NULL, "keywordId" uuid, CONSTRAINT "PK_3049091cd170cc88ad38bcca63f" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE TABLE "keyword_group" ("name" character varying NOT NULL, "options" text NOT NULL, CONSTRAINT "PK_25e81b041cf1f67ea9ce294fd91" PRIMARY KEY ("name"))`);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_keyword_group_unique_name" ON "keyword_group" ("name") `);
    await queryRunner.query(`CREATE TABLE "obswebsocket" ("id" character varying(14) NOT NULL, "name" character varying NOT NULL, "code" text NOT NULL, CONSTRAINT "PK_e02d10a34d5a7da25a92d4572de" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE TABLE "overlay" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "canvas" json NOT NULL, "items" json NOT NULL, CONSTRAINT "PK_2abda96f999ea44fd200bfef741" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE TABLE "permissions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "order" integer NOT NULL, "isCorePermission" boolean NOT NULL, "isWaterfallAllowed" boolean NOT NULL, "automation" character varying(12) NOT NULL, "userIds" text NOT NULL, "excludeUserIds" text NOT NULL, "filters" json NOT NULL, CONSTRAINT "PK_920331560282b8bd21bb02290df" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE TABLE "permission_commands" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "permission" character varying(36), CONSTRAINT "PK_bfbb3cdf4fc0add3e790ba7ce59" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE INDEX "IDX_ba6483f5c5882fa15299f22c0a" ON "permission_commands" ("name") `);
    await queryRunner.query(`CREATE TABLE "settings" ("id" SERIAL NOT NULL, "namespace" character varying NOT NULL, "name" character varying NOT NULL, "value" text NOT NULL, CONSTRAINT "PK_0669fe20e252eb692bf4d344975" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_d8a83b9ffce680092c8dfee37d" ON "settings" ("namespace", "name") `);
    await queryRunner.query(`CREATE TABLE "plugin" ("id" character varying NOT NULL, "name" character varying NOT NULL, "enabled" boolean NOT NULL, "workflow" text NOT NULL, "settings" text, CONSTRAINT "PK_9a65387180b2e67287345684c03" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE TABLE "plugin_variable" ("variableName" character varying NOT NULL, "pluginId" character varying NOT NULL, "value" text NOT NULL, CONSTRAINT "PK_8c7cf84aebae071dcbdb47381d6" PRIMARY KEY ("variableName", "pluginId"))`);
    await queryRunner.query(`CREATE TABLE "poll" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" character varying(7) NOT NULL, "title" character varying NOT NULL, "openedAt" character varying(30) NOT NULL, "closedAt" character varying(30), "options" text NOT NULL, "votes" json NOT NULL, CONSTRAINT "PK_03b5cf19a7f562b231c3458527e" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE TABLE "price" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "command" character varying NOT NULL, "enabled" boolean NOT NULL DEFAULT true, "emitRedeemEvent" boolean NOT NULL DEFAULT false, "price" integer NOT NULL, "priceBits" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_d163e55e8cce6908b2e0f27cea4" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_d12db23d28020784096bcb41a3" ON "price" ("command") `);
    await queryRunner.query(`CREATE TABLE "quotes" ("id" SERIAL NOT NULL, "tags" text NOT NULL, "quote" character varying NOT NULL, "quotedBy" character varying NOT NULL, "createdAt" character varying(30) NOT NULL DEFAULT '1970-01-01T00:00:00.000Z', CONSTRAINT "PK_99a0e8bcbcd8719d3a41f23c263" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE TABLE "randomizer" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "items" json NOT NULL, "createdAt" character varying(30) NOT NULL, "command" character varying NOT NULL, "permissionId" character varying NOT NULL, "name" character varying NOT NULL, "isShown" boolean NOT NULL DEFAULT false, "shouldPlayTick" boolean NOT NULL, "tickVolume" integer NOT NULL, "widgetOrder" integer NOT NULL, "type" character varying(20) NOT NULL DEFAULT 'simple', "position" json NOT NULL, "customizationFont" json NOT NULL, "tts" json NOT NULL, CONSTRAINT "PK_027539f48a550dda46773420ad7" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE UNIQUE INDEX "idx_randomizer_cmdunique" ON "randomizer" ("command") `);
    await queryRunner.query(`CREATE TABLE "rank" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "value" integer NOT NULL, "rank" character varying NOT NULL, "type" character varying NOT NULL, CONSTRAINT "PK_a5dfd2e605e5e4fb8578caec083" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_93c78c94804a13befdace81904" ON "rank" ("type", "value") `);
    await queryRunner.query(`CREATE TABLE "song_ban" ("videoId" character varying NOT NULL, "title" character varying NOT NULL, CONSTRAINT "PK_387b2109574f60ff7797b9206e7" PRIMARY KEY ("videoId"))`);
    await queryRunner.query(`CREATE TABLE "song_playlist" ("videoId" character varying NOT NULL, "lastPlayedAt" character varying(30) NOT NULL DEFAULT '1970-01-01T00:00:00.000Z', "title" character varying NOT NULL, "seed" double precision NOT NULL, "loudness" double precision NOT NULL, "tags" text NOT NULL, "length" integer NOT NULL, "volume" integer NOT NULL, "startTime" integer NOT NULL, "endTime" integer NOT NULL, "forceVolume" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_47041c19b2a8a264b51a592c9d0" PRIMARY KEY ("videoId"))`);
    await queryRunner.query(`CREATE TABLE "song_request" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "videoId" character varying NOT NULL, "addedAt" character varying(30) NOT NULL, "title" character varying NOT NULL, "loudness" double precision NOT NULL, "length" integer NOT NULL, "username" character varying NOT NULL, CONSTRAINT "PK_c2b53ff7f5fc5bf370a3f32ebf8" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE TABLE "spotify_song_ban" ("spotifyUri" character varying NOT NULL, "title" character varying NOT NULL, "artists" text NOT NULL, CONSTRAINT "PK_f9ba62ed678a1e426db17acc387" PRIMARY KEY ("spotifyUri"))`);
    await queryRunner.query(`CREATE TABLE "timer" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "isEnabled" boolean NOT NULL, "tickOffline" boolean NOT NULL DEFAULT false, "triggerEveryMessage" integer NOT NULL, "triggerEverySecond" integer NOT NULL, "triggeredAtTimestamp" character varying(30) NOT NULL DEFAULT '1970-01-01T00:00:00.000Z', "triggeredAtMessages" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_b476163e854c74bff55b29d320a" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE TABLE "timer_response" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "timestamp" character varying(30) NOT NULL DEFAULT '1970-01-01T00:00:00.000Z', "isEnabled" boolean NOT NULL DEFAULT true, "response" text NOT NULL, "timerId" uuid, CONSTRAINT "PK_785cbaf79acecb2971252bf609e" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE TABLE "variable_watch" ("id" SERIAL NOT NULL, "variableId" character varying NOT NULL, "order" integer NOT NULL, CONSTRAINT "PK_fa090e3c43468f9b1793439cb5e" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE TABLE "variable" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "history" json NOT NULL, "urls" json NOT NULL, "variableName" character varying NOT NULL, "description" character varying NOT NULL DEFAULT '', "type" character varying NOT NULL, "currentValue" character varying, "evalValue" text NOT NULL, "runEvery" integer NOT NULL DEFAULT '60000', "responseType" integer NOT NULL, "responseText" character varying NOT NULL DEFAULT '', "permission" character varying NOT NULL, "readOnly" boolean NOT NULL DEFAULT false, "usableOptions" text NOT NULL, "runAt" character varying(30) NOT NULL, CONSTRAINT "UQ_dd084634ad76dbefdca837b8de4" UNIQUE ("variableName"), CONSTRAINT "PK_f4e200785984484787e6b47e6fb" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE TABLE "cache_games" ("id" integer NOT NULL, "name" character varying NOT NULL, "thumbnail" character varying, CONSTRAINT "PK_83498942a78ff5d6309d91cf13e" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE INDEX "IDX_f37be3c66dbd449a8cb4fe7d59" ON "cache_games" ("name") `);
    await queryRunner.query(`CREATE TABLE "cache_titles" ("id" SERIAL NOT NULL, "game" character varying NOT NULL, "title" character varying NOT NULL, "tags" text NOT NULL, "timestamp" bigint NOT NULL, CONSTRAINT "PK_a2a0f1db2d0b215a771c14538a2" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE INDEX "IDX_a0c6ce833b5b3b13325e6f49b0" ON "cache_titles" ("game") `);
    await queryRunner.query(`CREATE TABLE "carousel" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "order" integer NOT NULL, "type" character varying NOT NULL, "waitAfter" integer NOT NULL, "waitBefore" integer NOT NULL, "duration" integer NOT NULL, "animationIn" character varying NOT NULL, "animationInDuration" integer NOT NULL, "animationOut" character varying NOT NULL, "animationOutDuration" integer NOT NULL, "showOnlyOncePerStream" boolean NOT NULL, "base64" text NOT NULL, CONSTRAINT "PK_d59e0674c5a5efe523df247f67b" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE TABLE "checklist" ("id" character varying NOT NULL, "isCompleted" boolean NOT NULL, CONSTRAINT "PK_e4b437f5107f2a9d5b744d4eb4c" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE TABLE "quickaction" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" character varying NOT NULL, "order" integer NOT NULL, "type" character varying NOT NULL, "options" text NOT NULL, CONSTRAINT "PK_b77fe99fe6a95cf4119e6756ca5" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE TABLE "discord_link" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tag" character varying NOT NULL, "discordId" character varying NOT NULL, "createdAt" bigint NOT NULL, "userId" character varying, CONSTRAINT "PK_51c82ec49736e25315b01dad663" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE TABLE "duel" ("id" character varying NOT NULL, "username" character varying NOT NULL, "tickets" integer NOT NULL, CONSTRAINT "PK_1575a4255b3bdf1f11398841d0d" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE TABLE "event" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "isEnabled" boolean NOT NULL, "triggered" text NOT NULL, "definitions" text NOT NULL, "filter" character varying NOT NULL, CONSTRAINT "PK_30c2f3bbaf6d34a55f8ae6e4614" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE INDEX "IDX_b535fbe8ec6d832dde22065ebd" ON "event" ("name") `);
    await queryRunner.query(`CREATE TABLE "event_operation" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "definitions" text NOT NULL, "eventId" uuid, CONSTRAINT "PK_ac1058d607aa18a9af827c36247" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE INDEX "IDX_daf6b97e1e5a5c779055fbb22d" ON "event_operation" ("name") `);
    await queryRunner.query(`CREATE TABLE "event_list" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "event" character varying NOT NULL, "userId" character varying NOT NULL, "timestamp" bigint NOT NULL, "isTest" boolean NOT NULL, "isHidden" boolean NOT NULL DEFAULT false, "values_json" text NOT NULL, CONSTRAINT "PK_1cc2e9353e9ae8acf95d976cf6f" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE INDEX "IDX_8a80a3cf6b2d815920a390968a" ON "event_list" ("userId") `);
    await queryRunner.query(`CREATE TABLE "gallery" ("id" character varying NOT NULL, "type" character varying NOT NULL, "data" text NOT NULL, "name" character varying NOT NULL, "folder" character varying NOT NULL DEFAULT '/', CONSTRAINT "PK_65d7a1ef91ddafb3e7071b188a0" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE TABLE "goal_group" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" character varying NOT NULL, "name" character varying NOT NULL, "display" text NOT NULL, CONSTRAINT "PK_22b802b42def291fab90fdcda14" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE TABLE "goal" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "groupId" uuid, "type" character varying(20) NOT NULL, "countBitsAsTips" boolean NOT NULL, "display" character varying(20) NOT NULL, "timestamp" character varying, "interval" character varying NOT NULL DEFAULT 'hour', "tiltifyCampaign" integer, "goalAmount" double precision NOT NULL DEFAULT '0', "currentAmount" double precision NOT NULL DEFAULT '0', "endAfter" character varying NOT NULL, "endAfterIgnore" boolean NOT NULL, "customizationBar" text NOT NULL, "customizationFont" text NOT NULL, "customizationHtml" text NOT NULL, "customizationJs" text NOT NULL, "customizationCss" text NOT NULL, CONSTRAINT "PK_88c8e2b461b711336c836b1e130" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE INDEX "IDX_a1a6bd23cb8ef7ddf921f54c0b" ON "goal" ("groupId") `);
    await queryRunner.query(`CREATE TABLE "google_private_keys" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "clientEmail" character varying NOT NULL, "privateKey" text NOT NULL, "createdAt" character varying NOT NULL, CONSTRAINT "PK_dd2e74a8b7a602b6b4a1f1e1816" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE TABLE "heist_user" ("userId" character varying NOT NULL, "username" character varying NOT NULL, "points" bigint NOT NULL, CONSTRAINT "PK_0a41172961540da3de15a9d223d" PRIMARY KEY ("userId"))`);
    await queryRunner.query(`CREATE TABLE "moderation_warning" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" character varying NOT NULL, "timestamp" bigint NOT NULL DEFAULT '0', CONSTRAINT "PK_0e90c9d7ff04a18218299cfc0e9" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE INDEX "IDX_f941603aef2741795a9108d0d2" ON "moderation_warning" ("userId") `);
    await queryRunner.query(`CREATE TABLE "moderation_permit" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" character varying NOT NULL, CONSTRAINT "PK_ba3b81de5de7feff025898b4a63" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE INDEX "IDX_69499e78c9ee1602baee77b97d" ON "moderation_permit" ("userId") `);
    await queryRunner.query(`CREATE TABLE "points_changelog" ("id" SERIAL NOT NULL, "userId" character varying NOT NULL, "originalValue" integer NOT NULL, "updatedValue" integer NOT NULL, "updatedAt" bigint NOT NULL, "command" character varying NOT NULL, CONSTRAINT "PK_0c0431424ad9af4002e606a5337" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE INDEX "IDX_points_changelog_userId" ON "points_changelog" ("userId") `);
    await queryRunner.query(`CREATE TABLE "queue" ("id" SERIAL NOT NULL, "createdAt" bigint NOT NULL, "username" character varying NOT NULL, "isModerator" boolean NOT NULL, "isSubscriber" boolean NOT NULL, "message" character varying, CONSTRAINT "PK_4adefbd9c73b3f9a49985a5529f" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_7401b4e0c30f5de6621b38f7a0" ON "queue" ("username") `);
    await queryRunner.query(`CREATE TABLE "raffle" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "winner" text, "timestamp" bigint NOT NULL DEFAULT '0', "keyword" character varying NOT NULL, "minTickets" bigint NOT NULL DEFAULT '0', "maxTickets" bigint NOT NULL DEFAULT '0', "type" integer NOT NULL, "forSubscribers" boolean NOT NULL, "isClosed" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_f9dee47f552e25482a1f65c282e" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE INDEX "IDX_e83facaeb8fbe8b8ce9577209a" ON "raffle" ("keyword") `);
    await queryRunner.query(`CREATE INDEX "IDX_raffleIsClosed" ON "raffle" ("isClosed") `);
    await queryRunner.query(`CREATE TABLE "raffle_participant" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "username" character varying NOT NULL, "tickets" integer NOT NULL, "isEligible" boolean NOT NULL, "isSubscriber" boolean NOT NULL, "raffleId" uuid, CONSTRAINT "PK_5d6f2b4fadbd927710cc2dd1e9f" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE TABLE "raffle_participant_message" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "timestamp" bigint NOT NULL DEFAULT '0', "text" text NOT NULL, "participantId" uuid, CONSTRAINT "PK_0355c24ac848612dc4232be2c0a" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE TABLE "scrim_match_id" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "username" character varying NOT NULL, "matchId" character varying NOT NULL, CONSTRAINT "PK_1cfb598145201e3f643598cbffe" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_5af6da125c1745151e0dfaf087" ON "scrim_match_id" ("username") `);
    await queryRunner.query(`CREATE TABLE "text" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "text" text NOT NULL, "css" text NOT NULL, "js" text NOT NULL, "external" text NOT NULL, CONSTRAINT "PK_ef734161ea7c326fedf699309f9" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE TABLE "translation" ("name" character varying NOT NULL, "value" character varying NOT NULL, CONSTRAINT "PK_a672a9127c15aa989a43e25074b" PRIMARY KEY ("name"))`);
    await queryRunner.query(`CREATE TABLE "twitch_stats" ("whenOnline" bigint NOT NULL, "currentViewers" integer NOT NULL DEFAULT '0', "currentSubscribers" integer NOT NULL DEFAULT '0', "chatMessages" bigint NOT NULL, "currentFollowers" integer NOT NULL DEFAULT '0', "maxViewers" integer NOT NULL DEFAULT '0', "newChatters" integer NOT NULL DEFAULT '0', "currentBits" bigint NOT NULL, "currentTips" double precision NOT NULL, "currentWatched" bigint NOT NULL, CONSTRAINT "PK_78b460c61f065e858da863e8102" PRIMARY KEY ("whenOnline"))`);
    await queryRunner.query(`CREATE TABLE "twitch_clips" ("clipId" character varying NOT NULL, "isChecked" boolean NOT NULL, "shouldBeCheckedAt" bigint NOT NULL, CONSTRAINT "PK_5692cf462da9f11803b3cf8f3dc" PRIMARY KEY ("clipId"))`);
    await queryRunner.query(`CREATE TABLE "user" ("userId" character varying NOT NULL, "userName" character varying NOT NULL, "displayname" character varying NOT NULL DEFAULT '', "profileImageUrl" character varying NOT NULL DEFAULT '', "isOnline" boolean NOT NULL DEFAULT false, "isVIP" boolean NOT NULL DEFAULT false, "isModerator" boolean NOT NULL DEFAULT false, "isSubscriber" boolean NOT NULL DEFAULT false, "haveSubscriberLock" boolean NOT NULL DEFAULT false, "haveSubscribedAtLock" boolean NOT NULL DEFAULT false, "rank" character varying NOT NULL DEFAULT '', "haveCustomRank" boolean NOT NULL DEFAULT false, "subscribedAt" character varying(30), "seenAt" character varying(30), "createdAt" character varying(30), "watchedTime" bigint NOT NULL DEFAULT '0', "chatTimeOnline" bigint NOT NULL DEFAULT '0', "chatTimeOffline" bigint NOT NULL DEFAULT '0', "points" bigint NOT NULL DEFAULT '0', "pointsOnlineGivenAt" bigint NOT NULL DEFAULT '0', "pointsOfflineGivenAt" bigint NOT NULL DEFAULT '0', "pointsByMessageGivenAt" bigint NOT NULL DEFAULT '0', "subscribeTier" character varying NOT NULL DEFAULT '0', "subscribeCumulativeMonths" integer NOT NULL DEFAULT '0', "subscribeStreak" integer NOT NULL DEFAULT '0', "giftedSubscribes" bigint NOT NULL DEFAULT '0', "messages" bigint NOT NULL DEFAULT '0', "extra" text, CONSTRAINT "PK_d72ea127f30e21753c9e229891e" PRIMARY KEY ("userId"))`);
    await queryRunner.query(`CREATE INDEX "IDX_78a916df40e02a9deb1c4b75ed" ON "user" ("userName") `);
    await queryRunner.query(`CREATE TABLE "user_tip" ("id" SERIAL NOT NULL, "amount" double precision NOT NULL, "sortAmount" double precision NOT NULL, "exchangeRates" text NOT NULL, "currency" character varying NOT NULL, "message" text NOT NULL, "tippedAt" bigint NOT NULL DEFAULT '0', "userId" character varying, CONSTRAINT "PK_0bea18dcc7e730784d58261dffd" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE INDEX "IDX_user_tip_userId" ON "user_tip" ("userId") `);
    await queryRunner.query(`CREATE TABLE "user_bit" ("id" SERIAL NOT NULL, "amount" bigint NOT NULL, "message" text NOT NULL, "cheeredAt" bigint NOT NULL DEFAULT '0', "userId" character varying, CONSTRAINT "PK_a944c6c776bab8b2e69126ed141" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE INDEX "IDX_user_bit_userId" ON "user_bit" ("userId") `);
    await queryRunner.query(`CREATE TABLE "widget_custom" ("id" character varying NOT NULL, "userId" character varying NOT NULL, "url" character varying NOT NULL, "name" character varying NOT NULL, CONSTRAINT "PK_6e587fd12023c57ce45562ba99a" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE TABLE "widget_social" ("id" character varying NOT NULL, "type" character varying NOT NULL, "hashtag" character varying NOT NULL, "text" text NOT NULL, "username" character varying NOT NULL, "displayname" character varying NOT NULL, "url" character varying NOT NULL, "timestamp" bigint NOT NULL DEFAULT '0', CONSTRAINT "PK_e57865605d678d69c5e4450f1fe" PRIMARY KEY ("id"))`);
    await queryRunner.query(`ALTER TABLE "keyword_responses" ADD CONSTRAINT "FK_d12716a3805d58dd75ab09c8c67" FOREIGN KEY ("keywordId") REFERENCES "keyword"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    await queryRunner.query(`ALTER TABLE "timer_response" ADD CONSTRAINT "FK_3192b176b66d4375368c9e960de" FOREIGN KEY ("timerId") REFERENCES "timer"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    await queryRunner.query(`ALTER TABLE "event_operation" ADD CONSTRAINT "FK_a9f07bd7a9f0b7b9d41f48b476d" FOREIGN KEY ("eventId") REFERENCES "event"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    await queryRunner.query(`ALTER TABLE "goal" ADD CONSTRAINT "FK_a1a6bd23cb8ef7ddf921f54c0bb" FOREIGN KEY ("groupId") REFERENCES "goal_group"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    await queryRunner.query(`ALTER TABLE "raffle_participant" ADD CONSTRAINT "FK_bc112542267bdd487f4479a94a1" FOREIGN KEY ("raffleId") REFERENCES "raffle"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    await queryRunner.query(`ALTER TABLE "raffle_participant_message" ADD CONSTRAINT "FK_e6eda53bcd6ceb62b5edd9e02b5" FOREIGN KEY ("participantId") REFERENCES "raffle_participant"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    return;
  }

}