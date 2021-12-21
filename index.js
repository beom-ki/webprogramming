const express = require("express");
const fs = require("fs");
const mongoose = require("mongoose");
const crypto = require("crypto");

const { constantManager, mapManager } = require("./datas/Manager");
const { Player } = require("./models/Player");
const { Item } = require("./models/Item");

const app = express();
app.use(express.urlencoded({ extended: true }));
app.set("views", __dirname + "/views");
app.set("view engine", "ejs");
app.engine("html", require("ejs").renderFile);

// mongoose.connect(
//     "mongodb+srv://tester123:tester123@cluster0.ye4cg.mongodb.net/myFirstDatabase?",
//     { useNewUrlParser: true, useUnifiedTopology: true }
// );

mongoose.connect(
    "mongodb+srv://final:final@final.d2h19.mongodb.net/myFirstDatabase?retryWrites=true&w=majority",
    { useNewUrlParser: true, useUnifiedTopology: true }
);

const authentication = async (req, res, next) => {
  const { authorization } = req.headers;
  if (!authorization) return res.sendStatus(401);
  const [bearer, key] = authorization.split(" ");
  if (bearer !== "Bearer") return res.sendStatus(401);
  const player = await Player.findOne({ key });
  if (!player) return res.sendStatus(401);

  req.player = player;
  next();
};

app.get("/", (req, res) => {
  res.render("index", { gameName: constantManager.gameName });
});

app.get("/game", (req, res) => {
  res.render("game");
});

app.post("/signup", async (req, res) => {
  const { name } = req.body;

  if (await Player.exists({ name })) {
    return res.status(400).send({ error: "Player already exists" });
  }

  const player = new Player({
    name,
    maxHP: 50,
    HP: 50,
    str: 10,
    def: 10,
    x: 0,
    y: 0,
    randomStat: 5
  });

  const key = crypto.randomBytes(24).toString("hex");
  player.key = key;

  await player.save();

  return res.send({ key });
});

app.get("/randomStat", (req,res)=>{
  res.render("randomStat");
})

app.post("/confirm_stat", authentication, async(req, res)=>{
  const {choice} = req.body;
  const player = req.player;

  const getRandomInt = (min, max) => {
    min = Math.ceil(min);
    max = Math.ceil(max);
    return Math.floor(Math.random()*(max-min)) + min;
  }

  if (choice==="retry" && player.randomStat > 0) {
    player.maxHP = getRandomInt(10,100);
    player.HP = player.maxHP;
    player.str = getRandomInt(5,30);
    player.def = getRandomInt(5,30);
    player.randomStat -= 1;

    await player.save();
  } else if (choice==="retry" && player.randomStat === 0){
    console.log('기회를 모두 소진하였습니다.')
  }

  return res.send({player});
});

app.post("/action", authentication, async (req, res) => {
  const { action } = req.body;
  const player = req.player;
  let event = null;
  let field = null;
  if (action === "query") {
    field = mapManager.getField(req.player.x, req.player.y);
    const actions = [];
    let itemId_count = [0, 0, 0, 0, 0];
    field.canGo.forEach((direction, i) => {
      if (direction === 1) {
        actions.push({
          url: "/action",
          text: i,
          params: { direction: i, origin: false, action: "move" }
        });
      }
    });
    event = { description: "몸 속의 시작점이다." };
    return res.send({ player, field, event, actions, itemId_count });
  } else if (action === "move") {
    const origin = req.body.origin;   // 사망 후 원점
    let x = 0;
    let y = 0;

    if (origin !== "true") {
      const direction = parseInt(req.body.direction, 0); // 0 북. 1 동 . 2 남. 3 서.
      x = req.player.x;
      y = req.player.y;
      if (direction === 0) {
        y -= 1;
      } else if (direction === 1) {
        x += 1;
      } else if (direction === 2) {
        y += 1;
      } else if (direction === 3) {
        x -= 1;
      } else {
        res.sendStatus(400);
      }
    }
    field = mapManager.getField(x, y);
    if (!field) res.sendStatus(400);
    player.x = x;
    player.y = y;

    // 이벤트 랜덤으로 발생
    const events = field.events;
    const actions = [];
    const event_prob = events
        .map((e, i) => Array(e.prob * 10).fill(i))
        .reduce((c, v) => c.concat(v), []);
    const event_index =
        event_prob[Math.floor(Math.random() * event_prob.length)];
    const _event = events[event_index];

    const item_list = await Item.find({ player });

    if (_event.type === "battle") {
      const monsters = JSON.parse(fs.readFileSync("./datas/monsters.json"));
      const monster_prob = monsters
          .map((e, i) => Array(e.prob * 10).fill(i))
          .reduce((c, v) => c.concat(v), []);
      const monster_index =
          monster_prob[Math.floor(Math.random() * monster_prob.length)];
      const _monster = monsters[monster_index]; //몬스터들도 랜덤 출현
      event = {
        description: `${_monster.name}와 마주쳐 싸움을 벌였다.`,
        type: "battle",
        monster: _monster
      }; // monster 능력치 보이게 해야한다.
      // player.incrementHP(-1);

      if (player.HP <= 0) {
        player.x = 0;
        player.y = 0;
        player.HP = player.maxHP
        item_list.splice(Math.floor(Math.random()*item_list.length), 1);
      }

      if (player.exp > 100) {
        player.exp -= 100;
        player.level += 1;
        player.str += 5;
        player.def += 5;
        player.maxHP += 5;
      }
    } else if (_event.type === "recovery") {
      event = {
        description: "포션을 획득해 체력을 회복했다.",
        type: "recovery"
      };
      player.incrementHP(1);
    } else if (_event.type === "item") {
      const items = JSON.parse(fs.readFileSync("./datas/items.json"));
      const _item = items[Math.floor(Math.random() * items.length)];
      event = {
        description: `${_item.name} 아이템을 획득했다.`,
        type: "item"
      };

      const item = new Item({
        itemId: _item.id,
        player
      });
      // TODO: item 별 능력치 변화 구현
      await item.save();
    } else if (_event.type === "random") {
      const random_events = events[4].detail;
      const _random =
          random_events[Math.floor(Math.random() * random_events.length)];
      event = {
        description: `랜덤 이벤트 : ${_random.type} 발생!`,
        type: "random"
      }; // TODO : 랜덤이벤트 능력치 구현
    } else {
      event = {
        description: '아무일도 일어나지 않았다.',
        type: "nothing"
      };
    }


    await player.save();
    field.canGo.forEach((direction, i) => {
      if (direction === 1) {
        actions.push({
          url: "/action",
          text: i,
          params: { direction: i, action: "move" }
        });
      }
    });


    const itemId_list = item_list.map((e) => e.itemId);
    const itemId_count = [];
    let i = 1;
    while (i < 6) {
      itemId_count.push(itemId_list.filter((x) => x === i).length);
      i += 1;
    }

    return res.send({ player, field, event, actions, itemId_count });
  } else if (action === "battle") {
    const damage = parseFloat(req.body.damage);
    const dead = req.body.dead;

    if (dead === "false") {
      player.incrementHP(-damage);
    } else if (dead === "true") {
      player.HP = player.maxHP;
    }

    await player.save();
  }
});

app.listen(3000);
