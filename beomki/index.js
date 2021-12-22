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

    // const item_list = await Item.find({ player });

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
      };


    } else if (_event.type === "recovery") {
      let recoveryNum = Math.floor(Math.random() * 10);
      player.incrementHP(recoveryNum);

      event = {
        description: `포션을 획득해 ${recoveryNum}의 체력을 회복했다.`,
        type: "recovery"
      };
    } else if (_event.type === "item") {
      const items = JSON.parse(fs.readFileSync("./datas/items.json"));
      const randItemNum = Math.floor(Math.random() * items.length);
      const _item = items[randItemNum];
      event = {
        description: `${_item.name} 아이템을 획득했다.`,
        type: "item"
      };

      const item = new Item({
        itemId: _item.id,
        player
      });


      if (randItemNum === 0){
        player.def += Number(items[0].def);
      } else if(randItemNum === 1){
        player.str += Number(items[1].str);
      } else if(randItemNum ===2){
        player.incrementHP(Number(items[2].HP))
      } else if(randItemNum ===3){
        player.exp += Number(items[3].exp);
      } else if(randItemNum === 4){
        player.maxHP += Number(items[4].maxHP);
      }

      await item.save();
    } else if (_event.type === "random") {
      const random_events = events[4].detail;
      const _random =
          random_events[Math.floor(Math.random() * random_events.length)];
      event = {
        description: `랜덤 이벤트 : ${_random.type} 발생!`,
        type: "random"
      };

      if(_random.type === 'mad'){
        event.description += ': 공격력 3 증가, 방어력 1 감소'
        player.str += 3;
        player.def -= 1;
      } else if(_random.type === 'shield'){
        event.description += ': 공격력 1 감소, 방어력 3 증가'
        player.str -= 1;
        player.def += 3;
      } else if(_random.type === 'teleport'){
        const x_new = Math.floor(Math.random() * 10);
        const y_new = Math.floor(Math.random() * 10);
        event.description += `: (${x_new},${y_new})로 이동`
        player.x = x_new;
        player.y = y_new;
      }
    } else {
      event = {
        description: '아무일도 일어나지 않았다.',
        type: "nothing"
      };
    }

    if (player.exp > 100) {
      player.exp -= 100;
      player.level += 1;
      player.str += 5;
      player.def += 5;
      player.maxHP += 5;
    } // 밖으로 안 빼주면 전투할 때만 레벨업 한다.

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

    const item_list = await Item.find({ player });
    const itemId_list = item_list.map((e) => e.itemId);
    const itemId_count = [];
    let i = 1;
    while (i < 6) {
      itemId_count.push(itemId_list.filter((x) => x === i).length);
      i += 1;
    }

    return res.send({ player, field, event, actions, itemId_count });
  } else if (action === "battle") {


    const item_list = await Item.find({ player });


    const damage = parseFloat(req.body.damage);
    const dead = req.body.dead;
    const exp = req.body.exp;

    if (dead === "false") {
      player.incrementHP(-damage);
    } else if (dead === "true") {
      player.HP = player.maxHP;
      const items = JSON.parse(fs.readFileSync("./datas/items.json"));
      const lostItem = item_list.splice(Math.floor(Math.random()*item_list.length), 1);
      await Item.deleteOne({player, itemId: lostItem[0].itemId});
      if (lostItem[0].itemId === 1){
        player.def -= items[0].def;
      } else if(lostItem[0].itemId === 2){
        player.str -= items[1].str;
      } else if(lostItem[0].itemId ===3){
        player.incrementHP(-items[2].HP)
      } else if(lostItem[0].itemId ===4){
        player.exp -= items[3].exp;
      } else if(lostItem[0].itemId === 5){
        player.maxHP -= items[4].maxHP;
      }
      console.log(lostItem[0].itemId);
    } else if (dead === "monster") {
      player.exp += parseFloat(exp);
    }

    const itemId_list = item_list.map((e) => e.itemId);
    const itemId_count = [];
    let i = 1;
    while (i < 6) {
      itemId_count.push(itemId_list.filter((x) => x === i).length);
      i += 1;
    }

    await player.save();


    return res.send({ player, field, event, itemId_count });
  }
});

app.listen(3000);
