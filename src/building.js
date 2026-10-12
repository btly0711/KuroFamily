"use strict";

import { player ,REALM_DATA} from "./main.js";
import { format_timedur, format_number , renderExploreLocation} from "./display.js";
import Decimal from "./break_eternity.js";

function update_building(dt){
    player.build.wh = player.family.stats.wh.mul(player.work.build);

    if(player.build.wt.status!='none'){
        player.build.wt.progress = player.build.wt.progress.add(player.build.wh.div(10800).mul(player.time.spd.mul(dt))).min(player.build.wt.prog_max);//wh/w'->wh/s'->wh/t
        //推进建设进度
    }
    if(player.build.wt.progress.gte(player.build.wt.prog_max)){
        if(player.build.wt.status=='tda'){
            player.build.tda.level =  player.build.tda.level.add(1);//升级
            //未来这里可能加入折算空间
            player.build.tda.price = (new Decimal(5)).pow(player.build.tda.level);//计算价格

            player.build.tda.effect = (new Decimal(1.5)).pow(player.build.tda.level);//计算效果
        }
        player.build.wt.progress = new Decimal(0);
        player.build.wt.prog_max = new Decimal(1);
        player.build.wt.status = 'none';//重置建设进度
    }

}

function build_tda(){
    if(player.resources.ore.lt(player.build.tda.price)) return;//灵矿不足
    if(player.build.wt.status != 'none') return;//建筑中

    player.resources.ore = player.resources.ore.sub(player.build.tda.price);//扣除灵矿
    player.build.wt.status = 'tda';//time distorting array
    player.build.wt.progress = new Decimal(0);
    player.build.wt.prog_max = new Decimal(player.build.tda.price.mul(1e4).pow(1.2));//设置建设进度
}
window.build_tda = build_tda;

export {update_building}