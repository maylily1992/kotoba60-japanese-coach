const STORAGE_KEY = "kotoba60-state-v2";

const PHASES = [
  { title: "主动回忆", minutes: 5, kicker: "WARM UP", subtitle: "先不看答案，把已经见过的话重新调动出来。" },
  { title: "场景输入", minutes: 10, kicker: "LISTEN", subtitle: "先听任务信息，再核对文本；不用逐字翻译。" },
  { title: "跟读表达块", minutes: 10, kicker: "SHADOW", subtitle: "只抓一个节奏点，把短句练成能整块说出的表达。" },
  { title: "三轮角色扮演", minutes: 20, kicker: "SPEAK", subtitle: "带提示、撤提示、换条件；每轮只关注完成任务。" },
  { title: "针对性纠错", minutes: 7, kicker: "REFINE", subtitle: "只修最影响理解或节奏的一处，然后立刻重说。" },
  { title: "真实条件迁移", minutes: 5, kicker: "TRANSFER", subtitle: "别人换了说法或条件，你仍要能把交流接下去。" },
  { title: "复盘与策略更新", minutes: 3, kicker: "REVIEW", subtitle: "记录表现，系统据此决定明天加速、巩固或回练。" },
];

const SKILL_LABELS = {
  listening: "听力抓取",
  speaking: "开口流畅",
  vocabulary: "表达调用",
  grammar: "句型准确",
  pronunciation: "节奏发音",
  repair: "交流修复",
};

const BLOCKERS = [
  { id: "listening", label: "没听懂" },
  { id: "vocabulary", label: "想不起词" },
  { id: "grammar", label: "句型不确定" },
  { id: "pronunciation", label: "说不顺" },
  { id: "repair", label: "卡住不会救场" },
];

const REMEDIES = {
  listening: {
    title: "先抓任务信息，不逐字翻译",
    body: "听第二遍时只回答：谁、在哪里、要做什么。没抓住的词先放过。",
    phrase: "もう一度、ゆっくりお願いします。",
    zh: "请再说一次，慢一点。",
  },
  vocabulary: {
    title: "不会精确词时，改用已经会的话",
    body: "把“想不起来的词”换成动作、位置或简单说明，让任务先完成。",
    phrase: "これは何ですか。",
    zh: "这是什么？",
  },
  grammar: {
    title: "先保住主干，再补修饰",
    body: "用「对象 + を + お願いします」或「地点 + はどこですか」完成最低可懂句。",
    phrase: "これをお願いします。",
    zh: "请给我这个。",
  },
  pronunciation: {
    title: "切短句，先把节奏说稳",
    body: "一个表达块一口气说完，不抢速度；长音和促音占一拍。",
    phrase: "ゆっくり話してください。",
    zh: "请说慢一点。",
  },
  repair: {
    title: "卡住时先修复交流",
    body: "沉默不是唯一选择。先争取时间，再请对方重复或换简单说法。",
    phrase: "すみません、もう一度お願いします。",
    zh: "不好意思，请再说一次。",
  },
};

const WEEKS = [
  {
    n: 1,
    title: "开局、求助和简单问答",
    menuTitle: "从一句自我介绍开始",
    scene: "机场到达大厅 · 初次见面",
    canDo: "能打招呼、介绍姓名与来自哪里，没听懂时主动求助。",
    focus: "です／ます、か 问句、これ／それ／あれ",
    phrases: [
      { jp: "はじめまして。中国から来ました。", reading: "はじめまして。ちゅうごくからきました。", zh: "初次见面，我从中国来。" },
      { jp: "日本語を勉強しています。", reading: "にほんごをべんきょうしています。", zh: "我正在学日语。" },
      { jp: "すみません、もう一度お願いします。", reading: "すみません、もういちどおねがいします。", zh: "不好意思，请再说一次。" },
      { jp: "ゆっくり話してください。", reading: "ゆっくりはなしてください。", zh: "请说慢一点。" },
      { jp: "トイレはどこですか。", reading: "トイレはどこですか。", zh: "洗手间在哪里？" },
      { jp: "大丈夫ですか。", reading: "だいじょうぶですか。", zh: "你还好吗？／没问题吗？" },
      { jp: "助けてください。", reading: "たすけてください。", zh: "请帮帮我。" },
      { jp: "これは何ですか。", reading: "これはなんですか。", zh: "这是什么？" },
    ],
    warmup: [
      { prompt: "初次见面，介绍自己的名字并说“请多关照”。", model: "はじめまして。李です。よろしくお願いします。" },
      { prompt: "告诉对方你来自中国。", model: "中国から来ました。" },
      { prompt: "说明自己正在学日语。", model: "日本語を勉強しています。" },
      { prompt: "没听清，请对方再说一次。", model: "すみません、もう一度お願いします。" },
      { prompt: "问洗手间在哪里。", model: "トイレはどこですか。" },
    ],
    dialogue: [
      { speaker: "田中", role: "tutor", jp: "はじめまして。田中です。", zh: "初次见面，我是田中。" },
      { speaker: "你", role: "learner", jp: "はじめまして。李です。中国から来ました。", zh: "初次见面，我是小李，从中国来。" },
      { speaker: "田中", role: "tutor", jp: "日本語を勉強していますか。", zh: "你在学日语吗？" },
      { speaker: "你", role: "learner", jp: "はい。まだ少しだけです。ゆっくりお願いします。", zh: "是的，还只会一点。请说慢一点。" },
    ],
    roleplays: [
      {
        speaker: "田中",
        subtitle: "机场到达大厅 · 第一次见面",
        line: "はじめまして。お名前は何ですか。",
        task: "先问候，再说自己的名字和来自哪里。",
        hint: "はじめまして｜名前｜中国から来ました",
        model: "はじめまして。李です。中国から来ました。",
      },
      {
        speaker: "田中",
        subtitle: "对方继续追问",
        line: "中国から来ましたね。今、何をしていますか。",
        task: "回答你正在学日语，并坦白自己还只会一点。",
        hint: "日本語を勉強しています｜まだ少しだけ",
        model: "日本語を勉強しています。まだ少しだけです。",
      },
      {
        speaker: "田中",
        subtitle: "语速突然变快",
        line: "あ、そうなんですね。じゃあ、これは何だと思いますか。",
        task: "没听清时不要沉默；先请对方说慢一点。",
        hint: "すみません｜ゆっくり話してください",
        model: "すみません、ゆっくり話してください。",
      },
    ],
    corrections: [
      { skill: "grammar", bad: "中国です来ました。", good: "中国から来ました。", why: "来た起点用「から」；不要按中文语序硬拼。" },
      { skill: "repair", bad: "……（沉默或直接说“听不懂”）", good: "すみません、もう一度お願いします。", why: "用日语主动修复交流，比停下来更能让对话继续。" },
    ],
    transfer: {
      setup: "你在机场找不到出口，工作人员说话很快。",
      task: "先礼貌叫住对方，问出口在哪里；如果没听清，再请对方慢一点。",
      hint: "すみません｜出口はどこですか｜ゆっくり",
      model: "すみません、出口はどこですか。……すみません、ゆっくり話してください。",
    },
    days: [
      { title: "问候与自我介绍", goal: "能介绍姓名、国家与正在做的事" },
      { title: "请求重复和放慢", goal: "听不懂时主动修复交流" },
      { title: "问人和物的位置", goal: "用どこですか询问地点" },
      { title: "问价格、时间和帮助", goal: "完成最基本的旅行询问" },
      { title: "快速追问", goal: "应对姓名、国家、目的、停留时间" },
      { title: "机场无提示求助", goal: "完成找不到出口的短对话" },
      { title: "第一周复测", goal: "录制 60 秒自我介绍与求助" },
    ],
  },
  {
    n: 2,
    title: "吃、买和提出请求",
    menuTitle: "点单不再只会指菜单",
    scene: "街角咖啡馆 · 点单",
    canDo: "能点餐、询问推荐和库存、说明限制并确认付款方式。",
    focus: "〜をください、〜をお願いします、ありますか",
    phrases: [
      { jp: "これをください。", reading: "これをください。", zh: "请给我这个。" },
      { jp: "おすすめは何ですか。", reading: "おすすめはなんですか。", zh: "有什么推荐？" },
      { jp: "〜はありますか。", reading: "〜はありますか。", zh: "有〜吗？" },
      { jp: "いくらですか。", reading: "いくらですか。", zh: "多少钱？" },
      { jp: "氷なしでお願いします。", reading: "こおりなしでおねがいします。", zh: "请不要加冰。" },
      { jp: "カードで払えますか。", reading: "カードではらえますか。", zh: "可以刷卡吗？" },
      { jp: "持ち帰りでお願いします。", reading: "もちかえりでおねがいします。", zh: "请帮我打包／外带。" },
      { jp: "大丈夫です。", reading: "だいじょうぶです。", zh: "不用了／没关系。" },
    ],
    warmup: [
      { prompt: "请店员推荐一样东西。", model: "おすすめは何ですか。" },
      { prompt: "指着菜单上的饮料说“请给我这个”。", model: "これをください。" },
      { prompt: "问是否可以使用信用卡。", model: "カードで払えますか。" },
      { prompt: "点一杯冰咖啡，请店员不要加冰。", model: "アイスコーヒーをください。氷なしでお願いします。" },
      { prompt: "询问价格。", model: "いくらですか。" },
    ],
    dialogue: [
      { speaker: "店员", role: "tutor", jp: "ご注文はお決まりですか。", zh: "决定好点什么了吗？" },
      { speaker: "你", role: "learner", jp: "おすすめは何ですか。", zh: "有什么推荐吗？" },
      { speaker: "店员", role: "tutor", jp: "アイスコーヒーがおすすめです。", zh: "推荐冰咖啡。" },
      { speaker: "你", role: "learner", jp: "じゃあ、それをください。カードで払えますか。", zh: "那请给我那个。可以刷卡吗？" },
    ],
    roleplays: [
      {
        speaker: "店员",
        subtitle: "咖啡馆柜台",
        line: "いらっしゃいませ。ご注文はお決まりですか。",
        task: "请店员推荐，然后点推荐的东西。",
        hint: "おすすめは何ですか｜それをください",
        model: "おすすめは何ですか。……じゃあ、それをください。",
      },
      {
        speaker: "店员",
        subtitle: "需要补充要求",
        line: "かしこまりました。ほかにご希望はありますか。",
        task: "饮料不要加冰，并问能不能刷卡。",
        hint: "氷なしでお願いします｜カードで払えますか",
        model: "氷なしでお願いします。カードで払えますか。",
      },
      {
        speaker: "店员",
        subtitle: "店内吃还是外带",
        line: "店内でお召し上がりですか、お持ち帰りですか。",
        task: "选择外带；如果没听清，问对方能否说慢一点。",
        hint: "持ち帰りでお願いします｜すみません、ゆっくり",
        model: "持ち帰りでお願いします。……すみません、ゆっくり話してください。",
      },
    ],
    corrections: [
      { skill: "grammar", bad: "コーヒーをくださいです。", good: "コーヒーをください。", why: "「ください」本身已经是请求句，不再加「です」。" },
      { skill: "pronunciation", bad: "コーヒ（短音）", good: "コーヒー", why: "「ヒ」后面的长音要占一拍；说足才不会像别的词。" },
    ],
    transfer: {
      setup: "便利店想找热茶，但货架上没有看到。",
      task: "先在句子里说“有热茶吗”，没有时改问“有什么推荐”。",
      hint: "ホットティーはありますか｜おすすめは何ですか",
      model: "すみません、ホットティーはありますか。……じゃあ、おすすめは何ですか。",
    },
    days: [
      { title: "入座、饮料与主食", goal: "完成一次完整点单" },
      { title: "用请求句提出要求", goal: "熟练调用 〜をお願いします" },
      { title: "推荐、库存和大小份", goal: "问清有没有、推荐什么" },
      { title: "过敏与不加某物", goal: "说明一个饮食限制" },
      { title: "快语速与没听清", goal: "主动修复并确认" },
      { title: "便利店连续任务", goal: "找商品、问价、付款" },
      { title: "第二周录音复测", goal: "完成两种点餐变体" },
    ],
  },
  {
    n: 3,
    title: "交通、问路和住宿",
    menuTitle: "把车站信息听到终点",
    scene: "地铁站 · 站台和换乘",
    canDo: "能说目的地、听站台与换乘、确认时间并办理入住。",
    focus: "へ／に／で 的地点功能、时间表达",
    phrases: [
      { jp: "渋谷へ行きたいです。", reading: "しぶやへいきたいです。", zh: "我想去涩谷。" },
      { jp: "何番線ですか。", reading: "なんばんせんですか。", zh: "是几号站台？" },
      { jp: "どこで乗り換えますか。", reading: "どこでのりかえますか。", zh: "在哪里换乘？" },
      { jp: "何時に着きますか。", reading: "なんじにつきますか。", zh: "几点到达？" },
      { jp: "チェックインをお願いします。", reading: "チェックインをおねがいします。", zh: "我想办理入住。" },
      { jp: "予約しています。", reading: "よやくしています。", zh: "我有预约。" },
      { jp: "まっすぐ行って、右です。", reading: "まっすぐいって、みぎです。", zh: "直走，然后右转。" },
      { jp: "近くにコンビニはありますか。", reading: "ちかくにコンビニはありますか。", zh: "附近有便利店吗？" },
    ],
    warmup: [
      { prompt: "告诉车站工作人员你想去涩谷。", model: "渋谷へ行きたいです。" },
      { prompt: "问应该去几号站台。", model: "何番線ですか。" },
      { prompt: "问在哪里换乘。", model: "どこで乗り換えますか。" },
      { prompt: "告诉酒店前台你有预约。", model: "予約しています。" },
      { prompt: "问附近有没有便利店。", model: "近くにコンビニはありますか。" },
    ],
    dialogue: [
      { speaker: "站员", role: "tutor", jp: "どちらまで行きますか。", zh: "您要去哪里？" },
      { speaker: "你", role: "learner", jp: "渋谷まで行きたいです。何番線ですか。", zh: "我想去涩谷，是几号站台？" },
      { speaker: "站员", role: "tutor", jp: "三番線です。新宿で乗り換えてください。", zh: "三号站台，请在新宿换乘。" },
      { speaker: "你", role: "learner", jp: "新宿ですね。何時に着きますか。", zh: "新宿，对吧？几点到？" },
    ],
    roleplays: [
      {
        speaker: "站员",
        subtitle: "车站售票机旁",
        line: "どちらまで行きますか。",
        task: "说目的地，并问要坐几号线的站台。",
        hint: "〜へ行きたいです｜何番線ですか",
        model: "浅草へ行きたいです。何番線ですか。",
      },
      {
        speaker: "站员",
        subtitle: "需要换乘",
        line: "新宿で乗り換えてください。",
        task: "复述换乘站，再问几点到达。",
        hint: "新宿で乗り換える｜何時に着きますか",
        model: "新宿で乗り換えるんですね。何時に着きますか。",
      },
      {
        speaker: "酒店前台",
        subtitle: "比预计晚到 30 分钟",
        line: "チェックインですね。ご予約のお名前は？",
        task: "说你有预约，姓名是李，并确认还来得及入住。",
        hint: "予約しています｜李です｜大丈夫ですか",
        model: "はい、予約しています。李です。少し遅れましたが、大丈夫ですか。",
      },
    ],
    corrections: [
      { skill: "grammar", bad: "渋谷を行きたいです。", good: "渋谷へ行きたいです。", why: "移动方向用「へ」；「を」通常标记动作对象。" },
      { skill: "listening", bad: "只抓住「新宿」就马上走", good: "新宿で乗り換えるんですね。", why: "复述关键站名和动作，可以确认自己没把起点和换乘点听反。" },
    ],
    transfer: {
      setup: "原计划直达，但站员告诉你临时停运，需要换乘。",
      task: "确认停运消息，再问替代路线与到达时间。",
      hint: "止まっているんですか｜どうやって行きますか｜何時",
      model: "電車が止まっているんですか。じゃあ、どうやって行きますか。何時に着きますか。",
    },
    days: [
      { title: "说目的地与交通方式", goal: "明确表达想去哪里" },
      { title: "站台、发车和换乘", goal: "抓住起点、换乘点和终点" },
      { title: "问路并复述指示", goal: "听懂方向并确认" },
      { title: "酒店入住与设施", goal: "完成前台短对话" },
      { title: "听错站名和方向", goal: "发现错误并立即修复" },
      { title: "车站到酒店的连贯任务", goal: "无提示完成 5 轮互动" },
      { title: "第三周地图复测", goal: "准确复述时间或换乘点" },
    ],
  },
  {
    n: 4,
    title: "日程、邀请和熟人聊天",
    menuTitle: "从办事口语走向短聊",
    scene: "咖啡馆 · 周末邀约",
    canDo: "能说作息、兴趣，发出邀请，接受或礼貌拒绝。",
    focus: "〜ています、〜が好きです、〜ませんか",
    phrases: [
      { jp: "毎朝コーヒーを飲みます。", reading: "まいあさコーヒーをのみます。", zh: "我每天早上喝咖啡。" },
      { jp: "今、本を読んでいます。", reading: "いま、ほんをよんでいます。", zh: "我现在正在看书。" },
      { jp: "趣味は映画です。", reading: "しゅみはえいがです。", zh: "我的爱好是看电影。" },
      { jp: "日本料理が好きです。", reading: "にほんりょうりがすきです。", zh: "我喜欢日本料理。" },
      { jp: "一緒に行きませんか。", reading: "いっしょにいきませんか。", zh: "要一起去吗？" },
      { jp: "いいですね。行きましょう。", reading: "いいですね。いきましょう。", zh: "好啊，走吧。" },
      { jp: "すみません、ちょっと……。", reading: "すみません、ちょっと……。", zh: "不好意思，有点不方便……" },
      { jp: "また今度お願いします。", reading: "またこんどおねがいします。", zh: "下次再约。" },
    ],
    warmup: [
      { prompt: "告诉朋友你的爱好是看电影。", model: "趣味は映画です。" },
      { prompt: "说自己喜欢日本料理。", model: "日本料理が好きです。" },
      { prompt: "邀请朋友一起去。", model: "一緒に行きませんか。" },
      { prompt: "接受邀请。", model: "いいですね。行きましょう。" },
      { prompt: "礼貌拒绝这次邀请。", model: "すみません、ちょっと……。また今度お願いします。" },
    ],
    dialogue: [
      { speaker: "佐藤", role: "tutor", jp: "週末は何をしますか。", zh: "周末做什么？" },
      { speaker: "你", role: "learner", jp: "友達とご飯を食べます。佐藤さんも一緒に行きませんか。", zh: "我和朋友去吃饭。佐藤也一起去吗？" },
      { speaker: "佐藤", role: "tutor", jp: "いいですね。何時にしますか。", zh: "好啊，几点？" },
      { speaker: "你", role: "learner", jp: "土曜日の六時に駅で会いましょう。", zh: "周六六点在车站见吧。" },
    ],
    roleplays: [
      {
        speaker: "佐藤",
        subtitle: "咖啡馆闲聊",
        line: "趣味は何ですか。",
        task: "说一个爱好，并反问对方喜欢什么。",
        hint: "趣味は〜です｜佐藤さんは？",
        model: "趣味は映画です。佐藤さんは何が好きですか。",
      },
      {
        speaker: "佐藤",
        subtitle: "发出周末邀请",
        line: "土曜日に一緒にご飯を食べませんか。",
        task: "接受邀请，并约定时间和地点。",
        hint: "いいですね｜何時に｜駅で会いましょう",
        model: "いいですね。何時にしますか。じゃあ、六時に駅で会いましょう。",
      },
      {
        speaker: "佐藤",
        subtitle: "临时改了时间",
        line: "ごめん、六時は難しくなった。七時でも大丈夫？",
        task: "听懂时间变化，确认七点并改地点。",
        hint: "七時ですね｜駅の前で会いましょう",
        model: "七時ですね、大丈夫です。じゃあ、駅の前で会いましょう。",
      },
    ],
    corrections: [
      { skill: "grammar", bad: "映画を好きです。", good: "映画が好きです。", why: "「好き」的对象通常用「が」标记。" },
      { skill: "speaking", bad: "只回答「はい」就结束", good: "いいですね。何時にしますか。", why: "接受邀请后补一个具体问题，交流才会真正向前。" },
    ],
    transfer: {
      setup: "朋友邀请你今晚吃饭，但你已经累了。",
      task: "礼貌拒绝今晚的邀请，提出改到周末并反问时间。",
      hint: "すみません、今日はちょっと｜週末はどうですか",
      model: "すみません、今日はちょっと……。週末はどうですか。",
    },
    days: [
      { title: "一天的基本作息", goal: "用 2–3 句说日常安排" },
      { title: "问喜好并回应", goal: "至少追问对方一个问题" },
      { title: "邀请、时间和地点", goal: "完成一次邀约" },
      { title: "接受与礼貌拒绝", goal: "两种回应都能自然说出" },
      { title: "临时改期和取消", goal: "听懂变化并重新确认" },
      { title: "3 分钟小闲聊", goal: "围绕熟悉话题维持互动" },
      { title: "第四周期中复测", goal: "四项任务至少三项脱稿" },
    ],
  },
  {
    n: 5,
    title: "身体不适、遗失和突发问题",
    menuTitle: "关键时刻说清需求",
    scene: "药店 · 头痛和用药",
    canDo: "能说基本症状、购买药品、报告遗失和网络支付故障。",
    focus: "疼痛表达、过去时、〜てもらえますか",
    phrases: [
      { jp: "頭が痛いです。", reading: "あたまがいたいです。", zh: "我头痛。" },
      { jp: "気分が悪いです。", reading: "きぶんがわるいです。", zh: "我不舒服。" },
      { jp: "この薬をお願いします。", reading: "このくすりをおねがいします。", zh: "请给我这个药。" },
      { jp: "財布をなくしました。", reading: "さいふをなくしました。", zh: "我丢了钱包。" },
      { jp: "Wi-Fi がつながりません。", reading: "ワイファイがつながりません。", zh: "Wi-Fi 连不上。" },
      { jp: "カードが使えません。", reading: "カードがつかえません。", zh: "卡不能用。" },
      { jp: "交番はどこですか。", reading: "こうばんはどこですか。", zh: "派出所在哪里？" },
      { jp: "書いてもらえますか。", reading: "かいてもらえますか。", zh: "能帮我写下来吗？" },
    ],
    warmup: [
      { prompt: "告诉药剂师你头痛。", model: "頭が痛いです。" },
      { prompt: "说你从昨天晚上开始不舒服。", model: "昨日の夜から気分が悪いです。" },
      { prompt: "告诉酒店前台你丢了钱包。", model: "財布をなくしました。" },
      { prompt: "说 Wi-Fi 连不上。", model: "Wi-Fi がつながりません。" },
      { prompt: "请对方把信息写下来。", model: "書いてもらえますか。" },
    ],
    dialogue: [
      { speaker: "药剂师", role: "tutor", jp: "どうしましたか。", zh: "怎么了？" },
      { speaker: "你", role: "learner", jp: "頭が痛いです。昨日の夜からです。", zh: "我头痛，从昨天晚上开始。" },
      { speaker: "药剂师", role: "tutor", jp: "この薬を食後に飲んでください。", zh: "请饭后服用这个药。" },
      { speaker: "你", role: "learner", jp: "一日何回ですか。書いてもらえますか。", zh: "一天几次？能帮我写下来吗？" },
    ],
    roleplays: [
      {
        speaker: "药剂师",
        subtitle: "药店柜台",
        line: "どうしましたか。",
        task: "说肚子痛，并说明从今天早上开始。",
        hint: "お腹が痛いです｜今朝からです",
        model: "お腹が痛いです。今朝からです。",
      },
      {
        speaker: "药剂师",
        subtitle: "说明服药频率",
        line: "この薬を一日三回、食事の後に飲んでください。",
        task: "没完全听懂，请对方再说慢一点，并确认次数。",
        hint: "すみません、もう一度｜一日三回ですか",
        model: "すみません、もう一度ゆっくりお願いします。一日三回ですか。",
      },
      {
        speaker: "酒店前台",
        subtitle: "手机和钱包不见了",
        line: "何かお困りですか。",
        task: "报告手机丢了，说明最后一次看到是在房间。",
        hint: "携帯をなくしました｜部屋で最後に見ました",
        model: "携帯をなくしました。最後に部屋で見ました。",
      },
    ],
    corrections: [
      { skill: "grammar", bad: "昨日から頭が痛いでした。", good: "昨日から頭が痛いです。", why: "「痛い」是形容词；礼貌说明现状用「痛いです」。" },
      { skill: "repair", bad: "面对一串服药说明只点头", good: "一日三回ですか。書いてもらえますか。", why: "用确认和书面记录降低遗漏关键信息的风险。" },
    ],
    transfer: {
      setup: "你不在酒店，手机没电，也记不住酒店名字。",
      task: "向路人说明手机没电，请求借用充电器或帮忙联系酒店。",
      hint: "携帯の電池がありません｜助けてもらえますか",
      model: "すみません、携帯の電池がありません。助けてもらえますか。",
    },
    days: [
      { title: "疼痛位置和基本症状", goal: "说清哪里不舒服、多久了" },
      { title: "药店说明与确认用法", goal: "确认次数、时间和注意事项" },
      { title: "遗失物品、地点和时间", goal: "完成失物报告" },
      { title: "网络、房卡、付款故障", goal: "说清设备问题并求助" },
      { title: "长串说明和细节追问", goal: "至少确认两个关键数字" },
      { title: "身体不适到买药", goal: "无提示完成连续任务" },
      { title: "第五周紧急求助复测", goal: "信息不全也能反问推进" },
    ],
  },
  {
    n: 6,
    title: "观光、问推荐和交换信息",
    menuTitle: "让推荐变成一段对话",
    scene: "观光案内所 · 问景点",
    canDo: "能问推荐和路线、交换经历、请求拍照并继续追问。",
    focus: "经历表达、理由、开放问题和共情",
    phrases: [
      { jp: "おすすめの場所はありますか。", reading: "おすすめのばしょはありますか。", zh: "有推荐的地方吗？" },
      { jp: "どうやって行きますか。", reading: "どうやっていきますか。", zh: "怎么去？" },
      { jp: "お寺に行ったことがありますか。", reading: "おてらにいったことがありますか。", zh: "你去过寺庙吗？" },
      { jp: "私は初めてです。", reading: "わたしははじめてです。", zh: "我是第一次。" },
      { jp: "写真を撮ってもらえますか。", reading: "しゃしんをとってもらえますか。", zh: "能帮我拍张照吗？" },
      { jp: "どうでしたか。", reading: "どうでしたか。", zh: "感觉怎么样？" },
      { jp: "地元では何が有名ですか。", reading: "じもとではなにがゆうめいですか。", zh: "你的家乡什么有名？" },
      { jp: "〜が好きなんですね。", reading: "〜がすきなんですね。", zh: "原来你喜欢〜啊。" },
    ],
    warmup: [
      { prompt: "问观光案内所有什么推荐的地方。", model: "おすすめの場所はありますか。" },
      { prompt: "问怎么去那个地方。", model: "どうやって行きますか。" },
      { prompt: "问对方有没有去过京都。", model: "京都に行ったことがありますか。" },
      { prompt: "请陌生人帮你拍照。", model: "すみません、写真を撮ってもらえますか。" },
      { prompt: "问对方的旅行感受怎么样。", model: "旅行はどうでしたか。" },
    ],
    dialogue: [
      { speaker: "案内员", role: "tutor", jp: "この近くのお寺はどうですか。", zh: "附近这座寺庙怎么样？" },
      { speaker: "你", role: "learner", jp: "いいですね。どうやって行きますか。", zh: "不错。怎么去？" },
      { speaker: "案内员", role: "tutor", jp: "三番のバスに乗って、十五分ぐらいです。", zh: "坐三号公交，大约十五分钟。" },
      { speaker: "你", role: "learner", jp: "三番のバスですね。ありがとうございます。", zh: "三号公交，对吧？谢谢。" },
    ],
    roleplays: [
      {
        speaker: "案内员",
        subtitle: "观光案内所",
        line: "何かお探しですか。",
        task: "问一个景点推荐，并追问为什么推荐。",
        hint: "おすすめの場所はありますか｜どうしてですか",
        model: "おすすめの場所はありますか。……どうしてですか。",
      },
      {
        speaker: "当地人",
        subtitle: "景点旁短聊",
        line: "ここは初めてですか。",
        task: "说自己第一次来，并问对方是不是来过。",
        hint: "初めてです｜〜たことがありますか",
        model: "はい、初めてです。ここに来たことがありますか。",
      },
      {
        speaker: "当地人",
        subtitle: "对方回答去过两次",
        line: "二回来たことがあります。桜がきれいでしたよ。",
        task: "回应这一点，再问对方最喜欢的季节。",
        hint: "いいですね｜どの季節が好きですか",
        model: "いいですね。どの季節が好きですか。",
      },
    ],
    corrections: [
      { skill: "grammar", bad: "京都に行くことがありました。", good: "京都に行ったことがあります。", why: "表达“曾经做过”时，动词用过去形接「ことがあります」。" },
      { skill: "speaking", bad: "得到推荐后只说「はい、わかりました」", good: "三番のバスですね。何分ぐらいですか。", why: "复述关键信息并追问，避免只听见表面回答。" },
    ],
    transfer: {
      setup: "当地人推荐了三个地方，你只听清其中两个。",
      task: "复述你听到的地点，坦白漏听一个，请对方再说一遍。",
      hint: "二つわかりました｜もう一つ、もう一度",
      model: "二つわかりました。すみません、もう一つ、もう一度お願いします。",
    },
    days: [
      { title: "景点推荐和理由", goal: "问开放问题并追问" },
      { title: "复述路线和交通", goal: "准确说出线路与时间" },
      { title: "交换旅行经历", goal: "每次至少追问一次" },
      { title: "请求拍照并确认", goal: "礼貌请求陌生人" },
      { title: "多个地点和长信息", goal: "抓住两个以上关键点" },
      { title: "五分钟旅行短聊", goal: "维持真实问答而非背稿" },
      { title: "第六周录音复测", goal: "完成推荐、经历和追问" },
    ],
  },
  {
    n: 7,
    title: "脱稿、换说和随机应变",
    menuTitle: "不会那个词，也能说下去",
    scene: "临时变化 · 随机场景",
    canDo: "在未预告场景中开口，不会词时换说，听懂常见普通体。",
    focus: "换说、确认、连接和识别自然口语",
    phrases: [
      { jp: "どう言えばいいですか。", reading: "どういえばいいですか。", zh: "这该怎么说？" },
      { jp: "つまり、〜ということです。", reading: "つまり、〜ということです。", zh: "也就是说，是〜。" },
      { jp: "たとえば、〜みたいな。", reading: "たとえば、〜みたいな。", zh: "比如，像〜这样的。" },
      { jp: "どうしてですか。", reading: "どうしてですか。", zh: "为什么？" },
      { jp: "本当ですか。", reading: "ほんとうですか。", zh: "真的吗？" },
      { jp: "もう一度お願いします。", reading: "もういちどおねがいします。", zh: "请再说一次。" },
      { jp: "簡単な日本語でお願いします。", reading: "かんたんなにほんごでおねがいします。", zh: "请用简单的日语说。" },
      { jp: "行けなくなりました。", reading: "いけなくなりました。", zh: "我去不了了。" },
    ],
    warmup: [
      { prompt: "不会某个词，问对方“这该怎么说”。", model: "すみません、これは日本語でどう言えばいいですか。" },
      { prompt: "请对方用简单日语再说一遍。", model: "簡単な日本語でお願いします。" },
      { prompt: "听到意外消息，回应“真的吗”。", model: "本当ですか。" },
      { prompt: "追问原因。", model: "どうしてですか。" },
      { prompt: "说明计划变了，你去不了。", model: "すみません、行けなくなりました。" },
    ],
    dialogue: [
      { speaker: "朋友", role: "tutor", jp: "明日の予定、変わったんだ。", zh: "明天的安排变了。" },
      { speaker: "你", role: "learner", jp: "本当ですか。どうしてですか。", zh: "真的吗？为什么？" },
      { speaker: "朋友", role: "tutor", jp: "午後から雨らしいから、室内にしない？", zh: "下午好像要下雨，改室内怎么样？" },
      { speaker: "你", role: "learner", jp: "なるほど。じゃあ、駅の近くで会いましょう。", zh: "原来如此。那在车站附近见吧。" },
    ],
    roleplays: [
      {
        speaker: "朋友",
        subtitle: "突然下雨 · 快速口语",
        line: "雨だから、今日は行かないほうがいいんじゃない？",
        task: "抓住“下雨、不去”，追问替代方案。",
        hint: "雨ですね｜じゃあ、どうしますか",
        model: "雨ですね。じゃあ、どうしますか。",
      },
      {
        speaker: "店员",
        subtitle: "忘记“充电器”怎么说",
        line: "何をお探しですか。",
        task: "不会说充电器，用“给手机充电的东西”换说。",
        hint: "携帯を充電するもの｜〜みたいな",
        model: "携帯を充電するもの、みたいなものです。ありますか。",
      },
      {
        speaker: "朋友",
        subtitle: "临时取消约定",
        line: "ごめん、急用ができちゃって、行けなくなった。",
        task: "表示理解，确认改天再约。",
        hint: "わかりました｜また今度",
        model: "わかりました。大丈夫です。また今度お願いします。",
      },
    ],
    corrections: [
      { skill: "vocabulary", bad: "不会词就停下来查手机", good: "携帯を充電するもの、みたいなものです。", why: "先绕开精确词，用功能描述或类比把意思说出来。" },
      { skill: "listening", bad: "只抓到一个「雨」就猜整句", good: "雨だから、行かないんですね。", why: "把听到的关键词串成确认句，比默默猜测更可靠。" },
    ],
    transfer: {
      setup: "你临时去不了约好的餐厅，也不会说“临时有事”。",
      task: "不查词，先简短道歉，用简单说法说明去不了，再提议改天。",
      hint: "行けなくなりました｜また今度",
      model: "すみません、急に行けなくなりました。また今度お願いします。",
    },
    days: [
      { title: "随机连接两个场景", goal: "不靠题库完成连续任务" },
      { title: "十秒内先开口", goal: "允许不完整，但先回应" },
      { title: "不会词就换说", goal: "至少完成一次意思替代" },
      { title: "听懂常见普通体", goal: "识别 〜じゃない、〜てる" },
      { title: "干扰、更正和变更", goal: "发现变化后立即调整" },
      { title: "五分钟无题库闲聊", goal: "保持自然问答节奏" },
      { title: "第七周弱点重练", goal: "只针对两个错误标签" },
    ],
  },
  {
    n: 8,
    title: "整趟旅行与最终验收",
    menuTitle: "把零散句子串成旅程",
    scene: "酒店前台 · 到达与入住",
    canDo: "把入住、点单、交通、求助和小聊串成完整旅行链。",
    focus: "场景衔接、信息确认、错误后继续交流",
    phrases: [
      { jp: "予約しています。李です。", reading: "よやくしています。りです。", zh: "我有预约，姓李。" },
      { jp: "チェックインをお願いします。", reading: "チェックインをおねがいします。", zh: "我想办理入住。" },
      { jp: "朝食は何時からですか。", reading: "ちょうしょくはなんじからですか。", zh: "早餐从几点开始？" },
      { jp: "チェックアウトは何時ですか。", reading: "チェックアウトはなんじですか。", zh: "几点退房？" },
      { jp: "荷物を預かってもらえますか。", reading: "にもつをあずかってもらえますか。", zh: "能帮我保管行李吗？" },
      { jp: "もう一度お願いします。", reading: "もういちどおねがいします。", zh: "请再说一次。" },
      { jp: "大丈夫です。ありがとうございます。", reading: "だいじょうぶです。ありがとうございます。", zh: "没关系，谢谢。" },
      { jp: "助かりました。", reading: "たすかりました。", zh: "帮大忙了。" },
    ],
    warmup: [
      { prompt: "告诉酒店前台你有预约，姓李。", model: "予約しています。李です。" },
      { prompt: "问早餐从几点开始。", model: "朝食は何時からですか。" },
      { prompt: "退房后请酒店帮你看管行李。", model: "チェックアウトの後、荷物を預かってもらえますか。" },
      { prompt: "没听清关键信息，请对方重复。", model: "すみません、もう一度お願いします。" },
      { prompt: "对方帮你解决了问题，表达感谢。", model: "助かりました。ありがとうございます。" },
    ],
    dialogue: [
      { speaker: "前台", role: "tutor", jp: "いらっしゃいませ。ご予約のお名前は？", zh: "欢迎。请问预约姓名？" },
      { speaker: "你", role: "learner", jp: "予約しています。李です。", zh: "我有预约，姓李。" },
      { speaker: "前台", role: "tutor", jp: "パスポートをお願いします。朝食は七時からです。", zh: "请出示护照。早餐七点开始。" },
      { speaker: "你", role: "learner", jp: "七時ですね。荷物を預かってもらえますか。", zh: "七点对吧。能帮我保管行李吗？" },
    ],
    roleplays: [
      {
        speaker: "前台",
        subtitle: "到达酒店",
        line: "いらっしゃいませ。ご予約のお名前は？",
        task: "说预约姓名，并出示护照、办理入住。",
        hint: "予約しています｜李です｜パスポートです",
        model: "予約しています。李です。パスポートはこれです。",
      },
      {
        speaker: "店员",
        subtitle: "早餐结账时卡失败",
        line: "申し訳ありません。このカードは使えないようです。",
        task: "确认卡不能用，问能不能改用现金。",
        hint: "使えないんですか｜現金で払えますか",
        model: "カードが使えないんですか。現金で払えますか。",
      },
      {
        speaker: "站员",
        subtitle: "最后一天赶车",
        line: "この電車は事故で止まっています。別の駅へ行ってください。",
        task: "没完全听懂，请对方慢说，并问需要多久。",
        hint: "すみません、ゆっくり｜どのくらいかかりますか",
        model: "すみません、もう一度ゆっくりお願いします。どのくらいかかりますか。",
      },
    ],
    corrections: [
      { skill: "repair", bad: "对方说得太长就点头离开", good: "朝食は七時ですね。荷物は大丈夫ですか。", why: "复述关键信息再追问第二项，可以避免信息过载时的遗漏。" },
      { skill: "speaking", bad: "每个答案都只有单词", good: "はい、予約しています。李です。", why: "用完整短句把回答和行动连起来，更像真实交流。" },
    ],
    transfer: {
      setup: "完整旅行链从酒店开始：你晚到、行李需要寄存，前台语速很快。",
      task: "无稿完成预约确认、晚到说明、寄存请求，并确认早餐时间。",
      hint: "予約しています｜少し遅れました｜荷物｜朝食は何時",
      model: "予約しています。少し遅れましたが、大丈夫ですか。荷物を預かってもらえますか。朝食は何時からですか。",
    },
    days: [
      { title: "到达、问路、入住", goal: "完成旅行第一串任务" },
      { title: "早餐、购物、付款失败", goal: "处理付款故障" },
      { title: "换乘、推荐和拍照", goal: "串联信息与社交" },
      { title: "药店、遗失、酒店求助", goal: "处理突发问题" },
      { title: "一日行程随机小聊", goal: "办事之后自然接短聊" },
      { title: "完整旅行链模拟", goal: "不换题库完成连续任务" },
      { title: "最终口语验收", goal: "12 项任务中至少通过 9 项" },
    ],
  },
];

const DEFAULT_STATE = {
  week: 1,
  day: 1,
  completed: [],
  sessions: 0,
  totalMinutes: 0,
  streak: 0,
  lastPracticeDate: null,
  notes: {},
  performance: [],
  skills: {
    listening: 38,
    speaking: 34,
    vocabulary: 36,
    grammar: 35,
    pronunciation: 38,
    repair: 31,
  },
  reviewQueue: [],
  dailyReadiness: {},
};

let state = loadState();
let route = "home";
let expandedWeek = state.week;
let deferredInstallPrompt = null;
let toastTimer = null;
let session = createEmptySession();

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved) return clone(DEFAULT_STATE);
    return {
      ...clone(DEFAULT_STATE),
      ...saved,
      skills: { ...DEFAULT_STATE.skills, ...(saved.skills || {}) },
      completed: Array.isArray(saved.completed) ? saved.completed : [],
      notes: saved.notes || {},
      performance: Array.isArray(saved.performance) ? saved.performance : [],
      reviewQueue: Array.isArray(saved.reviewQueue) ? saved.reviewQueue : [],
      dailyReadiness: saved.dailyReadiness || {},
    };
  } catch {
    return clone(DEFAULT_STATE);
  }
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function createEmptySession() {
  return {
    week: null,
    day: null,
    phase: 0,
    roleRound: 0,
    roleRevealed: false,
    hintShown: false,
    roleFeedback: {},
    listenRating: null,
    shadowRating: null,
    drafts: {},
    checks: {},
    seconds: 0,
    timerId: null,
    inProgressKey: null,
    reviewSkill: null,
  };
}

function currentWeek() {
  return WEEKS[state.week - 1];
}

function currentDay() {
  return currentWeek().days[state.day - 1];
}

function dayKey(week = state.week, day = state.day) {
  return `${week}-${day}`;
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function audioButton(text, label = "播放日语示范", className = "speak-button") {
  return `<button class="${className}" type="button" data-speak="${escapeHtml(text)}" aria-label="${escapeHtml(label)}">
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 9v6h4l5 4V5L9 9zm12 1a3 3 0 0 1 0 4m2-7a7 7 0 0 1 0 10"/></svg>
  </button>`;
}

function icon(name) {
  const paths = {
    arrow: '<path d="m9 18 6-6-6-6"/>',
    back: '<path d="m15 18-6-6 6-6"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    clock: '<circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2"/>',
    target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2"/>',
    spark: '<path d="m12 3 1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7zM19 16l.7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7z"/>',
    refresh: '<path d="M20 7v5h-5M4 17v-5h5"/><path d="M18.5 9A7 7 0 0 0 6 6.5L4 9m2 6a7 7 0 0 0 12.5 2.5L20 15"/>',
    mic: '<rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3m-3 0h6"/>',
    stop: '<rect x="7" y="7" width="10" height="10" rx="2"/>',
    lightbulb: '<path d="M9 18h6m-5 3h4M8.5 15.5A7 7 0 1 1 15.5 15.5c-.9.7-1.5 1.2-1.5 2.5h-4c0-1.3-.6-1.8-1.5-2.5z"/>',
    book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5zm16 0A2.5 2.5 0 0 0 17.5 3H13v16h4.5a2.5 2.5 0 0 1 2.5 2.5z"/>',
    route: '<circle cx="6" cy="18" r="2"/><circle cx="18" cy="6" r="2"/><path d="M7.5 16.5 16.5 7.5M8 5h4M18 13v4"/>',
    brain: '<path d="M9 4a3 3 0 0 0-5 2.2A3 3 0 0 0 5 12a3 3 0 0 0 4 3.5V4Zm6 0a3 3 0 0 1 5 2.2A3 3 0 0 1 19 12a3 3 0 0 1-4 3.5V4Z"/><path d="M9 8H7m8 2h2m-8 5H7"/>',
  };
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[name] || paths.arrow}</svg>`;
}

function getRatingAverage(feedback) {
  const values = Object.values(feedback || {})
    .map((item) => Number(item.difficulty))
    .filter(Boolean);
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function getLatestBlockers(feedback = {}) {
  return Object.values(feedback).flatMap((item) => item.blockers || []);
}

function weakestSkill() {
  return Object.entries(state.skills).sort((a, b) => a[1] - b[1])[0][0];
}

function getStrategy() {
  const liveAverage = getRatingAverage(session.roleFeedback);
  const last = state.performance[state.performance.length - 1];
  const readiness = state.dailyReadiness[localDateKey(new Date())];
  const average = liveAverage ?? last?.avgRating ?? null;
  const blockers = getLatestBlockers(session.roleFeedback);
  const blocker = blockers[0] || last?.blockers?.[0] || weakestSkill();
  const skill = state.skills[blocker] < 48 ? blocker : weakestSkill();

  if (liveAverage !== null) {
    if (liveAverage <= 1.5) {
      return {
        mode: "回练",
        title: "先降难度，不急着往前赶",
        body: `当前三轮的平均难度偏低。剩余时间减少新信息，保留提示并优先重练「${SKILL_LABELS[skill]}」。`,
        tags: ["保留提示", "同一任务重说", "先求完成"],
        skill,
        changed: true,
      };
    }
    if (liveAverage >= 2.7 && blockers.length === 0) {
      return {
        mode: "提速",
        title: "状态稳定，撤掉提示加一个变式",
        body: "你的自评显示负担较轻。后续减少关键词，要求回答后主动追问一次。",
        tags: ["撤掉提示", "主动追问", "加快反应"],
        skill,
        changed: true,
      };
    }
  }

  if (readiness === "low") {
    return {
      mode: "轻量",
      title: "今天降低负荷，优先保住开口",
      body: `你选择了精力偏低。系统会减少新内容，把提示留在角色扮演中，并将重点放在「${SKILL_LABELS[weakestSkill()]}」的可完成任务上。`,
      tags: ["减少新词", "提示保留", "允许短句"],
      skill: weakestSkill(),
      changed: true,
    };
  }

  if (readiness === "high") {
    return {
      mode: "进阶",
      title: "状态不错，提高输出占比",
      body: `你选择了精力较高。系统会缩短解释、减少提示，并要求回答后主动追问；重点观察「${SKILL_LABELS[weakestSkill()]}」是否能迁移。`,
      tags: ["更多开口", "撤掉提示", "主动追问"],
      skill: weakestSkill(),
      changed: true,
    };
  }

  if (last) {
    if (last.avgRating <= 1.5) {
      return {
        mode: "巩固",
        title: "今天先回练，不机械推进",
        body: `上次练习负荷偏高。今天沿用熟悉场景，先让「${SKILL_LABELS[skill]}」稳定，再进新任务。`,
        tags: ["复习优先", "少加新词", "短句完成"],
        skill,
        changed: true,
      };
    }
    if (last.blockers?.[0]) {
      return {
        mode: "定向",
        title: `先补「${SKILL_LABELS[skill]}」`,
        body: `你上次标记的主要卡点是${SKILL_LABELS[skill]}。训练会把这个环节前置，并在角色扮演后追加一次针对性重说。`,
        tags: ["卡点前置", "一次只修一处", "当日复测"],
        skill,
        changed: true,
      };
    }
    if (last.avgRating >= 2.7) {
      return {
        mode: "挑战",
        title: "基础任务变轻，加入脱稿迁移",
        body: "最近一次完成较顺。今天减少样板提示，增加语速、信息缺口和临时变化。",
        tags: ["脱稿", "换条件", "三秒开口"],
        skill,
        changed: true,
      };
    }
  }

  return {
    mode: "基线",
    title: "按标准节奏，先找到真正的卡点",
    body: "今天不预先假设强弱。每完成一轮角色扮演，请标记难度和卡点，系统会在本次课堂内改变后续提示量。",
    tags: ["标准 60 分钟", "首轮留提示", "实时记录"],
    skill,
    changed: false,
  };
}

function strategyCard(strategy = getStrategy()) {
  return `<section class="adaptive-card" aria-label="今日自适应策略">
    <div class="adaptive-top">
      <span class="adaptive-badge">${icon("spark")}策略 · ${escapeHtml(strategy.mode)}</span>
      <small>${strategy.changed ? "已根据表现调整" : "等待你的首轮反馈"}</small>
    </div>
    <h3>${escapeHtml(strategy.title)}</h3>
    <p>${escapeHtml(strategy.body)}</p>
    <div class="strategy-tags">${strategy.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div>
  </section>`;
}

function todayLabel() {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(new Date());
}

function renderHome() {
  const week = currentWeek();
  const day = currentDay();
  const key = dayKey();
  const done = state.completed.includes(key);
  const hasResume = session.inProgressKey === key && session.phase > 0 && !done;
  const weekDone = week.days.filter((_, index) => state.completed.includes(dayKey(week.n, index + 1))).length;
  const strategy = getStrategy();
  const dueReview = getDueReview();
  const readiness = state.dailyReadiness[localDateKey(new Date())] || "normal";

  return `<div class="page">
    <p class="eyebrow">TODAY · ${escapeHtml(todayLabel())}</p>
    <h1 class="page-title">开口练，<br />今天也向前一点。</h1>
    <p class="page-lead">第 ${week.n} 周 · 第 ${state.day} 天 · ${escapeHtml(week.title)}</p>

    <section class="hero-card">
      <div class="hero-topline">
        <p class="hero-kicker">TODAY'S 60 MIN</p>
        <span class="time-badge">${icon("clock")} 60 分钟</span>
      </div>
      <h2 class="hero-title">${escapeHtml(day.title)}</h2>
      <p class="hero-subtitle">${escapeHtml(day.goal)}<br />${escapeHtml(week.scene)}</p>
      <div class="hero-footer">
        <div class="day-dots" aria-label="本周完成 ${weekDone} 天">
          ${week.days.map((_, index) => `<span class="day-dot ${state.completed.includes(dayKey(week.n, index + 1)) ? "done" : ""} ${state.day === index + 1 ? "active" : ""}"></span>`).join("")}
        </div>
        <button class="hero-button" type="button" data-action="start-session">
          ${hasResume ? "继续课堂" : done ? "再练一次" : "开始训练"}
          ${icon("arrow")}
        </button>
      </div>
    </section>

    <div class="readiness-strip">
      <small>今天的状态</small>
      <div class="readiness-options" aria-label="选择今天的状态">
        <button class="${readiness === "low" ? "is-selected" : ""}" type="button" data-action="set-readiness" data-readiness="low">有点累</button>
        <button class="${readiness === "normal" ? "is-selected" : ""}" type="button" data-action="set-readiness" data-readiness="normal">正常</button>
        <button class="${readiness === "high" ? "is-selected" : ""}" type="button" data-action="set-readiness" data-readiness="high">精力好</button>
      </div>
    </div>

    ${strategyCard(strategy)}

    ${
      dueReview
        ? `<div class="review-banner">${icon("refresh")}<span><b>到期复习：</b>上次标记了「${escapeHtml(SKILL_LABELS[dueReview.skill])}」，今天会先用一个表达块重新调动。</span></div>`
        : ""
    }

    <div class="today-grid">
      <article class="mini-card">
        <span class="mini-icon">${icon("route")}</span>
        <strong>七段式课堂</strong>
        <span>回忆 → 听 → 跟读 → 角色扮演 → 纠错 → 迁移</span>
      </article>
      <article class="mini-card">
        <span class="mini-icon">${icon("target")}</span>
        <strong>今天的 Can-do</strong>
        <span>${escapeHtml(week.canDo)}</span>
      </article>
    </div>

    <div class="section-heading">
      <h2>先听三句</h2>
      <button type="button" data-route="phrasebook">打开句库</button>
    </div>
    ${week.phrases
      .slice(0, 3)
      .map(
        (phrase, index) => `<div class="phrase-preview">
          <span class="phrase-number">${String(index + 1).padStart(2, "0")}</span>
          <div class="phrase-preview-copy">
            <b>${escapeHtml(phrase.jp)}</b>
            <small>${escapeHtml(phrase.zh)}</small>
          </div>
          ${audioButton(phrase.jp)}
        </div>`,
      )
      .join("")}
    <p class="bottom-note">自适应结果来自你的练习表现，不是正式 JLPT 评级。真正的进步仍需要规律开口与真实交流。</p>
  </div>`;
}

function renderSession() {
  const week = WEEKS[session.week - 1];
  const day = week.days[session.day - 1];
  const phase = PHASES[session.phase];
  const progress = PHASES.map(
    (_, index) => `<span class="${index < session.phase ? "done" : index === session.phase ? "active" : ""}"></span>`,
  ).join("");

  return `<div class="page session-page">
    <div class="session-header">
      <div class="session-header-left">
        <button class="back-button" type="button" data-action="exit-session" aria-label="退出课堂">${icon("back")}</button>
        <div class="session-clock">
          <small>今日目标 60 分钟</small>
          <strong id="session-clock">${formatTime(session.seconds)}</strong>
        </div>
      </div>
      <span class="phase-count">${session.phase + 1} / ${PHASES.length}</span>
    </div>
    <div class="phase-progress">${progress}</div>
    <p class="lesson-kicker">第 ${week.n} 周 · 第 ${session.day} 天 · ${escapeHtml(phase.kicker)}</p>
    <h1 class="lesson-title">${escapeHtml(phase.title)}</h1>
    <p class="lesson-subtitle">${escapeHtml(day.title)}</p>
    <div class="phase-meta">
      <span class="pill red">${icon("clock")} 建议 ${phase.minutes} 分钟</span>
      <span class="pill indigo">${escapeHtml(week.scene)}</span>
    </div>
    ${phase.kicker === "WARM UP" ? strategyCard(getStrategy()) : ""}
    ${renderPhase(week)}
  </div>`;
}

function renderPhase(week) {
  switch (session.phase) {
    case 0:
      return renderWarmup(week);
    case 1:
      return renderDialogue(week);
    case 2:
      return renderShadowing(week);
    case 3:
      return renderRoleplay(week);
    case 4:
      return renderCorrection(week);
    case 5:
      return renderTransfer(week);
    case 6:
      return renderReview(week);
    default:
      return "";
  }
}

function renderWarmup(week) {
  const dueReview = getDueReview();
  return `
    ${
      dueReview
        ? `<div class="review-banner">${icon("refresh")}<span><b>定向复习：</b>${escapeHtml(SKILL_LABELS[dueReview.skill])}。先调用相关表达，再开始今天的任务。</span></div>`
        : ""
    }
    <div class="coach-note">${icon("lightbulb")}<p>请先朗读你的回答，再输入“刚才实际说出的内容”。不会时先空着，不要用查答案代替口头回忆。</p></div>
    ${week.warmup
      .map(
        (item, index) => `<article class="practice-card">
          <div class="practice-question">
            <span class="practice-index">${index + 1}</span>
            <p>${escapeHtml(item.prompt)}</p>
          </div>
          <button class="text-button" type="button" data-action="reveal-answer">说完了，查看示范</button>
          <div class="reveal-answer" hidden>
            <div class="jp-line">
              <b>${escapeHtml(item.model)}</b>
              ${audioButton(item.model)}
            </div>
          </div>
        </article>`,
      )
      .join("")}
    ${nextButton("进入场景输入")}
  `;
}

function renderDialogue(week) {
  const hasListened = session.listenRating !== null;
  return `
    <div class="coach-note">${icon("lightbulb")}<p>第一遍只听人物、地点和目的；第二遍再抓一个数字或关键表达。先别急着看中文。</p></div>
    <div class="dialogue-stage">
      <div class="dialogue-scene-label">${escapeHtml(week.scene)}</div>
      ${week.dialogue
        .map(
          (line) => `<div class="chat-row ${line.role === "learner" ? "learner" : ""}">
            <span class="avatar">${line.role === "learner" ? "你" : escapeHtml(line.speaker.slice(0, 1))}</span>
            <div class="bubble">
              <div class="bubble-head">
                <span class="bubble-speaker">${escapeHtml(line.speaker)}</span>
                <button class="bubble-speak" type="button" data-speak="${escapeHtml(line.jp)}">播放</button>
              </div>
              <p>${escapeHtml(line.jp)}</p>
              <small>${escapeHtml(line.zh)}</small>
            </div>
          </div>`,
        )
        .join("")}
      <p class="listen-prompt">听两遍后，先回答：谁在哪里、想完成什么？</p>
    </div>
    <div class="role-feedback">
      <span class="feedback-label">这次听懂的程度是？系统会据此调整解释量</span>
      ${ratingButtons("listen", session.listenRating)}
    </div>
    <div class="step-actions">
      <button class="button" type="button" data-action="play-dialogue">连续播放整段对话</button>
      <button class="button secondary" type="button" data-action="next-phase" ${hasListened ? "" : "disabled"}>进入影子跟读</button>
    </div>
  `;
}

function renderShadowing(week) {
  const focusPhrase = REMEDIES[getStrategy().skill];
  return `
    <div class="coach-note">${icon("lightbulb")}<p>跟读不是越快越好。每个表达块一口气说完，停顿时先保节奏，不逐字追求完美。</p></div>
    <div class="adaptive-change">${icon("target")}<span>今日跟读焦点：${escapeHtml(focusPhrase.title)}</span></div>
    <div class="chunk-list">
      ${week.phrases
        .slice(0, 5)
        .map(
          (phrase) => `<article class="chunk-card">
            <div>
              <b>${escapeHtml(phrase.jp)}</b>
              <small>${escapeHtml(phrase.zh)}</small>
            </div>
            ${audioButton(phrase.jp)}
          </article>`,
        )
        .join("")}
    </div>
    <div class="record-card">
      <button class="record-button" id="record-button" type="button" data-action="record" aria-label="开始录音">${icon("mic")}</button>
      <div class="record-copy">
        <b id="record-title">录 20–30 秒</b>
        <span id="record-status">录完回听一次，先检查有没有哪句断成碎片。</span>
        <audio class="recording-playback" id="recording-playback" controls hidden></audio>
      </div>
    </div>
    <div class="role-feedback">
      <span class="feedback-label">跟读后的真实感受</span>
      ${ratingButtons("shadow", session.shadowRating)}
    </div>
    <button class="button" type="button" data-action="next-phase" ${session.shadowRating ? "" : "disabled"}>进入角色扮演</button>
  `;
}

function renderRoleplay(week) {
  const round = week.roleplays[session.roleRound];
  const feedback = session.roleFeedback[session.roleRound] || { difficulty: null, blockers: [] };
  const strategy = getStrategy();
  const isFinal = session.roleRound === week.roleplays.length - 1;
  return `
    <div class="adaptive-card">
      <div class="adaptive-top">
        <span class="adaptive-badge">${icon("spark")}实时策略 · ${escapeHtml(strategy.mode)}</span>
        <small>每轮反馈后会重新排序训练重点</small>
      </div>
      <h3>${escapeHtml(strategy.title)}</h3>
      <p>${escapeHtml(strategy.body)}</p>
    </div>
    <div class="roleplay-shell">
      <div class="roleplay-top">
        <span class="roleplay-person">${escapeHtml(round.speaker.slice(0, 1))}</span>
        <div>
          <b>${escapeHtml(round.speaker)}</b>
          <small>${escapeHtml(round.subtitle)}</small>
        </div>
      </div>
      <div class="roleplay-body">
        <div class="roleplay-said">
          <small>对方说</small>
          <p>${escapeHtml(round.line)}</p>
          ${audioButton(round.line, "播放对方的话", "button soft")}
        </div>
        <div class="your-task">
          <small>YOUR TURN · 请直接开口</small>
          <p>${escapeHtml(round.task)}</p>
        </div>
        ${
          session.hintShown
            ? `<div class="hint-box"><p><b>${escapeHtml(round.hint)}</b><br />先用关键词组织，再用完整短句重新说一次。</p></div>`
            : `<button class="text-button" type="button" data-action="show-hint">卡住了，给我关键词</button>`
        }
        <textarea class="response-note" data-draft="role-${session.roleRound}" placeholder="说完后，可把刚才实际说出的内容记在这里（可选）">${escapeHtml(session.drafts[`role-${session.roleRound}`] || "")}</textarea>
        ${
          session.roleRevealed
            ? `<div class="hint-box">
                <p><b>示范：${escapeHtml(round.model)}</b><br />不用逐字背诵。保留你的意思，再完整说一遍。</p>
                ${audioButton(round.model, "播放示范", "button soft")}
              </div>
              <div class="role-feedback">
                <span class="feedback-label">这一轮对你来说有多难？</span>
                ${ratingButtons("role", feedback.difficulty)}
                <span class="feedback-label" style="margin-top: 13px">主要卡在哪里？可多选</span>
                <div class="blocker-chips">
                  ${BLOCKERS.map(
                    (item) => `<button class="blocker-chip ${feedback.blockers.includes(item.id) ? "is-selected" : ""}" type="button" data-action="toggle-blocker" data-blocker="${item.id}">${escapeHtml(item.label)}</button>`,
                  ).join("")}
                </div>
              </div>`
            : `<button class="button indigo" type="button" data-action="reveal-role">我说完了，对照示范</button>`
        }
      </div>
    </div>
    <div class="roleplay-progress">${week.roleplays.map((_, index) => `<span class="${index <= session.roleRound ? "active" : ""}"></span>`).join("")}</div>
    ${
      session.roleRevealed
        ? `<button class="button" type="button" data-action="next-role" ${feedback.difficulty ? "" : "disabled"}>${isFinal ? "完成三轮，进入纠错" : "完成这一轮，进入下一轮"}</button>`
        : ""
    }
  `;
}

function renderCorrection(week) {
  const strategy = getStrategy();
  const remedy = REMEDIES[strategy.skill];
  const matching = week.corrections.find((item) => item.skill === strategy.skill) || week.corrections[0];
  return `
    <div class="adaptive-change">${icon("brain")}<span>根据刚才的反馈，本次只优先处理「${escapeHtml(SKILL_LABELS[strategy.skill])}」，其余小偏差不挤占注意力。</span></div>
    <article class="practice-card">
      <p class="lesson-kicker">重点修复</p>
      <h2 style="margin: 5px 0 14px; font-family: var(--serif); font-size: 21px">${escapeHtml(remedy.title)}</h2>
      <p style="margin: 0; color: var(--ink-soft); font-size: 12px; line-height: 1.7">${escapeHtml(remedy.body)}</p>
      <div class="chunk-card" style="margin-top: 13px">
        <div><b>${escapeHtml(remedy.phrase)}</b><small>${escapeHtml(remedy.zh)}</small></div>
        ${audioButton(remedy.phrase)}
      </div>
    </article>
    <article class="practice-card">
      <div class="practice-question">
        <span class="practice-index">!</span>
        <p><b>高价值对照</b><br />${escapeHtml(matching.bad)} → ${escapeHtml(matching.good)}</p>
      </div>
      <p class="translation">${escapeHtml(matching.why)}</p>
      ${audioButton(matching.good, "播放自然说法", "button soft")}
    </article>
    <div class="coach-note">${icon("refresh")}<p>现在回到刚才的角色。不要整段重背，只把影响理解或礼貌的那一处换成自然说法，再完整说一遍。</p></div>
    ${nextButton("进入条件迁移")}
  `;
}

function renderTransfer(week) {
  const strategy = getStrategy();
  return `
    <div class="coach-note">${icon("route")}<p>${escapeHtml(week.transfer.setup)}</p></div>
    <article class="practice-card">
      <div class="practice-question">
        <span class="practice-index">→</span>
        <p><b>无提示任务</b><br />${escapeHtml(week.transfer.task)}</p>
      </div>
      ${
        strategy.mode === "回练"
          ? `<div class="hint-box"><p><b>自适应提示：${escapeHtml(week.transfer.hint)}</b><br />系统检测到当前负担偏高，保留这组关键词。</p></div>`
          : `<button class="text-button" type="button" data-action="show-transfer-hint">确实卡住后再看关键词</button>
             <div class="hint-box" id="transfer-hint" hidden><p><b>${escapeHtml(week.transfer.hint)}</b></p></div>`
      }
      <textarea class="response-note" data-draft="transfer" placeholder="先说出口；如果愿意，再把刚才实际说出的话记在这里。">${escapeHtml(session.drafts.transfer || "")}</textarea>
      <button class="text-button" type="button" data-action="reveal-transfer">查看示范并对照</button>
      <div class="reveal-answer" id="transfer-model" hidden>
        <div class="jp-line">
          <b>${escapeHtml(week.transfer.model)}</b>
          ${audioButton(week.transfer.model)}
        </div>
      </div>
    </article>
    ${nextButton("完成课堂，进入复盘")}
  `;
}

function renderReview(week) {
  const key = dayKey(session.week, session.day);
  return `
    <div class="complete-card">
      <div class="complete-mark">${icon(session.seconds > 0 ? "check" : "spark")}</div>
      <h2>最后一分钟，留给自己</h2>
      <p>完成不是“走完页面”，而是能说出下一次真正会用的一句话。</p>
      <div class="complete-stats">
        <div><strong>${Math.max(1, Math.round(session.seconds / 60))}</strong><span>本次分钟</span></div>
        <div><strong>${week.roleplays.length}</strong><span>角色轮次</span></div>
        <div><strong>${escapeHtml(SKILL_LABELS[getStrategy().skill])}</strong><span>当前重点</span></div>
      </div>
    </div>
    <div class="reflection-block">
      <h3>今天真正能直接用的一句</h3>
      <p>从今天的表达块里选一句，不看上方内容，完整说出它。</p>
      <textarea class="note-field" data-draft="takeaway" placeholder="例如：すみません、もう一度お願いします。">${escapeHtml(session.drafts.takeaway || "")}</textarea>
    </div>
    <div class="reflection-block">
      <h3>下次最容易继续卡住的地方</h3>
      <p>选一个最需要提前处理的，而不是一次修完所有问题。</p>
      <div class="blocker-chips">
        ${BLOCKS_FOR_REVIEW()}
      </div>
    </div>
    <div class="reflection-block">
      <h3>下次可用时长</h3>
      <p>系统会据此安排 10、20 或 60 分钟的训练结构。</p>
      <div class="rating-row">
        ${[10, 20, 60]
          .map((minutes) => `<button class="rating-button ${(session.drafts.available || 60) === minutes ? "is-selected" : ""}" type="button" data-action="set-availability" data-minutes="${minutes}">${minutes} 分钟</button>`)
          .join("")}
      </div>
    </div>
    <button class="button" type="button" data-action="finish-session">保存表现，更新下一课策略</button>
    <p class="bottom-note">比较的是你的可观察练习表现，不替代真人教师、语伴或正式等级考试。</p>
  `;
}

function BLOCKS_FOR_REVIEW() {
  const selected = session.drafts.nextBlocker || "";
  return BLOCKERS.map(
    (item) => `<button class="blocker-chip ${selected === item.id ? "is-selected" : ""}" type="button" data-action="set-next-blocker" data-blocker="${item.id}">${escapeHtml(item.label)}</button>`,
  ).join("");
}

function ratingButtons(kind, selected) {
  const labels = kind === "listen" ? ["没抓住", "大概懂", "很清楚"] : kind === "shadow" ? ["跟不顺", "还凑合", "节奏稳"] : ["很吃力", "刚刚好", "很轻松"];
  return `<div class="rating-row">
    ${labels
      .map(
        (label, index) => `<button class="rating-button ${Number(selected) === index + 1 ? "is-selected" : ""}" type="button" data-action="set-rating" data-kind="${kind}" data-value="${index + 1}">${escapeHtml(label)}</button>`,
      )
      .join("")}
  </div>`;
}

function nextButton(label) {
  return `<div class="step-actions"><button class="button" type="button" data-action="next-phase">${escapeHtml(label)} ${icon("arrow")}</button></div>`;
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

function renderCourse() {
  const totalDone = state.completed.length;
  return `<div class="page">
    <p class="eyebrow">8-WEEK ROUTE</p>
    <h1 class="page-title">八周，<br />练会生存口语。</h1>
    <p class="page-lead">课程按真实任务组织。系统会根据你的卡点和可用时长调整顺序，不要求机械追赶日历。</p>
    <div class="course-intro">
      当前完成 ${totalDone} / 56 天。目标不是背完全部句子，而是能在旅行和日常生活中完成任务、主动追问，并在卡住时修复交流。
    </div>
    ${WEEKS.map((week) => {
      const open = expandedWeek === week.n;
      const weekDone = week.days.filter((_, index) => state.completed.includes(dayKey(week.n, index + 1))).length;
      return `<section class="week-accordion ${open ? "is-open" : ""}">
        <button class="week-toggle" type="button" data-action="toggle-week" data-week="${week.n}" aria-expanded="${open}">
          <span class="week-number">W${week.n}</span>
          <span class="week-toggle-copy">
            <b>${escapeHtml(week.title)}</b>
            <small>${weekDone} / 7 天 · ${escapeHtml(week.canDo)}</small>
          </span>
          <svg class="chevron" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>
        </button>
        <div class="week-content">
          <div class="week-cando"><b>本阶段成功条件：</b>${escapeHtml(week.canDo)}</div>
          ${week.days
            .map((day, index) => {
              const key = dayKey(week.n, index + 1);
              const active = state.week === week.n && state.day === index + 1;
              return `<button class="day-row ${state.completed.includes(key) ? "done" : ""} ${active ? "active" : ""}" type="button" data-action="select-day" data-week="${week.n}" data-day="${index + 1}">
                <span class="day-row-index">${state.completed.includes(key) ? "✓" : index + 1}</span>
                <span class="day-row-copy"><b>第 ${index + 1} 天 · ${escapeHtml(day.title)}</b><small>${escapeHtml(day.goal)}</small></span>
                ${icon("arrow")}
              </button>`;
            })
            .join("")}
        </div>
      </section>`;
    }).join("")}
    <p class="bottom-note">完成 8 周且通过最终验收，表示已具备受控场景下的 A2 生存交流能力，不等于 B1 或母语式流利。</p>
  </div>`;
}

function renderPhrasebook() {
  return `<div class="page">
    <p class="eyebrow">POCKET PHRASES</p>
    <h1 class="page-title">需要时，<br />马上调出来。</h1>
    <p class="page-lead">按 8 周场景整理的可用表达块。每句都可以独立播放，建议先听、再说。</p>
    ${WEEKS.map(
      (week) => `<section class="week-group">
        <div class="week-group-head"><span>W${week.n}</span><hr /><span>${escapeHtml(week.title)}</span></div>
        ${week.phrases
          .map(
            (phrase) => `<div class="phrase-preview">
              <span class="phrase-number">${week.n}</span>
              <div class="phrase-preview-copy">
                <b>${escapeHtml(phrase.jp)}</b>
                <small>${escapeHtml(phrase.zh)}</small>
              </div>
              ${audioButton(phrase.jp)}
            </div>`,
          )
          .join("")}
      </section>`,
    ).join("")}
  </div>`;
}

function renderProgress() {
  const percent = Math.round((state.completed.length / 56) * 100);
  const notes = Object.entries(state.notes).sort();
  const lastNote = notes[notes.length - 1];
  const strategy = getStrategy();
  return `<div class="page">
    <p class="eyebrow">YOUR SIGNALS</p>
    <h1 class="page-title">让进步有迹可循。</h1>
    <p class="page-lead">这里显示的是练习掌握度，不代表正式日语等级。分数会随任务表现、卡点和间隔复习持续变化。</p>
    <section class="progress-hero">
      <div class="progress-ring" style="--value: ${percent}">
        <div class="progress-ring-copy"><strong>${percent}%</strong><small>8 周进度</small></div>
      </div>
      <div class="progress-summary">
        <h2>${state.completed.length} 天已完成</h2>
        <p>当前策略：${escapeHtml(strategy.mode)}<br />下一步重点：${escapeHtml(SKILL_LABELS[strategy.skill])}</p>
      </div>
    </section>
    <div class="stat-strip">
      <div><strong>${state.sessions}</strong><span>训练次数</span></div>
      <div><strong>${state.totalMinutes}</strong><span>累计分钟</span></div>
      <div><strong>${state.streak}</strong><span>连续天数</span></div>
    </div>
    <div class="section-heading"><h2>能力信号</h2><button type="button" data-route="course">去看课程</button></div>
    <section class="practice-card">
      <div class="skill-grid">
        ${Object.entries(state.skills)
          .map(
            ([skill, value]) => `<div class="skill-row">
              <b>${escapeHtml(SKILL_LABELS[skill])}</b>
              <div class="skill-track"><i style="width: ${Math.max(4, Math.min(100, value))}%"></i></div>
              <span>${Math.round(value)}</span>
            </div>`,
          )
          .join("")}
      </div>
    </section>
    <div class="insight-card">
      <small>下一次自动优化</small>
      <p>${escapeHtml(strategy.title)}。${escapeHtml(strategy.body)}</p>
    </div>
    ${
      lastNote
        ? `<div class="history-note"><b>最近一次复盘</b>${escapeHtml(lastNote[1].takeaway || "还没有写下带走的一句话。")}</div>`
        : ""
    }
    <div class="section-heading"><h2>56 天路径</h2><span class="pill">${state.completed.length} / 56</span></div>
    <section class="practice-card">
      ${WEEKS.map((week) => {
        const done = week.days.filter((_, index) => state.completed.includes(dayKey(week.n, index + 1))).length;
        return `<div class="week-progress-row">
          <b>第 ${week.n} 周</b>
          <div class="week-progress-track"><i style="width: ${(done / 7) * 100}%"></i></div>
          <span>${done}/7</span>
        </div>`;
      }).join("")}
      <div class="course-map" style="margin-top: 17px">
        ${WEEKS.flatMap((week) =>
          week.days.map((_, index) => {
            const key = dayKey(week.n, index + 1);
            const active = state.week === week.n && state.day === index + 1;
            return `<span class="${state.completed.includes(key) ? "done" : active ? "active" : ""}">${index + 1}</span>`;
          }),
        ).join("")}
      </div>
    </section>
    <div class="settings-zone">
      <button class="text-danger" type="button" data-action="reset-progress">清除本机练习记录并重新开始</button>
    </div>
  </div>`;
}

function setRoute(nextRoute) {
  if (route === "session" && nextRoute !== "session") pauseTimer();
  route = nextRoute;
  if (nextRoute === "course") expandedWeek = state.week;
  render();
  document.getElementById("main-content").scrollTop = 0;
}

function render() {
  const header = document.getElementById("app-header");
  const nav = document.getElementById("bottom-nav");
  const main = document.getElementById("main-content");
  const isSession = route === "session";
  header.hidden = isSession;
  nav.hidden = isSession;
  document.querySelectorAll(".nav-item").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.route === route);
  });

  if (route === "course") main.innerHTML = renderCourse();
  else if (route === "phrasebook") main.innerHTML = renderPhrasebook();
  else if (route === "progress") main.innerHTML = renderProgress();
  else if (route === "session") main.innerHTML = renderSession();
  else main.innerHTML = renderHome();

  if (isSession) ensureTimer();
}

function openSession(weekNumber = state.week, dayNumber = state.day, forceReset = false) {
  const key = dayKey(weekNumber, dayNumber);
  if (forceReset || session.inProgressKey !== key) {
    session = createEmptySession();
    session.week = weekNumber;
    session.day = dayNumber;
    session.inProgressKey = key;
    const due = getDueReview();
    session.reviewSkill = due?.skill || null;
  }
  state.week = weekNumber;
  state.day = dayNumber;
  saveState();
  route = "session";
  render();
  document.getElementById("main-content").scrollTop = 0;
  ensureTimer();
}

function ensureTimer() {
  if (session.timerId || route !== "session") return;
  session.timerId = window.setInterval(() => {
    if (route !== "session") return;
    session.seconds += 1;
    const clock = document.getElementById("session-clock");
    if (clock) clock.textContent = formatTime(session.seconds);
  }, 1000);
}

function pauseTimer() {
  if (session.timerId) window.clearInterval(session.timerId);
  session.timerId = null;
}

function nextPhase() {
  if (session.phase < PHASES.length - 1) {
    session.phase += 1;
    session.roleRevealed = false;
    session.hintShown = false;
    render();
    document.getElementById("main-content").scrollTop = 0;
  }
}

function setRating(kind, value) {
  if (kind === "listen") session.listenRating = value;
  if (kind === "shadow") session.shadowRating = value;
  if (kind === "role") {
    const feedback = session.roleFeedback[session.roleRound] || { difficulty: null, blockers: [] };
    feedback.difficulty = value;
    session.roleFeedback[session.roleRound] = feedback;
  }
  render();
  const main = document.getElementById("main-content");
  main.scrollTop = main.scrollHeight;
}

function toggleBlocker(blocker) {
  const feedback = session.roleFeedback[session.roleRound] || { difficulty: null, blockers: [] };
  if (feedback.blockers.includes(blocker)) {
    feedback.blockers = feedback.blockers.filter((item) => item !== blocker);
  } else {
    feedback.blockers = [...feedback.blockers, blocker];
  }
  session.roleFeedback[session.roleRound] = feedback;
  render();
  const main = document.getElementById("main-content");
  main.scrollTop = main.scrollHeight;
}

function nextRole() {
  const week = WEEKS[session.week - 1];
  if (session.roleRound < week.roleplays.length - 1) {
    session.roleRound += 1;
    session.roleRevealed = false;
    session.hintShown = false;
    render();
    document.getElementById("main-content").scrollTop = 0;
  } else {
    session.phase = 4;
    session.hintShown = false;
    render();
    document.getElementById("main-content").scrollTop = 0;
  }
}

function getDueReview() {
  return state.reviewQueue.find((item) => item.dueAt <= state.sessions);
}

function calculateSessionScore() {
  const roleValues = Object.values(session.roleFeedback)
    .map((item) => Number(item.difficulty))
    .filter(Boolean);
  const avgRating = roleValues.length ? roleValues.reduce((sum, value) => sum + value, 0) / roleValues.length : 2;
  const blockers = [...new Set(getLatestBlockers(session.roleFeedback))];
  const roleCompletion = roleValues.length / WEEKS[session.week - 1].roleplays.length;
  const listening = session.listenRating || 2;
  const shadow = session.shadowRating || 2;
  const score = Math.round(50 + (avgRating - 2) * 18 - blockers.length * 5 + roleCompletion * 12 + (listening - 2) * 5 + (shadow - 2) * 5);
  return { score: Math.max(20, Math.min(96, score)), avgRating, blockers, roleCompletion };
}

function updateSkills(result) {
  const difficultyDelta = (result.avgRating - 2) * 4;
  state.skills.speaking += difficultyDelta;
  state.skills.listening += (session.listenRating - 2) * 6;
  state.skills.pronunciation += (session.shadowRating - 2) * 6;

  for (const blocker of result.blockers) {
    if (Object.prototype.hasOwnProperty.call(state.skills, blocker)) {
      state.skills[blocker] -= 4;
    }
  }
  if (!result.blockers.length) {
    state.skills.repair += 2;
  }
  Object.keys(state.skills).forEach((skill) => {
    state.skills[skill] = Math.max(12, Math.min(92, state.skills[skill]));
  });
}

function updateStreak() {
  const now = new Date();
  const today = localDateKey(now);
  if (state.lastPracticeDate === today) return;
  const yesterdayDate = new Date(now);
  yesterdayDate.setDate(now.getDate() - 1);
  state.streak = state.lastPracticeDate === localDateKey(yesterdayDate) ? state.streak + 1 : 1;
  state.lastPracticeDate = today;
}

function localDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function finishSession() {
  pauseTimer();
  const result = calculateSessionScore();
  const key = dayKey(session.week, session.day);
  const week = WEEKS[session.week - 1];
  const day = week.days[session.day - 1];
  const minutes = Math.max(1, Math.round(session.seconds / 60));
  state.sessions += 1;
  state.totalMinutes += minutes;
  updateStreak();
  updateSkills(result);

  const nextBlocker = session.drafts.nextBlocker || result.blockers[0] || weakestSkill();
  const reviewSkill = result.blockers[0] || nextBlocker;
  if (result.score < 60 || result.blockers.length) {
    if (!state.reviewQueue.some((item) => item.key === key && item.skill === reviewSkill)) {
      state.reviewQueue.push({
        key,
        skill: reviewSkill,
        dueAt: state.sessions + (result.score < 60 ? 0 : 1),
      });
    }
  }
  state.reviewQueue = state.reviewQueue.filter((item) => item.dueAt <= state.sessions + 8);

  const passed = result.score >= 60;
  if (passed && !state.completed.includes(key)) state.completed.push(key);
  const note = {
    date: localDateKey(new Date()),
    week: session.week,
    day: session.day,
    title: day.title,
    takeaway: (session.drafts.takeaway || "").trim(),
    nextBlocker,
    available: Number(session.drafts.available || 60),
    score: result.score,
    strategy: getStrategy().mode,
  };
  state.notes[`${key}-${Date.now()}`] = note;
  state.performance.push({
    key,
    score: result.score,
    avgRating: result.avgRating,
    blockers: result.blockers,
    listenRating: session.listenRating,
    shadowRating: session.shadowRating,
    minutes,
    date: localDateKey(new Date()),
  });
  state.performance = state.performance.slice(-30);

  const completedWeek = session.week;
  const completedDay = session.day;
  const completionStrategy = result.score >= 85
    ? "表现稳定：下一课减少提示，并增加一个未预告的换条件。"
    : passed
      ? "任务已通过：下一课先用一个短复习调动今天的关键表达，再进入新场景。"
      : "任务尚未稳定：不推进新课，下一次先回练同一目标并保留提示。";

  if (passed) {
    if (session.day < 7) {
      state.week = session.week;
      state.day = session.day + 1;
    } else if (session.week < 8) {
      state.week = session.week + 1;
      state.day = 1;
    }
  } else {
    state.week = session.week;
    state.day = session.day;
  }

  session.inProgressKey = null;
  saveState();
  route = "home";
  render();
  document.getElementById("main-content").scrollTop = 0;
  showToast(`第 ${completedWeek} 周第 ${completedDay} 天已复盘 · ${completionStrategy}`, 5600);
}

function resetProgress() {
  const confirmed = window.confirm("确定清除这台设备上的全部练习记录吗？此操作无法撤销。");
  if (!confirmed) return;
  state = clone(DEFAULT_STATE);
  session = createEmptySession();
  pauseTimer();
  saveState();
  route = "home";
  render();
  showToast("练习记录已清除，将从第 1 周第 1 天重新开始。");
}

function speak(text) {
  if (!("speechSynthesis" in window)) {
    showToast("当前浏览器不支持日语语音播放。");
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "ja-JP";
  utterance.rate = 0.82;
  utterance.pitch = 1;
  const voice = window.speechSynthesis.getVoices().find((item) => item.lang.toLowerCase().startsWith("ja"));
  if (voice) utterance.voice = voice;
  window.speechSynthesis.speak(utterance);
}

function playDialogue() {
  const lines = WEEKS[session.week - 1].dialogue;
  if (!("speechSynthesis" in window)) {
    showToast("当前浏览器不支持日语语音播放。");
    return;
  }
  window.speechSynthesis.cancel();
  lines.forEach((line) => {
    const utterance = new SpeechSynthesisUtterance(line.jp);
    utterance.lang = "ja-JP";
    utterance.rate = 0.82;
    const voice = window.speechSynthesis.getVoices().find((item) => item.lang.toLowerCase().startsWith("ja"));
    if (voice) utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
  });
}

function showToast(message, duration = 2600) {
  const toast = document.getElementById("toast");
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("is-visible");
  toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), duration);
}

let mediaRecorder = null;
let recordingChunks = [];
let recordingStream = null;
let recordingStart = 0;

async function toggleRecording() {
  const button = document.getElementById("record-button");
  if (!button) return;
  if (mediaRecorder && mediaRecorder.state === "recording") {
    mediaRecorder.stop();
    return;
  }
  if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
    showToast("当前浏览器不能录音，请直接跟读并自己数 20–30 秒。");
    return;
  }
  try {
    recordingStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    recordingChunks = [];
    mediaRecorder = new MediaRecorder(recordingStream);
    recordingStart = Date.now();
    mediaRecorder.addEventListener("dataavailable", (event) => {
      if (event.data.size) recordingChunks.push(event.data);
    });
    mediaRecorder.addEventListener("stop", () => {
      const blob = new Blob(recordingChunks, { type: mediaRecorder.mimeType || "audio/webm" });
      const playback = document.getElementById("recording-playback");
      if (playback) {
        playback.src = URL.createObjectURL(blob);
        playback.hidden = false;
      }
      button.classList.remove("is-recording");
      button.innerHTML = icon("mic");
      const title = document.getElementById("record-title");
      const status = document.getElementById("record-status");
      if (title) title.textContent = `已录 ${Math.round((Date.now() - recordingStart) / 1000)} 秒`;
      if (status) status.textContent = "回听一次：有没有一句断成很多碎片？";
      recordingStream?.getTracks().forEach((track) => track.stop());
      mediaRecorder = null;
      recordingStream = null;
    });
    mediaRecorder.start();
    button.classList.add("is-recording");
    button.innerHTML = icon("stop");
    const title = document.getElementById("record-title");
    const status = document.getElementById("record-status");
    if (title) title.textContent = "正在录音…";
    if (status) status.textContent = "再说一句，然后点一下停止。";
  } catch {
    showToast("无法使用麦克风。请允许录音权限，或直接大声跟读。");
  }
}

document.addEventListener("click", (event) => {
  const speakTarget = event.target.closest("[data-speak]");
  if (speakTarget) {
    speak(speakTarget.dataset.speak);
    return;
  }

  const routeTarget = event.target.closest("[data-route]");
  if (routeTarget) {
    setRoute(routeTarget.dataset.route);
    return;
  }

  const actionTarget = event.target.closest("[data-action]");
  if (!actionTarget) return;
  const action = actionTarget.dataset.action;

  if (action === "start-session") openSession(state.week, state.day, false);
  if (action === "set-readiness") {
    state.dailyReadiness[localDateKey(new Date())] = actionTarget.dataset.readiness;
    saveState();
    render();
  }
  if (action === "exit-session") setRoute("home");
  if (action === "reveal-answer") {
    const answer = actionTarget.closest(".practice-card").querySelector(".reveal-answer");
    answer.hidden = false;
    actionTarget.hidden = true;
  }
  if (action === "next-phase") nextPhase();
  if (action === "play-dialogue") playDialogue();
  if (action === "set-rating") setRating(actionTarget.dataset.kind, Number(actionTarget.dataset.value));
  if (action === "show-hint") {
    session.hintShown = true;
    render();
  }
  if (action === "reveal-role") {
    session.roleRevealed = true;
    render();
    const main = document.getElementById("main-content");
    main.scrollTop = main.scrollHeight;
  }
  if (action === "toggle-blocker") toggleBlocker(actionTarget.dataset.blocker);
  if (action === "next-role") nextRole();
  if (action === "show-transfer-hint") {
    document.getElementById("transfer-hint").hidden = false;
    actionTarget.hidden = true;
  }
  if (action === "reveal-transfer") {
    document.getElementById("transfer-model").hidden = false;
    actionTarget.hidden = true;
  }
  if (action === "set-next-blocker") {
    session.drafts.nextBlocker = actionTarget.dataset.blocker;
    render();
  }
  if (action === "set-availability") {
    session.drafts.available = Number(actionTarget.dataset.minutes);
    render();
  }
  if (action === "finish-session") finishSession();
  if (action === "toggle-week") {
    const number = Number(actionTarget.dataset.week);
    expandedWeek = expandedWeek === number ? null : number;
    render();
  }
  if (action === "select-day") {
    openSession(Number(actionTarget.dataset.week), Number(actionTarget.dataset.day), true);
  }
  if (action === "reset-progress") resetProgress();
  if (action === "record") toggleRecording();
});

document.addEventListener("input", (event) => {
  if (!event.target.matches("[data-draft]")) return;
  session.drafts[event.target.dataset.draft] = event.target.value;
});

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  document.getElementById("install-button").hidden = false;
});

const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
const isStandalone =
  window.matchMedia?.("(display-mode: standalone)").matches || navigator.standalone === true;
if (isIOS && !isStandalone) {
  document.getElementById("install-button").hidden = false;
}

document.getElementById("install-button").addEventListener("click", async () => {
  if (!deferredInstallPrompt) {
    showToast("iPhone 请在 Safari 中点击“分享”，再选择“添加到主屏幕”。");
    return;
  }
  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  document.getElementById("install-button").hidden = true;
});

window.addEventListener("appinstalled", () => {
  deferredInstallPrompt = null;
  document.getElementById("install-button").hidden = true;
  showToast("已添加到主屏幕。");
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden && route === "session") pauseTimer();
  if (!document.hidden && route === "session") ensureTimer();
});

if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {});
  });
}

render();
