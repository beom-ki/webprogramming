// 전투, 아이템획득, 랜덤이벤트

const teleport = () => {
    let x_new;
    let y_new;
    x_new = Math.floor(Math.random() * 10);
    y_new = Math.floor(Math.random() * 10);
    x = x_new;
    y = y_new;
    return x,y;
};

const randomRecovery = () => {
    let recoveryNum = Math.floor(Math.random() * 10);
    return recoveryNum;
}


const events = field.events;
const actions = [];
if (events.length > 0) {
    // 확률별로 이벤트 발생하도록 변경
    let _event;
    const randPercent = Math.random();
    if (randPercent <= (Number(events[0].percent) / 100)) {
        _event = events[0];
    } else if ((Number(events[0].percent) / 100) < randPercent <= (Number(events[0].percent) / 100 + Number(events[1].percent) / 100)){
        _event  = events[1];
    } // 이벤트 발생확률은 무조건 2개로 나눔
    if (_event.type === "battle") {
        const monsterNum = _event.monster;
        let monster;
        monsterChunk.forEach(elem => {
            if(elem.id === monsterNum) {
                monster = elem
            }
            return monster;
        })
        const {id, name, str, def, hp, exp} = monster;
        const monsterStr = Number(str);
        const monsterDef = Number(def);
        let monsterHP = Number(hp);
        const monAttSpd = monsterStr / monsterDef;
        const playerAttSpd = player.str/ player.def;

        let battleNum = 0;
        // str/def로 선제공격시스템
        // str보다 def가 높을 경우 단순계산하면 체력이 늘어날 수 있어 그런 오류 방지하고자 먼저 if else로 방지
        while (monsterHP > 0){
            if(playerAttSpd >= monAttSpd){ // player 공속이 monster 공속보다 빠를 때
                if(player.str < monsterDef){ // player 공격력이 monster 방어력보다 낮아 대미지 안들어 갈 떄 스킵
                    continue;
                }
                else{
                    monsterHP -= (player.str - monsterDef); //player 먼저 공격
                    if(monsterHP <= 0){
                        player.exp = player.exp + exp;
                        break;
                        //monster hp이 0 이하가 되어 플레이어 공격받지 않고 바로 break
                    }
                    else{
                        if(monsterStr < player.def){ // monster공격력이 player 방어력보다 낮아 대미지 안들어 갈 때
                            continue;
                        }
                        else{
                            player.HP -= (monsterStr - player.def)
                            if (player.HP <= 0){
                                player.x = 0;
                                player.y = 0;
                                player.HP = Math.floor((player.maxHP / 2)); //체력 몇으로 부활할지?
                                break
                            }
                        }
                    }
                }
                // async-await으로 선후관계 정의해야하는지?
            }
            else{ // monster 공속이 player 공속보다 빠를 때
                if(monsterStr < player.def){ // monster공격력이 player 방어력보다 낮아 대미지 안들어 갈 때
                    continue;
                }
                else{
                    player.HP -= (monsterStr - player.def)
                    if (player.HP <= 0){
                        player.x = 0;
                        player.y = 0;
                        player.HP = Math.floor((player.maxHP / 2)); //체력 몇으로 부활할지?
                        break
                    }
                    else{
                        if(player.str < monsterDef){ // player 공격력이 monster 방어력보다 낮아 대미지 안들어 갈 떄 스킵
                            continue;
                        }
                        else{
                            monsterHP -= (player.str - monsterDef); //player 먼저 공격
                            if(monsterHP <= 0){
                                player.exp = player.exp + exp;
                                break;
                                //monster hp이 0 이하가 되어 플레이어 공격받지 않고 바로 break
                            }
                        }
                    }
                }
            }
            battleNum +=1
        }}else if (_event.type === "item") {
        const itemNum = _event.item;
        let realItem;
        itemChunk.forEach(elem => {
            if(elem.id === itemNum) {
                realItem = elem
            }
            return realItem;
        })
        player.item.push(realItem)
        //아이템 추가까지 완료
    }
    else if(_event.type === "recovery"){
        const recoveryVal = randomRecovery();
        player.incrementHP(recoveryVal);
        player.HP = Math.min(player.maxHP, player.HP);
        // 1-10 사이의 숫자로 체력 회복
    }
    // 랜덤이벤트 발생
    else if (_event.type === 'random') {
        const randEventNum = Math.floor(Math.random() * 3);
        const randEvent = eventChunk[4].detail[randEventNum];
        if (randEvent.type === 'mad'){
            // 추후 상세히 수치 및 로직 정해서 코드 삽입

        }else if(randEvent.type === 'strong'){
            // 추후 상세히 수치 및 로직 정해서 코드 삽입
        }else if(randEvent.type === 'teleport'){
            teleport(x,y);
            player.x = x;
            player.y = y;


        }
    }
}
if(player.exp >= 100){ // 경험치 100마다 레벨업
    player.exp -= 100;
    player.level += 1;
}