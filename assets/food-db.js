/**
 * 吃得明白 - 中国食物营养数据库
 * 数据参考《中国食物成分表》（第6版）
 * 所有数据为每100g可食部分的估算值，仅供饮食记录参考，不作为医疗依据
 * 微量营养素（钙/铁/锌/维生素A/维生素C）参考《中国食物成分表》及 USDA 数据库
 */

// ==================== 微量营养素映射表（每100g可食部分）====================
// 字段：钙(mg) / 铁(mg) / 锌(mg) / 维生素A(μgRAE) / 维生素C(mg)
var MICRO_NUTRIENTS = {
  // 主食
  'rice_white':       { ca: 10, fe: 0.2, zn: 0.5, va: 0,   vc: 0 },
  'rice_congee':      { ca: 7,  fe: 0.1, zn: 0.2, va: 0,   vc: 0 },
  'noodles':          { ca: 15, fe: 0.4, zn: 0.6, va: 0,   vc: 0 },
  'mantou':           { ca: 38, fe: 1.0, zn: 0.7, va: 0,   vc: 0 },
  'steamed_bun':      { ca: 20, fe: 1.5, zn: 0.8, va: 10,  vc: 0 },
  'fried_rice':       { ca: 30, fe: 1.8, zn: 1.0, va: 30,  vc: 2 },
  'congee_mixed':     { ca: 12, fe: 0.5, zn: 0.3, va: 0,   vc: 0 },
  'rice_noodles':     { ca: 15, fe: 1.2, zn: 0.5, va: 0,   vc: 0 },
  'dumpling':         { ca: 25, fe: 1.2, zn: 0.9, va: 15,  vc: 1 },
  'steamed_bread':    { ca: 35, fe: 0.9, zn: 0.6, va: 0,   vc: 0 },
  'sweet_potato':     { ca: 30, fe: 0.6, zn: 0.2, va: 125, vc: 2 },
  'corn':             { ca: 2,  fe: 0.7, zn: 0.9, va: 7,   vc: 7 },
  'oatmeal':          { ca: 15, fe: 0.5, zn: 0.4, va: 0,   vc: 0 },
  'porridge_liver':   { ca: 6,  fe: 4.0, zn: 1.5, va: 800, vc: 0 },
  'oatmeal_dry':      { ca: 186,fe: 4.7, zn: 3.6, va: 0,   vc: 0 },
  'chia_seeds':       { ca: 631,fe: 7.7, zn: 4.6, va: 0,   vc: 1 },
  'bread_wholewheat': { ca: 107,fe: 2.5, zn: 2.0, va: 0,   vc: 0 },
  'bread_white':      { ca: 58, fe: 1.3, zn: 0.8, va: 0,   vc: 0 },
  // 肉蛋
  'chicken_breast':   { ca: 9,  fe: 0.6, zn: 0.9, va: 5,   vc: 0 },
  'chicken_leg':      { ca: 10, fe: 0.8, zn: 1.0, va: 10,  vc: 0 },
  'pork_lean':        { ca: 6,  fe: 3.0, zn: 2.9, va: 10,  vc: 0 },
  'pork_belly':       { ca: 6,  fe: 1.0, zn: 1.0, va: 3,   vc: 0 },
  'pork_ribs':        { ca: 12, fe: 1.4, zn: 3.6, va: 5,   vc: 0 },
  'beef':             { ca: 9,  fe: 2.8, zn: 4.3, va: 0,   vc: 0 },
  'fish_steamed':     { ca: 138,fe: 1.2, zn: 0.8, va: 15,  vc: 0 },
  'shrimp':           { ca: 62, fe: 1.5, zn: 1.3, va: 15,  vc: 0 },
  'egg_boiled':       { ca: 50, fe: 1.2, zn: 1.1, va: 234, vc: 0 },
  'egg_fried':        { ca: 48, fe: 1.3, zn: 1.1, va: 220, vc: 0 },
  'duck':             { ca: 6,  fe: 2.2, zn: 1.3, va: 14,  vc: 0 },
  'lamb':             { ca: 6,  fe: 2.3, zn: 2.1, va: 0,   vc: 0 },
  'egg_custard':      { ca: 45, fe: 1.0, zn: 0.9, va: 200, vc: 0 },
  // 蔬菜
  'tomato':           { ca: 10, fe: 0.3, zn: 0.1, va: 92,  vc: 19 },
  'cabbage':          { ca: 50, fe: 0.7, zn: 0.3, va: 20,  vc: 31 },
  'spinach':          { ca: 66, fe: 2.9, zn: 0.8, va: 487, vc: 32 },
  'broccoli':         { ca: 67, fe: 1.0, zn: 0.4, va: 120, vc: 51 },
  'cucumber':         { ca: 24, fe: 0.5, zn: 0.2, va: 15,  vc: 9 },
  'carrot':           { ca: 32, fe: 1.0, zn: 0.2, va: 688, vc: 13 },
  'eggplant':         { ca: 24, fe: 0.5, zn: 0.2, va: 8,   vc: 5 },
  'bitter_gourd':     { ca: 14, fe: 0.7, zn: 0.3, va: 17,  vc: 56 },
  'lotus_root':       { ca: 39, fe: 1.4, zn: 0.3, va: 0,   vc: 44 },
  'mushroom':         { ca: 2,  fe: 0.3, zn: 0.7, va: 0,   vc: 1 },
  'tofu':             { ca: 164,fe: 1.9, zn: 1.1, va: 0,   vc: 0 },
  'potato':           { ca: 8,  fe: 0.8, zn: 0.4, va: 5,   vc: 27 },
  // 家常菜
  'dish_tomato_egg':  { ca: 35, fe: 1.5, zn: 0.7, va: 120, vc: 10 },
  'dish_mapo_tofu':   { ca: 120,fe: 1.5, zn: 0.9, va: 5,   vc: 1 },
  'dish_stir_fry_veg':{ ca: 40, fe: 1.0, zn: 0.3, va: 100, vc: 25 },
  'dish_fish_head':   { ca: 100,fe: 1.0, zn: 0.6, va: 10,  vc: 2 },
  'dish_kung_pao':    { ca: 25, fe: 1.5, zn: 1.2, va: 8,   vc: 3 },
  'dish_braised_pork':{ ca: 10, fe: 1.2, zn: 1.5, va: 5,   vc: 0 },
  'dish_steam_fish':  { ca: 138,fe: 1.0, zn: 0.7, va: 12,  vc: 0 },
  'dish_soup_egg':    { ca: 20, fe: 0.5, zn: 0.3, va: 50,  vc: 2 },
  'dish_soup_chicken':{ ca: 15, fe: 0.6, zn: 0.5, va: 8,   vc: 0 },
  'dish_soup_rib':    { ca: 20, fe: 0.8, zn: 0.7, va: 3,   vc: 0 },
  'dish_cold_cucumber':{ca: 20, fe: 0.4, zn: 0.2, va: 10,  vc: 7 },
  'dish_stir_fry_pork':{ca: 15, fe: 2.0, zn: 1.5, va: 8,   vc: 10 },
  'dish_braised_eggplant':{ca:20,fe: 0.6, zn: 0.2, va: 6,  vc: 4 },
  'dish_scrambled':   { ca: 30, fe: 1.3, zn: 0.8, va: 100, vc: 8 },
  'dish_mixed_veg':   { ca: 25, fe: 0.8, zn: 0.3, va: 80,  vc: 15 },
  // 水果
  'apple':            { ca: 4,  fe: 0.6, zn: 0.1, va: 3,   vc: 4 },
  'banana':           { ca: 7,  fe: 0.4, zn: 0.2, va: 10,  vc: 8 },
  'orange':           { ca: 40, fe: 0.1, zn: 0.1, va: 11,  vc: 33 },
  'grape':            { ca: 10, fe: 0.4, zn: 0.1, va: 3,   vc: 4 },
  'watermelon':       { ca: 7,  fe: 0.2, zn: 0.1, va: 28,  vc: 6 },
  'pear':             { ca: 9,  fe: 0.2, zn: 0.1, va: 2,   vc: 4 },
  'peach':            { ca: 6,  fe: 0.4, zn: 0.1, va: 2,   vc: 7 },
  // 饮品
  'milk':             { ca: 107,fe: 0.3, zn: 0.4, va: 24,  vc: 1 },
  'yogurt':           { ca: 118,fe: 0.4, zn: 0.5, va: 26,  vc: 1 },
  'soy_milk':         { ca: 10, fe: 0.4, zn: 0.2, va: 0,   vc: 0 },
  'green_tea':        { ca: 0,  fe: 0,   zn: 0,   va: 0,   vc: 0 },
  'milk_skim':        { ca: 125,fe: 0.3, zn: 0.4, va: 2,   vc: 1 },
  'milk_lowfat':      { ca: 116,fe: 0.3, zn: 0.4, va: 14,  vc: 1 },
  'coffee_black':     { ca: 2,  fe: 0,   zn: 0,   va: 0,   vc: 0 },
  'coffee_latte':     { ca: 80, fe: 0.2, zn: 0.3, va: 18,  vc: 0 },
  // 补剂
  'protein_whey':     { ca: 200,fe: 1.0, zn: 2.0, va: 0,   vc: 0 },
  'protein_isolate':  { ca: 180,fe: 0.8, zn: 1.8, va: 0,   vc: 0 },
  'protein_casein':   { ca: 300,fe: 0.5, zn: 1.5, va: 0,   vc: 0 },
  'protein_plant':    { ca: 150,fe: 5.0, zn: 3.0, va: 0,   vc: 0 },
  'protein_mass':     { ca: 100,fe: 2.0, zn: 2.5, va: 0,   vc: 0 },
  'protein_muscle_tech':{ca:190,fe: 1.0, zn: 2.0, va: 0,   vc: 0 },
  'protein_knight':   { ca: 185,fe: 0.9, zn: 1.9, va: 0,   vc: 0 },
  'protein_tomson':   { ca: 180,fe: 0.8, zn: 1.8, va: 0,   vc: 0 },
  'protein_collagen': { ca: 0,  fe: 0,   zn: 0,   va: 0,   vc: 0 },
  'protein_super':    { ca: 160,fe: 1.5, zn: 2.2, va: 0,   vc: 0 },
  'creatine':         { ca: 0,  fe: 0,   zn: 0,   va: 0,   vc: 0 },
  'mct_oil':          { ca: 0,  fe: 0,   zn: 0,   va: 0,   vc: 0 },
  // 坚果零食
  'walnut':           { ca: 98, fe: 2.9, zn: 2.2, va: 1,   vc: 1 },
  'almond':           { ca: 269,fe: 3.7, zn: 3.1, va: 0,   vc: 0 },
  'peanut':           { ca: 92, fe: 4.6, zn: 2.5, va: 0,   vc: 0 },
  'nuts_mixed':       { ca: 150,fe: 3.5, zn: 2.6, va: 1,   vc: 1 },
  'energy_bar':       { ca: 100,fe: 2.5, zn: 2.0, va: 0,   vc: 5 },
  'chocolate_dark':   { ca: 73, fe: 11.9,zn: 3.3, va: 2,   vc: 0 },
  // 外卖
  'takeout_huangmen': { ca: 40, fe: 2.0, zn: 1.5, va: 10,  vc: 2 },
  'takeout_beef_noodle':{ca: 25,fe: 2.5, zn: 1.8, va: 5,   vc: 3 },
  'takeout_fried_chicken':{ca:15,fe: 1.2, zn: 1.0, va: 10, vc: 0 },
  'takeout_milk_tea': { ca: 50, fe: 0.2, zn: 0.1, va: 10,  vc: 0 },
  'takeout_bubble_tea':{ca: 45, fe: 0.2, zn: 0.1, va: 8,   vc: 0 },
  'takeout_rice_bowl':{ ca: 30, fe: 1.8, zn: 1.2, va: 8,   vc: 3 },
  'takeout_dumplings':{ ca: 30, fe: 1.5, zn: 1.0, va: 20,  vc: 2 },
  'takeout_hotpot':   { ca: 50, fe: 3.0, zn: 2.5, va: 20,  vc: 5 },
  // 其他
  'rice_dish':        { ca: 30, fe: 1.8, zn: 1.0, va: 30,  vc: 2 },
  'congee_veg':       { ca: 10, fe: 0.4, zn: 0.2, va: 5,   vc: 1 },
  'jellyfish':        { ca: 182,fe: 5.1, zn: 0.5, va: 0,   vc: 0 },
  // 扩充蔬菜
  'lettuce':           { ca: 34, fe: 0.9, zn: 0.3, va: 25,  vc: 10 },
  'avocado':           { ca: 12, fe: 0.6, zn: 0.6, va: 7,   vc: 8 },
  'celery':            { ca: 48, fe: 0.8, zn: 0.5, va: 13,  vc: 12 },
  'leek':              { ca: 42, fe: 1.3, zn: 0.4, va: 235, vc: 24 },
  'bean_sprout':       { ca: 9,  fe: 0.5, zn: 0.3, va: 3,   vc: 6 },
  'winter_melon':      { ca: 19, fe: 0.2, zn: 0.1, va: 2,   vc: 18 },
  'pumpkin':           { ca: 16, fe: 0.4, zn: 0.2, va: 74,  vc: 5 },
  'loofah':            { ca: 14, fe: 0.2, zn: 0.2, va: 15,  vc: 5 },
  'lettuce_stem':      { ca: 23, fe: 0.9, zn: 0.3, va: 15,  vc: 4 },
  'chrysanthemum':     { ca: 73, fe: 2.1, zn: 0.4, va: 337, vc: 18 },
  'water_spinach':     { ca: 99, fe: 2.3, zn: 0.4, va: 287, vc: 25 },
  'garlic_sprout':     { ca: 16, fe: 0.4, zn: 0.5, va: 47,  vc: 25 },
  'onion':             { ca: 24, fe: 0.6, zn: 0.2, va: 3,   vc: 8 },
  'bell_pepper':       { ca: 11, fe: 0.5, zn: 0.2, va: 132, vc: 130 },
  'okra':              { ca: 45, fe: 0.4, zn: 0.3, va: 31,  vc: 16 },
  'cauliflower':       { ca: 23, fe: 1.1, zn: 0.3, va: 5,   vc: 61 },
  'bok_choy':          { ca: 90, fe: 1.9, zn: 0.5, va: 168, vc: 28 },
  'water_chestnut':    { ca: 4,  fe: 0.6, zn: 0.3, va: 0,   vc: 7 },
  'bamboo_shoot':      { ca: 9,  fe: 0.5, zn: 0.3, va: 5,   vc: 5 },
  'wood_ear':          { ca: 247,fe: 97.4,zn: 3.2, va: 17,  vc: 0 },
  'kelp':              { ca: 348,fe: 4.7, zn: 0.6, va: 0,   vc: 0 },
  'seaweed':           { ca: 264,fe: 54.9,zn: 2.5, va: 15,  vc: 2 },
  // 扩充水果
  'strawberry':        { ca: 16, fe: 1.8, zn: 0.1, va: 5,   vc: 47 },
  'blueberry':         { ca: 6,  fe: 0.3, zn: 0.2, va: 3,   vc: 9 },
  'kiwi':              { ca: 27, fe: 1.2, zn: 0.6, va: 12,  vc: 62 },
  'mango':             { ca: 11, fe: 0.2, zn: 0.1, va: 54,  vc: 36 },
  'pineapple':         { ca: 12, fe: 0.6, zn: 0.1, va: 3,   vc: 18 },
  'cherry':            { ca: 13, fe: 0.4, zn: 0.1, va: 2,   vc: 7 },
  'pomelo':            { ca: 4,  fe: 0.3, zn: 0.1, va: 2,   vc: 23 },
  'cantaloupe':        { ca: 14, fe: 0.2, zn: 0.1, va: 153, vc: 12 },
  'dragon_fruit':      { ca: 7,  fe: 0.3, zn: 0.2, va: 0,   vc: 3 },
  'pomegranate':       { ca: 9,  fe: 0.3, zn: 0.2, va: 0,   vc: 8 },
  'persimmon':         { ca: 9,  fe: 0.2, zn: 0.1, va: 20,  vc: 30 },
  'jujube':            { ca: 64, fe: 2.3, zn: 0.7, va: 2,   vc: 14 },
  'longan':            { ca: 6,  fe: 0.2, zn: 0.1, va: 0,   vc: 43 },
  'lychee':            { ca: 5,  fe: 0.4, zn: 0.2, va: 0,   vc: 41 },
  'durian':            { ca: 4,  fe: 0.3, zn: 0.3, va: 3,   vc: 24 },
  'papaya':            { ca: 17, fe: 0.2, zn: 0.1, va: 9,   vc: 43 },
  // 扩充肉蛋海鲜
  'salmon':            { ca: 9,  fe: 0.3, zn: 1.0, va: 12,  vc: 0 },
  'hairtail':          { ca: 24, fe: 1.2, zn: 0.7, va: 19,  vc: 0 },
  'bass':              { ca: 138,fe: 1.2, zn: 0.8, va: 15,  vc: 0 },
  'crab':              { ca: 126,fe: 1.8, zn: 3.7, va: 15,  vc: 0 },
  'scallop':           { ca: 142,fe: 7.2, zn: 11.7,va: 0,   vc: 0 },
  'squid':             { ca: 44, fe: 0.5, zn: 2.4, va: 16,  vc: 0 },
  'ham':               { ca: 9,  fe: 1.0, zn: 1.5, va: 0,   vc: 0 },
  'bacon':             { ca: 8,  fe: 0.8, zn: 1.2, va: 0,   vc: 0 },
  'sausage':           { ca: 14, fe: 1.5, zn: 1.8, va: 0,   vc: 0 },
  'chicken_wing':      { ca: 12, fe: 0.9, zn: 0.9, va: 23,  vc: 0 },
  'liver_pork':        { ca: 6,  fe: 22.6,zn: 5.8, va: 6500,vc: 0 },
  'rib_pork':          { ca: 12, fe: 1.4, zn: 3.6, va: 5,   vc: 0 },
  // 扩充主食
  'shaobing':          { ca: 47, fe: 1.2, zn: 0.8, va: 0,   vc: 0 },
  'youtiao':           { ca: 6,  fe: 0.5, zn: 0.4, va: 0,   vc: 0 },
  'jianbing':          { ca: 35, fe: 1.5, zn: 0.9, va: 5,   vc: 0 },
  'zongzi':            { ca: 12, fe: 0.6, zn: 0.5, va: 0,   vc: 0 },
  'nian_gao':          { ca: 10, fe: 0.3, zn: 0.3, va: 0,   vc: 0 },
  'millet_congee':     { ca: 7,  fe: 0.5, zn: 0.3, va: 0,   vc: 0 },
  'babao_congee':      { ca: 13, fe: 0.8, zn: 0.4, va: 0,   vc: 0 },
  'huajuan':           { ca: 38, fe: 1.0, zn: 0.7, va: 0,   vc: 0 },
  'wotou':             { ca: 12, fe: 1.0, zn: 0.5, va: 7,   vc: 0 },
  'taro':              { ca: 36, fe: 0.5, zn: 0.3, va: 2,   vc: 3 },
  'purple_sweet_potato':{ca: 15, fe: 0.4, zn: 0.2, va: 30,  vc: 2 },
  // 扩充家常菜
  'dish_yuxiang_pork': { ca: 25, fe: 2.0, zn: 1.5, va: 10,  vc: 5 },
  'dish_qingjiao_pork':{ ca: 30, fe: 2.5, zn: 1.8, va: 50,  vc: 40 },
  'dish_shredded_potato':{ca: 10,fe: 0.8, zn: 0.3, va: 5,   vc: 15 },
  'dish_dandan_noodle':{ ca: 30, fe: 2.0, zn: 1.2, va: 5,   vc: 3 },
  'dish_cong_bao_lamb':{ ca: 15, fe: 2.5, zn: 2.0, va: 5,   vc: 2 },
  'dish_shuizhu_fish': { ca: 50, fe: 1.5, zn: 0.8, va: 10,  vc: 3 },
  'dish_suancai_fish': { ca: 45, fe: 1.2, zn: 0.7, va: 8,   vc: 5 },
  'dish_huiguo_pork':  { ca: 20, fe: 1.8, zn: 1.5, va: 5,   vc: 2 },
  'dish_ganbian_beans':{ ca: 40, fe: 1.5, zn: 0.5, va: 15,  vc: 10 },
  'dish_disanxian':    { ca: 15, fe: 1.0, zn: 0.3, va: 30,  vc: 20 },
  'dish_guobaorou':    { ca: 15, fe: 1.5, zn: 1.2, va: 3,   vc: 2 },
  'dish_sweet_sour_rib':{ca: 20,fe: 1.5, zn: 2.0, va: 3,   vc: 1 },
  'dish_cold_cucumber':{ ca: 20, fe: 0.4, zn: 0.2, va: 10,  vc: 7 },
  'dish_garlic_broccoli':{ca: 50,fe: 0.8, zn: 0.3, va: 90,  vc: 38 },
  'dish_bai_zhuo_shrimp':{ca: 62,fe: 1.5, zn: 1.3, va: 15,  vc: 0 },
  'dish_cola_chicken': { ca: 12, fe: 0.9, zn: 0.9, va: 20,  vc: 0 },
  'dish_potato_beef':  { ca: 20, fe: 2.5, zn: 2.0, va: 5,   vc: 8 },
  'dish_tomato_beef':  { ca: 25, fe: 2.8, zn: 2.2, va: 40,  vc: 12 },
  'dish_chicken_mushroom':{ca: 15,fe: 1.5, zn: 1.0, va: 8,  vc: 5 },
  'dish_hongshao_rib': { ca: 20, fe: 1.5, zn: 2.5, va: 5,   vc: 1 },
  'dish_xiangla_chicken':{ca: 15,fe: 1.0, zn: 0.8, va: 10,  vc: 2 },
  // 扩充豆制品
  'soybean':           { ca: 191,fe: 8.2, zn: 3.3, va: 13,  vc: 0 },
  'mung_bean':         { ca: 81, fe: 6.5, zn: 2.2, va: 3,   vc: 0 },
  'red_bean':          { ca: 74, fe: 7.4, zn: 2.2, va: 3,   vc: 0 },
  'yuba':              { ca: 77, fe: 16.5,zn: 3.7, va: 0,   vc: 0 },
  'dried_tofu':        { ca: 308,fe: 4.0, zn: 1.8, va: 0,   vc: 0 },
  'tofu_skin':         { ca: 116,fe: 13.9,zn: 2.5, va: 0,   vc: 0 },
  'edamame':           { ca: 135,fe: 3.5, zn: 1.7, va: 22,  vc: 27 },
  // 扩充坚果零食
  'cashew':            { ca: 26, fe: 3.6, zn: 4.3, va: 0,   vc: 0 },
  'pistachio':         { ca: 108,fe: 4.0, zn: 2.2, va: 8,   vc: 3 },
  'pine_nut':          { ca: 3,  fe: 5.9, zn: 4.6, va: 2,   vc: 0 },
  'sunflower_seed':    { ca: 115,fe: 2.9, zn: 5.0, va: 5,   vc: 0 },
  'chips':             { ca: 20, fe: 0.6, zn: 0.4, va: 0,   vc: 10 },
  'biscuit':           { ca: 50, fe: 1.0, zn: 0.5, va: 0,   vc: 0 },
  'cake':              { ca: 40, fe: 0.8, zn: 0.4, va: 50,  vc: 0 },
  'ice_cream':         { ca: 128,fe: 0.2, zn: 0.4, va: 48,  vc: 1 },
  'jelly':             { ca: 4,  fe: 0.1, zn: 0,   va: 0,   vc: 0 },
  'candy':             { ca: 0,  fe: 0,   zn: 0,   va: 0,   vc: 0 },
  // 扩充饮品
  'lemon_water':       { ca: 8,  fe: 0.1, zn: 0,   va: 1,   vc: 5 },
  'honey_water':       { ca: 2,  fe: 0.1, zn: 0,   va: 0,   vc: 0 },
  'jujube_tea':        { ca: 10, fe: 0.3, zn: 0.1, va: 1,   vc: 2 },
  'soybean_milk_mix':  { ca: 15, fe: 0.4, zn: 0.2, va: 0,   vc: 0 },
  'coconut_juice':     { ca: 20, fe: 0.1, zn: 0.1, va: 0,   vc: 2 },
  'orange_juice':      { ca: 11, fe: 0.1, zn: 0,   va: 10,  vc: 33 },
  'sour_plum':         { ca: 5,  fe: 0.1, zn: 0,   va: 0,   vc: 1 },
  'beer':              { ca: 7,  fe: 0.1, zn: 0,   va: 0,   vc: 0 },
  'red_wine':          { ca: 7,  fe: 0.3, zn: 0.1, va: 0,   vc: 0 },
  // 扩充调味品/其他
  'sugar':             { ca: 1,  fe: 0,   zn: 0,   va: 0,   vc: 0 },
  'honey':             { ca: 4,  fe: 1.0, zn: 0.2, va: 0,   vc: 3 },
  'dark_chocolate':    { ca: 73, fe: 11.9,zn: 3.3, va: 2,   vc: 0 },
  'milk_chocolate':    { ca: 189,fe: 2.4, zn: 2.2, va: 56,  vc: 0 },
  'egg_tart':          { ca: 45, fe: 1.0, zn: 0.5, va: 80,  vc: 0 },
  'donut':             { ca: 30, fe: 0.8, zn: 0.4, va: 10,  vc: 0 },
  'croissant':         { ca: 50, fe: 1.5, zn: 0.6, va: 30,  vc: 0 },
  // ===== 新增：更多主食 =====
  'mixed_grain_rice':      { ca: 20, fe: 1.5, zn: 1.2, va: 0,   vc: 0 },
  'yangzhou_fried_rice':   { ca: 35, fe: 2.0, zn: 1.3, va: 35,  vc: 3 },
  'claypot_rice':          { ca: 25, fe: 1.8, zn: 1.2, va: 20,  vc: 2 },
  'rice_cake_niangao':     { ca: 30, fe: 1.0, zn: 0.6, va: 0,   vc: 0 },
  'wonton':                { ca: 30, fe: 1.5, zn: 1.1, va: 20,  vc: 1 },
  'shaobing':              { ca: 50, fe: 2.0, zn: 0.8, va: 10,  vc: 0 },
  'youtiao':               { ca: 25, fe: 1.0, zn: 0.6, va: 0,   vc: 0 },
  'jianbing_guozi':        { ca: 40, fe: 1.8, zn: 0.9, va: 25,  vc: 2 },
  'scallion_pancake_hand': { ca: 35, fe: 1.2, zn: 0.6, va: 10,  vc: 0 },
  'rice_rolls_changfen':   { ca: 15, fe: 0.6, zn: 0.4, va: 0,   vc: 0 },
  'zongzi':                { ca: 20, fe: 1.2, zn: 0.8, va: 5,   vc: 0 },
  'tangyuan':              { ca: 25, fe: 0.8, zn: 0.5, va: 0,   vc: 0 },
  'yuanxiao':              { ca: 25, fe: 0.8, zn: 0.5, va: 0,   vc: 0 },
  'mung_bean_congee':      { ca: 15, fe: 0.8, zn: 0.4, va: 0,   vc: 0 },
  'millet_congee':         { ca: 18, fe: 1.0, zn: 0.5, va: 0,   vc: 0 },
  'century_egg_pork_congee':{ca: 12, fe: 2.5, zn: 0.8, va: 30,  vc: 0 },
  'eight_treasure_rice':   { ca: 20, fe: 1.0, zn: 0.6, va: 5,   vc: 0 },
  'rice_ball_zifan':       { ca: 15, fe: 0.6, zn: 0.4, va: 5,   vc: 0 },
  'shengjian_bao':         { ca: 30, fe: 1.5, zn: 0.9, va: 15,  vc: 1 },
  'soup_dumpling':         { ca: 28, fe: 1.4, zn: 0.9, va: 15,  vc: 1 },
  'char_siu_bao':          { ca: 25, fe: 1.2, zn: 0.8, va: 10,  vc: 0 },
  'lotus_paste_bun':       { ca: 22, fe: 1.0, zn: 0.5, va: 0,   vc: 0 },
  'red_bean_bun':          { ca: 22, fe: 1.0, zn: 0.5, va: 0,   vc: 0 },
  'youbing':               { ca: 30, fe: 1.2, zn: 0.6, va: 5,   vc: 0 },
  'mahua':                 { ca: 40, fe: 1.5, zn: 0.7, va: 5,   vc: 0 },
  'sachima':               { ca: 35, fe: 1.5, zn: 0.6, va: 10,  vc: 0 },
  'walnut_cookie':         { ca: 50, fe: 1.5, zn: 0.7, va: 5,   vc: 0 },
  'spring_roll':           { ca: 30, fe: 1.2, zn: 0.7, va: 15,  vc: 2 },
  'chive_pocket':          { ca: 45, fe: 1.8, zn: 0.8, va: 60,  vc: 8 },
  'egg_filled_pancake':    { ca: 40, fe: 1.5, zn: 0.8, va: 30,  vc: 1 },
  'roujiamo':              { ca: 30, fe: 1.8, zn: 1.2, va: 8,   vc: 1 },
  'liangpi':               { ca: 15, fe: 0.8, zn: 0.4, va: 0,   vc: 0 },
  'lanzhou_beef_noodle':   { ca: 25, fe: 2.0, zn: 1.3, va: 8,   vc: 2 },
  'chongqing_noodles':     { ca: 30, fe: 1.8, zn: 0.9, va: 10,  vc: 3 },
  'hot_dry_noodles':       { ca: 35, fe: 2.0, zn: 1.0, va: 8,   vc: 1 },
  'zhajiangmian':          { ca: 30, fe: 1.8, zn: 1.0, va: 10,  vc: 2 },
  'xinjiang_fried_noodles':{ ca: 30, fe: 1.8, zn: 1.0, va: 15,  vc: 3 },
  'guotie':                { ca: 28, fe: 1.4, zn: 0.9, va: 15,  vc: 1 },

  // ===== 新增：更多肉类/水产 =====
  'pig_trotters':          { ca: 33, fe: 1.0, zn: 1.0, va: 3,   vc: 0 },
  'chicken_feet':          { ca: 36, fe: 0.4, zn: 0.4, va: 5,   vc: 0 },
  'chicken_wing':          { ca: 12, fe: 0.8, zn: 0.9, va: 14,  vc: 0 },
  'duck_leg':              { ca: 6,  fe: 2.2, zn: 1.3, va: 14,  vc: 0 },
  'duck_neck':             { ca: 15, fe: 2.0, zn: 1.5, va: 10,  vc: 0 },
  'spiced_beef':           { ca: 10, fe: 4.0, zn: 5.0, va: 0,   vc: 0 },
  'braised_meat':          { ca: 12, fe: 2.5, zn: 2.5, va: 5,   vc: 0 },
  'cured_meat':            { ca: 22, fe: 3.0, zn: 3.0, va: 30,  vc: 0 },
  'sausage':               { ca: 14, fe: 2.5, zn: 2.5, va: 20,  vc: 0 },
  'ham':                   { ca: 10, fe: 2.0, zn: 2.0, va: 10,  vc: 0 },
  'bacon':                 { ca: 11, fe: 1.5, zn: 2.5, va: 5,   vc: 0 },
  'luncheon_meat':         { ca: 15, fe: 1.5, zn: 1.5, va: 10,  vc: 0 },
  'meat_floss':            { ca: 30, fe: 5.0, zn: 3.0, va: 15,  vc: 0 },
  'meatball':              { ca: 20, fe: 1.5, zn: 1.5, va: 8,   vc: 0 },
  'fish_ball':             { ca: 30, fe: 1.0, zn: 0.6, va: 5,   vc: 0 },
  'crab_stick':            { ca: 20, fe: 0.5, zn: 0.3, va: 5,   vc: 0 },
  'squid':                 { ca: 44, fe: 0.5, zn: 2.4, va: 16,  vc: 0 },
  'octopus':               { ca: 46, fe: 0.6, zn: 1.7, va: 30,  vc: 0 },
  'scallop':               { ca: 142,fe: 7.2, zn: 11.7,va: 0,   vc: 0 },
  'oyster':                { ca: 131,fe: 7.1, zn: 9.4, va: 27,  vc: 0 },
  'clam':                  { ca: 133,fe: 10.9,zn: 2.4, va: 20,  vc: 0 },
  'river_snail':           { ca: 245,fe: 19.7,zn: 6.2, va: 0,   vc: 0 },
  'crayfish':              { ca: 85, fe: 2.0, zn: 2.2, va: 15,  vc: 0 },
  'hairy_crab':            { ca: 126,fe: 1.8, zn: 3.7, va: 389, vc: 0 },
  'mantis_shrimp':         { ca: 66, fe: 1.0, zn: 2.4, va: 25,  vc: 0 },
  'beef_brisket':          { ca: 9,  fe: 2.7, zn: 4.5, va: 0,   vc: 0 },
  'steak':                 { ca: 10, fe: 2.5, zn: 4.0, va: 0,   vc: 0 },
  'pork_liver':            { ca: 6,  fe: 22.6,zn: 5.8, va: 4972,vc: 0 },
  'duck_blood':            { ca: 10, fe: 25.0,zn: 0.3, va: 0,   vc: 0 },
  'chicken_gizzard':       { ca: 7,  fe: 4.4, zn: 2.8, va: 36,  vc: 0 },

  // ===== 新增：更多蔬菜 =====
  'rapeseed':              { ca: 108,fe: 1.4, zn: 0.3, va: 103, vc: 36 },
  'celery':                { ca: 48, fe: 0.8, zn: 0.5, va: 13,  vc: 12 },
  'chives':                { ca: 42, fe: 1.7, zn: 0.4, va: 235, vc: 24 },
  'water_spinach':         { ca: 99, fe: 2.3, zn: 0.4, va: 281, vc: 25 },
  'lettuce':               { ca: 34, fe: 0.9, zn: 0.3, va: 29,  vc: 13 },
  'romaine_lettuce':       { ca: 70, fe: 1.2, zn: 0.4, va: 60,  vc: 10 },
  'amaranth':              { ca: 187,fe: 2.9, zn: 0.8, va: 248, vc: 30 },
  'chrysanthemum_greens':  { ca: 73, fe: 2.5, zn: 0.4, va: 242, vc: 18 },
  'chinese_broccoli':      { ca: 128,fe: 2.0, zn: 0.5, va: 300, vc: 76 },
  'asparagus':             { ca: 10, fe: 1.4, zn: 0.4, va: 5,   vc: 7 },
  'okra':                  { ca: 45, fe: 0.6, zn: 0.3, va: 10,  vc: 16 },
  'green_beans':           { ca: 42, fe: 1.0, zn: 0.3, va: 15,  vc: 9 },
  'kidney_beans':          { ca: 43, fe: 1.0, zn: 0.3, va: 15,  vc: 6 },
  'peas':                  { ca: 20, fe: 1.5, zn: 0.5, va: 42,  vc: 40 },
  'snow_peas':             { ca: 43, fe: 1.7, zn: 0.3, va: 25,  vc: 60 },
  'mung_sprouts':          { ca: 9,  fe: 0.6, zn: 0.2, va: 3,   vc: 6 },
  'soy_sprouts':           { ca: 21, fe: 0.9, zn: 0.5, va: 5,   vc: 8 },
  'wood_ear':              { ca: 34, fe: 5.5, zn: 0.5, va: 3,   vc: 0 },
  'snow_fungus':           { ca: 36, fe: 0.4, zn: 0.3, va: 0,   vc: 0 },
  'kelp':                  { ca: 46, fe: 0.9, zn: 0.2, va: 0,   vc: 0 },
  'seaweed_nori':          { ca: 264,fe: 54.9,zn: 2.5, va: 15,  vc: 2 },
  'winter_melon':          { ca: 19, fe: 0.2, zn: 0.1, va: 2,   vc: 18 },
  'pumpkin':               { ca: 16, fe: 0.4, zn: 0.1, va: 74,  vc: 5 },
  'loofah':                { ca: 14, fe: 0.2, zn: 0.2, va: 3,   vc: 5 },
  'chayote':               { ca: 17, fe: 0.4, zn: 0.2, va: 3,   vc: 12 },
  'zucchini':              { ca: 15, fe: 0.4, zn: 0.2, va: 10,  vc: 9 },
  'bamboo_shoots':         { ca: 9,  fe: 0.5, zn: 0.3, va: 5,   vc: 5 },
  'spring_shoots':         { ca: 9,  fe: 0.5, zn: 0.3, va: 5,   vc: 5 },
  'winter_shoots':         { ca: 22, fe: 0.3, zn: 0.3, va: 5,   vc: 1 },
  'baby_corn':             { ca: 12, fe: 0.4, zn: 0.3, va: 3,   vc: 6 },
  'baby_cabbage':          { ca: 50, fe: 0.7, zn: 0.3, va: 20,  vc: 31 },
  'cauliflower':           { ca: 23, fe: 1.1, zn: 0.4, va: 5,   vc: 61 },
  'onion':                 { ca: 24, fe: 0.6, zn: 0.2, va: 1,   vc: 8 },
  'garlic':                { ca: 39, fe: 1.2, zn: 0.9, va: 0,   vc: 7 },
  'ginger':                { ca: 27, fe: 1.4, zn: 0.3, va: 0,   vc: 4 },
  'chili_pepper':          { ca: 37, fe: 1.4, zn: 0.3, va: 57,  vc: 62 },
  'bell_pepper':           { ca: 14, fe: 0.8, zn: 0.2, va: 57,  vc: 130 },
  'sweet_pepper':          { ca: 14, fe: 0.8, zn: 0.2, va: 57,  vc: 130 },
  'water_bamboo':          { ca: 4,  fe: 0.4, zn: 0.3, va: 0,   vc: 5 },
  'stem_lettuce':          { ca: 23, fe: 0.9, zn: 0.3, va: 15,  vc: 4 },
  'yam_chinese':           { ca: 16, fe: 0.3, zn: 0.3, va: 3,   vc: 5 },
  'taro':                  { ca: 36, fe: 0.6, zn: 0.5, va: 0,   vc: 2 },
  'konjac':                { ca: 33, fe: 0.6, zn: 0.3, va: 0,   vc: 0 },

  // ===== 新增：更多水果 =====
  'strawberry':            { ca: 16, fe: 1.8, zn: 0.1, va: 5,   vc: 47 },
  'blueberry':             { ca: 6,  fe: 0.3, zn: 0.1, va: 3,   vc: 9 },
  'cherry':                { ca: 13, fe: 0.4, zn: 0.1, va: 2,   vc: 7 },
  'lychee':                { ca: 2,  fe: 0.4, zn: 0.2, va: 2,   vc: 41 },
  'longan':                { ca: 6,  fe: 0.2, zn: 0.1, va: 2,   vc: 43 },
  'mango':                 { ca: 9,  fe: 0.2, zn: 0.1, va: 26,  vc: 23 },
  'pineapple':             { ca: 12, fe: 0.6, zn: 0.1, va: 3,   vc: 18 },
  'durian':                { ca: 9,  fe: 0.3, zn: 0.3, va: 3,   vc: 24 },
  'coconut':               { ca: 14, fe: 0.4, zn: 0.4, va: 0,   vc: 6 },
  'dragon_fruit':          { ca: 7,  fe: 0.3, zn: 0.2, va: 0,   vc: 3 },
  'kiwi':                  { ca: 27, fe: 1.2, zn: 0.6, va: 22,  vc: 62 },
  'pomegranate':           { ca: 9,  fe: 0.3, zn: 0.2, va: 0,   vc: 8 },
  'persimmon':             { ca: 9,  fe: 0.2, zn: 0.1, va: 20,  vc: 30 },
  'jujube':                { ca: 22, fe: 0.5, zn: 0.2, va: 2,   vc: 243 },
  'hawthorn':              { ca: 52, fe: 0.4, zn: 0.3, va: 8,   vc: 53 },
  'papaya':                { ca: 17, fe: 0.2, zn: 0.1, va: 26,  vc: 43 },
  'passion_fruit':         { ca: 12, fe: 1.2, zn: 0.3, va: 24,  vc: 30 },
  'pomelo':                { ca: 4,  fe: 0.3, zn: 0.1, va: 2,   vc: 23 },
  'lemon':                 { ca: 101,fe: 0.8, zn: 0.1, va: 0,   vc: 22 },
  'avocado':               { ca: 12, fe: 0.6, zn: 0.6, va: 7,   vc: 8 },
  'mangosteen':            { ca: 12, fe: 0.2, zn: 0.2, va: 0,   vc: 2.9 },
  'rambutan':              { ca: 5,  fe: 0.3, zn: 0.1, va: 0,   vc: 4 },
  'bayberry':              { ca: 14, fe: 1.0, zn: 0.1, va: 0,   vc: 9 },
  'starfruit':             { ca: 4,  fe: 0.3, zn: 0.1, va: 2,   vc: 7 },
  'cantaloupe':            { ca: 14, fe: 0.2, zn: 0.1, va: 84,  vc: 12 },
  'muskmelon':             { ca: 9,  fe: 0.2, zn: 0.1, va: 5,   vc: 10 },
  'melon':                 { ca: 9,  fe: 0.2, zn: 0.1, va: 5,   vc: 10 },
  'loquat':                { ca: 16, fe: 0.3, zn: 0.2, va: 12,  vc: 1 },
  'fig':                   { ca: 67, fe: 0.4, zn: 0.2, va: 2,   vc: 2 },
  'cherry_tomato':         { ca: 10, fe: 0.3, zn: 0.2, va: 92,  vc: 22 },

  // ===== 新增：更多家常菜 =====
  'yuxiang_shredded_pork': { ca: 25, fe: 2.0, zn: 1.2, va: 30,  vc: 5 },
  'twice_cooked_pork':     { ca: 15, fe: 1.5, zn: 1.5, va: 10,  vc: 3 },
  'boiled_fish':           { ca: 60, fe: 1.0, zn: 0.7, va: 10,  vc: 2 },
  'pickled_cabbage_fish':  { ca: 55, fe: 1.0, zn: 0.6, va: 8,   vc: 3 },
  'mao_xue_wang':          { ca: 30, fe: 2.5, zn: 1.5, va: 15,  vc: 2 },
  'spicy_chicken':         { ca: 20, fe: 1.2, zn: 1.0, va: 10,  vc: 1 },
  'mouthwatering_chicken': { ca: 15, fe: 1.0, zn: 0.9, va: 12,  vc: 1 },
  'white_cut_chicken':     { ca: 9,  fe: 1.0, zn: 1.0, va: 14,  vc: 0 },
  'salt_baked_chicken':    { ca: 20, fe: 1.2, zn: 1.1, va: 15,  vc: 0 },
  'beggars_chicken':       { ca: 18, fe: 1.2, zn: 1.0, va: 12,  vc: 1 },
  'buddha_jumps_soup':     { ca: 40, fe: 2.0, zn: 1.5, va: 20,  vc: 1 },
  'dongpo_pork':           { ca: 12, fe: 1.2, zn: 1.5, va: 5,   vc: 0 },
  'meicai_kourou':         { ca: 30, fe: 2.0, zn: 1.5, va: 15,  vc: 1 },
  'steamed_pork_rice_powder':{ca: 20,fe: 1.5, zn: 1.2, va: 8,   vc: 0 },
  'guobaorou':             { ca: 15, fe: 1.5, zn: 1.2, va: 8,   vc: 2 },
  'dry_fried_green_beans': { ca: 45, fe: 1.2, zn: 0.4, va: 30,  vc: 12 },
  'hot_sour_shredded_potato':{ca: 10,fe: 0.5, zn: 0.2, va: 5,   vc: 12 },
  'vinegar_cabbage':       { ca: 50, fe: 0.7, zn: 0.3, va: 20,  vc: 31 },
  'garlic_vermicelli_scallop':{ca: 70,fe: 1.5, zn: 1.2, va: 5,  vc: 2 },
  'scallion_lamb':         { ca: 10, fe: 2.5, zn: 2.2, va: 5,   vc: 1 },
  'boiled_beef':           { ca: 12, fe: 2.8, zn: 4.0, va: 5,   vc: 1 },
  'sizzling_beef':         { ca: 12, fe: 2.5, zn: 3.8, va: 5,   vc: 1 },
  'black_pepper_beef':     { ca: 12, fe: 2.7, zn: 4.0, va: 5,   vc: 2 },
  'curry_chicken':         { ca: 25, fe: 1.2, zn: 1.0, va: 15,  vc: 3 },
  'braised_chicken_huangmen':{ca: 20,fe: 1.2, zn: 1.0, va: 12,  vc: 1 },
  'dapanji':               { ca: 20, fe: 1.5, zn: 1.2, va: 15,  vc: 5 },
  'sweet_sour_pork':       { ca: 15, fe: 1.5, zn: 1.3, va: 8,   vc: 3 },
  'jingjiang_shredded_pork':{ca: 15,fe: 2.0, zn: 1.5, va: 8,    vc: 2 },
  'muxu_pork':             { ca: 30, fe: 1.8, zn: 1.0, va: 60,  vc: 5 },
  'garlic_sprout_pork':    { ca: 20, fe: 2.0, zn: 1.2, va: 15,  vc: 8 },
  'yuxiang_eggplant':      { ca: 24, fe: 0.5, zn: 0.2, va: 8,   vc: 5 },
  'dry_cauliflower':       { ca: 23, fe: 1.1, zn: 0.4, va: 5,   vc: 61 },
  'mushroom_greens':       { ca: 60, fe: 1.5, zn: 0.4, va: 103, vc: 36 },
  'oyster_sauce_lettuce':  { ca: 34, fe: 0.9, zn: 0.3, va: 29,  vc: 13 },
  'garlic_broccoli':       { ca: 67, fe: 1.0, zn: 0.4, va: 120, vc: 51 },
  'cold_wood_ear':         { ca: 34, fe: 5.5, zn: 0.5, va: 3,   vc: 0 },
  'century_egg_tofu':      { ca: 100,fe: 2.5, zn: 1.0, va: 100, vc: 0 },
  'fuchi_feipian':         { ca: 12, fe: 3.0, zn: 3.0, va: 10,  vc: 1 },
  'sweet_sour_ribs':       { ca: 12, fe: 1.4, zn: 3.6, va: 5,   vc: 1 },
  'cola_chicken_wings':    { ca: 12, fe: 0.8, zn: 0.9, va: 14,  vc: 0 },
  'potato_beef_stew':      { ca: 12, fe: 2.0, zn: 2.5, va: 5,   vc: 8 },
  'tomato_beef_brisket':   { ca: 12, fe: 2.5, zn: 2.8, va: 30,  vc: 12 },
  'braised_pork_rice':     { ca: 18, fe: 1.5, zn: 1.2, va: 8,   vc: 1 },

  // ===== 新增：更多饮品 =====
  'fruit_tea':             { ca: 20, fe: 0.2, zn: 0.1, va: 5,   vc: 5 },
  'sparkling_water':       { ca: 0,  fe: 0,   zn: 0,   va: 0,   vc: 0 },
  'sports_drink':          { ca: 3,  fe: 0,   zn: 0,   va: 0,   vc: 0 },
  'energy_drink':          { ca: 5,  fe: 0,   zn: 0,   va: 0,   vc: 0 },
  'coconut_juice':         { ca: 20, fe: 0.3, zn: 0.2, va: 0,   vc: 2 },
  'almond_drink':          { ca: 25, fe: 0.5, zn: 0.3, va: 0,   vc: 0 },
  'walnut_drink':          { ca: 30, fe: 0.6, zn: 0.4, va: 0,   vc: 0 },
  'soy_milk_drink':        { ca: 15, fe: 0.6, zn: 0.3, va: 0,   vc: 0 },
  'oat_milk':              { ca: 20, fe: 0.4, zn: 0.3, va: 0,   vc: 0 },
  'honey_water':           { ca: 10, fe: 0.1, zn: 0,   va: 0,   vc: 1 },
  'lemon_water':           { ca: 4,  fe: 0.1, zn: 0,   va: 1,   vc: 5 },
  'sour_plum_drink':       { ca: 15, fe: 0.2, zn: 0.1, va: 0,   vc: 1 },
  'mung_bean_soup':        { ca: 15, fe: 0.8, zn: 0.3, va: 0,   vc: 0 },
  'red_bean_soup':         { ca: 25, fe: 1.0, zn: 0.4, va: 0,   vc: 0 },
  'snow_fungus_soup':      { ca: 18, fe: 0.2, zn: 0.1, va: 0,   vc: 0 },
  'sesame_soup':           { ca: 60, fe: 1.0, zn: 0.5, va: 0,   vc: 0 },
  'walnut_soup':           { ca: 55, fe: 0.8, zn: 0.5, va: 0,   vc: 0 },
  'peanut_soup':           { ca: 50, fe: 1.2, zn: 0.5, va: 0,   vc: 0 },
  'cola':                  { ca: 3,  fe: 0,   zn: 0,   va: 0,   vc: 0 },
  'orange_juice':          { ca: 11, fe: 0.2, zn: 0,   va: 10,  vc: 33 },

  // ===== 新增：更多零食 =====
  'potato_chips':          { ca: 40, fe: 1.8, zn: 1.5, va: 0,   vc: 30 },
  'biscuit':               { ca: 90, fe: 1.5, zn: 0.8, va: 0,   vc: 0 },
  'cake':                  { ca: 50, fe: 1.0, zn: 0.4, va: 50,  vc: 0 },
  'donut':                 { ca: 30, fe: 0.8, zn: 0.4, va: 20,  vc: 0 },
  'macaron':               { ca: 40, fe: 0.8, zn: 0.4, va: 30,  vc: 0 },
  'ice_cream':             { ca: 120,fe: 0.2, zn: 0.5, va: 50,  vc: 1 },
  'ice_lolly':             { ca: 100,fe: 1.5, zn: 0.3, va: 40,  vc: 0 },
  'popsicle':              { ca: 5,  fe: 0,   zn: 0,   va: 0,   vc: 2 },
  'jelly':                 { ca: 5,  fe: 0,   zn: 0,   va: 0,   vc: 0 },
  'pudding':               { ca: 90, fe: 2.5, zn: 0.4, va: 40,  vc: 0 },
  'cheese':                { ca: 731,fe: 0.6, zn: 4.0, va: 152, vc: 0 },
  'butter':                { ca: 24, fe: 0,   zn: 0.1, va: 535, vc: 0 },
  'chocolate':             { ca: 73, fe: 11.9,zn: 3.3, va: 2,   vc: 0 },
  'candy':                 { ca: 0,  fe: 0,   zn: 0,   va: 0,   vc: 0 },
  'gum':                   { ca: 0,  fe: 0,   zn: 0,   va: 0,   vc: 0 },
  'sunflower_seeds':       { ca: 72, fe: 6.1, zn: 5.9, va: 0,   vc: 0 },
  'pistachio':             { ca: 107,fe: 4.5, zn: 2.8, va: 8,   vc: 0 },
  'cashew':                { ca: 37, fe: 4.8, zn: 4.3, va: 0,   vc: 0 },
  'macadamia':             { ca: 85, fe: 3.7, zn: 1.3, va: 0,   vc: 0 },
  'pine_nuts':             { ca: 14, fe: 5.9, zn: 6.4, va: 2,   vc: 0 },
  'hazelnut':              { ca: 114,fe: 3.3, zn: 2.4, va: 1,   vc: 0 },
  'dried_cranberry':       { ca: 53, fe: 0.9, zn: 0.2, va: 0,   vc: 0 },
  'raisin':                { ca: 50, fe: 1.8, zn: 0.3, va: 0,   vc: 3 },
  'dried_red_date':        { ca: 64, fe: 2.3, zn: 0.6, va: 0,   vc: 7 },
  'dried_mango':           { ca: 30, fe: 0.5, zn: 0.2, va: 30,  vc: 18 },
  'dried_sweet_potato':    { ca: 50, fe: 1.0, zn: 0.3, va: 50,  vc: 5 },
  'rice_cracker':          { ca: 20, fe: 1.5, zn: 0.8, va: 0,   vc: 0 },
  'shrimp_cracker':        { ca: 30, fe: 1.0, zn: 0.5, va: 0,   vc: 0 },
  'popcorn':               { ca: 7,  fe: 0.8, zn: 0.9, va: 7,   vc: 0 },
  'seaweed_snack':         { ca: 264,fe: 54.9,zn: 2.5, va: 15,  vc: 2 },

  // ===== 新增：更多调味品 =====
  'soy_sauce':             { ca: 66, fe: 6.0, zn: 0.6, va: 0,   vc: 0 },
  'vinegar':               { ca: 17, fe: 1.1, zn: 0.3, va: 0,   vc: 0 },
  'cooking_wine':          { ca: 12, fe: 0.1, zn: 0,   va: 0,   vc: 0 },
  'oyster_sauce':          { ca: 88, fe: 1.5, zn: 0.6, va: 0,   vc: 0 },
  'doubanjiang':           { ca: 60, fe: 4.0, zn: 1.0, va: 0,   vc: 0 },
  'sweet_bean_sauce':      { ca: 30, fe: 2.0, zn: 0.5, va: 0,   vc: 0 },
  'sesame_paste':          { ca: 80, fe: 5.8, zn: 4.0, va: 0,   vc: 0 },
  'peanut_butter':         { ca: 50, fe: 1.5, zn: 2.3, va: 0,   vc: 0 },
  'ketchup':               { ca: 15, fe: 0.5, zn: 0.2, va: 25,  vc: 15 },
  'salad_dressing':        { ca: 12, fe: 0.2, zn: 0.1, va: 10,  vc: 0 },
  'mustard':               { ca: 130,fe: 6.0, zn: 1.5, va: 5,   vc: 5 },
  'curry_powder':          { ca: 540,fe: 30.0,zn: 4.0, va: 0,   vc: 5 },
  'five_spice_powder':     { ca: 180,fe: 8.0, zn: 2.0, va: 0,   vc: 0 },
  'chili_powder':          { ca: 100,fe: 9.0, zn: 1.5, va: 60,  vc: 30 },
  'sichuan_pepper_powder': { ca: 130,fe: 6.0, zn: 1.5, va: 0,   vc: 0 },
  'cumin_powder':          { ca: 90, fe: 6.0, zn: 3.0, va: 0,   vc: 0 },
  'white_sugar':           { ca: 1,  fe: 0,   zn: 0,   va: 0,   vc: 0 },
  'brown_sugar':           { ca: 70, fe: 2.0, zn: 0.3, va: 0,   vc: 0 },
  'honey':                 { ca: 4,  fe: 1.0, zn: 0.2, va: 0,   vc: 3 },
  'fermented_black_bean':  { ca: 60, fe: 7.0, zn: 2.0, va: 0,   vc: 0 },

  // ===== 新增：更多豆制品 =====
  'tofu_skin':             { ca: 116,fe: 13.9,zn: 1.7, va: 0,   vc: 0 },
  'yuba':                  { ca: 77, fe: 16.5,zn: 1.5, va: 0,   vc: 0 },
  'dried_tofu':            { ca: 308,fe: 4.9, zn: 1.8, va: 0,   vc: 0 },
  'tofu_sheet':            { ca: 313,fe: 6.4, zn: 2.5, va: 0,   vc: 0 },
  'fried_tofu':            { ca: 147,fe: 2.3, zn: 1.7, va: 0,   vc: 0 },
  'natto':                 { ca: 217,fe: 8.6, zn: 3.6, va: 0,   vc: 0 },
  'miso':                  { ca: 60, fe: 2.8, zn: 1.5, va: 0,   vc: 0 },
  'edamame':               { ca: 197,fe: 3.5, zn: 1.7, va: 22,  vc: 27 },
  'green_peas':            { ca: 195,fe: 4.9, zn: 2.2, va: 10,  vc: 0 },
  'broad_bean':            { ca: 54, fe: 2.2, zn: 1.0, va: 8,   vc: 16 },
  'chickpea':              { ca: 150,fe: 6.2, zn: 3.4, va: 0,   vc: 0 },
  'red_bean':              { ca: 74, fe: 7.4, zn: 2.2, va: 0,   vc: 0 },
  'mung_bean':             { ca: 81, fe: 6.5, zn: 2.2, va: 0,   vc: 0 },
  'black_bean':            { ca: 224,fe: 7.0, zn: 4.2, va: 0,   vc: 0 },
  'soybean':               { ca: 191,fe: 8.2, zn: 3.3, va: 6,   vc: 0 },
  'tofu_pudding':          { ca: 301,fe: 1.9, zn: 0.3, va: 0,   vc: 0 },

  // ===== 新增：更多汤类 =====
  'tomato_egg_soup':       { ca: 18, fe: 0.8, zn: 0.3, va: 50,  vc: 8 },
  'fish_soup':             { ca: 50, fe: 0.5, zn: 0.4, va: 8,   vc: 0 },
  'tofu_soup':             { ca: 80, fe: 1.0, zn: 0.6, va: 0,   vc: 0 },
  'seaweed_soup':          { ca: 264,fe: 54.9,zn: 2.5, va: 15,  vc: 2 },
  'kelp_soup':             { ca: 46, fe: 0.9, zn: 0.2, va: 0,   vc: 0 },
  'winter_melon_soup':     { ca: 19, fe: 0.2, zn: 0.1, va: 2,   vc: 18 },
  'lotus_root_soup':       { ca: 39, fe: 1.4, zn: 0.3, va: 0,   vc: 44 },
  'hot_sour_soup':         { ca: 30, fe: 1.5, zn: 0.5, va: 10,  vc: 1 },
  'spicy_soup_hula':       { ca: 40, fe: 1.2, zn: 0.5, va: 5,   vc: 2 },
  'dough_drop_soup':       { ca: 25, fe: 0.8, zn: 0.3, va: 5,   vc: 1 },
  'mushroom_soup':         { ca: 2,  fe: 0.3, zn: 0.7, va: 0,   vc: 1 },
  'corn_soup':             { ca: 2,  fe: 0.7, zn: 0.9, va: 7,   vc: 7 },
};

// ==================== 将微量营养素合并到 FOOD_DB ====================
 function enrichFoodDB() {
   for (var i = 0; i < FOOD_DB.length; i++) {
     var food = FOOD_DB[i];
     var micro = MICRO_NUTRIENTS[food.id];
     if (micro) {
       food.ca = micro.ca;
       food.fe = micro.fe;
       food.zn = micro.zn;
       food.va = micro.va;
       food.vc = micro.vc;
     } else {
       food.ca = 0; food.fe = 0; food.zn = 0; food.va = 0; food.vc = 0;
     }
   }
 }
 
 var FOOD_DB = [
  // ============ 主食类 ============
  { id: 'rice_white', name: '白米饭', category: '主食', cal: 116, protein: 2.6, fat: 0.3, carb: 25.9, fiber: 0.3, unit: '碗', unitWeight: 200, icon: '🍚' },
  { id: 'rice_congee', name: '白粥', category: '主食', cal: 46, protein: 0.8, fat: 0.1, carb: 10.4, fiber: 0.1, unit: '碗', unitWeight: 300, icon: '🥣' },
  { id: 'noodles', name: '面条（煮）', category: '主食', cal: 110, protein: 3.4, fat: 0.4, carb: 24.3, fiber: 0.4, unit: '碗', unitWeight: 250, icon: '🍜' },
  { id: 'mantou', name: '馒头', category: '主食', cal: 221, protein: 7.0, fat: 1.1, carb: 47.0, fiber: 1.3, unit: '个', unitWeight: 100, icon: '🍞' },
  { id: 'steamed_bun', name: '包子（猪肉馅）', category: '主食', cal: 227, protein: 7.2, fat: 10.1, carb: 27.0, fiber: 0.7, unit: '个', unitWeight: 120, icon: '🥟' },
  { id: 'fried_rice', name: '蛋炒饭', category: '主食', cal: 174, protein: 4.5, fat: 6.5, carb: 24.0, fiber: 0.4, unit: '份', unitWeight: 300, icon: '🍳' },
  { id: 'congee_mixed', name: '八宝粥', category: '主食', cal: 80, protein: 2.0, fat: 0.4, carb: 17.5, fiber: 0.6, unit: '碗', unitWeight: 300, icon: '🥣' },
  { id: 'rice_noodles', name: '米粉（炒）', category: '主食', cal: 155, protein: 3.2, fat: 5.8, carb: 22.0, fiber: 0.3, unit: '份', unitWeight: 300, icon: '🍜' },
  { id: 'dumpling', name: '饺子（猪肉白菜）', category: '主食', cal: 196, protein: 7.8, fat: 7.5, carb: 25.0, fiber: 0.8, unit: '个', unitWeight: 30, icon: '🥟' },
  { id: 'steamed_bread', name: '花卷', category: '主食', cal: 213, protein: 6.4, fat: 4.5, carb: 40.0, fiber: 1.2, unit: '个', unitWeight: 100, icon: '🫓' },
  { id: 'sweet_potato', name: '红薯', category: '主食', cal: 99, protein: 1.1, fat: 0.2, carb: 23.1, fiber: 1.6, unit: '个', unitWeight: 200, icon: '🍠' },
  { id: 'corn', name: '玉米（煮）', category: '主食', cal: 112, protein: 4.0, fat: 1.2, carb: 22.8, fiber: 2.9, unit: '根', unitWeight: 200, icon: '🌽' },
  { id: 'oatmeal', name: '燕麦粥', category: '主食', cal: 65, protein: 2.5, fat: 1.0, carb: 11.5, fiber: 1.0, unit: '碗', unitWeight: 250, icon: '🥣' },
  { id: 'porridge_liver', name: '猪肝粥', category: '主食', cal: 72, protein: 4.5, fat: 1.2, carb: 12.0, fiber: 0.2, unit: '碗', unitWeight: 300, icon: '🥣' },

  // ============ 肉蛋类 ============
  { id: 'chicken_breast', name: '鸡胸肉', category: '肉蛋', cal: 133, protein: 24.6, fat: 3.1, carb: 0.7, fiber: 0, unit: '块', unitWeight: 150, icon: '🍗' },
  { id: 'chicken_leg', name: '鸡腿', category: '肉蛋', cal: 181, protein: 16.0, fat: 12.5, carb: 0.8, fiber: 0, unit: '个', unitWeight: 100, icon: '🍗' },
  { id: 'pork_lean', name: '猪瘦肉', category: '肉蛋', cal: 143, protein: 20.3, fat: 6.2, carb: 1.5, fiber: 0, unit: '份', unitWeight: 100, icon: '🥩' },
  { id: 'pork_belly', name: '五花肉', category: '肉蛋', cal: 349, protein: 14.5, fat: 30.8, carb: 3.2, fiber: 0, unit: '份', unitWeight: 100, icon: '🥩' },
  { id: 'pork_ribs', name: '排骨', category: '肉蛋', cal: 264, protein: 16.7, fat: 21.0, carb: 1.2, fiber: 0, unit: '份', unitWeight: 150, icon: '🍖' },
  { id: 'beef', name: '牛肉', category: '肉蛋', cal: 125, protein: 19.9, fat: 4.2, carb: 2.0, fiber: 0, unit: '份', unitWeight: 100, icon: '🥩' },
  { id: 'fish_steamed', name: '清蒸鱼', category: '肉蛋', cal: 108, protein: 17.8, fat: 3.6, carb: 1.2, fiber: 0, unit: '份', unitWeight: 150, icon: '🐟' },
  { id: 'shrimp', name: '虾', category: '肉蛋', cal: 93, protein: 18.6, fat: 0.8, carb: 2.8, fiber: 0, unit: '份', unitWeight: 100, icon: '🦐' },
  { id: 'egg_boiled', name: '鸡蛋（煮）', category: '肉蛋', cal: 144, protein: 13.3, fat: 8.8, carb: 2.8, fiber: 0, unit: '个', unitWeight: 50, icon: '🥚' },
  { id: 'egg_fried', name: '煎蛋', category: '肉蛋', cal: 199, protein: 13.0, fat: 15.0, carb: 2.5, fiber: 0, unit: '个', unitWeight: 50, icon: '🍳' },
  { id: 'duck', name: '鸭肉', category: '肉蛋', cal: 240, protein: 15.5, fat: 19.7, carb: 0.2, fiber: 0, unit: '份', unitWeight: 100, icon: '🦆' },
  { id: 'lamb', name: '羊肉', category: '肉蛋', cal: 203, protein: 19.0, fat: 14.1, carb: 0, fiber: 0, unit: '份', unitWeight: 100, icon: '🥩' },

  // ============ 蔬菜类 ============
  { id: 'tomato', name: '番茄', category: '蔬菜', cal: 19, protein: 0.9, fat: 0.2, carb: 3.5, fiber: 0.5, unit: '个', unitWeight: 150, icon: '🍅' },
  { id: 'cabbage', name: '白菜', category: '蔬菜', cal: 17, protein: 1.5, fat: 0.1, carb: 2.8, fiber: 0.8, unit: '份', unitWeight: 200, icon: '🥬' },
  { id: 'spinach', name: '菠菜', category: '蔬菜', cal: 24, protein: 2.6, fat: 0.3, carb: 3.6, fiber: 1.7, unit: '份', unitWeight: 150, icon: '🥬' },
  { id: 'broccoli', name: '西兰花', category: '蔬菜', cal: 36, protein: 4.1, fat: 0.6, carb: 4.3, fiber: 1.6, unit: '份', unitWeight: 150, icon: '🥦' },
  { id: 'cucumber', name: '黄瓜', category: '蔬菜', cal: 15, protein: 0.8, fat: 0.2, carb: 2.9, fiber: 0.5, unit: '根', unitWeight: 200, icon: '🥒' },
  { id: 'carrot', name: '胡萝卜', category: '蔬菜', cal: 37, protein: 1.0, fat: 0.2, carb: 8.1, fiber: 2.7, unit: '根', unitWeight: 100, icon: '🥕' },
  { id: 'eggplant', name: '茄子', category: '蔬菜', cal: 21, protein: 1.1, fat: 0.2, carb: 4.6, fiber: 1.3, unit: '根', unitWeight: 200, icon: '🍆' },
  { id: 'bitter_gourd', name: '苦瓜', category: '蔬菜', cal: 19, protein: 1.0, fat: 0.1, carb: 3.5, fiber: 1.4, unit: '份', unitWeight: 150, icon: '🥒' },
  { id: 'lotus_root', name: '莲藕', category: '蔬菜', cal: 73, protein: 1.9, fat: 0.2, carb: 16.4, fiber: 1.2, unit: '份', unitWeight: 150, icon: '🥬' },
  { id: 'mushroom', name: '香菇', category: '蔬菜', cal: 26, protein: 2.2, fat: 0.3, carb: 5.2, fiber: 3.3, unit: '份', unitWeight: 100, icon: '🍄' },
  { id: 'tofu', name: '豆腐', category: '蔬菜', cal: 81, protein: 8.1, fat: 3.7, carb: 4.2, fiber: 0.4, unit: '块', unitWeight: 150, icon: '🧈' },
  { id: 'potato', name: '土豆', category: '蔬菜', cal: 76, protein: 2.0, fat: 0.2, carb: 17.2, fiber: 0.7, unit: '个', unitWeight: 150, icon: '🥔' },

  // ============ 常见家常菜 ============
  { id: 'dish_tomato_egg', name: '番茄炒蛋', category: '家常菜', cal: 85, protein: 5.2, fat: 5.0, carb: 5.5, fiber: 0.4, unit: '份', unitWeight: 200, icon: '🍳' },
  { id: 'dish_mapo_tofu', name: '麻婆豆腐', category: '家常菜', cal: 104, protein: 7.5, fat: 6.5, carb: 4.8, fiber: 0.8, unit: '份', unitWeight: 200, icon: '🫕' },
  { id: 'dish_stir_fry_veg', name: '炒时蔬', category: '家常菜', cal: 55, protein: 2.0, fat: 3.5, carb: 4.0, fiber: 1.2, unit: '份', unitWeight: 200, icon: '🥬' },
  { id: 'dish_fish_head', name: '剁椒鱼头', category: '家常菜', cal: 92, protein: 12.0, fat: 4.0, carb: 3.5, fiber: 0.3, unit: '份', unitWeight: 300, icon: '🐟' },
  { id: 'dish_kung_pao', name: '宫保鸡丁', category: '家常菜', cal: 130, protein: 12.0, fat: 7.5, carb: 6.0, fiber: 1.0, unit: '份', unitWeight: 200, icon: '🍗' },
  { id: 'dish_braised_pork', name: '红烧肉', category: '家常菜', cal: 230, protein: 10.0, fat: 18.0, carb: 8.0, fiber: 0.3, unit: '份', unitWeight: 150, icon: '🥩' },
  { id: 'dish_steam_fish', name: '清蒸鲈鱼', category: '家常菜', cal: 78, protein: 15.0, fat: 2.0, carb: 1.0, fiber: 0, unit: '份', unitWeight: 250, icon: '🐟' },
  { id: 'dish_soup_egg', name: '紫菜蛋花汤', category: '家常菜', cal: 25, protein: 2.5, fat: 1.0, carb: 2.0, fiber: 0.5, unit: '碗', unitWeight: 300, icon: '🥣' },
  { id: 'dish_soup_chicken', name: '鸡汤', category: '家常菜', cal: 55, protein: 5.0, fat: 3.0, carb: 1.5, fiber: 0, unit: '碗', unitWeight: 300, icon: '🥣' },
  { id: 'dish_soup_rib', name: '排骨汤', category: '家常菜', cal: 65, protein: 5.5, fat: 3.8, carb: 2.5, fiber: 0, unit: '碗', unitWeight: 300, icon: '🥣' },
  { id: 'dish_cold_cucumber', name: '凉拌黄瓜', category: '家常菜', cal: 35, protein: 1.0, fat: 2.0, carb: 3.0, fiber: 0.8, unit: '份', unitWeight: 150, icon: '🥒' },
  { id: 'dish_stir_fry_pork', name: '青椒肉丝', category: '家常菜', cal: 120, protein: 12.0, fat: 7.0, carb: 5.0, fiber: 0.8, unit: '份', unitWeight: 200, icon: '🫑' },
  { id: 'dish_braised_eggplant', name: '红烧茄子', category: '家常菜', cal: 110, protein: 2.5, fat: 7.0, carb: 9.0, fiber: 1.0, unit: '份', unitWeight: 200, icon: '🍆' },
  { id: 'dish_scrambled', name: '韭菜炒蛋', category: '家常菜', cal: 95, protein: 7.0, fat: 6.0, carb: 4.5, fiber: 0.8, unit: '份', unitWeight: 180, icon: '🍳' },
  { id: 'dish_mixed_veg', name: '地三鲜', category: '家常菜', cal: 125, protein: 3.0, fat: 8.0, carb: 10.0, fiber: 1.5, unit: '份', unitWeight: 200, icon: '🍆' },

  // ============ 水果类 ============
  { id: 'apple', name: '苹果', category: '水果', cal: 52, protein: 0.2, fat: 0.1, carb: 13.5, fiber: 1.2, unit: '个', unitWeight: 200, icon: '🍎' },
  { id: 'banana', name: '香蕉', category: '水果', cal: 91, protein: 1.4, fat: 0.2, carb: 22.0, fiber: 1.2, unit: '根', unitWeight: 120, icon: '🍌' },
  { id: 'orange', name: '橙子', category: '水果', cal: 48, protein: 0.8, fat: 0.2, carb: 11.1, fiber: 0.6, unit: '个', unitWeight: 200, icon: '🍊' },
  { id: 'grape', name: '葡萄', category: '水果', cal: 43, protein: 0.5, fat: 0.2, carb: 10.3, fiber: 0.4, unit: '份', unitWeight: 150, icon: '🍇' },
  { id: 'watermelon', name: '西瓜', category: '水果', cal: 25, protein: 0.5, fat: 0.1, carb: 5.8, fiber: 0.3, unit: '份', unitWeight: 300, icon: '🍉' },
  { id: 'pear', name: '梨', category: '水果', cal: 44, protein: 0.4, fat: 0.1, carb: 10.6, fiber: 1.4, unit: '个', unitWeight: 200, icon: '🍐' },
  { id: 'peach', name: '桃子', category: '水果', cal: 51, protein: 0.9, fat: 0.1, carb: 12.2, fiber: 1.0, unit: '个', unitWeight: 200, icon: '🍑' },

  // ============ 奶制品/饮品 ============
  { id: 'milk', name: '牛奶', category: '饮品', cal: 54, protein: 3.0, fat: 3.2, carb: 3.4, fiber: 0, unit: '杯', unitWeight: 250, icon: '🥛' },
  { id: 'yogurt', name: '酸奶', category: '饮品', cal: 72, protein: 2.5, fat: 2.7, carb: 9.3, fiber: 0, unit: '杯', unitWeight: 200, icon: '🥛' },
  { id: 'soy_milk', name: '豆浆', category: '饮品', cal: 31, protein: 3.0, fat: 1.6, carb: 1.2, fiber: 1.1, unit: '杯', unitWeight: 300, icon: '🥛' },
  { id: 'green_tea', name: '绿茶', category: '饮品', cal: 1, protein: 0.2, fat: 0, carb: 0, fiber: 0, unit: '杯', unitWeight: 250, icon: '🍵' },

  // ============ 蛋白粉/补剂 ============
  { id: 'protein_whey', name: '乳清蛋白粉', category: '补剂', cal: 370, protein: 75.0, fat: 5.0, carb: 6.0, fiber: 0, unit: '勺', unitWeight: 30, icon: '🥛' },
  { id: 'protein_isolate', name: '分离乳清蛋白粉', category: '补剂', cal: 380, protein: 80.0, fat: 2.0, carb: 5.0, fiber: 0, unit: '勺', unitWeight: 30, icon: '🥛' },
  { id: 'protein_casein', name: '酪蛋白', category: '补剂', cal: 360, protein: 70.0, fat: 6.0, carb: 8.0, fiber: 0, unit: '勺', unitWeight: 30, icon: '🥛' },
  { id: 'protein_plant', name: '植物蛋白粉（大豆/豌豆）', category: '补剂', cal: 350, protein: 65.0, fat: 6.0, carb: 12.0, fiber: 3.0, unit: '勺', unitWeight: 30, icon: '🌱' },
  { id: 'protein_mass', name: '增肌粉', category: '补剂', cal: 380, protein: 15.0, fat: 5.0, carb: 65.0, fiber: 2.0, unit: '勺', unitWeight: 100, icon: '💪' },
  { id: 'protein_muscle_tech', name: '肌肉科技蛋白粉', category: '补剂', cal: 375, protein: 70.0, fat: 6.0, carb: 8.0, fiber: 0, unit: '勺', unitWeight: 30, icon: '🥛' },
  { id: 'protein_knight', name: '康比特蛋白粉', category: '补剂', cal: 365, protein: 72.0, fat: 4.5, carb: 7.0, fiber: 0, unit: '勺', unitWeight: 30, icon: '🥛' },
  { id: 'protein_tomson', name: '汤臣倍健蛋白粉', category: '补剂', cal: 370, protein: 68.0, fat: 5.0, carb: 10.0, fiber: 0, unit: '勺', unitWeight: 30, icon: '🥛' },
  { id: 'protein_collagen', name: '胶原蛋白肽粉', category: '补剂', cal: 380, protein: 85.0, fat: 2.0, carb: 5.0, fiber: 0, unit: '勺', unitWeight: 10, icon: '✨' },
  { id: 'protein_super', name: '复合蛋白粉', category: '补剂', cal: 360, protein: 60.0, fat: 6.0, carb: 15.0, fiber: 2.0, unit: '勺', unitWeight: 30, icon: '🥛' },
  { id: 'creatine', name: '肌酸粉', category: '补剂', cal: 400, protein: 0, fat: 0, carb: 90.0, fiber: 0, unit: '勺', unitWeight: 5, icon: '💊' },
  { id: 'mct_oil', name: 'MCT油/中链甘油三酯', category: '补剂', cal: 830, protein: 0, fat: 93.0, carb: 0, fiber: 0, unit: '勺', unitWeight: 15, icon: '🫒' },

  // ============ 更多早餐/健康食品 ============
  { id: 'oatmeal_dry', name: '燕麦片（干）', category: '主食', cal: 370, protein: 15.0, fat: 7.0, carb: 60.0, fiber: 10.0, unit: '勺', unitWeight: 40, icon: '🌾' },
  { id: 'chia_seeds', name: '奇亚籽', category: '主食', cal: 486, protein: 17.0, fat: 31.0, carb: 42.0, fiber: 34.0, unit: '勺', unitWeight: 15, icon: '🌱' },
  { id: 'walnut', name: '核桃', category: '坚果', cal: 654, protein: 15.2, fat: 65.2, carb: 13.7, fiber: 6.7, unit: '个', unitWeight: 8, icon: '🥜' },
  { id: 'almond', name: '杏仁/巴旦木', category: '坚果', cal: 579, protein: 21.2, fat: 49.9, carb: 21.6, fiber: 12.5, unit: '颗', unitWeight: 15, icon: '🥜' },
  { id: 'peanut', name: '花生', category: '坚果', cal: 563, protein: 25.8, fat: 49.2, carb: 16.1, fiber: 8.5, unit: '份', unitWeight: 30, icon: '🥜' },
  { id: 'nuts_mixed', name: '每日坚果', category: '坚果', cal: 600, protein: 18.0, fat: 52.0, carb: 20.0, fiber: 8.0, unit: '包', unitWeight: 25, icon: '🌰' },
  { id: 'egg_custard', name: '鸡蛋羹', category: '肉蛋', cal: 95, protein: 5.0, fat: 7.0, carb: 3.0, fiber: 0, unit: '碗', unitWeight: 200, icon: '🍳' },
  { id: 'bread_wholewheat', name: '全麦面包', category: '主食', cal: 246, protein: 9.0, fat: 3.5, carb: 49.0, fiber: 6.0, unit: '片', unitWeight: 35, icon: '🍞' },
  { id: 'bread_white', name: '白面包', category: '主食', cal: 265, protein: 9.0, fat: 3.2, carb: 49.0, fiber: 2.7, unit: '片', unitWeight: 35, icon: '🍞' },
  { id: 'milk_skim', name: '脱脂牛奶', category: '饮品', cal: 33, protein: 3.4, fat: 0.2, carb: 4.8, fiber: 0, unit: '杯', unitWeight: 250, icon: '🥛' },
  { id: 'milk_lowfat', name: '低脂牛奶', category: '饮品', cal: 43, protein: 3.4, fat: 1.0, carb: 4.8, fiber: 0, unit: '杯', unitWeight: 250, icon: '🥛' },
  { id: 'coffee_black', name: '黑咖啡', category: '饮品', cal: 2, protein: 0.2, fat: 0, carb: 0.3, fiber: 0, unit: '杯', unitWeight: 240, icon: '☕' },
  { id: 'coffee_latte', name: '拿铁咖啡', category: '饮品', cal: 45, protein: 2.8, fat: 2.5, carb: 3.5, fiber: 0, unit: '杯', unitWeight: 350, icon: '☕' },
  { id: 'energy_bar', name: '能量棒/蛋白棒', category: '零食', cal: 400, protein: 20.0, fat: 12.0, carb: 50.0, fiber: 5.0, unit: '根', unitWeight: 50, icon: '🍫' },
  { id: 'chocolate_dark', name: '黑巧克力', category: '零食', cal: 546, protein: 4.9, fat: 31.0, carb: 63.5, fiber: 7.0, unit: '块', unitWeight: 30, icon: '🍫' },

  // ============ 外卖/快餐 ============
  { id: 'takeout_huangmen', name: '黄焖鸡米饭', category: '外卖', cal: 180, protein: 14.0, fat: 8.0, carb: 16.0, fiber: 0.5, unit: '份', unitWeight: 400, icon: '🍱' },
  { id: 'takeout_beef_noodle', name: '牛肉面', category: '外卖', cal: 165, protein: 10.0, fat: 5.0, carb: 22.0, fiber: 0.5, unit: '份', unitWeight: 450, icon: '🍜' },
  { id: 'takeout_fried_chicken', name: '炸鸡', category: '外卖', cal: 246, protein: 18.0, fat: 16.0, carb: 10.0, fiber: 0.3, unit: '份', unitWeight: 150, icon: '🍗' },
  { id: 'takeout_milk_tea', name: '奶茶', category: '外卖', cal: 52, protein: 0.8, fat: 1.5, carb: 8.5, fiber: 0, unit: '杯', unitWeight: 500, icon: '🧋' },
  { id: 'takeout_bubble_tea', name: '珍珠奶茶', category: '外卖', cal: 65, protein: 0.6, fat: 1.8, carb: 11.0, fiber: 0, unit: '杯', unitWeight: 500, icon: '🧋' },
  { id: 'takeout_rice_bowl', name: '盖浇饭', category: '外卖', cal: 200, protein: 10.0, fat: 8.0, carb: 24.0, fiber: 0.5, unit: '份', unitWeight: 400, icon: '🍱' },
  { id: 'takeout_dumplings', name: '小笼包', category: '外卖', cal: 230, protein: 8.0, fat: 10.0, carb: 28.0, fiber: 0.5, unit: '笼', unitWeight: 200, icon: '🥟' },
  { id: 'takeout_hotpot', name: '火锅（人均）', category: '外卖', cal: 450, protein: 25.0, fat: 25.0, carb: 30.0, fiber: 2.0, unit: '顿', unitWeight: 500, icon: '🫕' },

  // ============ 其他 ============
  { id: 'rice_dish', name: '蛋炒饭', category: '家常菜', cal: 174, protein: 4.5, fat: 6.5, carb: 24.0, fiber: 0.4, unit: '份', unitWeight: 300, icon: '🍳' },
  { id: 'congee_veg', name: '蔬菜粥', category: '主食', cal: 52, protein: 1.2, fat: 0.3, carb: 11.0, fiber: 0.5, unit: '碗', unitWeight: 300, icon: '🥣' },
  { id: 'jellyfish', name: '凉拌海蜇', category: '家常菜', cal: 50, protein: 3.0, fat: 0.3, carb: 8.0, fiber: 0.2, unit: '份', unitWeight: 150, icon: '🥒' },

  // ============ 扩充蔬菜 ============
  { id: 'lettuce', name: '生菜', category: '蔬菜', cal: 13, protein: 1.3, fat: 0.3, carb: 2.1, fiber: 0.7, unit: '份', unitWeight: 100, icon: '🥬' },
  { id: 'avocado', name: '牛油果', category: '蔬菜', cal: 171, protein: 2.0, fat: 15.3, carb: 7.4, fiber: 2.1, unit: '个', unitWeight: 150, icon: '🥑' },
  { id: 'celery', name: '芹菜', category: '蔬菜', cal: 14, protein: 1.2, fat: 0.2, carb: 3.3, fiber: 1.2, unit: '份', unitWeight: 150, icon: '🥬' },
  { id: 'leek', name: '韭菜', category: '蔬菜', cal: 26, protein: 2.4, fat: 0.4, carb: 4.6, fiber: 1.4, unit: '份', unitWeight: 150, icon: '🥬' },
  { id: 'bean_sprout', name: '豆芽', category: '蔬菜', cal: 18, protein: 2.6, fat: 0.2, carb: 2.9, fiber: 0.8, unit: '份', unitWeight: 150, icon: '🌱' },
  { id: 'winter_melon', name: '冬瓜', category: '蔬菜', cal: 12, protein: 0.4, fat: 0.2, carb: 2.6, fiber: 0.7, unit: '份', unitWeight: 200, icon: '🥬' },
  { id: 'pumpkin', name: '南瓜', category: '蔬菜', cal: 22, protein: 0.7, fat: 0.1, carb: 5.3, fiber: 0.8, unit: '份', unitWeight: 200, icon: '🎃' },
  { id: 'loofah', name: '丝瓜', category: '蔬菜', cal: 20, protein: 1.0, fat: 0.2, carb: 4.2, fiber: 0.6, unit: '份', unitWeight: 150, icon: '🥬' },
  { id: 'lettuce_stem', name: '莴笋', category: '蔬菜', cal: 14, protein: 1.0, fat: 0.1, carb: 2.8, fiber: 0.6, unit: '份', unitWeight: 150, icon: '🥬' },
  { id: 'chrysanthemum', name: '茼蒿', category: '蔬菜', cal: 14, protein: 1.9, fat: 0.3, carb: 2.7, fiber: 1.2, unit: '份', unitWeight: 150, icon: '🥬' },
  { id: 'water_spinach', name: '空心菜', category: '蔬菜', cal: 19, protein: 2.2, fat: 0.3, carb: 3.6, fiber: 1.4, unit: '份', unitWeight: 150, icon: '🥬' },
  { id: 'garlic_sprout', name: '蒜苗', category: '蔬菜', cal: 25, protein: 2.1, fat: 0.4, carb: 5.1, fiber: 1.6, unit: '份', unitWeight: 150, icon: '🥬' },
  { id: 'onion', name: '洋葱', category: '蔬菜', cal: 40, protein: 1.1, fat: 0.2, carb: 9.0, fiber: 0.9, unit: '份', unitWeight: 100, icon: '🧅' },
  { id: 'bell_pepper', name: '彩椒', category: '蔬菜', cal: 26, protein: 1.0, fat: 0.2, carb: 6.0, fiber: 2.1, unit: '份', unitWeight: 100, icon: '🫑' },
  { id: 'okra', name: '秋葵', category: '蔬菜', cal: 25, protein: 1.8, fat: 0.2, carb: 5.3, fiber: 1.8, unit: '份', unitWeight: 150, icon: '🥬' },
  { id: 'cauliflower', name: '花菜', category: '蔬菜', cal: 24, protein: 2.1, fat: 0.2, carb: 4.6, fiber: 1.2, unit: '份', unitWeight: 150, icon: '🥦' },
  { id: 'bok_choy', name: '小白菜', category: '蔬菜', cal: 15, protein: 1.5, fat: 0.3, carb: 2.7, fiber: 1.1, unit: '份', unitWeight: 150, icon: '🥬' },
  { id: 'water_chestnut', name: '荸荠', category: '蔬菜', cal: 61, protein: 1.2, fat: 0.2, carb: 14.2, fiber: 1.1, unit: '份', unitWeight: 100, icon: '🥬' },
  { id: 'bamboo_shoot', name: '竹笋', category: '蔬菜', cal: 23, protein: 2.6, fat: 0.2, carb: 3.6, fiber: 1.8, unit: '份', unitWeight: 150, icon: '🎋' },
  { id: 'wood_ear', name: '黑木耳', category: '蔬菜', cal: 21, protein: 1.5, fat: 0.2, carb: 6.0, fiber: 7.0, unit: '份', unitWeight: 100, icon: '🍄' },
  { id: 'kelp', name: '海带', category: '蔬菜', cal: 13, protein: 1.2, fat: 0.1, carb: 2.1, fiber: 1.3, unit: '份', unitWeight: 100, icon: '🌊' },
  { id: 'seaweed', name: '紫菜', category: '蔬菜', cal: 207, protein: 26.7, fat: 1.1, carb: 22.5, fiber: 21.6, unit: '份', unitWeight: 10, icon: '🌊' },

  // ============ 扩充水果 ============
  { id: 'strawberry', name: '草莓', category: '水果', cal: 32, protein: 1.0, fat: 0.2, carb: 7.1, fiber: 1.1, unit: '份', unitWeight: 150, icon: '🍓' },
  { id: 'blueberry', name: '蓝莓', category: '水果', cal: 57, protein: 0.7, fat: 0.3, carb: 14.5, fiber: 2.4, unit: '份', unitWeight: 100, icon: '🫐' },
  { id: 'kiwi', name: '猕猴桃', category: '水果', cal: 61, protein: 0.8, fat: 0.6, carb: 14.5, fiber: 2.6, unit: '个', unitWeight: 80, icon: '🥝' },
  { id: 'mango', name: '芒果', category: '水果', cal: 35, protein: 0.6, fat: 0.2, carb: 8.3, fiber: 1.3, unit: '个', unitWeight: 200, icon: '🥭' },
  { id: 'pineapple', name: '菠萝', category: '水果', cal: 41, protein: 0.5, fat: 0.1, carb: 10.8, fiber: 1.3, unit: '份', unitWeight: 150, icon: '🍍' },
  { id: 'cherry', name: '樱桃', category: '水果', cal: 46, protein: 1.1, fat: 0.2, carb: 10.2, fiber: 0.3, unit: '份', unitWeight: 100, icon: '🍒' },
  { id: 'pomelo', name: '柚子', category: '水果', cal: 42, protein: 0.8, fat: 0.2, carb: 9.5, fiber: 1.0, unit: '份', unitWeight: 200, icon: '🍊' },
  { id: 'cantaloupe', name: '哈密瓜', category: '水果', cal: 34, protein: 0.5, fat: 0.1, carb: 7.7, fiber: 0.9, unit: '份', unitWeight: 200, icon: '🍈' },
  { id: 'dragon_fruit', name: '火龙果', category: '水果', cal: 51, protein: 1.1, fat: 0.2, carb: 13.3, fiber: 2.0, unit: '个', unitWeight: 300, icon: '🐉' },
  { id: 'pomegranate', name: '石榴', category: '水果', cal: 72, protein: 1.4, fat: 0.2, carb: 18.7, fiber: 4.8, unit: '个', unitWeight: 200, icon: '🟥' },
  { id: 'persimmon', name: '柿子', category: '水果', cal: 71, protein: 0.4, fat: 0.1, carb: 18.5, fiber: 1.4, unit: '个', unitWeight: 100, icon: '🍊' },
  { id: 'jujube', name: '红枣', category: '水果', cal: 274, protein: 3.2, fat: 0.5, carb: 72.8, fiber: 6.2, unit: '份', unitWeight: 30, icon: '🔴' },
  { id: 'longan', name: '桂圆', category: '水果', cal: 71, protein: 1.2, fat: 0.1, carb: 16.6, fiber: 0.4, unit: '份', unitWeight: 100, icon: '🟤' },
  { id: 'lychee', name: '荔枝', category: '水果', cal: 70, protein: 0.8, fat: 0.2, carb: 16.6, fiber: 1.3, unit: '份', unitWeight: 100, icon: '🔴' },
  { id: 'durian', name: '榴莲', category: '水果', cal: 150, protein: 1.5, fat: 3.3, carb: 27.0, fiber: 3.8, unit: '份', unitWeight: 100, icon: '🟡' },
  { id: 'papaya', name: '木瓜', category: '水果', cal: 29, protein: 0.4, fat: 0.1, carb: 7.0, fiber: 0.8, unit: '份', unitWeight: 150, icon: '🟠' },

  // ============ 扩充肉蛋海鲜 ============
  { id: 'salmon', name: '三文鱼', category: '肉蛋', cal: 139, protein: 17.2, fat: 7.8, carb: 0, fiber: 0, unit: '份', unitWeight: 100, icon: '🐟' },
  { id: 'hairtail', name: '带鱼', category: '肉蛋', cal: 127, protein: 17.7, fat: 4.9, carb: 3.1, fiber: 0, unit: '份', unitWeight: 150, icon: '🐟' },
  { id: 'bass', name: '鲈鱼', category: '肉蛋', cal: 105, protein: 18.6, fat: 3.4, carb: 0, fiber: 0, unit: '条', unitWeight: 200, icon: '🐟' },
  { id: 'crab', name: '螃蟹', category: '肉蛋', cal: 95, protein: 13.8, fat: 2.3, carb: 4.7, fiber: 0, unit: '只', unitWeight: 200, icon: '🦀' },
  { id: 'scallop', name: '扇贝', category: '肉蛋', cal: 60, protein: 11.1, fat: 0.6, carb: 2.6, fiber: 0, unit: '份', unitWeight: 100, icon: '🐚' },
  { id: 'squid', name: '鱿鱼', category: '肉蛋', cal: 75, protein: 17.0, fat: 0.8, carb: 0, fiber: 0, unit: '份', unitWeight: 100, icon: '🦑' },
  { id: 'ham', name: '火腿', category: '肉蛋', cal: 330, protein: 16.0, fat: 27.4, carb: 4.9, fiber: 0, unit: '片', unitWeight: 50, icon: '🍖' },
  { id: 'bacon', name: '培根', category: '肉蛋', cal: 181, protein: 22.0, fat: 9.0, carb: 2.0, fiber: 0, unit: '片', unitWeight: 50, icon: '🥓' },
  { id: 'sausage', name: '香肠', category: '肉蛋', cal: 508, protein: 24.1, fat: 40.7, carb: 11.2, fiber: 0, unit: '根', unitWeight: 50, icon: '🌭' },
  { id: 'chicken_wing', name: '鸡翅', category: '肉蛋', cal: 194, protein: 17.4, fat: 11.8, carb: 4.6, fiber: 0, unit: '个', unitWeight: 80, icon: '🍗' },
  { id: 'liver_pork', name: '猪肝', category: '肉蛋', cal: 129, protein: 19.3, fat: 3.5, carb: 5.0, fiber: 0, unit: '份', unitWeight: 100, icon: '🥩' },
  { id: 'rib_pork', name: '排骨', category: '肉蛋', cal: 278, protein: 18.3, fat: 22.0, carb: 1.7, fiber: 0, unit: '份', unitWeight: 150, icon: '🍖' },

  // ============ 扩充主食 ============
  { id: 'shaobing', name: '烧饼', category: '主食', cal: 326, protein: 8.0, fat: 2.1, carb: 68.0, fiber: 1.5, unit: '个', unitWeight: 80, icon: '🥯' },
  { id: 'youtiao', name: '油条', category: '主食', cal: 388, protein: 6.9, fat: 17.6, carb: 51.0, fiber: 0.9, unit: '根', unitWeight: 80, icon: '🍟' },
  { id: 'jianbing', name: '煎饼', category: '主食', cal: 354, protein: 9.0, fat: 10.0, carb: 55.0, fiber: 1.2, unit: '个', unitWeight: 150, icon: '🫓' },
  { id: 'zongzi', name: '粽子', category: '主食', cal: 195, protein: 5.2, fat: 3.5, carb: 36.0, fiber: 0.8, unit: '个', unitWeight: 150, icon: '🍙' },
  { id: 'nian_gao', name: '年糕', category: '主食', cal: 154, protein: 3.2, fat: 0.5, carb: 34.0, fiber: 0.6, unit: '份', unitWeight: 100, icon: '🍚' },
  { id: 'millet_congee', name: '小米粥', category: '主食', cal: 46, protein: 1.4, fat: 0.4, carb: 9.6, fiber: 0.3, unit: '碗', unitWeight: 300, icon: '🥣' },
  { id: 'babao_congee', name: '八宝粥', category: '主食', cal: 86, protein: 2.5, fat: 0.8, carb: 17.5, fiber: 1.2, unit: '碗', unitWeight: 300, icon: '🥣' },
  { id: 'huajuan', name: '花卷', category: '主食', cal: 217, protein: 6.4, fat: 1.0, carb: 45.0, fiber: 1.0, unit: '个', unitWeight: 80, icon: '🍞' },
  { id: 'wotou', name: '窝头', category: '主食', cal: 227, protein: 5.5, fat: 1.0, carb: 48.0, fiber: 2.8, unit: '个', unitWeight: 80, icon: '🌽' },
  { id: 'taro', name: '芋头', category: '主食', cal: 79, protein: 2.2, fat: 0.2, carb: 18.1, fiber: 1.0, unit: '份', unitWeight: 150, icon: '🥔' },
  { id: 'purple_sweet_potato', name: '紫薯', category: '主食', cal: 82, protein: 1.0, fat: 0.2, carb: 18.4, fiber: 1.5, unit: '个', unitWeight: 150, icon: '🟪' },

  // ============ 扩充家常菜 ============
  { id: 'dish_yuxiang_pork', name: '鱼香肉丝', category: '家常菜', cal: 160, protein: 12.0, fat: 8.0, carb: 10.0, fiber: 1.5, unit: '份', unitWeight: 250, icon: '🍖' },
  { id: 'dish_qingjiao_pork', name: '青椒肉丝', category: '家常菜', cal: 145, protein: 13.0, fat: 7.0, carb: 8.0, fiber: 1.8, unit: '份', unitWeight: 250, icon: '🫑' },
  { id: 'dish_shredded_potato', name: '酸辣土豆丝', category: '家常菜', cal: 110, protein: 3.0, fat: 5.0, carb: 14.0, fiber: 1.5, unit: '份', unitWeight: 250, icon: '🥔' },
  { id: 'dish_dandan_noodle', name: '担担面', category: '家常菜', cal: 280, protein: 9.0, fat: 12.0, carb: 35.0, fiber: 1.5, unit: '碗', unitWeight: 300, icon: '🍜' },
  { id: 'dish_cong_bao_lamb', name: '葱爆羊肉', category: '家常菜', cal: 180, protein: 15.0, fat: 10.0, carb: 6.0, fiber: 1.0, unit: '份', unitWeight: 200, icon: '🥩' },
  { id: 'dish_shuizhu_fish', name: '水煮鱼', category: '家常菜', cal: 175, protein: 15.0, fat: 9.0, carb: 8.0, fiber: 1.0, unit: '份', unitWeight: 300, icon: '🐟' },
  { id: 'dish_suancai_fish', name: '酸菜鱼', category: '家常菜', cal: 130, protein: 14.0, fat: 5.0, carb: 8.0, fiber: 1.2, unit: '份', unitWeight: 300, icon: '🐟' },
  { id: 'dish_huiguo_pork', name: '回锅肉', category: '家常菜', cal: 215, protein: 12.0, fat: 15.0, carb: 10.0, fiber: 1.0, unit: '份', unitWeight: 200, icon: '🥩' },
  { id: 'dish_ganbian_beans', name: '干煸豆角', category: '家常菜', cal: 155, protein: 5.0, fat: 8.0, carb: 15.0, fiber: 2.5, unit: '份', unitWeight: 200, icon: '🫛' },
  { id: 'dish_disanxian', name: '地三鲜', category: '家常菜', cal: 135, protein: 3.5, fat: 7.0, carb: 16.0, fiber: 2.0, unit: '份', unitWeight: 250, icon: '🥔' },
  { id: 'dish_guobaorou', name: '锅包肉', category: '家常菜', cal: 230, protein: 14.0, fat: 12.0, carb: 18.0, fiber: 0.5, unit: '份', unitWeight: 200, icon: '🍖' },
  { id: 'dish_sweet_sour_rib', name: '糖醋排骨', category: '家常菜', cal: 265, protein: 15.0, fat: 16.0, carb: 15.0, fiber: 0.5, unit: '份', unitWeight: 200, icon: '🍖' },
  { id: 'dish_cold_cucumber', name: '凉拌黄瓜', category: '家常菜', cal: 50, protein: 1.5, fat: 2.0, carb: 6.0, fiber: 1.0, unit: '份', unitWeight: 150, icon: '🥒' },
  { id: 'dish_garlic_broccoli', name: '蒜蓉西兰花', category: '家常菜', cal: 65, protein: 4.0, fat: 2.5, carb: 7.0, fiber: 2.5, unit: '份', unitWeight: 200, icon: '🥦' },
  { id: 'dish_bai_zhuo_shrimp', name: '白灼虾', category: '家常菜', cal: 90, protein: 18.0, fat: 1.0, carb: 1.0, fiber: 0, unit: '份', unitWeight: 150, icon: '🦐' },
  { id: 'dish_cola_chicken', name: '可乐鸡翅', category: '家常菜', cal: 185, protein: 16.0, fat: 9.0, carb: 10.0, fiber: 0, unit: '份', unitWeight: 200, icon: '🍗' },
  { id: 'dish_potato_beef', name: '土豆炖牛肉', category: '家常菜', cal: 130, protein: 10.0, fat: 6.0, carb: 10.0, fiber: 1.2, unit: '份', unitWeight: 250, icon: '🥩' },
  { id: 'dish_tomato_beef', name: '番茄牛腩', category: '家常菜', cal: 125, protein: 9.0, fat: 6.0, carb: 8.0, fiber: 1.0, unit: '份', unitWeight: 250, icon: '🍅' },
  { id: 'dish_chicken_mushroom', name: '小鸡炖蘑菇', category: '家常菜', cal: 115, protein: 10.0, fat: 5.0, carb: 7.0, fiber: 1.5, unit: '份', unitWeight: 250, icon: '🍄' },
  { id: 'dish_hongshao_rib', name: '红烧排骨', category: '家常菜', cal: 275, protein: 15.0, fat: 18.0, carb: 12.0, fiber: 0.5, unit: '份', unitWeight: 200, icon: '🍖' },
  { id: 'dish_xiangla_chicken', name: '香辣鸡腿堡', category: '家常菜', cal: 260, protein: 12.0, fat: 13.0, carb: 25.0, fiber: 1.0, unit: '个', unitWeight: 150, icon: '🍔' },

  // ============ 扩充豆制品 ============
  { id: 'soybean', name: '黄豆', category: '蔬菜', cal: 359, protein: 35.0, fat: 16.0, carb: 34.2, fiber: 15.5, unit: '份', unitWeight: 50, icon: '🟡' },
  { id: 'mung_bean', name: '绿豆', category: '蔬菜', cal: 329, protein: 21.6, fat: 0.8, carb: 62.0, fiber: 6.4, unit: '份', unitWeight: 50, icon: '🟢' },
  { id: 'red_bean', name: '红豆', category: '蔬菜', cal: 324, protein: 20.2, fat: 0.6, carb: 63.4, fiber: 7.7, unit: '份', unitWeight: 50, icon: '🔴' },
  { id: 'yuba', name: '腐竹', category: '蔬菜', cal: 459, protein: 44.6, fat: 21.7, carb: 22.3, fiber: 1.0, unit: '份', unitWeight: 50, icon: '🟡' },
  { id: 'dried_tofu', name: '豆干', category: '蔬菜', cal: 153, protein: 16.2, fat: 8.6, carb: 5.1, fiber: 0.8, unit: '块', unitWeight: 80, icon: '🟫' },
  { id: 'tofu_skin', name: '豆皮', category: '蔬菜', cal: 409, protein: 44.6, fat: 17.4, carb: 18.8, fiber: 0.2, unit: '份', unitWeight: 50, icon: '🟡' },
  { id: 'edamame', name: '毛豆', category: '蔬菜', cal: 131, protein: 13.1, fat: 5.0, carb: 10.5, fiber: 4.0, unit: '份', unitWeight: 100, icon: '🫛' },

  // ============ 扩充坚果零食 ============
  { id: 'cashew', name: '腰果', category: '坚果', cal: 559, protein: 17.3, fat: 36.7, carb: 41.6, fiber: 3.3, unit: '份', unitWeight: 30, icon: '🥜' },
  { id: 'pistachio', name: '开心果', category: '坚果', cal: 614, protein: 20.6, fat: 53.0, carb: 21.9, fiber: 10.6, unit: '份', unitWeight: 30, icon: '🥜' },
  { id: 'pine_nut', name: '松子', category: '坚果', cal: 698, protein: 13.4, fat: 70.6, carb: 2.2, fiber: 10.0, unit: '份', unitWeight: 30, icon: '🌰' },
  { id: 'sunflower_seed', name: '葵花籽', category: '坚果', cal: 606, protein: 22.6, fat: 52.8, carb: 17.3, fiber: 4.5, unit: '份', unitWeight: 30, icon: '🌻' },
  { id: 'chips', name: '薯片', category: '零食', cal: 547, protein: 7.0, fat: 34.0, carb: 53.0, fiber: 2.0, unit: '袋', unitWeight: 50, icon: '🍟' },
  { id: 'biscuit', name: '饼干', category: '零食', cal: 433, protein: 9.0, fat: 12.7, carb: 73.0, fiber: 1.5, unit: '份', unitWeight: 50, icon: '🍪' },
  { id: 'cake', name: '蛋糕', category: '零食', cal: 347, protein: 8.6, fat: 5.1, carb: 67.0, fiber: 0.6, unit: '块', unitWeight: 80, icon: '🍰' },
  { id: 'ice_cream', name: '冰淇淋', category: '零食', cal: 127, protein: 2.5, fat: 5.3, carb: 17.3, fiber: 0.4, unit: '份', unitWeight: 100, icon: '🍦' },
  { id: 'jelly', name: '果冻', category: '零食', cal: 60, protein: 0.0, fat: 0.0, carb: 15.0, fiber: 0.1, unit: '个', unitWeight: 100, icon: '🍮' },
  { id: 'candy', name: '糖果', category: '零食', cal: 394, protein: 0.0, fat: 0.0, carb: 98.0, fiber: 0, unit: '颗', unitWeight: 10, icon: '🍬' },

  // ============ 扩充饮品 ============
  { id: 'lemon_water', name: '柠檬水', category: '饮品', cal: 15, protein: 0.1, fat: 0.0, carb: 3.8, fiber: 0.1, unit: '杯', unitWeight: 300, icon: '🍋' },
  { id: 'honey_water', name: '蜂蜜水', category: '饮品', cal: 40, protein: 0.1, fat: 0.0, carb: 10.0, fiber: 0, unit: '杯', unitWeight: 300, icon: '🍯' },
  { id: 'jujube_tea', name: '红枣茶', category: '饮品', cal: 35, protein: 0.3, fat: 0.1, carb: 8.5, fiber: 0.3, unit: '杯', unitWeight: 300, icon: '🍵' },
  { id: 'soybean_milk_mix', name: '豆奶', category: '饮品', cal: 45, protein: 2.0, fat: 1.5, carb: 6.0, fiber: 0.5, unit: '杯', unitWeight: 250, icon: '🥛' },
  { id: 'coconut_juice', name: '椰汁', category: '饮品', cal: 50, protein: 0.5, fat: 1.0, carb: 10.0, fiber: 0.2, unit: '杯', unitWeight: 250, icon: '🥥' },
  { id: 'orange_juice', name: '橙汁', category: '饮品', cal: 47, protein: 0.7, fat: 0.2, carb: 11.2, fiber: 0.2, unit: '杯', unitWeight: 250, icon: '🍊' },
  { id: 'sour_plum', name: '酸梅汤', category: '饮品', cal: 50, protein: 0.3, fat: 0.1, carb: 12.5, fiber: 0.2, unit: '杯', unitWeight: 300, icon: '🫗' },
  { id: 'beer', name: '啤酒', category: '饮品', cal: 43, protein: 0.5, fat: 0, carb: 3.6, fiber: 0, unit: '瓶', unitWeight: 500, icon: '🍺' },
  { id: 'red_wine', name: '红酒', category: '饮品', cal: 85, protein: 0.1, fat: 0, carb: 2.6, fiber: 0, unit: '杯', unitWeight: 150, icon: '🍷' },

  // ============ 扩充调味品/其他 ============
  { id: 'sugar', name: '白糖', category: '零食', cal: 400, protein: 0, fat: 0, carb: 99.9, fiber: 0, unit: '勺', unitWeight: 10, icon: '🟦' },
  { id: 'honey', name: '蜂蜜', category: '零食', cal: 321, protein: 0.4, fat: 1.9, carb: 75.6, fiber: 0, unit: '勺', unitWeight: 20, icon: '🍯' },
  { id: 'dark_chocolate', name: '黑巧克力', category: '零食', cal: 546, protein: 4.9, fat: 31.3, carb: 60.0, fiber: 7.0, unit: '块', unitWeight: 30, icon: '🍫' },
  { id: 'milk_chocolate', name: '牛奶巧克力', category: '零食', cal: 535, protein: 7.6, fat: 30.0, carb: 59.0, fiber: 3.4, unit: '块', unitWeight: 30, icon: '🍫' },
  { id: 'egg_tart', name: '蛋挞', category: '零食', cal: 375, protein: 5.0, fat: 22.0, carb: 40.0, fiber: 0.5, unit: '个', unitWeight: 60, icon: '🥧' },
  { id: 'donut', name: '甜甜圈', category: '零食', cal: 452, protein: 4.9, fat: 25.0, carb: 51.0, fiber: 1.5, unit: '个', unitWeight: 60, icon: '🍩' },
  { id: 'croissant', name: '可颂', category: '零食', cal: 406, protein: 8.2, fat: 21.0, carb: 45.0, fiber: 2.6, unit: '个', unitWeight: 60, icon: '🥐' },
];

// 执行微量营养素合并
enrichFoodDB();

/**
 * 搜索食物 - 支持模糊匹配
 */
function searchFood(keyword) {
  if (!keyword || keyword.trim() === '') return [];
  var kw = keyword.trim().toLowerCase();
  return FOOD_DB.filter(function(f) {
    return f.name.toLowerCase().indexOf(kw) !== -1 ||
           f.category.toLowerCase().indexOf(kw) !== -1;
  });
}

/**
 * 根据ID获取食物
 */
function getFoodById(id) {
  for (var i = 0; i < FOOD_DB.length; i++) {
    if (FOOD_DB[i].id === id) return FOOD_DB[i];
  }
  return null;
}

/**
 * 解析语音/文字输入中的食物
 * 简单关键词匹配 + 常见量词处理
 */
function parseFoodInput(text) {
  if (!text || text.trim() === '') return [];
  var results = [];
  var found = [];
  var matchedRanges = []; // 记录已匹配的文本区间 [start, end]

  // 辅助函数：获取食物的所有匹配名（原名 + 去掉括号的简称）
  function getMatchNames(food) {
    var names = [food.name];
    // 处理形如 "面条（煮）" -> "面条" 的简称
    var simple = food.name.replace(/[（(][^）)]*[）)]/g, '').trim();
    if (simple && simple !== food.name && simple.length >= 2) {
      names.push(simple);
    }
    return names;
  }

  // 第一阶段：精确匹配（食物名完整出现在文本中）
  // 按食物名长度降序排列，优先匹配更长的名称（如"番茄炒蛋"优先于"番茄"）
  var sortedFoods = FOOD_DB.slice().sort(function(a, b) {
    return b.name.length - a.name.length;
  });

  for (var i = 0; i < sortedFoods.length; i++) {
    var food = sortedFoods[i];
    var matchNames = getMatchNames(food);
    for (var m = 0; m < matchNames.length; m++) {
      var matchName = matchNames[m];
      var idx = text.indexOf(matchName);
      while (idx !== -1) {
        // 检查这个区间是否已被更长的食物名覆盖
        var endIdx = idx + matchName.length;
        var isOverlapped = false;
        for (var r = 0; r < matchedRanges.length; r++) {
          if (idx >= matchedRanges[r][0] && endIdx <= matchedRanges[r][1]) {
            isOverlapped = true;
            break;
          }
        }
        if (!isOverlapped && found.indexOf(food.id) === -1) {
          var portion = extractPortion(text, matchName);
          results.push({
            food: food,
            portionDesc: portion.desc,
            multiplier: portion.multiplier
          });
          found.push(food.id);
          matchedRanges.push([idx, endIdx]);
        }
        idx = text.indexOf(matchName, idx + 1);
      }
      if (found.indexOf(food.id) !== -1) break; // 已经匹配到这个食物，跳过其他匹配名
    }
  }

  // 第二阶段：关键词模糊匹配（用于处理数据库中食物名不完全匹配的情况）
  var keywords = [
    '米饭', '白米饭', '白粥', '面条', '馒头', '花卷', '包子', '饺子', '小笼包',
    '红薯', '玉米', '燕麦', '八宝粥', '米粉',
    '煮鸡蛋', '煎蛋', '鸡蛋', '牛奶', '酸奶', '豆浆', '绿茶', '奶茶', '珍珠奶茶',
    '鸡胸肉', '鸡腿', '鸡翅', '鸭肉', '牛肉', '羊肉', '猪瘦肉', '五花肉', '排骨', '虾仁', '虾',
    '清蒸鱼', '鲈鱼', '鱼',
    '番茄', '白菜', '菠菜', '西兰花', '黄瓜', '胡萝卜', '茄子', '苦瓜', '莲藕', '香菇', '豆腐', '土豆',
    '番茄炒蛋', '麻婆豆腐', '炒时蔬', '宫保鸡丁', '红烧肉', '清蒸鲈鱼', '紫菜蛋花汤', '鸡汤', '排骨汤',
    '凉拌黄瓜', '青椒肉丝', '红烧茄子', '韭菜炒蛋', '地三鲜',
    '黄焖鸡米饭', '牛肉面', '炸鸡', '盖浇饭', '火锅',
    '苹果', '香蕉', '橙子', '葡萄', '西瓜', '梨', '桃子',
    '蛋白粉', '乳清', '酪蛋白', '肌酸', '蛋白棒', '能量棒', '奇亚籽', '燕麦片', '坚果', '每日坚果', '核桃', '杏仁', '巴旦木', '花生', '黑巧克力', '咖啡', '拿铁', '脱脂牛奶', '低脂牛奶', '全麦面包', '白面包', '鸡蛋羹', 'MCT', '胶原蛋白'
  ];

  // 按关键词长度降序排列，优先匹配更长的关键词
  keywords.sort(function(a, b) { return b.length - a.length; });

  for (var j = 0; j < keywords.length; j++) {
    var kwIdx = text.indexOf(keywords[j]);
    if (kwIdx !== -1) {
      // 检查关键词的文本区间是否已被第一阶段覆盖
      var kwEnd = kwIdx + keywords[j].length;
      var isCovered = false;
      for (var rr = 0; rr < matchedRanges.length; rr++) {
        if (kwIdx >= matchedRanges[rr][0] && kwEnd <= matchedRanges[rr][1]) {
          isCovered = true;
          break;
        }
      }
      if (isCovered) continue;

      var matches = searchFood(keywords[j]);
      for (var k = 0; k < Math.min(matches.length, 1); k++) {
        if (found.indexOf(matches[k].id) === -1) {
          results.push({
            food: matches[k],
            portionDesc: '常规份量',
            multiplier: 1
          });
          found.push(matches[k].id);
          matchedRanges.push([kwIdx, kwEnd]);
        }
      }
    }
  }

  return results;
}

/**
 * 从文本中提取份量描述
 * 只匹配食物名紧邻的量词，避免被其他食物的量词干扰
 */
function extractPortion(text, foodName) {
  var nameIdx = text.indexOf(foodName);
  if (nameIdx === -1) {
    return { desc: '常规份量', multiplier: 1 };
  }

  // 只取食物名称前 6 个字符（典型量词如"一碗"、"一个"、"半个"都是2-3字）
  var before = text.substring(Math.max(0, nameIdx - 6), nameIdx);

  // 从右向左匹配：找到紧邻食物名的第一个量词
  var patterns = [
    { regex: /半碗$|小半碗$/, desc: '小半碗', multiplier: 0.4 },
    { regex: /大半碗$|多半碗$/, desc: '大半碗', multiplier: 0.7 },
    { regex: /两碗$|2碗$/, desc: '两碗', multiplier: 2 },
    { regex: /一碗$|1碗$/, desc: '一碗', multiplier: 1 },
    { regex: /半个$|半份$/, desc: '半个', multiplier: 0.5 },
    { regex: /一小$|一点$|少许$|少量$/, desc: '少量', multiplier: 0.3 },
    { regex: /一大$|很多$|大量$/, desc: '大份', multiplier: 1.5 },
    { regex: /两个$|2个$|两只$/, desc: '两个', multiplier: 2 },
    { regex: /一个$|1个$|一只$/, desc: '一个', multiplier: 1 },
    { regex: /两份$|2份$/, desc: '两份', multiplier: 2 },
    { regex: /一份$|1份$/, desc: '一份', multiplier: 1 },
    { regex: /两块$|2块$/, desc: '两块', multiplier: 2 },
    { regex: /一块$/, desc: '一块', multiplier: 1 },
    { regex: /两根$|2根$/, desc: '两根', multiplier: 2 },
    { regex: /一根$/, desc: '一根', multiplier: 1 },
    { regex: /两杯$|2杯$/, desc: '两杯', multiplier: 2 },
    { regex: /一杯$|1杯$/, desc: '一杯', multiplier: 1 },
    { regex: /两盘$|2盘$|一盘$|1盘$/, desc: '一盘', multiplier: 1 },
  ];

  for (var i = 0; i < patterns.length; i++) {
    if (patterns[i].regex.test(before)) {
      return { desc: patterns[i].desc, multiplier: patterns[i].multiplier };
    }
  }

  return { desc: '常规份量', multiplier: 1 };
}

/**
 * 计算食物营养（按实际份量）
 */
function calcNutrition(food, multiplier) {
  var m = multiplier || 1;
  var weight = food.unitWeight * m;
  var result = {
    name: food.name,
    icon: food.icon,
    weight: Math.round(weight),
    cal: Math.round(food.cal * weight / 100),
    protein: Math.round(food.protein * weight / 100 * 10) / 10,
    fat: Math.round(food.fat * weight / 100 * 10) / 10,
    carb: Math.round(food.carb * weight / 100 * 10) / 10,
    fiber: Math.round((food.fiber || 0) * weight / 100 * 10) / 10
  };

  // 遍历所有营养素定义，计算全部营养素
  if (typeof NUTRIENT_DEFS !== 'undefined') {
    NUTRIENT_DEFS.forEach(function(n) {
      // 跳过已计算的核心营养素
      if (['cal','protein','fat','carb','fiber'].indexOf(n.key) >= 0) return;
      var val = food[n.key] || 0;
      result[n.key] = Math.round(val * weight / 100 * 100) / 100;
    });
  } else {
    // 后备：手动取常见营养素
    var keys = ['na','ca','fe','zn','se','k','mg','p','cu','mn','i',
                'va','vc','vd','ve','vk','vb1','vb2','vb6','vb12','niacin','folate','pantothenic'];
    keys.forEach(function(key) {
      var val = food[key] || 0;
      result[key] = Math.round(val * weight / 100 * 100) / 100;
    });
  }

  return result;
}

/**
 * 模拟 AI 拍照识别结果
 * 在 Demo 中模拟从照片中识别出的食物
 */
function simulatePhotoRecognition() {
  var presets = [
    [
      { food: getFoodById('rice_white'), multiplier: 0.8 },
      { food: getFoodById('dish_tomato_egg'), multiplier: 1 },
      { food: getFoodById('dish_soup_egg'), multiplier: 1 }
    ],
    [
      { food: getFoodById('noodles'), multiplier: 1 },
      { food: getFoodById('chicken_leg'), multiplier: 1 },
      { food: getFoodById('cucumber'), multiplier: 1 }
    ],
    [
      { food: getFoodById('rice_congee'), multiplier: 1 },
      { food: getFoodById('egg_boiled'), multiplier: 1 },
      { food: getFoodById('steamed_bun'), multiplier: 1 }
    ],
    [
      { food: getFoodById('rice_white'), multiplier: 1 },
      { food: getFoodById('dish_steam_fish'), multiplier: 1 },
      { food: getFoodById('dish_stir_fry_veg'), multiplier: 1 },
      { food: getFoodById('dish_soup_chicken'), multiplier: 1 }
    ],
    [
      { food: getFoodById('mantou'), multiplier: 1 },
      { food: getFoodById('soy_milk'), multiplier: 1 },
      { food: getFoodById('egg_boiled'), multiplier: 1 }
    ],
    [
      { food: getFoodById('takeout_huangmen'), multiplier: 1 },
      { food: getFoodById('takeout_milk_tea'), multiplier: 1 }
    ],
    [
      { food: getFoodById('rice_white'), multiplier: 0.7 },
      { food: getFoodById('dish_braised_pork'), multiplier: 0.8 },
      { food: getFoodById('spinach'), multiplier: 1 }
    ]
  ];
  return presets[Math.floor(Math.random() * presets.length)];
}

/**
 * 自定义食物管理（保存到 localStorage）
 */
var CUSTOM_FOODS_KEY = 'chidemingbai_custom_foods';

function loadCustomFoods() {
  try {
    var raw = localStorage.getItem(CUSTOM_FOODS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch(e) {}
  return [];
}

function saveCustomFoods(foods) {
  try {
    localStorage.setItem(CUSTOM_FOODS_KEY, JSON.stringify(foods));
  } catch(e) {}
}

function addCustomFood(food) {
  var foods = loadCustomFoods();
  foods.unshift(food);
  saveCustomFoods(foods);
  // 同时添加到主数据库
  if (typeof FOOD_DB !== 'undefined') {
    FOOD_DB.unshift(food);
  }
}

function deleteCustomFood(foodId) {
  var foods = loadCustomFoods();
  foods = foods.filter(function(f) { return f.id !== foodId; });
  saveCustomFoods(foods);
  // 从主数据库移除
  if (typeof FOOD_DB !== 'undefined') {
    for (var i = 0; i < FOOD_DB.length; i++) {
      if (FOOD_DB[i].id === foodId) {
        FOOD_DB.splice(i, 1);
        break;
      }
    }
  }
}

// 启动时将自定义食物加载到 FOOD_DB
function initCustomFoods() {
  var custom = loadCustomFoods();
  if (custom.length > 0 && typeof FOOD_DB !== 'undefined') {
    for (var i = custom.length - 1; i >= 0; i--) {
      FOOD_DB.unshift(custom[i]);
    }
  }
}

// 自动初始化
if (typeof window !== 'undefined' && window.addEventListener) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCustomFoods);
  } else {
    initCustomFoods();
  }
}