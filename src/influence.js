"use strict";

import { player ,REALM_DATA} from "./main.js";

import { updateRealmcap} from "./explore.js";
import {getAchievement, showAchievementToast} from "./achievement.js";
import {format_number,renderFamilyMembers , renderExploreLocation , change_timedtb} from "./display.js";
import Decimal from "./break_eternity.js";
function get_pending_influ(){
    let eff_cats = new Decimal(0);
    if(player.family.cats[8]) eff_cats = eff_cats.add(player.family.cats[8]);
    if(player.influ.upgs[3]){if(player.family.cats[9]) eff_cats =  eff_cats.add(player.family.cats[9].mul(10));
        if(player.family.cats[10]) eff_cats =  eff_cats.add(player.family.cats[10].mul(40));
        if(player.family.cats[11]) eff_cats =  eff_cats.add(player.family.cats[11].mul(200));
    }//IU3
    return eff_cats.div(4e7).pow(0.5).floor();
}
function try_influ_reset(){
    if(player.influ.miles[3]){
        influ_reset();
        return;//直接重置 跳过确认
    }
    document.getElementById("reset_screen").style.display='flex';
    document.getElementById("influ_reset_screen").style.display='flex';
    document.getElementById("pending_influ_screen").innerText=`作为交换，你将得到 ${format_number(get_pending_influ())} 影响力`;

    //尝试重置时获取里程碑 0.24删除
    for(let m=1;m<influ_miles.length;m+=1){
        if(player.influ.times.gte(influ_miles[m]) && (!player.influ.miles[m])){
            player.influ.miles[m] = 1;
            showAchievementToast([`获得了新的影响力里程碑！`,`No.${m}`],"influ-toast");
            ReloadInfluMilestones();
        }
    }
}
function cancel_influ_reset(){
    document.getElementById("reset_screen").style.display='none';
    document.getElementById("influ_reset_screen").style.display='none';
}
function commit_influ_reset(){
    document.getElementById("reset_screen").style.display='none';
    document.getElementById("influ_reset_screen").style.display='none';
    influ_reset();
}
window.try_influ_reset = try_influ_reset;
window.cancel_influ_reset = cancel_influ_reset;
window.commit_influ_reset = commit_influ_reset;
const influ_miles = [0,1,3,6,10,15,20];
function influ_reset(){
    if(get_pending_influ().lte(0)){
        showAchievementToast([`[潮汐级巅峰]不足.`,`无法获取任何影响力，重置已取消。`],"battle-toast-lose");
        return;
    }
    showAchievementToast([`重置成功!`,`获取了 ${get_pending_influ()} 影响力。`],"influ-toast");
    player.influ.points = player.influ.points.add(get_pending_influ()).round();
    player.influ.times = player.influ.times.add(1);
    
    for(let m=1;m<influ_miles.length;m+=1){
        if(player.influ.times.gte(influ_miles[m]) && (!player.influ.miles[m])){
            player.influ.miles[m] = 1;
            showAchievementToast([`获得了新的影响力里程碑！`,`No.${m}`],"influ-toast");
            ReloadInfluMilestones();
        }
    }
    //资源获取
    player.time.reseting = 1;
    reset_cats();
    reset_explore();//含realmcap
    reset_building();
    reset_resources();
    player.time.reseting = 0;
    player.time.cur = new Decimal(0);
    console.log("influ reset complete");
    if(player.influ.times.gte(1)) getAchievement(22);
    if(player.influ.times.gte(3)) getAchievement(26);
    if(player.influ.times.gte(10)) getAchievement(29);
    if(player.influ.points.gte(100)) getAchievement(31);

}
function reset_cats(){
    player.family.maxrealm = 0;
    player.family.cats = [new Decimal(0)];
    player.family.stats = {wh:new Decimal(0),cnt:new Decimal(0)};
    renderFamilyMembers();
    player.family.birt = new Decimal(0);
}
function reset_explore(){
    if(player.influ.miles[4]) return;//不重置
    player.family.realmcap = 4;
    updateRealmcap();
    player.explore.prog = 0;
    player.explore.cur = 1;
    player.explore.b_mul = new Decimal(1);
    renderExploreLocation();
}
function reset_building(){
    player.build.wt = {status:'none',progress:new Decimal(0),prog_max:new Decimal(1)};
    let tda_lv = new Decimal(0);
    if(player.influ.miles[2]) tda_lv = player.build.level.tda.min(player.influ.times);//保留一些乱时
    player.build.level.tda = tda_lv;
}
function reset_resources(){
    if(!player.influ.miles[6]) player.resources.herb = new Decimal(0);
    if(!player.influ.miles[5]) player.resources.ore = new Decimal(0);
}
function renderInfluMiles(){
    document.getElementById("influ_reset_times").innerText = format_number(player.influ.times);
}
function ReloadInfluMilestones(){
    for(let m=1;m<=influ_miles.length;m+=1){
        let ml=document.getElementById(`influ_miles_${m}`); 
        if(player.influ.miles[m]){
            ml.classList.add('influ_miles_active');
        }
    }
}
const RESET_VALUE = 0;

let currentUpgEl = null; // 记录当前 hover 的 div，避免重复赋值和中间态闪烁

function setHoveringUpg(el) {
    if (el === currentUpgEl) return;
    currentUpgEl = el;
    if(el?.id=='influ_upg_content') return;
  player.influ.checking_upg = el
    ? Number(el.id.replace('influ_upg_', ''))
    : RESET_VALUE;
}

document.addEventListener('mouseover', (e) => {
  // e.target 可能是里面的 img，closest 往上找那个 div
  setHoveringUpg(e.target.closest('div[id^="influ_upg_"]'));
});

// 鼠标移出窗口时 relatedTarget 为 null，兜底复位
// document.addEventListener('mouseout', (e) => {
//   if (e.relatedTarget === null) setHoveringUpg(null);
// });
const INFLU_UPG = [
    [0,new Decimal(0),"= 影响力升级 =","将鼠标放置到升级上查看相关信息!"],
    [1,new Decimal(1),"[IU1]新手大礼包","时间流速*2,每猫工时*2"],
    [2,new Decimal(5),"[IU2]影响->生育","一重生育软上限延后3cbrt(影响力+1)倍,上限600倍."],
    [3,new Decimal(20),"[IU3]扩大影响","大地级初等|高等|巅峰小猫在影响力获取计算中记作10|40|200个潮汐级巅峰"],
    [4,new Decimal(80),"[IU4]冥想法","所有小猫的休息时间>死亡率公式中有效休息时间+60h'"],
    [5,new Decimal(233),"[IU5]加强训练","解锁训练场"],
];
function renderInfluUpg(){
    for(let iu=1;iu<INFLU_UPG.length;iu+=1){
        if(player.influ.upgs[iu]) document.getElementById(`influ_upg_${iu}`).className = `influ_upg_bought`;
        else if(player.influ.checking_upg == iu) document.getElementById(`influ_upg_${iu}`).className = `influ_upg_chosen`;
        else document.getElementById(`influ_upg_${iu}`).className = `influ_upg_unbought`;
    }
    document.getElementById("influ_upg_name").innerText = '= '+INFLU_UPG[player.influ.checking_upg][2] + ' =';
    document.getElementById("influ_upg_detail").innerText = INFLU_UPG[player.influ.checking_upg][3];
    if(player.influ.checking_upg == 0) document.getElementById("influ_upg_price").innerText = "";
    else if(player.influ.upgs[player.influ.checking_upg]){
        document.getElementById("influ_upg_price").innerText = "[已购买]";
        document.getElementById("influ_upg_price").style.color='lime';
    }
    else{
        document.getElementById("influ_upg_price").innerText = `价格 : ${format_number(INFLU_UPG[player.influ.checking_upg][1])} 影响力
        `;
        if(INFLU_UPG[player.influ.checking_upg][1].gt(player.influ.points)) document.getElementById("influ_upg_price").style.color='red';
        else document.getElementById("influ_upg_price").style.color='lime';
    }
}
function BuyInfluUpg(iu){
    if(INFLU_UPG[iu][1].gt(player.influ.points)) return; //买不起。
    if(player.influ.upgs[iu]) return;//买过了。

    player.influ.upgs[iu]=1;
    player.influ.points = player.influ.points.sub(INFLU_UPG[iu][1]);
    
    if(iu==4){
        for(ri=0;ri<=player.family.maxrealm;ri++){
            change_timedtb(ri,1,0);//不改变，但刷新
        }
    }
    
    if(iu==1) getAchievement(23);
    if(iu==2) getAchievement(24);
    if(iu==3) getAchievement(28);

    showAchievementToast([`购买了新的影响力升级！`,`[ ${INFLU_UPG[iu][2]} ]`],"influ-toast");
}
window.BuyInfluUpg = BuyInfluUpg;
export {influ_reset, get_pending_influ , renderInfluMiles , renderInfluUpg , ReloadInfluMilestones};