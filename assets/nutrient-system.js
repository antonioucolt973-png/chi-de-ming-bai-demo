/**
 * 完整营养素体系 - 基于《中国居民膳食指南2022》和GB 28050-2025
 *
 * 营养素分为三大类：
 * 1. 核心营养素：能量、蛋白质、脂肪、碳水、纤维、钠（国标强制标示）
 * 2. 矿物质：钙、铁、锌、硒、钾、镁、磷、铜、锰、碘
 * 3. 维生素：VA、VC、VD、VE、VK、VB1、VB2、VB6、VB12、烟酸、叶酸、泛酸
 */

// 所有营养素定义（key、中文名、单位、图标、分类）
var NUTRIENT_DEFS = [
  // 核心营养素
  { key: 'cal',       name: '能量',       unit: 'kcal', icon: '🔥', group: 'core' },
  { key: 'protein',   name: '蛋白质',     unit: 'g',    icon: '🥩', group: 'core' },
  { key: 'fat',       name: '脂肪',       unit: 'g',    icon: '🧈', group: 'core' },
  { key: 'carb',      name: '碳水化合物', unit: 'g',    icon: '🍚', group: 'core' },
  { key: 'fiber',     name: '膳食纤维',   unit: 'g',    icon: '🌾', group: 'core' },
  { key: 'na',        name: '钠',         unit: 'mg',   icon: '🧂', group: 'core' },
  // 矿物质
  { key: 'ca',        name: '钙',         unit: 'mg',   icon: '🦴', group: 'mineral' },
  { key: 'fe',        name: '铁',         unit: 'mg',   icon: '🔩', group: 'mineral' },
  { key: 'zn',        name: '锌',         unit: 'mg',   icon: '⚙️', group: 'mineral' },
  { key: 'se',        name: '硒',         unit: 'μg',   icon: '🧬', group: 'mineral' },
  { key: 'k',         name: '钾',         unit: 'mg',   icon: '🍌', group: 'mineral' },
  { key: 'mg',        name: '镁',         unit: 'mg',   icon: '💚', group: 'mineral' },
  { key: 'p',         name: '磷',         unit: 'mg',   icon: '🐟', group: 'mineral' },
  { key: 'cu',        name: '铜',         unit: 'mg',   icon: '🟤', group: 'mineral' },
  { key: 'mn',        name: '锰',         unit: 'mg',   icon: '⚫', group: 'mineral' },
  { key: 'i',         name: '碘',         unit: 'μg',   icon: '🌊', group: 'mineral' },
  // 维生素
  { key: 'va',        name: '维生素A',    unit: 'μgRAE',icon: '🥕', group: 'vitamin' },
  { key: 'vc',        name: '维生素C',    unit: 'mg',   icon: '🍊', group: 'vitamin' },
  { key: 'vd',        name: '维生素D',    unit: 'μg',   icon: '☀️', group: 'vitamin' },
  { key: 've',        name: '维生素E',    unit: 'mg',   icon: '🌰', group: 'vitamin' },
  { key: 'vk',        name: '维生素K',    unit: 'μg',   icon: '🥬', group: 'vitamin' },
  { key: 'vb1',       name: '维生素B1',   unit: 'mg',   icon: '💊', group: 'vitamin' },
  { key: 'vb2',       name: '维生素B2',   unit: 'mg',   icon: '💊', group: 'vitamin' },
  { key: 'vb6',       name: '维生素B6',   unit: 'mg',   icon: '💊', group: 'vitamin' },
  { key: 'vb12',      name: '维生素B12',  unit: 'μg',   icon: '💊', group: 'vitamin' },
  { key: 'niacin',    name: '烟酸',       unit: 'mgNE', icon: '💊', group: 'vitamin' },
  { key: 'folate',    name: '叶酸',       unit: 'μgDFE',icon: '🌱', group: 'vitamin' },
  { key: 'pantothenic',name:'泛酸',       unit: 'mg',   icon: '💊', group: 'vitamin' },
];

// 营养素中文名到key的映射（用于解析AI返回的自然语言）
var NUTRIENT_NAME_MAP = {};
NUTRIENT_DEFS.forEach(function(n) {
  NUTRIENT_NAME_MAP[n.name] = n.key;
  // 添加常见别名
});
// 别名
NUTRIENT_NAME_MAP['热量'] = 'cal';
NUTRIENT_NAME_MAP['能量'] = 'cal';
NUTRIENT_NAME_MAP['卡路里'] = 'cal';
NUTRIENT_NAME_MAP['蛋白质'] = 'protein';
NUTRIENT_NAME_MAP['脂肪'] = 'fat';
NUTRIENT_NAME_MAP['碳水化合物'] = 'carb';
NUTRIENT_NAME_MAP['碳水'] = 'carb';
NUTRIENT_NAME_MAP['膳食纤维'] = 'fiber';
NUTRIENT_NAME_MAP['纤维'] = 'fiber';
NUTRIENT_NAME_MAP['钠'] = 'na';
NUTRIENT_NAME_MAP['钙'] = 'ca';
NUTRIENT_NAME_MAP['铁'] = 'fe';
NUTRIENT_NAME_MAP['锌'] = 'zn';
NUTRIENT_NAME_MAP['硒'] = 'se';
NUTRIENT_NAME_MAP['钾'] = 'k';
NUTRIENT_NAME_MAP['镁'] = 'mg';
NUTRIENT_NAME_MAP['磷'] = 'p';
NUTRIENT_NAME_MAP['铜'] = 'cu';
NUTRIENT_NAME_MAP['锰'] = 'mn';
NUTRIENT_NAME_MAP['碘'] = 'i';
NUTRIENT_NAME_MAP['维生素A'] = 'va';
NUTRIENT_NAME_MAP['维A'] = 'va';
NUTRIENT_NAME_MAP['维生素C'] = 'vc';
NUTRIENT_NAME_MAP['维C'] = 'vc';
NUTRIENT_NAME_MAP['维生素D'] = 'vd';
NUTRIENT_NAME_MAP['维D'] = 'vd';
NUTRIENT_NAME_MAP['维生素E'] = 've';
NUTRIENT_NAME_MAP['维E'] = 've';
NUTRIENT_NAME_MAP['维生素K'] = 'vk';
NUTRIENT_NAME_MAP['维生素K1'] = 'vk';
NUTRIENT_NAME_MAP['维K'] = 'vk';
NUTRIENT_NAME_MAP['维K1'] = 'vk';
NUTRIENT_NAME_MAP['维生素B1'] = 'vb1';
NUTRIENT_NAME_MAP['维B1'] = 'vb1';
NUTRIENT_NAME_MAP['硫胺素'] = 'vb1';
NUTRIENT_NAME_MAP['维生素B2'] = 'vb2';
NUTRIENT_NAME_MAP['维B2'] = 'vb2';
NUTRIENT_NAME_MAP['核黄素'] = 'vb2';
NUTRIENT_NAME_MAP['维生素B6'] = 'vb6';
NUTRIENT_NAME_MAP['维B6'] = 'vb6';
NUTRIENT_NAME_MAP['维生素B12'] = 'vb12';
NUTRIENT_NAME_MAP['维B12'] = 'vb12';
NUTRIENT_NAME_MAP['烟酸'] = 'niacin';
NUTRIENT_NAME_MAP['叶酸'] = 'folate';
NUTRIENT_NAME_MAP['泛酸'] = 'pantothenic';
NUTRIENT_NAME_MAP['饱和脂肪'] = 'sat_fat';
NUTRIENT_NAME_MAP['饱和脂肪酸'] = 'sat_fat';
NUTRIENT_NAME_MAP['糖'] = 'sugar';
NUTRIENT_NAME_MAP['反式脂肪'] = 'trans_fat';
NUTRIENT_NAME_MAP['反式脂肪酸'] = 'trans_fat';
NUTRIENT_NAME_MAP['胆固醇'] = 'chol';

// 英文名映射（OCR可能返回英文）
NUTRIENT_NAME_MAP['Energy'] = 'cal';
NUTRIENT_NAME_MAP['energy'] = 'cal';
NUTRIENT_NAME_MAP['Calories'] = 'cal';
NUTRIENT_NAME_MAP['calories'] = 'cal';
NUTRIENT_NAME_MAP['Protein'] = 'protein';
NUTRIENT_NAME_MAP['protein'] = 'protein';
NUTRIENT_NAME_MAP['Fat'] = 'fat';
NUTRIENT_NAME_MAP['fat'] = 'fat';
NUTRIENT_NAME_MAP['Total Fat'] = 'fat';
NUTRIENT_NAME_MAP['Carbohydrate'] = 'carb';
NUTRIENT_NAME_MAP['carbohydrate'] = 'carb';
NUTRIENT_NAME_MAP['Total Carbohydrate'] = 'carb';
NUTRIENT_NAME_MAP['Carbs'] = 'carb';
NUTRIENT_NAME_MAP['Dietary Fiber'] = 'fiber';
NUTRIENT_NAME_MAP['Fiber'] = 'fiber';
NUTRIENT_NAME_MAP['fiber'] = 'fiber';
NUTRIENT_NAME_MAP['Sodium'] = 'na';
NUTRIENT_NAME_MAP['sodium'] = 'na';
NUTRIENT_NAME_MAP['Calcium'] = 'ca';
NUTRIENT_NAME_MAP['calcium'] = 'ca';
NUTRIENT_NAME_MAP['Iron'] = 'fe';
NUTRIENT_NAME_MAP['iron'] = 'fe';
NUTRIENT_NAME_MAP['Zinc'] = 'zn';
NUTRIENT_NAME_MAP['zinc'] = 'zn';
NUTRIENT_NAME_MAP['Selenium'] = 'se';
NUTRIENT_NAME_MAP['Potassium'] = 'k';
NUTRIENT_NAME_MAP['potassium'] = 'k';
NUTRIENT_NAME_MAP['Magnesium'] = 'mg';
NUTRIENT_NAME_MAP['magnesium'] = 'mg';
NUTRIENT_NAME_MAP['Phosphorus'] = 'p';
NUTRIENT_NAME_MAP['Copper'] = 'cu';
NUTRIENT_NAME_MAP['Manganese'] = 'mn';
NUTRIENT_NAME_MAP['Iodine'] = 'i';
NUTRIENT_NAME_MAP['Vitamin A'] = 'va';
NUTRIENT_NAME_MAP['Vitamin C'] = 'vc';
NUTRIENT_NAME_MAP['Vitamin D'] = 'vd';
NUTRIENT_NAME_MAP['Vitamin E'] = 've';
NUTRIENT_NAME_MAP['Vitamin K'] = 'vk';
NUTRIENT_NAME_MAP['Vitamin B1'] = 'vb1';
NUTRIENT_NAME_MAP['Thiamin'] = 'vb1';
NUTRIENT_NAME_MAP['Vitamin B2'] = 'vb2';
NUTRIENT_NAME_MAP['Riboflavin'] = 'vb2';
NUTRIENT_NAME_MAP['Vitamin B6'] = 'vb6';
NUTRIENT_NAME_MAP['Vitamin B12'] = 'vb12';
NUTRIENT_NAME_MAP['Niacin'] = 'niacin';
NUTRIENT_NAME_MAP['Folate'] = 'folate';
NUTRIENT_NAME_MAP['Folic Acid'] = 'folate';
NUTRIENT_NAME_MAP['Pantothenic Acid'] = 'pantothenic';
NUTRIENT_NAME_MAP['Saturated Fat'] = 'sat_fat';
NUTRIENT_NAME_MAP['Sugar'] = 'sugar';
NUTRIENT_NAME_MAP['Trans Fat'] = 'trans_fat';
NUTRIENT_NAME_MAP['Cholesterol'] = 'chol';

/**
 * 根据用户画像计算所有营养素的推荐值
 * 依据《中国居民膳食营养素参考摄入量（2023版）》
 */
function calcAllRecommendations(p) {
  var age = p.age || 30;
  var gender = p.gender || 'female';
  var condition = p.condition || 'healthy';
  var weight = p.weight || 60;
  var height = p.height || (gender === 'male' ? 170 : 160);
  var isElderly = age >= 50;
  var isYouth = age <= 18;
  var isPregnancy = condition === 'pregnancy';
  var isLactation = condition === 'lactation';
  var isDiabetes = condition === 'diabetes';

  // 基础代谢率（Mifflin-St Jeor公式）
  var bmr;
  if (gender === 'male') {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  }
  if (isNaN(bmr) || bmr <= 0) bmr = 1400;

  // 活动系数和热量调整（根据健康情况）
  var activityFactor = 1.4; // 久坐
  var calAdjust = 1.0;      // 热量调整系数
  var proteinPerKg = 1.0;   // 蛋白质 g/kg
  var fatRatio = 0.25;      // 脂肪供能比
  var carbRatio = 0.55;     // 碳水供能比

  switch(condition) {
    case 'healthy':
      activityFactor = 1.4; calAdjust = 1.0; proteinPerKg = 1.0; break;
    case 'fatloss':
      activityFactor = 1.5; calAdjust = 0.8; proteinPerKg = 1.5; fatRatio = 0.30; carbRatio = 0.42; break;
    case 'muscle':
      activityFactor = 1.6; calAdjust = 1.15; proteinPerKg = 1.8; fatRatio = 0.27; carbRatio = 0.55; break;
    case 'elderly':
      activityFactor = 1.3; calAdjust = 0.95; proteinPerKg = 1.3; break;
    case 'stomach':
      activityFactor = 1.3; calAdjust = 0.9; proteinPerKg = 1.1; fatRatio = 0.22; carbRatio = 0.58; break;
    case 'recovery':
      activityFactor = 1.3; calAdjust = 1.1; proteinPerKg = 1.5; break;
    case 'diabetes':
      activityFactor = 1.4; calAdjust = 0.95; proteinPerKg = 1.2; fatRatio = 0.30; carbRatio = 0.45; break;
    case 'pregnancy':
      activityFactor = 1.4; calAdjust = 1.1; proteinPerKg = 1.3; break;
    case 'lactation':
      activityFactor = 1.5; calAdjust = 1.2; proteinPerKg = 1.3; break;
    default:
      break;
  }

  var baseCal = bmr * activityFactor * calAdjust;
  if (isNaN(baseCal) || baseCal <= 0) baseCal = 1800;

  var reco = {};

  // === 核心营养素 ===
  reco.cal = Math.round(baseCal);
  reco.protein = Math.round(weight * proteinPerKg);
  reco.fat = Math.round(baseCal * fatRatio / 9);
  reco.carb = Math.round(baseCal * carbRatio / 4);
  reco.fiber = isDiabetes ? 30 : 25;
  reco.na = isElderly ? 1300 : 1500; // 老人减钠

  // === 矿物质 ===
  // 钙：青少年1200，成人800，老人1000，孕乳1000
  reco.ca = isYouth ? 1200 : (isElderly ? 1000 : 800);
  if (isPregnancy || isLactation) reco.ca = 1000;

  // 铁：男12，女18，孕24，乳24
  reco.fe = gender === 'male' ? 12 : 18;
  if (isPregnancy) reco.fe = 24;
  if (isLactation) reco.fe = 24;

  // 锌：男12.5，女7.5，孕9.5，乳12
  reco.zn = gender === 'male' ? 12.5 : 7.5;
  if (isPregnancy) reco.zn = 9.5;
  if (isLactation) reco.zn = 12;

  // 硒：成人60μg，孕乳65-78
  reco.se = 60;
  if (isPregnancy) reco.se = 65;
  if (isLactation) reco.se = 78;

  // 钾：成人2000mg
  reco.k = 2000;

  // 镁：成人330mg
  reco.mg = 330;

  // 磷：成人720mg
  reco.p = 720;

  // 铜：成人0.8mg
  reco.cu = 0.8;

  // 锰：成人4.5mg
  reco.mn = 4.5;

  // 碘：成人120μg，孕230，乳243
  reco.i = 120;
  if (isPregnancy) reco.i = 230;
  if (isLactation) reco.i = 243;

  // === 维生素 ===
  // VA：男800，女700，孕770，乳1300
  reco.va = gender === 'male' ? 800 : 700;
  if (isPregnancy) reco.va = 770;
  if (isLactation) reco.va = 1300;

  // VC：成人100，孕115，乳150
  reco.vc = 100;
  if (isPregnancy) reco.vc = 115;
  if (isLactation) reco.vc = 150;

  // VD：成人10μg（2023版下调，老人15）
  reco.vd = isElderly ? 15 : 10;

  // VE：成人14mg
  reco.ve = 14;

  // VK：成人80μg
  reco.vk = 80;

  // VB1：男1.4，女1.2，孕1.5，乳1.5
  reco.vb1 = gender === 'male' ? 1.4 : 1.2;
  if (isPregnancy || isLactation) reco.vb1 = 1.5;

  // VB2：男1.4，女1.2，孕1.4，乳1.4
  reco.vb2 = gender === 'male' ? 1.4 : 1.2;
  if (isPregnancy || isLactation) reco.vb2 = 1.4;

  // VB6：成人1.4，孕1.9，乳1.7
  reco.vb6 = 1.4;
  if (isPregnancy) reco.vb6 = 1.9;
  if (isLactation) reco.vb6 = 1.7;

  // VB12：成人2.4，孕2.9，乳3.2
  reco.vb12 = 2.4;
  if (isPregnancy) reco.vb12 = 2.9;
  if (isLactation) reco.vb12 = 3.2;

  // 烟酸：男15，女12，孕12，乳15
  reco.niacin = gender === 'male' ? 15 : 12;
  if (isPregnancy) reco.niacin = 12;
  if (isLactation) reco.niacin = 15;

  // 叶酸：成人400μg，孕600，乳550
  reco.folate = 400;
  if (isPregnancy) reco.folate = 600;
  if (isLactation) reco.folate = 550;

  // 泛酸：成人5mg
  reco.pantothenic = 5;

  return reco;
}

/**
 * 从自然语言文本中解析营养成分
 * 支持各种格式："蛋白质 6.2g"、"能量：430千卡"、"钠 450mg"等
 */
function parseNutrientsFromText(text) {
  var result = {};
  if (!text) return result;
  console.log('[parseNutrients] 原始文本:', text);

  // 按行分割
  var lines = text.split(/[\n\r;；|]/);

  // 检测是否进入了"每100kJ"列区域
  // 很多营养成分表有两列：每100g 和 每100kJ
  // 我们需要优先取"每100g"的值，跳过"每100kJ"的值
  var inPerKjSection = false;

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].trim();
    if (!line) continue;

    // 检测列头：如果出现"每100kJ"或"每100千焦"，标记进入kJ区域
    if (/每\s*100\s*k[J]|每\s*100\s*千焦/i.test(line)) {
      inPerKjSection = true;
      console.log('[parseNutrients] 检测到每100kJ列，跳过后续值');
      continue;
    }
    // 如果重新出现"每100g"，退出kJ区域
    if (/每\s*100\s*g/i.test(line)) {
      inPerKjSection = false;
      console.log('[parseNutrients] 检测到每100g列，恢复解析');
      continue;
    }

    // 在kJ区域中跳过
    if (inPerKjSection) {
      console.log('[parseNutrients] 跳过(kJ列): ' + line);
      continue;
    }

    // 一行可能有两个数值（如 "蛋白质 15.90g 0.88g"）
    // 取第一个数值（通常是每100g列的值）
    // 注意：营养素名可能包含数字（如 维生素B1, 维生素B12, 维生素K1）
    // 所以正则要贪婪匹配名字，直到遇到"数值+单位"的模式
    // 支持的单位：kcal, kJ, 千卡, 千焦, mg, μg, ug, µg, g, 以及复合单位如 μgRE, μgRAE, mgα-TE, mgNE, μgDFE 等
    var match = line.match(/^(.+?)\s*[:：]?\s*(\d+\.?\d*)\s*(kcal|kJ|千卡|千焦|mgα-TE|mgNE|μgRAE|μgRE|μgDFE|mg|μg|ug|µg|g|mg\/kg)?/i);
    if (match) {
      var nutrientName = match[1].trim();
      var value = parseFloat(match[2]);
      var unit = (match[3] || '').toLowerCase();

      // 清理营养素名：去掉前缀符号（如 * ）、括号内容
      nutrientName = nutrientName.replace(/^[*\s·•\-]+/, '').trim();
      nutrientName = nutrientName.replace(/[（(].*?[）)]/g, '').trim();

      // 特殊处理：维生素B1/B2/B6/B12/K1 等带数字的名字
      // 正则可能把 "维生素B1" 拆成 "维生素B" + "1"
      // 检测这种情况并修复
      var vbMatch = nutrientName.match(/^(维生素[ABCDEK])(\d+)$/i);
      if (vbMatch) {
        nutrientName = vbMatch[1] + vbMatch[2];  // 重新组合
      }
      // 另一种情况：名字被截断为 "维生素B" 而数值是 "1"
      // 如 "维生素B1：0.80mg" -> match[1]="维生素B" match[2]="1"
      // 这时需要把数值"1"还回名字，重新找真正的数值
      if (/^(维生素[ABCDEK])$/i.test(nutrientName) && value < 20 && !unit) {
        // 可能是维生素B1/B2/B6/B12/K1被拆开了
        // 重新从原始行中提取
        var reMatch = line.match(/^(.+?)(\d+)\s*[:：]?\s*(\d+\.?\d*)\s*(kcal|kJ|千卡|千焦|mgα-TE|mgNE|μgRAE|μgRE|μgDFE|mg|μg|ug|µg|g)?/i);
        if (reMatch) {
          nutrientName = (reMatch[1] + reMatch[2]).replace(/^[*\s·•\-]+/, '').trim();
          value = parseFloat(reMatch[3]);
          unit = (reMatch[4] || '').toLowerCase();
          console.log('[parseNutrients] 修复带数字名字: ' + nutrientName + ' = ' + value + unit);
        }
      }

      // 查找对应的key
      var key = NUTRIENT_NAME_MAP[nutrientName];

      // 如果精确匹配失败，尝试模糊匹配（包含关系）
      if (!key) {
        for (var mapName in NUTRIENT_NAME_MAP) {
          if (nutrientName.indexOf(mapName) >= 0 || mapName.indexOf(nutrientName) >= 0) {
            key = NUTRIENT_NAME_MAP[mapName];
            break;
          }
        }
      }

      if (key && !isNaN(value)) {
        // 如果这个营养素已经有值了，不要覆盖（保留第一个=每100g的值）
        if (result[key] !== undefined) {
          console.log('[parseNutrients] 已有值，跳过覆盖: ' + nutrientName + ' (已有 ' + result[key] + ')');
          continue;
        }

        // ====== 单位换算 ======
        // 获取该营养素在系统中的期望单位
        var def = getNutrientDef(key);
        var expectedUnit = def ? def.unit : '';

        // 1. 能量：千焦 -> 千卡
        if ((key === 'cal') && (unit === 'kj' || unit === '千焦')) {
          value = Math.round(value / 4.184);
          console.log('[parseNutrients] 能量换算: kJ->kcal = ' + value);
        }

        // 2. μg -> mg 换算（系统期望mg但返回值是μg的情况）
        // 铜(cu)期望mg，锰(mn)期望mg
        if (expectedUnit === 'mg' && (unit === 'μg' || unit === 'ug' || unit === 'µg')) {
          value = Math.round(value / 1000 * 1000) / 1000;  // 保留3位小数
          console.log('[parseNutrients] 单位换算: μg->mg = ' + value + ' (' + nutrientName + ')');
        }

        // 3. mg -> μg 换算（系统期望μg但返回值是mg的情况）
        // 硒(se)期望μg，碘(i)期望μg，维生素D(vd)期望μg，维生素K(vk)期望μg，维生素B12(vb12)期望μg
        if (expectedUnit === 'μg' && unit === 'mg') {
          value = Math.round(value * 1000);
          console.log('[parseNutrients] 单位换算: mg->μg = ' + value + ' (' + nutrientName + ')');
        }

        // 4. 维生素A: μgRE / μgRAE -> 直接用数值（单位名不同但含义相同）
        // 百度可能返回 "410μgRE" 或 "410μgRAE"，系统期望 μgRAE
        // 不需要换算数值，只需要识别

        // 5. 维生素E: mgα-TE -> mg（去掉后缀，数值不变）
        // 百度可能返回 "6.0mgα-TE"，系统期望 mg
        // 不需要换算数值

        result[key] = value;
        console.log('[parseNutrients] 匹配成功: ' + nutrientName + ' -> ' + key + ' = ' + value + (expectedUnit ? ' ' + expectedUnit : ''));
      }
    }
  }

  console.log('[parseNutrients] 最终结果:', JSON.stringify(result));
  return result;
}

// 获取营养素定义
function getNutrientDef(key) {
  for (var i = 0; i < NUTRIENT_DEFS.length; i++) {
    if (NUTRIENT_DEFS[i].key === key) return NUTRIENT_DEFS[i];
  }
  return null;
}

// 格式化营养素显示
function formatNutrient(key, value) {
  var def = getNutrientDef(key);
  if (!def) return value;
  if (value === undefined || value === null || isNaN(value)) return '0' + def.unit;
  return value + def.unit;
}
