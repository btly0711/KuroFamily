"use strict";

import { player ,REALM_DATA} from "./main.js";
import { format_timedur, format_number , renderExploreLocation} from "./display.js";
import Decimal from "./break_eternity.js";

const EXP_LOCATIONS = [
['家里蹲',new Decimal(0),new Decimal(1.00),4,"blank_location"],
['练兵场 - 1',new Decimal(1e4),new Decimal(1.04),4,"blank_location",new Decimal(1),new Decimal(0)],
['练兵场 - 2',new Decimal(3.2e4),new Decimal(1.10),4,"blank_location",new Decimal(4),new Decimal(0)],
['练兵场 - 3',new Decimal(1e5),new Decimal(1.17),4,"blank_location",new Decimal(12),new Decimal(0)],
['练兵场 - 4',new Decimal(4e5),new Decimal(1.25),5,"blank_location",new Decimal(60),new Decimal(0)],
['燕岗城 - 1',new Decimal(1e6),new Decimal(1.32),5,"gray_location",new Decimal(160),new Decimal(1)],
['燕岗城 - 2',new Decimal(3e6),new Decimal(1.40),5,"gray_location",new Decimal(530),new Decimal(4)],
['燕岗城 - 3',new Decimal(8e6),new Decimal(1.50),5,"gray_location",new Decimal(1560),new Decimal(12)],
['燕岗城 - 4',new Decimal(2e7),new Decimal(1.62),6,"gray_location",new Decimal(4280),new Decimal(36)],
['燕岗近郊 - 1',new Decimal(6e7),new Decimal(1.75),6,"grass_location",new Decimal(14300),new Decimal(136)],
['燕岗近郊 - 2',new Decimal(16e7),new Decimal(1.88),6,"grass_location",new Decimal(42100),new Decimal(440)],
['燕岗近郊 - 3',new Decimal(42e7),new Decimal(2.05),6,"grass_location",new Decimal(12.2e4),new Decimal(1400)],
['燕岗近郊 - 4',new Decimal(999999999),new Decimal(2.25),7,"grass_location",new Decimal(31.6e4),new Decimal(3980)],
['地宫 - 1',new Decimal(9.223372036854775807e18),new Decimal(2.50),7,"palace_location",new Decimal(4280),new Decimal(36)],
]
//地点名,需求战力,环境乘数,解锁新境界,背景名,灵矿,灵药
/*

灵矿/e4 ^1.1
灵药/e6 ^1.2
 */
let DC_E = new Decimal(Math.E),DC_1 = new Decimal(1),DC_M1 = new Decimal(-1);
function get_battle_passrate(){
    if(player.explore.bb.lte(0)) player.explore.bb = new Decimal(1);
    let ans = DC_1.minus(EXP_LOCATIONS[player.explore.cur][1].div(player.explore.bb).pow(2).atan().mul(2/Math.PI));
    //console.log(ans);
    if(!ans.sign) return new Decimal(0);
    return ans;
}
function update_explore(dt){
    player.explore.wh = player.family.stats.wh.mul(player.work.explore);
    if(player.explore.wh.lte(0)){
        player.explore.trt = new Decimal(0);
        
        player.display.explore.trp = player.display.explore.trt = '未开始训练';
        
        player.display.explore.bb = '0ψ';
    }
    else player.explore.trt = player.explore.trt.add(player.time.spd.mul(dt));
    player.display.explore.trt = format_timedur(player.explore.trt);
    player.explore.trp = DC_1.minus(DC_E.pow(DC_M1.div(600).mul(player.explore.trt).mul(player.explore.wh.pow(-0.32))))
    //1-e^(-Ctb^(-a)) a=1/4 C=τ0=10h
    player.display.explore.trp = format_number(player.explore.trp.mul(100)) + '%';

    player.explore.bb = player.explore.wh.mul(player.explore.trp).add(1);
    player.display.explore.bb = format_number(player.explore.bb) + 'ψ';

    player.display.explore.pr = format_number(get_battle_passrate().mul(100)) + '%';
}
function location_change(op){
    console.log(player.explore);
    if(op==-1 && player.explore.cur >= 2){
        player.explore.cur -= 1;
    }
    if(op==1 && player.explore.cur <= player.explore.prog){
        player.explore.cur += 1;
    }
    renderExploreLocation();
}
function location_fight(){
    if(get_battle_passrate().gt(Math.random())){
        if(player.explore.cur > player.explore.prog){
            player.explore.prog += 1;
            player.explore.cur += 1;
            player.explore.b_mul = EXP_LOCATIONS[player.explore.prog][2];
            player.family.realmcap = EXP_LOCATIONS[player.explore.prog][3];
            updateRealmcap();
            renderExploreLocation();
            //探索开拓
        }
        else{
            //扫荡(0.08)
            player.resources.ore = player.resources.ore.add(EXP_LOCATIONS[player.explore.cur][5]);
            player.resources.herb = player.resources.herb.add(EXP_LOCATIONS[player.explore.cur][6]);

        }
        console.log("win");
    }//赢了
    else{
        console.log("lose");
    }//输了
    player.explore.trt = new Decimal(0);//训练时间清零
}
window.location_change = location_change;
window.location_fight = location_fight;
function updateRealmcap(){
    const realmcap = document.getElementById("realm_cap");
    realmcap.innerText = REALM_DATA[player.family.realmcap][0];
    realmcap.className = '';
    realmcap.classList.add('realm_'+REALM_DATA[player.family.realmcap][1]);
}

export { update_explore ,EXP_LOCATIONS, updateRealmcap , get_battle_passrate};