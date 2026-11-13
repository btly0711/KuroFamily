"use strict";

import { player ,REALM_DATA} from "./main.js";
import {format_number} from "./display.js";
import Decimal from "./break_eternity.js";
import { getAchievement ,showAchievementToast} from "./achievement.js";

const BUILDING_MAPS = {"none":"[无]","tda":"[乱时法阵]","btf":"训练场"}
function get_tda_effect(){
    return (new Decimal(1.5)).pow(player.build.level.tda);
}//乱时法阵·效果
let tda_super_scale = {st:20,pw:2};//超级折算:20起，效果^2
function get_tda_price(){
    let eff_lv = player.build.level.tda;
    
    if(eff_lv.gte(tda_super_scale.st)) eff_lv = eff_lv.sub(tda_super_scale.st).mul(tda_super_scale.pw).add(tda_super_scale.st);
    return (new Decimal(5)).pow(eff_lv);
}
function get_btf_price(){
    let btf_mul = (new Decimal(6)).pow(player.build.level.btf);
    return {ore:btf_mul.mul(100e8),herb:btf_mul.pow(1.1).mul(10e8),wh:btf_mul.pow(1.15).mul(1e16)};
}
function renderBuilding(){
    document.getElementById("building_workhour").innerText = format_number(player.build.wh) + 'wh/w\'';
    document.getElementById("building_workhour_rt").innerText = format_number(player.build.wh.div(10800).mul(player.time.spd)) + 'wh/s';

    document.getElementById("build_project").innerText = BUILDING_MAPS[player.build.wt.status];
    if(player.build.wt.prog_max.lte(1)) document.getElementById("build_progress").innerText = '当前不在建设中'
    else document.getElementById("build_progress").innerText = format_number(player.build.wt.progress) + ' / ' + format_number(player.build.wt.prog_max) + ' wh';
    document.getElementById("build_prog_bar").style.width = Math.floor(player.build.wt.progress.div(player.build.wt.prog_max).mul(100).mag*100)/100 + '%';

    document.getElementById("tda_level").innerText = format_number(player.build.level.tda);
    document.getElementById("tda_upgrade_ore").innerText = format_number(get_tda_price()) + ' 灵矿';
    document.getElementById("tda_upgrade_wh").innerText = format_number(get_tda_price().mul(1e4).pow(1.15)) + ' wh';
    document.getElementById("tda_effect").innerText = "时间流速 " + format_number(get_tda_effect()) + 'x';

    document.getElementById("tda_scale").innerText = (player.build.level.tda.gte(tda_super_scale.st))?"超级折算 | ":"";

    if(player.influ.upgs[5]){
        document.getElementById("btf_div").style.display = 'block';
        document.getElementById("btf_level").innerText = format_number(player.build.level.btf);
        let cur_btf_price = get_btf_price();
        document.getElementById("btf_upgrade_ore").innerText = format_number(cur_btf_price.ore) + ' 灵矿';
        document.getElementById("btf_upgrade_herb").innerText = format_number(cur_btf_price.herb) + ' 灵药';
        document.getElementById("btf_upgrade_wh").innerText = format_number(cur_btf_price.wh) + ' wh';
        document.getElementById("btf_effect").innerText = "训练速度 " + format_number((new Decimal(1.25)).pow(player.build.level.btf)) + 'x,'+ " 战力上限 " + format_number((new Decimal(1.5)).pow(player.build.level.btf)) + 'x';
    }
    else document.getElementById("btf_div").style.display = 'none';
}
function update_building(dt){
    player.build.wh = player.family.stats.wh.mul(player.work.build);

    if(player.build.wt.status!='none'){
        player.build.wt.progress = player.build.wt.progress.add(player.build.wh.div(10800).mul(player.time.spd.mul(dt))).min(player.build.wt.prog_max);//wh/w'->wh/s'->wh/t
        //推进建设进度
    }
    if(player.build.wt.progress.gte(player.build.wt.prog_max)){
        if(player.build.wt.status=='tda'){
            player.build.level.tda =  player.build.level.tda.add(1);//升级
            //未来这里可能加入折算空间

            if(player.build.level.tda.gte(1)) getAchievement(14);
            if(player.build.level.tda.gte(13)) getAchievement(20);
            if(player.build.level.tda.gte(20)) getAchievement(30);
            
            showAchievementToast([`乱时法阵 Lv.${format_number(player.build.level.tda)} 竣工`,`时间流速 x1.5.`],"build-toast");
        }
        if(player.build.wt.status=='btf'){
            player.build.level.btf =  player.build.level.btf.add(1);//升级
            //未来这里可能加入折算空间

            if(player.build.level.btf.gte(1)) getAchievement(33);
            
            showAchievementToast([`训练场 Lv.${format_number(player.build.level.tda)} 竣工`,`训练速度 x1.25，战力上限 x1.5.`],"build-toast");
        }
        player.build.wt.progress = new Decimal(0);
        player.build.wt.prog_max = new Decimal(1);
        player.build.wt.status = 'none';//重置建设进度
    }

}

function build_tda(){
    if(player.build.wt.status != 'none') return;//建筑中
    if(player.resources.ore.lt(get_tda_price())) return;//灵矿不足

    player.resources.ore = player.resources.ore.sub(get_tda_price());//扣除灵矿
    player.build.wt.status = 'tda';//time distorting array
    player.build.wt.progress = new Decimal(0);
    player.build.wt.prog_max = new Decimal(get_tda_price().mul(1e4).pow(1.15));//设置建设进度
}
window.build_tda = build_tda;
function build_btf(){
    if(player.build.wt.status != 'none') return;//建筑中
    let cur_btf_price = get_btf_price();
    if(player.resources.ore.lt( cur_btf_price.ore)) return;//灵矿不足
    if(player.resources.herb.lt( cur_btf_price.herb)) return;//灵药不足

    player.resources.ore = player.resources.ore.sub(cur_btf_price.ore);//扣除灵矿
    player.resources.herb = player.resources.herb.sub(cur_btf_price.herb);//扣除灵药
    player.build.wt.status = 'btf';//battle training field
    player.build.wt.progress = new Decimal(0);
    player.build.wt.prog_max = new Decimal(cur_btf_price.wh);//设置建设进度
}
window.build_btf = build_btf;

export {update_building , renderBuilding,get_tda_effect}