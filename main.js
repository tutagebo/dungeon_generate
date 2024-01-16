import { system, world as World } from "@minecraft/server";

let dimension = World.getDimension("overworld");
let [right, left, up, down] = [0, 1, 2, 3]

class Dungeon {
  constructor() {
    this.base = [];
    this.roomCellList = [];
  }

  draw() {
    let count = 0;
    async function loop(x, y, mapData) {
      for (let i = x; i < 27; i++) {
        for (let j = y; j < 27; j++) {
          count++;
          if (mapData[i][j] >= 1) {
            dimension.runCommandAsync(`structure load "1" ${i*6} -60 ${j*6}`);
          } else {
            dimension.runCommandAsync(`structure load "0" ${i*6} -60 ${j*6}`);
          }
          if (count > 100) {
            system.run(async function () {
              loop(i, j, mapData);
              count = 0;
            });
            break;
          }
        }
        y = 0;
        if (count > 100) break;
      }
    }

    loop(0, 0, this.base);
  }
  fillRoomArea(x1, y1, x2, y2, mode) {
    this.roomCellList[mode] = [];
    for (let i = x1; i <= x2; i++) {
      for (let j = y1; j <= y2; j++) {
        if ((i == x1 || j == y1) || (i == x2 || j == y2)) {
          this.roomCellList[mode].push([i, j]);
          this.base[i][j] = mode;
        } else {
          this.base[i][j] = 0;
        }
      }
    }
  }
  checkRoomArea(x1, y1, x2, y2) {
    x1--; y1--; x2++; y2++;
    for (let i = x1; i <= x2; i++) {
      for (let j = y1; j <= y2; j++) {
        if ((this.base[i][j] >= 2) || (this.base[i][j] == 0)) return false;
      }
    }
    return true;
  }

  createWay(x, y) {
    let targetCell = new Array(2);
    let canWayList = [];
    targetCell[0] = x;
    targetCell[1] = y;
    while (typeof targetCell !== 'undefined') {
      //World.say(`${targetCell}`)
      let isCreateWays = [
        (this.base[targetCell[0] + 1][targetCell[1]] == 1 && this.base[targetCell[0] + 2][targetCell[1]] == 1),   //right
        (this.base[targetCell[0] - 1][targetCell[1]] == 1 && this.base[targetCell[0] - 2][targetCell[1]] == 1),   //left
        (this.base[targetCell[0]][targetCell[1] + 1] == 1 && this.base[targetCell[0]][targetCell[1] + 2] == 1),   //up
        (this.base[targetCell[0]][targetCell[1] - 1] == 1 && this.base[targetCell[0]][targetCell[1] - 2] == 1)    //down
      ];
      let wayIndexes = isCreateWays.map((e, i) => (e === true) ? i : '').filter(String);
      //World.say(JSON.stringify(wayIndexes));
      let r = Math.floor(Math.random() * wayIndexes.length);
      let wayIndex = wayIndexes[r];
      if (wayIndexes.length === 0) {    //行く場所がない時
        let rr = Math.floor(Math.random() * canWayList.length);
        if (canWayList.length == 0) return;
        let nextCell = canWayList.splice(rr, 1);
        targetCell[0] = nextCell[0][0];
        targetCell[1] = nextCell[0][1];
        continue;
      }
      if (wayIndexes.length > 1) {
        canWayList.push([targetCell[0], targetCell[1]]);
      };
      switch (wayIndex) {
        case 0: {
          this.base[targetCell[0] + 1][targetCell[1]] = 0;
          this.base[targetCell[0] + 2][targetCell[1]] = 0;
          targetCell[0] = targetCell[0] + 2;
          break;
        }
        case 1: {
          this.base[targetCell[0] - 1][targetCell[1]] = 0;
          this.base[targetCell[0] - 2][targetCell[1]] = 0;
          targetCell[0] = targetCell[0] - 2;
          break;
        }
        case 2: {
          this.base[targetCell[0]][targetCell[1] + 1] = 0;
          this.base[targetCell[0]][targetCell[1] + 2] = 0;
          targetCell[1] = targetCell[1] + 2;
          break;
        }
        case 3: {
          this.base[targetCell[0]][targetCell[1] - 1] = 0;
          this.base[targetCell[0]][targetCell[1] - 2] = 0;
          targetCell[1] = targetCell[1] - 2;
          break;
        }
      }
      continue;
    }
  }

  connectRoomToCell(qty) {
    for (let i = 0; i < qty; i++) {
      let r = Math.floor(Math.random() * this.roomCellList[i + 2].length)
      let [x, y] = [this.roomCellList[i + 2][r][0], this.roomCellList[i + 2][r][1]];
      if (this.base[x + 1][y] == 1 && this.base[x + 2][y] == 0) {
        this.base[x + 1][y] = 0;
      } else if (this.base[x - 1][y] == 1 && this.base[x - 2][y] == 0) {
        this.base[x - 1][y] = 0;
      } else if (this.base[x][y + 1] == 1 && this.base[x][y + 2] == 0) {
        this.base[x][y + 1] = 0;
      } else if (this.base[x][y - 1] == 1 && this.base[x][y - 2] == 0) {
        this.base[x][y - 1] = 0;
      }
    }
  }

  parse(){
    for(let i=0;i<27;i++){
      for(let j=0;j<27;j++){
        if(this.base[i][j]!==1){
          this.base[i][j]=0;
          continue;
        }
        let wallR = (i==26) ? 0:Number(this.base[i+1][j]==1);
        let wallL = (i==0) ? 0:Number(this.base[i-1][j]==1);
        let wallU = (j==26) ? 0:Number(this.base[i][j+1]==1);
        let wallD = (j==0) ? 0:Number(this.base[i][j-1]==1);
        let wallBit = `${wallR}${wallL}${wallU}${wallD}`
        let wallId = parseInt(wallBit,2);
        this.base[i][j] = wallId+1;
      }
    }
  }

  generate() {
    let room = [
      [2, 2],
      [2, 4],
      [4, 2],
      [4, 4]
    ]
    for (let i = 0; i < 27; i++) {    //create base map
      this.base.push([])
      for (let j = 0; j < 27; j++) {
        if ((i == 0 || j == 0) || (i == 26 || j == 26)) {
          this.base[i].push(0);
        } else {
          this.base[i].push(1);
        }
      }
    }
    let qtyRoom = Math.floor(Math.random() * 4) + 4;
    let can = false;
    let count = 0;
    for (let i = 0; i < qtyRoom; i++) {   //create room
      while (!can) {
        let rRoom = Math.floor(Math.random() * 4);
        let rPosX = Math.floor(Math.random() * 11) * 2 + 1;
        let rPosY = Math.floor(Math.random() * 11) * 2 + 1;
        can = this.checkRoomArea(rPosX, rPosY, rPosX + room[rRoom][0], rPosY + room[rRoom][1])
        if (can) {
          this.fillRoomArea(rPosX, rPosY, rPosX + room[rRoom][0], rPosY + room[rRoom][1], i + 2);
          can = false;
          break;
        }
        count++;
        if (count > 20) break;
      }
      count = 0;
    }

    let rPosX = Math.floor(Math.random() * 12) * 2 + 1;
    let rPosY = Math.floor(Math.random() * 12) * 2 + 1;
    this.createWay(rPosX, rPosY);//道生成
    this.connectRoomToCell(qtyRoom);//部屋と道を繋ぐ
    for(let i=0;i<27;i++){//囲い生成
      this.base[i][0]=1;
    }
    for(let i=0;i<27;i++){
      this.base[i][26]=1;
    }
    for(let i=0;i<27;i++){
      this.base[0][i]=1;
    }
    for(let i=0;i<27;i++){
      this.base[26][i]=1;
    }
    //World.sendMessage(JSON.stringify(this.base[0][0]))
    this.parse()//wallidに変換
    World.sendMessage(JSON.stringify(this.base))
    this.draw();//マイクラに描画
  }
}

World.events.beforeChat.subscribe(chatEvent => {
  const { message, sender } = chatEvent;
  const name = sender.nameTag;
  const [cmd, sub, ...other] = message.split(' ');
  if (cmd == '!dan') {
    let danGene = new Dungeon();
    danGene.generate();
  }
})
