"use strict";

import {renderGame, renderFamilyMembers,format_number,format_chance_time} from "./display.js";
import Decimal from "./break_eternity.js";
const GAME_VERSION = 'V0.06a';
let player ={
    time:{
        cur:new Decimal(0),//存储单位:分钟
        spd:new Decimal("300"),//分钟/s
        save:0,//自动保存计数器，30触发保存
    },
    family:{
        cats:[new Decimal(0)],
        maxrealm:0,//微尘级初等
        realmcap:4,//万物级高等
        rdata:[{
            br:new Decimal(0),
            dd:new Decimal(0),
            wk:new Decimal(0),
            //当前突破率/死亡率/每猫工时
            timedtb:{
                wk:new Decimal(60),
                rt:new Decimal(60),
                ct:new Decimal(60),
            }//时间分配work/rest/cultivate],
        }],
        stats:{
            wh:new Decimal(0),//workhour
            cnt:new Decimal(0),//小猫总量
        },//统计数据
        birt:new Decimal(0),//小猫生育率(c/m)
    },
    work:{
        workless:new Decimal(1),//无业
        reproduce:new Decimal(0),//生育
    },
    display:{
        tab:"family",//选项卡
        format:0,//计数法
        birt:{
            wh:"0wh/w",
            basic:"0c/w",
            sc1:"0c/w",
            scn:0,
        }
    }
}
const tickspeed = 50;
function prepareGame(){
    //load everything
    //WIP:load player from local
    //if illegal reset
    try{load_from_local()}
    catch(error) {console.error("加载本地存档时出错！");
        console.error(error);}
    //上面加载数据

    document.getElementById(`${player.display.tab}_button`).classList.add("tab_button_active");
    document.getElementById(`${player.display.tab}_content`).style.display = 'block';
    //load tab display status

    renderFamilyMembers();
    document.getElementById("cur_version").innerText = GAME_VERSION;
    document.getElementById("loading_screen").style.display='none';
    
    let lastTime = Date.now();
    let cnt_t = 0,sum_t = 0,adt = 0.2;
    setInterval(()=>{
        let now = Date.now();
        let dt = (now - lastTime);
        cnt_t += 1,sum_t += dt;
        if(cnt_t >= 10){
            cnt_t = 0;
            adt = sum_t;
            sum_t = 0;
        }//
        lastTime = now;
        updateGame(dt / 1000);
        renderGame(adt / 10000); 
    },1000/tickspeed);
}


window.prepareGame = prepareGame;
const REALM_DATA = [
    ["微尘级初等",'basic',1e-4,1e-5,0.1,0],
    ["微尘级高等",'basic',5e-5,1e-5,0.2,1],
    ["微尘级巅峰",'basic',2e-5,1e-5,0.4,2],
    ["万物级初等",'basic2',2e-6,1e-6,1,3],
    ["万物级高等",'basic2',6e-7,1e-6,2,4],
    ["万物级巅峰",'basic2',3e-7,1e-6,4,5],
    ["潮汐级初等",'basic3',2e-8,1e-7,10,6],
    ["潮汐级高等",'basic3',7e-9,1e-7,20,7],
    ["潮汐级巅峰",'basic3',2e-10,1e-7,40,8],

]//等级名，颜色，突破率，死亡率，工时，境界编号

function updateGame(dt){

    //dt:现实中实际经过秒数
    //一切计算更新
    player.time.cur = player.time.cur.add(player.time.spd.mul(dt));
    update_family(dt);
    update_work(dt);
    player.time.save += dt;
    if(player.time.save >= 30) save_to_local();
}
function update_family(dt){
    update_family_rdata();
    calculate_family_bd(player.time.spd.mul(dt));//break&death
    
}
function update_family_rdata(){
    let wh_n = new Decimal(0),cnt_n = new Decimal(0);//计数
    for(let i=0;i<=player.family.realmcap;i+=1){
        player.family.rdata[i] ||= {};
        if(player.family.rdata[i].timedtb == undefined) player.family.rdata[i].timedtb = {
            wk:new Decimal(60),
            rt:new Decimal(60),
            ct:new Decimal(60),
        };
        player.family.rdata[i].br = new Decimal(REALM_DATA[i][2]).mul(player.family.rdata[i].timedtb.ct.div(60).pow(0.8));
        player.family.rdata[i].dd = new Decimal(REALM_DATA[i][3]).mul(player.family.rdata[i].timedtb.rt.add(2).div(62).pow(-0.8));
        player.family.rdata[i].wk = new Decimal(REALM_DATA[i][4]).mul(player.family.rdata[i].timedtb.wk);//默认60h工作/d
        //以后这里会有乘数
        wh_n = wh_n.add(player.family.rdata[i].wk.mul(player.family.cats[i]));
        cnt_n = cnt_n.add(player.family.cats[i])
    }
    player.family.stats.wh = wh_n;
    player.family.stats.cnt = cnt_n;

}
function calculate_family_bd(gt){//gametime passed
    //console.log(gt);
    for(let i=player.family.maxrealm;i>=0;i-=1){
        let brate = player.family.rdata[i].br.mul(gt);
        if(brate.gt(1)) brate = new Decimal(1);
        brate = brate.mul(player.family.cats[i]);
        let bf =brate.floor();
        if(brate.sub(bf).gt(Math.random())) brate=bf.add(1);
        else brate = bf;
        //突破
        if(i==player.family.realmcap) continue;//境界硬上限
        if(brate.gt(0)){
            if(i==player.family.maxrealm){
                player.family.maxrealm += 1;//扩展境界最大值
                player.family.cats[i+1] = brate;
                renderFamilyMembers();
            }
            else player.family.cats[i+1] = player.family.cats[i+1].add(brate);
            player.family.cats[i] = player.family.cats[i].sub(brate);
        }
    }//突破计算
    for(let i=player.family.maxrealm;i>=0;i-=1){
        let drate = player.family.rdata[i].dd.mul(gt);
        if(drate.gt(1)) drate = new Decimal(1);
        drate = drate.mul(player.family.cats[i]);
        let df =drate.floor();
        if(drate.sub(df).gt(Math.random())) drate=df.add(1);
        else drate = df;
        //死亡
        if(drate.gt(0)){
            player.family.cats[i] = player.family.cats[i].sub(drate);
        }
    }//死亡计算

    let nrate = player.family.birt.mul(gt);
    let nf=nrate.floor();
    if(nrate.sub(nf).gt(Math.random())) nrate=nf.add(1);
    else nrate = nf;
    player.family.cats[0] = player.family.cats[0].add(nrate);
    //计算出生
}
function update_work(){
    //work_reproduce
    let reproduce_workhour = player.family.stats.wh.mul(player.work.reproduce);//wh/w
    player.display.birt.wh = format_number(reproduce_workhour)+ 'wh/w';
    reproduce_workhour = reproduce_workhour.div(10800);//wh/m
    reproduce_workhour = reproduce_workhour.div(1920);//c/m(这一步可能后续加强?)

    player.display.birt.basic = format_chance_time(reproduce_workhour);
    player.display.birt.scn=0;
    if(reproduce_workhour.gt(1/60)){
        reproduce_workhour = reproduce_workhour.mul(60).pow(0.6).div(60);
        player.display.birt.scn=1;
        player.display.birt.sc1 = format_chance_time(reproduce_workhour);
    }// 1p/h一重软上限
    else player.display.birt.sc1 = "";
    player.family.birt = reproduce_workhour;// p/m单位
}
function get_member(){
    player.family.cats[0]=player.family.cats[0].add(1);
}
window.get_member = get_member;
function get_save_string() {
    const save = JSON.stringify(player, function (key, value) {
        // 用 this[key] 拿到原始对象，而不是已被 toJSON 处理过的 value
        const original = this[key];
        if (original instanceof Decimal) {
            return { __decimal__: original.toString() };
        }
        return value;
    });
    return btoa(encodeURIComponent(save));
}
function load_from_save(save) {
    console.log("load_from_save 收到:", typeof save, save && save.slice ? save.slice(0, 60) : save);
    const json = decodeURIComponent(atob(save));
    player = JSON.parse(json, function (key, value) {
        if (value && typeof value === "object" && typeof value.__decimal__ === "string") {
            return new Decimal(value.__decimal__);
        }
        return value;
    });
}
const SAVE_KEY = 'Kuro_Family_Local_Save';
function save_to_local(){
    player.time.save = 0;
    localStorage.setItem(SAVE_KEY,get_save_string());
}
window.save_to_local = save_to_local;
function load_from_local(){
    let item = localStorage.getItem(SAVE_KEY);
    if(item == null) return;
    load_from_save(item);
}
window.player = player;
window.save_to_local = save_to_local;

function hard_reset() {
    const CONFIRM_TEXT = "Goodbye,Kuro_family";   // 想改成什么就改什么
    const input = prompt(
        `确定要硬重置吗？\n所有进度将永久丢失，无法恢复。\n\n请输入 "${CONFIRM_TEXT}" 以确认：`
    );
    if (input === null) return; 
    if (input !== CONFIRM_TEXT) {
        alert("已取消硬重置……果然还是不想离开吧。");
        return;
    }
    try {
        localStorage.clear();
    } catch (e) {
        console.error("硬重置失败:", e);
        alert("清空存档失败，请手动清除浏览器数据。");
        return;
    }
    location.reload();
}
window.hard_reset = hard_reset;
function format_timestamp(d = new Date()) {
    const p = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
         + `_${p(d.getHours())}-${p(d.getMinutes())}-${p(d.getSeconds())}`;
}
function save_to_file() {
    const data = get_save_string();  
    const blob = new Blob([data], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `Kuro_family ${GAME_VERSION} ${format_timestamp()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
}


window.save_to_file = save_to_file;

document.getElementById("load-file-input").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
        try {
            load_from_save(reader.result);
            console.log("读档成功");
        } catch (err) {
            console.error(err);
            alert("存档无效");
        }
    };
    reader.readAsText(file);
});

export {player,REALM_DATA};