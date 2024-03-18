type UserState = { userName: string, userId: string };
type AlertsCustomOptions = {
  volume?:          number;
  alertDuration?:   number;
  textDelay?:       number;
  layout?:          number;
  messageTemplate?: string;
  audioId?:         string;
  mediaId?:         string;
};

/**
 * ListenTo contains all usable listeners for Twitch and other available services.
 */
declare const ListenTo: {
  OBS: {
    /**
     * Listen to OBS websocket events
     */
    on(event:
    'CurrentSceneCollectionChanging' | 'CurrentSceneCollectionChanged' | 'SceneCollectionListChanged' | 'CurrentProfileChanging' |
    'CurrentProfileChanged' | 'ProfileListChanged' | 'SourceFilterListReindexed' | 'SourceFilterCreated' | 'SourceFilterRemoved' |
    'SourceFilterNameChanged' | 'SourceFilterEnableStateChanged' | 'InputCreated' | 'InputRemoved' | 'InputNameChanged' |
    'InputActiveStateChanged' | 'InputShowStateChanged' | 'InputMuteStateChanged' | 'InputVolumeChanged' | 'InputAudioBalanceChanged' |
    'InputAudioSyncOffsetChanged' | 'InputAudioTracksChanged' | 'InputAudioMonitorTypeChanged' | 'InputVolumeMeters' |
    'MediaInputPlaybackStarted' | 'MediaInputPlaybackEnded' | 'MediaInputActionTriggered' | 'StreamStateChanged' |
    'RecordStateChanged' | 'ReplayBufferStateChanged' | 'VirtualcamStateChanged' | 'ReplayBufferSaved' | 'SceneItemCreated' |
    'SceneItemRemoved' | 'SceneItemListReindexed' | 'SceneItemEnableStateChanged' | 'SceneItemLockStateChanged' | 'SceneItemSelected' |
    'SceneItemTransformChanged' | 'SceneCreated' | 'SceneRemoved' | 'SceneNameChanged' | 'CurrentProgramSceneChanged' |
    'CurrentPreviewSceneChanged' | 'SceneListChanged' | 'CurrentSceneTransitionChanged' | 'CurrentSceneTransitionDurationChanged' |
    'SceneTransitionStarted' | 'SceneTransitionEnded' | 'SceneTransitionVideoEnded' | 'StudioModeStateChanged' | 'ScreenshotSaved' |
    'VendorEvent' | 'CustomEvent', callback: (args: any) => void): void,
  }
  Bot: {
    /**
     * Triggers when bot is started
     */
    started(callback: () => void): void,
  }

  /**
   * Register cron to trigger function in intervals
   * @param cron cron schedule (seconds supported) - https://elmah.io/tools/cron-parser/
   * @example Run cron every 5 seconds
   *
   *    ListenTo.Cron('0/5 * * * * *', () => {
   *
   *      // your function logic here
   *
   *    })
   *
   * @example Run cron every 5 minutes (notice seconds can be omitted)
   *
   *    ListenTo.Cron('0/5 * * * *', () => {
   *
   *      // your function logic here
   *
   *    })
   *
   */
  Cron(cron: string, callback: () => void): void;

  Generic: {
    /**
     *  Listen to Generic tip event
     *  @param callback.userState contains userId and userName
     *  @param callback.params contains additional data
     *  @example
     *
     *    ListenTo.Generic.onTip((userState, params) => {
     *
     *      // your function logic here
     *
     *    })
     *
     */
    onTip(callback: (userState: UserState, message: string, params: { isAnonymous: boolean; amount: string; currency: string; amountInBotCurrency: string; currencyInBot: string; }) => void): void,
  };

  /**
   * Twitch listeners
   */
  Twitch: {
    /**
     * Listen to specified Twitch command
     * @param opts.command command to listen to, e.g. '!myCustomCommand'
     * @param opts.customArgSplitter defines custom splitter for args after command, by default split by empty space
     * @param callback.userState contains userId and userName
     * @param callback.commandArgs contains all args split by space
     * @example
     *
     *    ListenTo.Twitch.onCommand({ command: '!me' }, (userState, ....commandArgs) => {
     *
     *      // your function logic here
     *
     *    })
     *
     */
    onCommand(opts: { command: string }, callback: (userState: UserState, ...commandArgs: string[]) => void): void;
    /**
     *  Listen to Twitch follow event
     *  @param callback.userState contains userId and userName
     *  @example
     *
     *    ListenTo.Twitch.onFollow((userState) => {
     *
     *      // your function logic here
     *
     *    })
     *
     */
    onFollow(callback: (userState: UserState) => void): void,
    /**
     *  Listen to Twitch raid event
     *  @param callback.userState contains userId and userName
     *  @param callback.params contains additional data
     *  @example
     *
     *    ListenTo.Twitch.onRaid((userState, params) => {
     *
     *      // your function logic here
     *
     *    })
     *
     */
    onRaid(callback: (userState: UserState, params: { hostViewers: number; event: string; timestamp: number; }) => void): void,
    /**
     *  Listen to Twitch subscripton event
     *  @param callback.userState contains userId and userName
     *  @param callback.params contains additional data
     *  @example
     *
     *    ListenTo.Twitch.onSubscription((userState, params) => {
     *
     *      // your function logic here
     *
     *    })
     *
     */
    onSubscription(callback: (userState: UserState, params: { method: string, subCumulativeMonths: number, tier: 'Prime' | '1' | '2' | '3' }) => void): void,
    /**
     *  Listen to Twitch resubscripton event
     *  @param callback.userState contains userId and userName
     *  @param callback.params contains additional data
     *  @example
     *
     *    ListenTo.Twitch.onResub((userState, params) => {
     *
     *      // your function logic here
     *
     *    })
     *
     */
    onResub(callback: (userState: UserState, params: { subStreakShareEnabled: boolean; subStreak: number; subStreakName: string; subCumulativeMonthsName: string; message: string; subCumulativeMonths: number; tier: 'Prime' | '1' | '2' | '3'; }) => void): void,
    /**
     *  Listen to Twitch reward subgift event
     *  @param callback.userState contains userId and userName
     *  @param callback.params contains additional data
     *  @example
     *
     *    ListenTo.Twitch.onSubGift((userState, params) => {
     *
     *      // your function logic here
     *
     *    })
     *
     */
    onSubGift(callback: (userState: UserState, params: { recipient: string; tier: 'Prime' | '1' | '2' | '3' }) => void): void,
    /**
     *  Listen to Twitch reward subgift event
     *  @param callback.userState contains userId and userName
     *  @param callback.params contains additional data
     *  @example
     *
     *    ListenTo.Twitch.onSubCommunityGift((userState, params) => {
     *
     *      // your function logic here
     *
     *    })
     *
     */
    onChannelAdBreakBegin(callback: (userState: UserState, params: { count: number }) => void): void,
    /**
     *  Listen to Twitch channel break
     *  @param callback.userState contains userId and userName
     *  @param callback.params contains additional data
     *  @example
     *
     *    ListenTo.Twitch.onRewardRedeem((userState, params) => {
     *
     *      // your function logic here
     *
     *    })
     *
     */
    onSubCommunityGift(callback: (userState: UserState, params: { count: number, tier: 'Prime' | '1' | '2' | '3' }) => void): void,
    /**
     *  Listen to Twitch reward redemption event
     *  @param callback.userState contains userId and userName
     *  @param callback.params contains additional data
     *  @example
     *
     *    ListenTo.Twitch.onRewardRedeem((userState, params) => {
     *
     *      // your function logic here
     *
     *    })
     *
     */
    onRewardRedeem(callback: (userState: UserState, params: { rewardId: string; userInput: string; }) => void): void,
    /**
     *  Listen to regular Twitch messages
     *  @param callback.userState contains userId and userName
     *  @param callback.message contains full message
     *  @example
     *
     *    ListenTo.Twitch.onMessage((userState, message) => {
     *
     *      // your function logic here
     *
     *    })
     *
     */
    onMessage(callback: (userState: UserState, message: string) => void): void,
    /**
     *  Listen to stream start event
     *  @example
     *
     *    ListenTo.Twitch.onStreamStart(() => {
     *
     *      // your function logic here
     *
     *    })
     *
     */
    onStreamStart(callback: () => void): void,
    /**
     *  Listen to stream stop event
     *  @example
     *
     *    ListenTo.Twitch.onStreamStop(() => {
     *
     *      // your function logic here
     *
     *    })
     *
     */
    onStreamStop(callback: () => void): void,
    /**
     *  Listen to chat cleared event
     *  @example
     *
     *    ListenTo.Twitch.onChatClear(() => {
     *
     *      // your function logic here
     *
     *    })
     *
     */
    onChatClear(callback: () => void): void,
    /**
     *  Listen to category change event
     *  @param callback.category current category set
     *  @param callback.oldCategory previous category
     *  @example
     *
     *    ListenTo.Twitch.onCategoryChange((category, oldCategory) => {
     *
     *      // your function logic here
     *
     *    })
     *
     */
    onCategoryChange(callback: (category: string, oldCategory: string) => void): void,
    /**
     *  Listen to received bits/cheer event
     *  @param callback.userState contains userId and userName
     *  @param callback.amount how many bits received
     *  @param callback.message contains full message
     *  @example
     *
     *    ListenTo.Twitch.onCheer((userState, amount, message) => {
     *
     *      // your function logic here
     *
     *    })
     *
     */
    onCheer(callback: (userState: UserState, amount: number, message: string) => void): void,

    onChannelCharityCampaignStart(callback: (args: {
      broadcasterDisplayName: string;
      broadcasterId:          string;
      broadcasterName:        string;
      charityDescription:     string;
      charityLogo:            string;
      charityWebsite:         string;
      charityName:            string;
      currentAmount:          number;
      currentAmountCurrency:  string;
      targetAmount:           number;
      targetAmountCurrency:   string;
      startDate:              string;
    }) => void): void,
    onChannelCharityCampaignProgress(callback: (args: {
      broadcasterDisplayName: string;
      broadcasterId:          string;
      broadcasterName:        string;
      charityDescription:     string;
      charityLogo:            string;
      charityWebsite:         string;
      charityName:            string;
      currentAmount:          number;
      currentAmountCurrency:  string;
      targetAmount:           number;
      targetAmountCurrency:   string;
    }) => void): void,
    onChannelCharityCampaignStop(callback: (args: {
      broadcasterDisplayName: string;
      broadcasterId:          string;
      broadcasterName:        string;
      charityDescription:     string;
      charityLogo:            string;
      charityWebsite:         string;
      charityName:            string;
      currentAmount:          number;
      currentAmountCurrency:  string;
      targetAmount:           number;
      targetAmountCurrency:   string;
      endDate:                string;
    }) => void): void,

    onChannelCharityDonation(callback: (args: {
      broadcasterDisplayName: string;
      broadcasterId:          string;
      broadcasterName:        string;
      charityDescription:     string;
      charityLogo:            string;
      charityWebsite:         string;
      charityName:            string;
      campaignId:             string;
      donorDisplayName:       string;
      donorId:                string;
      donorName:              string;
      amount:                 number;
      amountCurrency:         string;
    }) => void): void,

    onChannelGoalBegin(callback: (args: {
      broadcasterDisplayName: string;
      broadcasterId:          string;
      broadcasterName:        string;
      currentAmount:          number;
      description:            string;
      startDate:              string;
      targetAmount:           number;
      type:                   'follow' | 'subscription' | 'subscription_count' | 'new_subscription' | 'new_subscription_count';
    }) => void): void,
    onChannelGoalProgress(callback: (args: {
      broadcasterDisplayName: string;
      broadcasterId:          string;
      broadcasterName:        string;
      currentAmount:          number;
      description:            string;
      startDate:              string;
      targetAmount:           number;
      type:                   'follow' | 'subscription' | 'subscription_count' | 'new_subscription' | 'new_subscription_count';
    }) => void): void,
    onChannelGoalEnd(callback: (args: {
      broadcasterDisplayName: string;
      broadcasterId:          string;
      broadcasterName:        string;
      currentAmount:          number;
      description:            string;
      startDate:              string;
      endDate:                string;
      targetAmount:           number;
      type:                   'follow' | 'subscription' | 'subscription_count' | 'new_subscription' | 'new_subscription_count';
      isAchieved:             boolean;
    }) => void): void,

    onChannelModeratorAdd(callback: (args: {
      broadcasterDisplayName: string;
      broadcasterId:          string;
      broadcasterName:        string;
      userDisplayName:        string;
      userId:                 string;
      userName:               string;
    }) => void): void,
    onChannelModeratorRemove(callback: (args: {
      broadcasterDisplayName: string;
      broadcasterId:          string;
      broadcasterName:        string;
      userDisplayName:        string;
      userId:                 string;
      userName:               string;
    }) => void): void,
    onChannelRewardAdd(callback: (args: {
      duration: number;
      startedAt:              string,
      isAutomatic:            boolean,
      broadcasterDisplayName: string,
      broadcasterId:          string,
      broadcasterName:        string,
      requesterDisplayName:   string,
      requesterId:            string,
      requesterName:          string,
    }) => void): void,
    onChannelRewardAdd(callback: (args: {
      broadcasterDisplayName:         string;
      broadcasterId:                  string;
      broadcasterName:                string;
      autoApproved:                   boolean;
      backgroundColor:                string;
      cooldownExpiryDate:             string | null;
      cost:                           number;
      globalCooldown:                 number | null;
      id:                             string;
      isEnabled:                      boolean;
      isInStock:                      boolean;
      isPaused:                       boolean;
      maxRedemptionsPerStream:        number | null;
      maxRedemptionsPerUserPerStream: number | null;
      prompt:                         string;
      redemptionsThisStream:          number | null;
      title:                          string;
      userInputRequired:              boolean;
    }) => void): void,
    onChannelRewardUpdate(callback: (args: {
      broadcasterDisplayName:         string;
      broadcasterId:                  string;
      broadcasterName:                string;
      autoApproved:                   boolean;
      backgroundColor:                string;
      cooldownExpiryDate:             string | null;
      cost:                           number;
      globalCooldown:                 number | null;
      id:                             string;
      isEnabled:                      boolean;
      isInStock:                      boolean;
      isPaused:                       boolean;
      maxRedemptionsPerStream:        number | null;
      maxRedemptionsPerUserPerStream: number | null;
      prompt:                         string;
      redemptionsThisStream:          number | null;
      title:                          string;
      userInputRequired:              boolean;
    }) => void): void,
    onChannelRewardRemove(callback: (args: {
      broadcasterDisplayName:         string;
      broadcasterId:                  string;
      broadcasterName:                string;
      autoApproved:                   boolean;
      backgroundColor:                string;
      cooldownExpiryDate:             string | null;
      cost:                           number;
      globalCooldown:                 number | null;
      id:                             string;
      isEnabled:                      boolean;
      isInStock:                      boolean;
      isPaused:                       boolean;
      maxRedemptionsPerStream:        number | null;
      maxRedemptionsPerUserPerStream: number | null;
      prompt:                         string;
      redemptionsThisStream:          number | null;
      title:                          string;
      userInputRequired:              boolean;
    }) => void): void,

    onChannelShieldModeBegin(callback: (args: {
      broadcasterDisplayName: string,
      broadcasterId:          string,
      broadcasterName:        string,
      moderatorDisplayName:   string,
      moderatorId:            string,
      moderatorName:          string,
    }) => void): void,
    onChannelShieldModeEnd(callback: (args: {
      broadcasterDisplayName: string,
      broadcasterId:          string,
      broadcasterName:        string,
      moderatorDisplayName:   string,
      moderatorId:            string,
      moderatorName:          string,
      endDate:                string,
    }) => void): void,

    onChannelShoutoutCreate(callback: (args: {
      broadcasterDisplayName:           string,
      broadcasterId:                    string,
      broadcasterName:                  string,
      moderatorDisplayName:             string,
      moderatorId:                      string,
      moderatorName:                    string,
      cooldownEndDate:                  string;
      shoutedOutBroadcasterDisplayName: string;
      shoutedOutBroadcasterId:          string;
      shoutedOutBroadcasterName:        string;
      startDate:                        string;
      viewerCount:                      number;
    }) => void): void,
    onChannelShoutoutReceive(callback: (args: {
      broadcasterDisplayName:            string,
      broadcasterId:                     string,
      broadcasterName:                   string,
      startDate:                         string;
      viewerCount:                       number;
      shoutingOutBroadcasterDisplayName: string,
      shoutingOutBroadcasterId:          string,
      shoutingOutBroadcasterName:        string,
    }) => void): void,

    onChannelUpdate(callback: (args: {
      broadcasterDisplayName: string,
      broadcasterId:          string,
      broadcasterName:        string,
      categoryId:             string;
      categoryName:           string;
      isMature:               boolean;
      streamLanguage:         string;
      streamTitle:            string;
    }) => void): void,
    onUserUpdate(callback: (args: {
      userDescription:     string;
      userDisplayName:     string;
      userId:              string;
      userEmail:           string | null;
      userEmailIsVerified: boolean | null;
      userName:            string;
    }) => void): void,
    onChannelRaidFrom(callback: (args: {
      raidedBroadcasterDisplayName:  string;
      raidedBroadcasterName:         string;
      raidedBroadcasterId:           string;
      raidingBroadcasterDisplayName: string;
      raidingBroadcasterName:        string;
      raidingBroadcasterId:          string;
      viewers:                       number;
    }) => void): void,
    onChannelHypeTrainBegin(callback: () => void): void,
    onChannelHypeTrainProgress(callback: (args: {
      level: number,
      total: number,
      goal: number,
      topContributionsBitsUserId: string;
      topContributionsBitsUsername: string;
      topContributionsBitsTotal: number;
      topContributionsSubsUserId: string;
      topContributionsSubsUsername: string;
      topContributionsSubsTotal: number;
      lastContributionType: 'bits' | 'subscription';
      lastContributionUserId: string;
      lastContributionUsername: string;
      lastContributionTotal: number;
    }) => void): void,
    onChannelHypeTrainEnd(callback: (args: {
      level: number,
      total: number,
      goal: number,
      topContributionsBitsUserId: string;
      topContributionsBitsUsername: string;
      topContributionsBitsTotal: number;
      topContributionsSubsUserId: string;
      topContributionsSubsUsername: string;
      topContributionsSubsTotal: number;
      lastContributionType: 'bits' | 'subscription';
      lastContributionUserId: string;
      lastContributionUsername: string;
      lastContributionTotal: number;
    }) => void): void,
    onChannelRedemptionUpdate(callback: (args: {
      broadcasterDisplayName: string;
      broadcasterId:          string;
      broadcasterName:        string;
      id:                     string;
      input:                  string;
      redemptionDate:         string;
      rewardCost:             number;
      rewardId:               string;
      rewardPrompt:           string;
      rewardTitle:            string;
      status:                 string;
      userDisplayName:        string;
      userId:                 string;
      userName:               string;
    }) => void): void,
  },

  CustomVariable: {
    /**
     *  Listen to custom variable change
     *  @param callback.cur current variable value
     *  @param callback.prev previous variable value
     *  @example
     *
     *    ListenTo.CustomVariable.onChange('$_variableName', (cur, prev) => {
     *
     *      // your function logic here
     *
     *    })
     *
     */
    onChange(variableName: string, callback: (cur: any, prev: any) => void): void;
  }
};

declare const Twitch: {
  /**
   * Bot will send message to chat
   * */
  sendMessage(message:string): void;
  timeout(userId: string, seconds: number, reason?: string): void;
  ban(userId: string, reason?: string): void;
};
declare const Overlay: {
  /**
   * Trigger emote explosion in emote explosion overlay (not plugin overlay)
  *  @example
  *
  *    Overlay.emoteExplosion(['Kappa', 'PogChamp']);
  *
  */
  emoteExplosion(emotes: string[]): void;
  /**
   * Trigger emote firework in emote firework overlay (not plugin overlay)
  *  @example
  *
  *    Overlay.emoteFirework(['Kappa', 'PogChamp']);
  *
  */
  emoteFirework(emotes: string[]): void;
  /**
   * Trigger function in overlay
  *  @example
  *
  *    Overlay.runFunction('test', ['a', 1, true]);
  *
  */
  runFunction(functionName: string, args: (string|number|boolean)[], overlayId?: string): void;
  /**
   * Trigger !tts in TTS Overlay
  *  @example
  *
  *    Overlay.triggerTTSOverlay('My tts message');
  *
  */
  triggerTTSOverlay(message: string): void;
};
declare const Permission: {
  /**
   * Check if user have access to this permissionId
   * */
  accessTo(userId: string, permissionId: string): Promise<boolean>;
};
declare const Log: {
  info(text: string): void,
  warning(text: string): void
};
/**
 * OBS contains all functions to control OBS with obs-websocket-js
 */
declare const OBS: {
  call(requestType: string, requestData?: Record<string, any>): Promise<any>;
  callBatch(requests: { requestType: string, requestData?: Record<string, any> }[], options?: Record<string, any>): Promise<any>;
};

declare const Alerts: {
  trigger(uuid: string, name?: string, message?: string, customOptions?: AlertsCustomOptions): Promise<void>,
};

declare const User: {
  getByUserId(userId: string): Promise<User>,
  getByUserName(userName: string): Promise<User>,
  getRandom: {
    subscriber(onlineOnly: boolean): Promise<User>,
    viewer(onlineOnly: boolean): Promise<User>,
  }
};

declare const Points: {
  increment(userName: string, value: number): Promise<void>,
  decrement(userName: string, value: number): Promise<void>
};

declare const CustomVariable: {
  set(variableName: string, value: any): Promise<void>
  get(variableName: string): Promise<string>
};

declare const Variable: {
  loadFromDatabase(variableName: string): Promise<null | any>,
  saveToDatabase(variableName: string, value: any): Promise<void>
};

/**
 * Contains core permissions defined by bot
 * */
declare const permission = {
  CASTERS:     '4300ed23-dca0-4ed9-8014-f5f2f7af55a9',
  MODERATORS:  'b38c5adb-e912-47e3-937a-89fabd12393a',
  SUBSCRIBERS: 'e3b557e7-c26a-433c-a183-e56c11003ab7',
  VIP:         'e8490e6e-81ea-400a-b93f-57f55aad8e31',
  VIEWERS:     '0efd7b1c-e460-4167-8e06-8aaf2c170311',
} as const;

declare function fetch(uri: string, config: AxiosRequestConfig): Promise<AxiosResponse['data']>;

declare const stream: {
  uptime:             string,
  chatMessages:       number,
  currentViewers:     number,
  currentBits:        number,
  currentFollowers:   number,
  currentHosts:       number,
  currentTips:        number,
  currentWatched:     number,
  currency:           string,
  maxViewers:         number,
  newChatters:        number,
  game:               string,
  status:             string,
  channelDisplayName: string,
  channelUserName:    string,
};

interface User {
  userId: string; userName: string; displayname?: string; profileImageUrl?: string;
  isOnline?: boolean; isVIP?: boolean; isModerator?: boolean; isSubscriber?: boolean;
  haveSubscriberLock?: boolean; haveSubscribedAtLock?: boolean; rank?: string; haveCustomRank?: boolean;
  subscribedAt?: string | null; seenAt?: string | null; createdAt?: string | null;
  watchedTime?: number; chatTimeOnline?: number; chatTimeOffline?: number;
  points?: number; pointsOnlineGivenAt?: number; pointsOfflineGivenAt?: number; pointsByMessageGivenAt?: number;
  subscribeTier?: string; subscribeCumulativeMonths?: number; subscribeStreak?: number; giftedSubscribes?: number;
  messages?: number;
  extra: {
    jackpotWins?: number;
    levels?: {
      xp:                string; // we need to use string as we cannot stringify bigint in typeorm
      xpOfflineGivenAt:  number;
      xpOfflineMessages: number;
      xpOnlineGivenAt:   number;
      xpOnlineMessages:  number;
    },
  } | null
}

interface Permission {
  id:   string,
  name: string,
}