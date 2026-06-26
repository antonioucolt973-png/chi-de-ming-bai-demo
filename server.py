"""
吃得明白 - 食物识别后端服务（MiMo-V2.5 版本）

使用小米 MiMo-V2.5 多模态大模型替代百度AI，优势：
  1. 同步调用，无需轮询（1-3秒返回，百度需10-40秒）
  2. 一个模型搞定图片识别+文字读取+建议生成
  3. OpenAI兼容格式，代码更简洁
  4. 新增 AI 营养建议、趋势分析能力

API 接口（与前端兼容）：
  POST /api/recognize      - 上传图片识别食物
  GET  /api/result/<id>    - 获取识别结果
  POST /api/scan_label     - 扫描营养成分表
  POST /api/ai_advice      - AI 营养建议（新增）
  POST /api/ai_trend       - AI 趋势分析（新增）
  POST /api/export_report  - 导出饮食报告
"""

import json
import base64
import os
import time
import uuid
import re
import traceback
import threading
import tempfile
import requests as http_requests
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

# ============ 路径配置（跨平台兼容） ============
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# ============ MiMo 配置 ============
# 优先尝试 import mimo_config（本地开发用，已在 .gitignore 中排除）
# 如果 mimo_config.py 不存在（线上环境），直接从环境变量读取
try:
    from mimo_config import MIMO_API_KEY, MIMO_BASE_URL, MIMO_MODEL, MIMO_TIMEOUT, is_configured
    MIMO_READY = is_configured()
except ImportError:
    # 线上环境：mimo_config.py 不存在，直接从环境变量读取
    MIMO_API_KEY = os.environ.get('MIMO_API_KEY', '')
    MIMO_BASE_URL = os.environ.get('MIMO_BASE_URL', 'https://api.xiaomimimo.com/v1/chat/completions')
    MIMO_MODEL = os.environ.get('MIMO_MODEL', 'mimo-v2.5')
    MIMO_TIMEOUT = int(os.environ.get('MIMO_TIMEOUT', '90'))
    MIMO_READY = bool(MIMO_API_KEY) and len(MIMO_API_KEY) > 10

app = Flask(__name__, static_folder=BASE_DIR)
CORS(app)

# 任务目录（跨平台临时目录，保持与前端兼容的轮询机制）
TMP_DIR = tempfile.gettempdir()
PENDING_DIR = os.path.join(TMP_DIR, 'chi_de_ming_bai_food_pending')
RESULTS_DIR = os.path.join(TMP_DIR, 'chi_de_ming_bai_food_results')
os.makedirs(PENDING_DIR, exist_ok=True)
os.makedirs(RESULTS_DIR, exist_ok=True)

# ============ 轻量 IP 限流（内存 dict，防刷额度） ============
RATE_LIMIT_MAX = 20       # 每个 IP 每分钟最多请求次数
RATE_LIMIT_WINDOW = 60    # 窗口大小（秒）
_rate_limit_store = {}    # {ip: [(timestamp, ...)]}

def _check_rate_limit(ip):
    """检查 IP 是否超过限流。返回 True 表示允许，False 表示被限流。"""
    now = time.time()
    if ip not in _rate_limit_store:
        _rate_limit_store[ip] = []
    # 清理过期记录
    _rate_limit_store[ip] = [t for t in _rate_limit_store[ip] if now - t < RATE_LIMIT_WINDOW]
    if len(_rate_limit_store[ip]) >= RATE_LIMIT_MAX:
        return False
    _rate_limit_store[ip].append(now)
    return True

def _get_client_ip():
    """获取客户端真实 IP（兼容反向代理）"""
    if request.headers.get('X-Forwarded-For'):
        return request.headers.get('X-Forwarded-For').split(',')[0].strip()
    return request.remote_addr or 'unknown'

def _rate_limit_check():
    """统一限流检查，返回 None 或 (jsonify_response)"""
    ip = _get_client_ip()
    if not _check_rate_limit(ip):
        return jsonify({'success': False, 'error': '请求太频繁，请稍后再试'})
    return None

# ============ 图片大小限制 ============
MAX_IMAGE_SIZE = 4 * 1024 * 1024  # 4MB

def _check_image_size(image_b64):
    """检查 base64 图片大小是否超限。返回 None 或 (jsonify_response)"""
    # base64 编码后大小约为原始大小的 4/3
    estimated_size = len(image_b64) * 3 / 4
    if estimated_size > MAX_IMAGE_SIZE:
        return jsonify({'success': False, 'error': '图片过大，请压缩后再上传'})
    return None

# ============ 食物营养数据库（与前端一致） ============
FOOD_DB = {
    '白米饭': {'cal': 116, 'protein': 2.6, 'fat': 0.3, 'carb': 25.9, 'unit': '碗', 'unit_weight': 200, 'icon': '🍚', 'category': '主食'},
    '白粥': {'cal': 46, 'protein': 0.8, 'fat': 0.1, 'carb': 10.4, 'unit': '碗', 'unit_weight': 300, 'icon': '🥣', 'category': '主食'},
    '面条': {'cal': 110, 'protein': 3.4, 'fat': 0.4, 'carb': 24.3, 'unit': '碗', 'unit_weight': 250, 'icon': '🍜', 'category': '主食'},
    '馒头': {'cal': 221, 'protein': 7.0, 'fat': 1.1, 'carb': 47.0, 'unit': '个', 'unit_weight': 100, 'icon': '🍞', 'category': '主食'},
    '包子': {'cal': 227, 'protein': 7.2, 'fat': 10.1, 'carb': 27.0, 'unit': '个', 'unit_weight': 120, 'icon': '🥟', 'category': '主食'},
    '蛋炒饭': {'cal': 174, 'protein': 4.5, 'fat': 6.5, 'carb': 24.0, 'unit': '份', 'unit_weight': 300, 'icon': '🍳', 'category': '主食'},
    '饺子': {'cal': 196, 'protein': 7.8, 'fat': 7.5, 'carb': 25.0, 'unit': '个', 'unit_weight': 30, 'icon': '🥟', 'category': '主食'},
    '红薯': {'cal': 99, 'protein': 1.1, 'fat': 0.2, 'carb': 23.1, 'unit': '个', 'unit_weight': 200, 'icon': '🍠', 'category': '主食'},
    '玉米': {'cal': 112, 'protein': 4.0, 'fat': 1.2, 'carb': 22.8, 'unit': '根', 'unit_weight': 200, 'icon': '🌽', 'category': '主食'},
    '燕麦粥': {'cal': 65, 'protein': 2.5, 'fat': 1.0, 'carb': 11.5, 'unit': '碗', 'unit_weight': 250, 'icon': '🥣', 'category': '主食'},
    '八宝粥': {'cal': 80, 'protein': 2.0, 'fat': 0.4, 'carb': 17.5, 'unit': '碗', 'unit_weight': 300, 'icon': '🥣', 'category': '主食'},
    '鸡胸肉': {'cal': 133, 'protein': 24.6, 'fat': 3.1, 'carb': 0.7, 'unit': '块', 'unit_weight': 150, 'icon': '🍗', 'category': '肉蛋'},
    '鸡腿': {'cal': 181, 'protein': 16.0, 'fat': 12.5, 'carb': 0.8, 'unit': '个', 'unit_weight': 100, 'icon': '🍗', 'category': '肉蛋'},
    '猪瘦肉': {'cal': 143, 'protein': 20.3, 'fat': 6.2, 'carb': 1.5, 'unit': '份', 'unit_weight': 100, 'icon': '🥩', 'category': '肉蛋'},
    '五花肉': {'cal': 349, 'protein': 14.5, 'fat': 30.8, 'carb': 3.2, 'unit': '份', 'unit_weight': 100, 'icon': '🥩', 'category': '肉蛋'},
    '排骨': {'cal': 264, 'protein': 16.7, 'fat': 21.0, 'carb': 1.2, 'unit': '份', 'unit_weight': 150, 'icon': '🍖', 'category': '肉蛋'},
    '牛肉': {'cal': 125, 'protein': 19.9, 'fat': 4.2, 'carb': 2.0, 'unit': '份', 'unit_weight': 100, 'icon': '🥩', 'category': '肉蛋'},
    '清蒸鱼': {'cal': 108, 'protein': 17.8, 'fat': 3.6, 'carb': 1.2, 'unit': '份', 'unit_weight': 150, 'icon': '🐟', 'category': '肉蛋'},
    '虾': {'cal': 93, 'protein': 18.6, 'fat': 0.8, 'carb': 2.8, 'unit': '份', 'unit_weight': 100, 'icon': '🦐', 'category': '肉蛋'},
    '鸡蛋': {'cal': 144, 'protein': 13.3, 'fat': 8.8, 'carb': 2.8, 'unit': '个', 'unit_weight': 50, 'icon': '🥚', 'category': '肉蛋'},
    '煎蛋': {'cal': 199, 'protein': 13.0, 'fat': 15.0, 'carb': 2.5, 'unit': '个', 'unit_weight': 50, 'icon': '🍳', 'category': '肉蛋'},
    '鸭肉': {'cal': 240, 'protein': 15.5, 'fat': 19.7, 'carb': 0.2, 'unit': '份', 'unit_weight': 100, 'icon': '🦆', 'category': '肉蛋'},
    '羊肉': {'cal': 203, 'protein': 19.0, 'fat': 14.1, 'carb': 0, 'unit': '份', 'unit_weight': 100, 'icon': '🥩', 'category': '肉蛋'},
    '番茄': {'cal': 19, 'protein': 0.9, 'fat': 0.2, 'carb': 3.5, 'unit': '个', 'unit_weight': 150, 'icon': '🍅', 'category': '蔬菜'},
    '白菜': {'cal': 17, 'protein': 1.5, 'fat': 0.1, 'carb': 2.8, 'unit': '份', 'unit_weight': 200, 'icon': '🥬', 'category': '蔬菜'},
    '菠菜': {'cal': 24, 'protein': 2.6, 'fat': 0.3, 'carb': 3.6, 'unit': '份', 'unit_weight': 150, 'icon': '🥬', 'category': '蔬菜'},
    '西兰花': {'cal': 36, 'protein': 4.1, 'fat': 0.6, 'carb': 4.3, 'unit': '份', 'unit_weight': 150, 'icon': '🥦', 'category': '蔬菜'},
    '黄瓜': {'cal': 15, 'protein': 0.8, 'fat': 0.2, 'carb': 2.9, 'unit': '根', 'unit_weight': 200, 'icon': '🥒', 'category': '蔬菜'},
    '胡萝卜': {'cal': 37, 'protein': 1.0, 'fat': 0.2, 'carb': 8.1, 'unit': '根', 'unit_weight': 100, 'icon': '🥕', 'category': '蔬菜'},
    '茄子': {'cal': 21, 'protein': 1.1, 'fat': 0.2, 'carb': 4.6, 'unit': '根', 'unit_weight': 200, 'icon': '🍆', 'category': '蔬菜'},
    '苦瓜': {'cal': 19, 'protein': 1.0, 'fat': 0.1, 'carb': 3.5, 'unit': '份', 'unit_weight': 150, 'icon': '🥒', 'category': '蔬菜'},
    '莲藕': {'cal': 73, 'protein': 1.9, 'fat': 0.2, 'carb': 16.4, 'unit': '份', 'unit_weight': 150, 'icon': '🥬', 'category': '蔬菜'},
    '香菇': {'cal': 26, 'protein': 2.2, 'fat': 0.3, 'carb': 5.2, 'unit': '份', 'unit_weight': 100, 'icon': '🍄', 'category': '蔬菜'},
    '豆腐': {'cal': 81, 'protein': 8.1, 'fat': 3.7, 'carb': 4.2, 'unit': '块', 'unit_weight': 150, 'icon': '🧈', 'category': '蔬菜'},
    '土豆': {'cal': 76, 'protein': 2.0, 'fat': 0.2, 'carb': 17.2, 'unit': '个', 'unit_weight': 150, 'icon': '🥔', 'category': '蔬菜'},
    '生菜': {'cal': 13, 'protein': 1.3, 'fat': 0.3, 'carb': 2.1, 'unit': '份', 'unit_weight': 100, 'icon': '🥬', 'category': '蔬菜'},
    '甜椒': {'cal': 22, 'protein': 1.0, 'fat': 0.2, 'carb': 5.0, 'unit': '个', 'unit_weight': 100, 'icon': '🫑', 'category': '蔬菜'},
    '小番茄': {'cal': 22, 'protein': 0.9, 'fat': 0.2, 'carb': 4.8, 'unit': '份', 'unit_weight': 100, 'icon': '🍅', 'category': '蔬菜'},
    '牛油果': {'cal': 171, 'protein': 1.7, 'fat': 15.3, 'carb': 7.4, 'unit': '个', 'unit_weight': 150, 'icon': '🥑', 'category': '蔬菜'},
    '番茄炒蛋': {'cal': 85, 'protein': 5.2, 'fat': 5.0, 'carb': 5.5, 'unit': '份', 'unit_weight': 200, 'icon': '🍳', 'category': '家常菜'},
    '麻婆豆腐': {'cal': 104, 'protein': 7.5, 'fat': 6.5, 'carb': 4.8, 'unit': '份', 'unit_weight': 200, 'icon': '🫕', 'category': '家常菜'},
    '炒时蔬': {'cal': 55, 'protein': 2.0, 'fat': 3.5, 'carb': 4.0, 'unit': '份', 'unit_weight': 200, 'icon': '🥬', 'category': '家常菜'},
    '宫保鸡丁': {'cal': 130, 'protein': 12.0, 'fat': 7.5, 'carb': 6.0, 'unit': '份', 'unit_weight': 200, 'icon': '🍗', 'category': '家常菜'},
    '红烧肉': {'cal': 230, 'protein': 10.0, 'fat': 18.0, 'carb': 8.0, 'unit': '份', 'unit_weight': 150, 'icon': '🥩', 'category': '家常菜'},
    '清蒸鲈鱼': {'cal': 78, 'protein': 15.0, 'fat': 2.0, 'carb': 1.0, 'unit': '份', 'unit_weight': 250, 'icon': '🐟', 'category': '家常菜'},
    '紫菜蛋花汤': {'cal': 25, 'protein': 2.5, 'fat': 1.0, 'carb': 2.0, 'unit': '碗', 'unit_weight': 300, 'icon': '🥣', 'category': '家常菜'},
    '鸡汤': {'cal': 55, 'protein': 5.0, 'fat': 3.0, 'carb': 1.5, 'unit': '碗', 'unit_weight': 300, 'icon': '🥣', 'category': '家常菜'},
    '排骨汤': {'cal': 65, 'protein': 5.5, 'fat': 3.8, 'carb': 2.5, 'unit': '碗', 'unit_weight': 300, 'icon': '🥣', 'category': '家常菜'},
    '凉拌黄瓜': {'cal': 35, 'protein': 1.0, 'fat': 2.0, 'carb': 3.0, 'unit': '份', 'unit_weight': 150, 'icon': '🥒', 'category': '家常菜'},
    '青椒肉丝': {'cal': 120, 'protein': 12.0, 'fat': 7.0, 'carb': 5.0, 'unit': '份', 'unit_weight': 200, 'icon': '🫑', 'category': '家常菜'},
    '红烧茄子': {'cal': 110, 'protein': 2.5, 'fat': 7.0, 'carb': 9.0, 'unit': '份', 'unit_weight': 200, 'icon': '🍆', 'category': '家常菜'},
    '韭菜炒蛋': {'cal': 95, 'protein': 7.0, 'fat': 6.0, 'carb': 4.5, 'unit': '份', 'unit_weight': 180, 'icon': '🍳', 'category': '家常菜'},
    '地三鲜': {'cal': 125, 'protein': 3.0, 'fat': 8.0, 'carb': 10.0, 'unit': '份', 'unit_weight': 200, 'icon': '🍆', 'category': '家常菜'},
    '蔬菜沙拉': {'cal': 35, 'protein': 1.5, 'fat': 1.0, 'carb': 4.5, 'unit': '份', 'unit_weight': 200, 'icon': '🥗', 'category': '家常菜'},
    '水果沙拉': {'cal': 55, 'protein': 0.8, 'fat': 0.5, 'carb': 12.0, 'unit': '份', 'unit_weight': 200, 'icon': '🥗', 'category': '家常菜'},
    '苹果': {'cal': 52, 'protein': 0.2, 'fat': 0.1, 'carb': 13.5, 'unit': '个', 'unit_weight': 200, 'icon': '🍎', 'category': '水果'},
    '香蕉': {'cal': 91, 'protein': 1.4, 'fat': 0.2, 'carb': 22.0, 'unit': '根', 'unit_weight': 120, 'icon': '🍌', 'category': '水果'},
    '橙子': {'cal': 48, 'protein': 0.8, 'fat': 0.2, 'carb': 11.1, 'unit': '个', 'unit_weight': 200, 'icon': '🍊', 'category': '水果'},
    '葡萄': {'cal': 43, 'protein': 0.5, 'fat': 0.2, 'carb': 10.3, 'unit': '份', 'unit_weight': 150, 'icon': '🍇', 'category': '水果'},
    '西瓜': {'cal': 25, 'protein': 0.5, 'fat': 0.1, 'carb': 5.8, 'unit': '份', 'unit_weight': 300, 'icon': '🍉', 'category': '水果'},
    '梨': {'cal': 44, 'protein': 0.4, 'fat': 0.1, 'carb': 10.6, 'unit': '个', 'unit_weight': 200, 'icon': '🍐', 'category': '水果'},
    '桃子': {'cal': 51, 'protein': 0.9, 'fat': 0.1, 'carb': 12.2, 'unit': '个', 'unit_weight': 200, 'icon': '🍑', 'category': '水果'},
    '牛奶': {'cal': 54, 'protein': 3.0, 'fat': 3.2, 'carb': 3.4, 'unit': '杯', 'unit_weight': 250, 'icon': '🥛', 'category': '饮品'},
    '酸奶': {'cal': 72, 'protein': 2.5, 'fat': 2.7, 'carb': 9.3, 'unit': '杯', 'unit_weight': 200, 'icon': '🥛', 'category': '饮品'},
    '豆浆': {'cal': 31, 'protein': 3.0, 'fat': 1.6, 'carb': 1.2, 'unit': '杯', 'unit_weight': 300, 'icon': '🥛', 'category': '饮品'},
    '绿茶': {'cal': 1, 'protein': 0.2, 'fat': 0, 'carb': 0, 'unit': '杯', 'unit_weight': 250, 'icon': '🍵', 'category': '饮品'},
    '奶茶': {'cal': 52, 'protein': 0.8, 'fat': 1.5, 'carb': 8.5, 'unit': '杯', 'unit_weight': 500, 'icon': '🧋', 'category': '饮品'},
    '黄焖鸡米饭': {'cal': 180, 'protein': 14.0, 'fat': 8.0, 'carb': 16.0, 'unit': '份', 'unit_weight': 400, 'icon': '🍱', 'category': '外卖'},
    '牛肉面': {'cal': 165, 'protein': 10.0, 'fat': 5.0, 'carb': 22.0, 'unit': '份', 'unit_weight': 450, 'icon': '🍜', 'category': '外卖'},
    '炸鸡': {'cal': 246, 'protein': 18.0, 'fat': 16.0, 'carb': 10.0, 'unit': '份', 'unit_weight': 150, 'icon': '🍗', 'category': '外卖'},
    '盖浇饭': {'cal': 200, 'protein': 10.0, 'fat': 8.0, 'carb': 24.0, 'unit': '份', 'unit_weight': 400, 'icon': '🍱', 'category': '外卖'},
    '小笼包': {'cal': 230, 'protein': 8.0, 'fat': 10.0, 'carb': 28.0, 'unit': '笼', 'unit_weight': 200, 'icon': '🥟', 'category': '外卖'},
    '火锅': {'cal': 450, 'protein': 25.0, 'fat': 25.0, 'carb': 30.0, 'unit': '顿', 'unit_weight': 500, 'icon': '🫕', 'category': '外卖'},
}

# 从 food_db_sync.py 加载完整数据库（含微量营养素）
try:
    from food_db_sync import FOOD_DB_EX
    FOOD_DB.update(FOOD_DB_EX)
    print(f"[启动] 食物数据库已加载: {len(FOOD_DB)} 种食物")
except ImportError:
    print("[警告] food_db_sync.py 未找到，仅使用基础数据库")

# 食物别名映射
FOOD_ALIASES = {
    '米饭': '白米饭', '饭': '白米饭',
    '粥': '白粥', '稀饭': '白粥',
    '番茄炒鸡蛋': '番茄炒蛋', '西红柿炒蛋': '番茄炒蛋', '西红柿炒鸡蛋': '番茄炒蛋',
    '西红柿': '番茄',
    '樱桃番茄': '小番茄', '圣女果': '小番茄',
    '彩椒': '甜椒', '青椒': '甜椒', '灯笼椒': '甜椒',
    '生菜沙拉': '蔬菜沙拉', '沙拉': '蔬菜沙拉',
    '蒸鱼': '清蒸鱼', '鱼': '清蒸鱼',
    '猪肉': '猪瘦肉', '肉片': '猪瘦肉',
    '煎鸡蛋': '煎蛋', '荷包蛋': '煎蛋',
    '豆腐脑': '豆腐',
    '炒青菜': '炒时蔬', '青菜': '炒时蔬',
    '紫菜汤': '紫菜蛋花汤', '蛋花汤': '紫菜蛋花汤',
    '鸡块': '鸡胸肉', '鸡肉': '鸡胸肉',
    '排骨饭': '排骨',
    '红烧排骨': '排骨',
}


# ============ MiMo API 核心调用 ============

def _classify_mimo_error(status_code, error_text):
    """
    根据 HTTP 状态码和错误内容，返回用户可读的中文错误提示。
    不泄露密钥。
    """
    error_lower = error_text.lower()

    if status_code == 401 or 'unauthorized' in error_lower or 'invalid api' in error_lower:
        return '鉴权失败：API Key 无效或已过期，请检查 MIMO_API_KEY'
    if status_code == 403 or 'forbidden' in error_lower or 'permission' in error_lower:
        return '权限不足或余额不足，请检查小米 MiMo 平台账户状态'
    if status_code == 404 or 'model' in error_lower and 'not found' in error_lower:
        return f'模型名错误：当前模型 "{MIMO_MODEL}" 不存在，请确认模型名'
    if status_code == 429 or 'rate' in error_lower or 'quota' in error_lower:
        return '请求频率超限或额度用完，请稍后重试'
    if status_code == 400:
        if 'max_completion_tokens' in error_lower or 'max_tokens' in error_lower:
            return '接口参数错误：token 参数不合法'
        if 'temperature' in error_lower:
            return '接口参数错误：temperature 参数不合法'
        return f'接口参数错误：{error_text[:150]}'
    if status_code >= 500:
        return f'MiMo 服务端错误（{status_code}），请稍后重试'

    return f'MiMo API 返回 {status_code}：{error_text[:150]}'


def mimo_chat(messages, max_tokens=1024, temperature=0.1):
    """
    调用 MiMo-V2.5 模型（OpenAI 兼容格式）
    同步返回结果，无需轮询。

    官方文档确认的调用格式：
      - 请求 URL：https://api.xiaomimimo.com/v1/chat/completions
      - 认证头：api-key（不是 Authorization: Bearer）
      - token 参数：max_completion_tokens（不是 max_tokens）
      - 模型名：mimo-v2.5
      - 多模态图片：OpenAI image_url 格式

    Args:
        messages: OpenAI 格式的消息列表
        max_tokens: 最大返回 token 数
        temperature: 温度参数（越低越确定）

    Returns:
        dict: {'success': True, 'text': '...'} 或 {'success': False, 'error': '...'}
    """
    if not MIMO_READY:
        return {'success': False, 'error': '未配置 MIMO_API_KEY，请在环境变量或 mimo_config.py 中设置'}

    try:
        resp = http_requests.post(
            MIMO_BASE_URL,
            headers={
                'api-key': MIMO_API_KEY,
                'Content-Type': 'application/json'
            },
            json={
                'model': MIMO_MODEL,
                'messages': messages,
                'max_completion_tokens': max_tokens,
                'temperature': temperature
            },
            timeout=MIMO_TIMEOUT
        )

        if resp.status_code != 200:
            error_detail = resp.text[:300]
            friendly_error = _classify_mimo_error(resp.status_code, error_detail)
            print(f"[MiMo] API错误 {resp.status_code}: {error_detail}", flush=True)
            print(f"[MiMo] 可读错误: {friendly_error}", flush=True)
            return {'success': False, 'error': friendly_error, 'status_code': resp.status_code}

        data = resp.json()
        text = data.get('choices', [{}])[0].get('message', {}).get('content', '')

        if not text:
            # 打印完整响应帮助调试（不含密钥）
            print(f"[MiMo] 返回空内容，完整响应: {json.dumps(data, ensure_ascii=False)[:500]}", flush=True)
            reasoning = data.get('choices', [{}])[0].get('message', {}).get('reasoning_content', '')
            if reasoning:
                return {'success': False, 'error': 'MiMo 返回空内容（思考模式消耗了全部 token，请增大 max_tokens）'}
            return {'success': False, 'error': 'MiMo 返回空内容'}

        return {'success': True, 'text': text.strip()}

    except http_requests.exceptions.Timeout:
        return {'success': False, 'error': f'MiMo API 请求超时（{MIMO_TIMEOUT}秒），请检查网络或增大超时时间'}
    except http_requests.exceptions.ConnectionError:
        return {'success': False, 'error': '无法连接 MiMo API，请检查网络连接'}
    except Exception as e:
        return {'success': False, 'error': f'MiMo API 调用异常: {str(e)}'}


def mimo_chat_with_image(image_base64, prompt, max_tokens=4096, temperature=0.1):
    """
    调用 MiMo-V2.5 多模态接口（图片+文字）

    图片传参逻辑：
      - 如果 image_base64 已含 data:image/... 前缀，直接使用
      - 如果是纯 base64，补成 data:image/jpeg;base64,... 格式
      - 最终传给 MiMo 的 image_url.url 是完整 data URL

    Args:
        image_base64: 图片的 base64 字符串（可含 data:image/... 前缀）
        prompt: 文字提示词
        max_tokens: 最大返回 token 数
        temperature: 温度参数

    Returns:
        dict: {'success': True, 'text': '...'} 或 {'success': False, 'error': '...'}
    """
    # 确保图片格式正确：必须是完整的 data URL
    if not image_base64.startswith('data:image'):
        image_base64 = f'data:image/jpeg;base64,{image_base64}'

    # 诊断日志（不打印 base64 内容）
    has_prefix = image_base64.startswith('data:image')
    img_size_kb = round(len(image_base64) * 0.75 / 1024)
    print(f"[MiMo] 多模态调用: 图片大小={img_size_kb}KB, 含data前缀={has_prefix}, prompt长度={len(prompt)}, max_tokens={max_tokens}", flush=True)

    messages = [
        {
            'role': 'user',
            'content': [
                {
                    'type': 'image_url',
                    'image_url': {
                        'url': image_base64
                    }
                },
                {
                    'type': 'text',
                    'text': prompt
                }
            ]
        }
    ]

    start_time = time.time()
    result = mimo_chat(messages, max_tokens=max_tokens, temperature=temperature)
    elapsed = time.time() - start_time

    if result.get('success'):
        print(f"[MiMo] 多模态调用成功: 耗时={elapsed:.1f}秒, 返回长度={len(result['text'])}", flush=True)
    else:
        print(f"[MiMo] 多模态调用失败: 耗时={elapsed:.1f}秒, 错误={result.get('error', '未知')}", flush=True)

    return result


# ============ 食物数据库匹配 ============

def _build_food_item(food_name, info):
    """构建完整的食物数据（含所有营养素）"""
    w = info['unit_weight']
    return {
        'name': food_name,
        'icon': info['icon'],
        'category': info['category'],
        'weight': w,
        'cal': round(info['cal'] * w / 100),
        'protein': round(info['protein'] * w / 100, 1),
        'fat': round(info['fat'] * w / 100, 1),
        'carb': round(info['carb'] * w / 100, 1),
        'fiber': round(info.get('fiber', 0) * w / 100, 1),
        'ca': round(info.get('ca', 0) * w / 100, 1),
        'fe': round(info.get('fe', 0) * w / 100, 1),
        'zn': round(info.get('zn', 0) * w / 100, 1),
        'va': round(info.get('va', 0) * w / 100, 1),
        'vc': round(info.get('vc', 0) * w / 100, 1),
        'multiplier': 1.0
    }


def match_food_from_text(food_names_text):
    """从 AI 返回的食物名称文本中匹配数据库"""
    matched = []
    found_names = set()
    text = food_names_text.strip()

    # 精确匹配
    for food_name, info in FOOD_DB.items():
        if food_name == text and food_name not in found_names:
            matched.append(_build_food_item(food_name, info))
            found_names.add(food_name)
            return matched

    for alias, standard in FOOD_ALIASES.items():
        if alias == text and standard in FOOD_DB and standard not in found_names:
            matched.append(_build_food_item(standard, FOOD_DB[standard]))
            found_names.add(standard)
            return matched

    # 包含匹配
    all_foods = sorted(FOOD_DB.keys(), key=len, reverse=True)
    matched_ranges = []

    for food_name in all_foods:
        if food_name in found_names:
            continue
        idx = food_names_text.find(food_name)
        while idx != -1:
            end_idx = idx + len(food_name)
            is_overlapped = False
            for r in matched_ranges:
                if idx >= r[0] and end_idx <= r[1]:
                    is_overlapped = True
                    break
            if not is_overlapped:
                matched.append(_build_food_item(food_name, FOOD_DB[food_name]))
                found_names.add(food_name)
                matched_ranges.append([idx, end_idx])
                break
            idx = food_names_text.find(food_name, idx + 1)

    return matched


# ============ MiMo 食物营养查询（无限食物库） ============

# 食物图标映射（根据食物名匹配图标）
FOOD_ICON_MAP = {
    '饭': '🍚', '粥': '🥣', '面': '🍜', '粉': '🍜', '馒头': '🍞', '包子': '🥟',
    '饺子': '🥟', '饼': '🫓', '面包': '🍞', '糕': '🍰', '玉米': '🌽', '红薯': '🍠',
    '土豆': '🥔', '燕麦': '🥣',
    '鸡': '🍗', '鸭': '🦆', '鹅': '🦆', '猪': '🥩', '牛': '🥩', '羊': '🥩',
    '鱼': '🐟', '虾': '🦐', '蟹': '🦀', '贝': '🐚', '蚝': '🦪', ' squid': '🦑',
    '蛋': '🥚', '豆腐': '🧈', '豆': '🫘',
    '番茄': '🍅', '西红柿': '🍅', '白菜': '🥬', '菠菜': '🥬', '菜': '🥬',
    '西兰花': '🥦', '花菜': '🥦', '黄瓜': '🥒', '胡萝卜': '🥕', '萝卜': '🥕',
    '茄子': '🍆', '椒': '🫑', '葱': '🧅', '蒜': '🧄', '菇': '🍄', '菌': '🍄',
    '藕': '🥬', '笋': '🥬', '瓜': '🥒',
    '苹果': '🍎', '香蕉': '🍌', '橙': '🍊', '橘': '🍊', '柚': '🍊',
    '葡萄': '🍇', '西瓜': '🍉', '梨': '🍐', '桃': '🍑', '草莓': '🍓',
    '蓝莓': '🫐', '芒果': '🥭', '菠萝': '🍍', '猕猴桃': '🥝', '樱桃': '🍒',
    '柠檬': '🍋', '枣': '🫐', '榴莲': '🥥', '椰子': '🥥', '牛油果': '🥑',
    '牛奶': '🥛', '酸奶': '🥛', '豆浆': '🥛', '茶': '🍵', '咖啡': '☕',
    '奶茶': '🧋', '果汁': '🧃', '可乐': '🥤', '汽水': '🥤', '啤酒': '🍺',
    '酒': '🍷', '汤': '🥣',
    '沙拉': '🥗', '三明治': '🥪', '汉堡': '🍔', '披萨': '🍕', '寿司': '🍣',
    '炸鸡': '🍗', '薯条': '🍟', '薯片': '🍟', '冰淇淋': '🍦', '蛋糕': '🍰',
    '巧克力': '🍫', '饼干': '🍪', '糖果': '🍬', '蜂蜜': '🍯', '坚果': '🥜',
    '花生': '🥜', '核桃': '🥜', '瓜子': '🥜',
}


def _get_food_icon(name):
    """根据食物名称匹配图标"""
    for keyword, icon in FOOD_ICON_MAP.items():
        if keyword in name:
            return icon
    return '🍽'


def _normalize_food_name(name):
    """清理模型返回的食物名，避免解释性文字影响匹配。"""
    if not name:
        return ''
    name = str(name).strip()
    name = re.sub(r'^(还有|包括|有|是|这|那|一个|一碗|一盘|一杯|一份|约|大概|可能是)', '', name)
    name = re.sub(r'[（(].*?[）)]', '', name)
    name = re.sub(r'\s+', '', name)
    name = name.strip('，,。；;：:')
    if name in ('无', '没有', '未识别到食物'):
        return ''
    return name[:15]


def _food_key(name):
    """用于去重和宽松匹配的简化 key。"""
    name = _normalize_food_name(name)
    for token in ('新鲜', '熟', '生', '绿色', '红色', '白色', '黑色'):
        name = name.replace(token, '')
    aliases = {
        '圣女果': '番茄',
        '西红柿': '番茄',
        '小番茄': '番茄',
        '番茄酱汁': '番茄酱',
        '意大利面': '意面',
        '罗勒': '罗勒叶',
        '绿橄榄': '橄榄',
        '黑橄榄': '橄榄',
    }
    return aliases.get(name, name)


def _dedupe_food_names(names, limit=8):
    """保留顺序去重，避免番茄/圣女果/番茄酱汁这类重复项挤占名额。"""
    deduped = []
    seen = set()
    for raw in names:
        name = _normalize_food_name(raw)
        if not name:
            continue
        key = _food_key(name)
        if key in seen:
            continue
        seen.add(key)
        deduped.append(name)
        if len(deduped) >= limit:
            break
    return deduped


def _find_mimo_nutrition(mimo_nutrition, name):
    """MiMo 营养查询返回名可能略有差异，做一次宽松匹配。"""
    if not mimo_nutrition:
        return None
    if name in mimo_nutrition:
        return mimo_nutrition[name]
    target_key = _food_key(name)
    for item_name, item in mimo_nutrition.items():
        item_key = _food_key(item_name)
        if item_key == target_key or item_key in target_key or target_key in item_key:
            return item
    return None


def _build_estimated_food(name, weight=150, source='mimo'):
    """最后兜底：识别到了名字就必须给前端一个可编辑食物项。"""
    return {
        'name': name,
        'icon': _get_food_icon(name),
        'category': 'AI识别',
        'weight': weight,
        'cal': round(150 * weight / 100),
        'protein': round(5 * weight / 100, 1),
        'fat': round(3 * weight / 100, 1),
        'carb': round(20 * weight / 100, 1),
        'fiber': round(2 * weight / 100, 1),
        'ca': 0, 'fe': 0, 'zn': 0, 'va': 0, 'vc': 0,
        'multiplier': 1.0,
        'source': source
    }


def get_food_nutrition_from_mimo(food_names):
    """
    用 MiMo 查询食物营养信息（无限食物库）。
    当本地数据库没有某种食物时，调用此函数获取真实营养数据。

    一次批量查询多个食物，减少 API 调用次数。

    Args:
        food_names: 食物名称列表，如 ['螺蛳粉', '酸辣粉']

    Returns:
        dict: {食物名: {营养数据}} 
    """
    if not food_names:
        return {}

    names_str = '、'.join(food_names)
    prompt = (
        f"请返回以下食物的营养成分（每100克可食用部分）。\n"
        f"食物列表：{names_str}\n\n"
        f"返回JSON数组格式，每个食物包含：\n"
        f'- name: 食物名称\n'
        f'- cal: 热量(千卡)\n'
        f'- protein: 蛋白质(克)\n'
        f'- fat: 脂肪(克)\n'
        f'- carb: 碳水化合物(克)\n'
        f'- fiber: 膳食纤维(克)\n'
        f'- ca: 钙(毫克)\n'
        f'- fe: 铁(毫克)\n'
        f'- zn: 锌(毫克)\n'
        f'- va: 维生素A(微克RE)\n'
        f'- vc: 维生素C(毫克)\n'
        f'- category: 分类(主食/肉蛋/蔬菜/水果/饮品/家常菜/外卖/零食/其他)\n'
        f'- unit: 常见单位(碗/个/份/杯/根/块/盘)\n'
        f'- unit_weight: 一份的常见克数\n\n'
        f'只返回JSON数组，不要加其他文字。例如：\n'
        f'[{{"name":"螺蛳粉","cal":350,"protein":12,"fat":15,"carb":45,"fiber":3,"ca":40,"fe":3,"zn":1.5,"va":10,"vc":5,"category":"外卖","unit":"碗","unit_weight":400}}]\n'
    )

    result = mimo_chat(
        [{'role': 'user', 'content': prompt}],
        max_tokens=2048,
        temperature=0.1
    )

    if not result.get('success'):
        print(f"[MiMo] 食物营养查询失败: {result.get('error')}", flush=True)
        return {}

    ai_text = result['text'].strip()
    # 去掉 markdown 代码块标记
    ai_text = re.sub(r'^```json\s*', '', ai_text)
    ai_text = re.sub(r'\s*```$', '', ai_text)
    ai_text = ai_text.strip()

    print(f"[MiMo] 食物营养查询返回: {ai_text[:200]}", flush=True)

    try:
        food_list = json.loads(ai_text)
        if not isinstance(food_list, list):
            food_list = [food_list]

        result_map = {}
        for item in food_list:
            name = item.get('name', '').strip()
            if not name:
                continue

            weight = item.get('unit_weight', 200)
            if not weight or weight <= 0:
                weight = 200

            # 按 unit_weight 换算总营养（数据库格式是每份的总营养）
            w = weight / 100  # 换算系数
            result_map[name] = {
                'name': name,
                'icon': _get_food_icon(name),
                'category': item.get('category', 'AI识别'),
                'weight': weight,
                'cal': round(item.get('cal', 200) * w),
                'protein': round(item.get('protein', 5) * w, 1),
                'fat': round(item.get('fat', 3) * w, 1),
                'carb': round(item.get('carb', 30) * w, 1),
                'fiber': round(item.get('fiber', 2) * w, 1),
                'ca': round(item.get('ca', 0) * w, 1),
                'fe': round(item.get('fe', 0) * w, 1),
                'zn': round(item.get('zn', 0) * w, 1),
                'va': round(item.get('va', 0) * w, 1),
                'vc': round(item.get('vc', 0) * w, 1),
                'multiplier': 1.0,
                'source': 'mimo_nutrition'
            }

        return result_map

    except json.JSONDecodeError as e:
        print(f"[MiMo] 食物营养JSON解析失败: {e}", flush=True)
        print(f"[MiMo] 原始返回: {ai_text[:300]}", flush=True)
        return {}


# ============ 食物识别（MiMo 多模态） ============

def recognize_by_mimo(image_base64):
    """
    用 MiMo-V2.5 识别图片中的食物。
    同步调用，1-3秒返回结果。

    流程：
      1. 发送图片 + 提示词给 MiMo
      2. MiMo 返回食物名称列表
      3. 逐个匹配本地食物数据库
      4. 本地没有的，批量调用 MiMo 查询营养
      5. 仍查不到的，用基础估算
      6. 最多返回 8 个 foods
    """
    # 不再提前剥离 data:image 前缀，让 mimo_chat_with_image 统一处理

    prompt = (
        "请识别图片中所有可见的食物、食材、调料和饮品。"
        "包括配菜、谷物、豆类、酱料、香草、坚果、种子、主食、乳制品等。"
        "不要只返回最大或最明显的食物，要尽量列出所有可见食材。"
        "只返回中文名称，用逗号分隔，不要加其他描述。"
        "例如：罗勒叶,鹰嘴豆,黑芝麻,橄榄,番茄,番茄酱,意面,酸奶。"
        "如果不确定，也返回最可能的通用食材名，例如'谷物粉''酸奶/奶油''番茄酱'。"
        "如果图片中没有食物，返回：无。"
        "最多返回8种食物。"
    )

    result = mimo_chat_with_image(image_base64, prompt, max_tokens=4096, temperature=0.1)

    if not result.get('success'):
        return result

    ai_text = result['text']
    print(f"[MiMo] raw_text={ai_text}", flush=True)

    if '无' in ai_text or not ai_text.strip():
        return {'success': False, 'error': '图片中未识别到食物'}

    # 清理 AI 返回的文本，提取食物名称
    parts = re.split(r'[,，、\n]+', ai_text)
    food_names = _dedupe_food_names(parts, limit=8)

    if not food_names:
        return {'success': False, 'error': '无法解析识别结果：' + ai_text[:50]}

    print(f"[MiMo] food_names={food_names}", flush=True)

    # 逐个匹配数据库：本地匹配的用本地，未匹配的收集起来
    matched_foods = []
    matched_keys = set()
    unmatched_names = []

    for name in food_names[:8]:
        local_match = match_food_from_text(name)
        if local_match:
            for food in local_match:
                key = _food_key(food.get('name', name))
                if key in matched_keys:
                    continue
                matched_foods.append(food)
                matched_keys.add(key)
            print(f"[MiMo] 本地匹配: '{name}' → {[f['name'] for f in local_match]}", flush=True)
        else:
            unmatched_names.append(name)
            print(f"[MiMo] 未匹配: '{name}'", flush=True)

    print(f"[MiMo] 本地匹配总数={len(matched_foods)}, 未匹配={unmatched_names}", flush=True)

    # 对未匹配的食物，批量调用 MiMo 查询营养
    if unmatched_names:
        print(f"[MiMo] 批量查询AI营养: {unmatched_names}", flush=True)
        try:
            mimo_nutrition = get_food_nutrition_from_mimo(unmatched_names)
            print(f"[MiMo] MiMo营养返回keys={list(mimo_nutrition.keys())}", flush=True)
        except Exception as e:
            print(f"[MiMo] MiMo营养查询异常: {e}", flush=True)
            mimo_nutrition = {}

        for name in unmatched_names:
            key = _food_key(name)
            if key in matched_keys:
                continue
            nutrition_item = _find_mimo_nutrition(mimo_nutrition, name)
            if nutrition_item:
                matched_foods.append(nutrition_item)
                matched_keys.add(key)
                print(f"[MiMo] MiMo营养成功: '{name}'", flush=True)
            else:
                # MiMo 也查不到，用基础估算兜底（必须加入 foods，不能丢弃）
                matched_foods.append(_build_estimated_food(name, weight=150, source='mimo_estimated'))
                matched_keys.add(key)
                print(f"[MiMo] 基础估算: '{name}'", flush=True)

    # 最多返回 8 个
    matched_foods = matched_foods[:8]

    print(f"[MiMo] 最终返回foods={len(matched_foods)}个: {[f['name'] for f in matched_foods]}", flush=True)

    if matched_foods:
        return {
            'success': True,
            'foods': matched_foods,
            'source': 'mimo',
            'raw_text': ai_text
        }
    else:
        return {'success': False, 'error': '未能匹配任何食物'}


# ============ 营养成分表扫描（MiMo 多模态） ============

LABEL_NUTRIENT_ALIASES = {
    '能量': ('cal', 'kcal'),
    '热量': ('cal', 'kcal'),
    '蛋白质': ('protein', 'g'),
    '脂肪': ('fat', 'g'),
    '总脂肪': ('fat', 'g'),
    '碳水化合物': ('carb', 'g'),
    '膳食纤维': ('fiber', 'g'),
    '钠': ('na', 'mg'),
    '钙': ('ca', 'mg'),
    '铁': ('fe', 'mg'),
    '锌': ('zn', 'mg'),
    '硒': ('se', 'μg'),
    '钾': ('k', 'mg'),
    '镁': ('mg', 'mg'),
    '磷': ('p', 'mg'),
    '铜': ('cu', 'mg'),
    '锰': ('mn', 'mg'),
    '碘': ('i', 'μg'),
    '维生素a': ('va', 'μg'),
    '维生素A': ('va', 'μg'),
    '维生素c': ('vc', 'mg'),
    '维生素C': ('vc', 'mg'),
    '维生素d': ('vd', 'μg'),
    '维生素D': ('vd', 'μg'),
    '维生素e': ('ve', 'mg'),
    '维生素E': ('ve', 'mg'),
    # 维生素K / K1 / K₁ — 全部兼容
    '维生素k': ('vk', 'μg'),
    '维生素K': ('vk', 'μg'),
    '维生素k1': ('vk', 'μg'),
    '维生素K1': ('vk', 'μg'),
    '维生素k₂': ('vk', 'μg'),
    # 维生素B1 / B₁ / VB1 / 硫胺素 — 全部兼容
    '维生素b1': ('vb1', 'mg'),
    '维生素B1': ('vb1', 'mg'),
    'vb1': ('vb1', 'mg'),
    'VB1': ('vb1', 'mg'),
    '硫胺素': ('vb1', 'mg'),
    # 维生素B2 / B₂ / VB2 / 核黄素
    '维生素b2': ('vb2', 'mg'),
    '维生素B2': ('vb2', 'mg'),
    'vb2': ('vb2', 'mg'),
    'VB2': ('vb2', 'mg'),
    '核黄素': ('vb2', 'mg'),
    # 维生素B6 / B₆ / VB6
    '维生素b6': ('vb6', 'mg'),
    '维生素B6': ('vb6', 'mg'),
    'vb6': ('vb6', 'mg'),
    'VB6': ('vb6', 'mg'),
    # 维生素B12 / B₁₂ / VB12
    '维生素b12': ('vb12', 'μg'),
    '维生素B12': ('vb12', 'μg'),
    'vb12': ('vb12', 'μg'),
    'VB12': ('vb12', 'μg'),
    '烟酸': ('niacin', 'mg'),
    '叶酸': ('folate', 'μg'),
    '泛酸': ('pantothenic', 'mg'),
}

def _extract_json_object(text):
    """Extract the first JSON object from a model response."""
    if not text:
        return None
    cleaned = text.strip()
    if cleaned.startswith('```'):
        cleaned = re.sub(r'^```(?:json)?\s*', '', cleaned)
        cleaned = re.sub(r'\s*```$', '', cleaned)
    try:
        return json.loads(cleaned)
    except Exception:
        pass
    start = cleaned.find('{')
    end = cleaned.rfind('}')
    if start >= 0 and end > start:
        try:
            return json.loads(cleaned[start:end + 1])
        except Exception:
            return None
    return None

_SUBSCRIPT_MAP = str.maketrans('₀₁₂₃₄₅₆₇₈₉', '0123456789')

def _normalize_label_name(name):
    """Normalize nutrient name: remove spaces/punctuation, convert subscripts to regular digits."""
    s = str(name or '').strip()
    # Convert Unicode subscripts (₁₂₆ etc.) to regular digits
    s = s.translate(_SUBSCRIPT_MAP)
    # Remove spaces, brackets, colons, commas, percent signs
    s = re.sub(r'[\s（）()\[\]：:、,，%]', '', s)
    return s.strip()

def _label_number(value):
    if isinstance(value, (int, float)):
        return float(value)
    text = str(value or '')
    match = re.search(r'-?\d+(?:\.\d+)?', text)
    return float(match.group(0)) if match else None

def _merge_label_nutrient(label, item):
    name = str(item.get('name') or '').strip()
    value = _label_number(item.get('value'))
    if not name or value is None:
        return
    unit = str(item.get('unit') or '').strip()
    norm = _normalize_label_name(name)
    alias = None
    for key, mapped in LABEL_NUTRIENT_ALIASES.items():
        if _normalize_label_name(key).lower() == norm.lower():
            alias = mapped
            break
    if alias:
        field, default_unit = alias
        if field == 'cal' and ('kJ' in unit or '千焦' in unit or unit.lower() == 'kj'):
            value = round(value / 4.184, 1)
        label[field] = value
        return
    custom = label.setdefault('customNutrients', [])
    custom.append({'name': name, 'value': value, 'unit': unit or 'mg'})

def _build_label_from_mimo_json(data, raw_text):
    label = {
        'name': str(data.get('name') or data.get('product_name') or '').strip(),
        'weight': data.get('weight') or 100,
        'unit': data.get('unit') or '份',
        'raw_text': raw_text,
        'raw_text_llm': raw_text,
    }
    nutrients = data.get('nutrients') or data.get('items') or []
    if isinstance(nutrients, dict):
        nutrients = [{'name': k, 'value': v} for k, v in nutrients.items()]
    for item in nutrients:
        if isinstance(item, dict):
            _merge_label_nutrient(label, item)
    return label

def scan_label_by_mimo(image_base64):
    """
    用 MiMo-V2.5 读取营养成分表图片。
    一个模型同时完成 OCR + 结构化提取。

    返回：
      成功: {'success': True, 'label': {'name': '...', 'raw_text': '...', 'raw_text_llm': '...'}, 'source': 'mimo'}
      失败: {'success': False, 'error': '...', 'source': 'mimo', 'raw_preview': '...'}
    """
    # 不再提前剥离 data:image 前缀，让 mimo_chat_with_image 统一处理
    # 如果前端传来的是 data:image/jpeg;base64,...，直接传下去
    # 如果是纯 base64，mimo_chat_with_image 会补前缀

    prompt = (
        "你是一名食品营养标签 OCR 和结构化提取助手。请读取图片中的营养成分表。\n"
        "只提取图片中真实出现的内容，不要猜测。如果不是营养成分表，返回 {\"success\":false,\"error\":\"未识别到营养成分表\"}。\n"
        "必须把营养成分表左右两栏、每一行都提取出来，微量元素、脂肪酸、胆碱、牛磺酸、核苷酸等也不能省略。\n"
        "如果同一行有“每100g”和“每100kJ”两列，优先使用“每100g”的数值。\n"
        "只返回 JSON，不要 Markdown，不要解释。格式如下：\n"
        "{\"success\":true,\"name\":\"产品名或空\",\"weight\":100,\"unit\":\"份\",\"nutrients\":["
        "{\"name\":\"能量\",\"value\":1801,\"unit\":\"kJ\",\"per\":\"每100g\"},"
        "{\"name\":\"蛋白质\",\"value\":15.9,\"unit\":\"g\",\"per\":\"每100g\"}"
        "],\"raw_text\":\"把识别到的营养成分表原文合并放这里\"}"
    )

    result = mimo_chat_with_image(image_base64, prompt, max_tokens=6144, temperature=0)

    if not result.get('success'):
        error_msg = result.get('error', 'MiMo 调用失败')
        print(f"[MiMo] 营养成分表识别失败: {error_msg}", flush=True)
        return {
            'success': False,
            'error': error_msg,
            'source': 'mimo',
            'raw_preview': error_msg[:200]
        }

    raw_text = result['text']
    print(f"[MiMo] 营养成分表识别返回(前500字): {raw_text[:500]}", flush=True)

    parsed_json = _extract_json_object(raw_text)
    if isinstance(parsed_json, dict):
        if parsed_json.get('success') is False:
            return {
                'success': False,
                'error': parsed_json.get('error') or '图片中未识别到营养成分表',
                'source': 'mimo',
                'raw_preview': raw_text[:200]
            }
        label = _build_label_from_mimo_json(parsed_json, raw_text)
        return {'success': True, 'label': label, 'source': 'mimo'}

    # 检查是否识别到营养成分表
    if '未识别到营养成分表' in raw_text:
        return {
            'success': False,
            'error': '图片中未识别到营养成分表',
            'source': 'mimo',
            'raw_preview': raw_text[:200]
        }

    # 提取产品名称
    name_match = re.search(r'(?:产品名[称]|名称|品名)[：:]\s*([^\n,，。]+)', raw_text)
    product_name = name_match.group(1).strip() if name_match else ''

    # 兜底：只要 MiMo 返回了文字，就交给前端文本解析。
    return {
        'success': True,
        'label': {
            'name': product_name,
            'raw_text': raw_text,
            'raw_text_llm': raw_text
        },
        'source': 'mimo'
    }


# ============ AI 营养建议（新增能力） ============

def generate_ai_advice(today_nutrition, profile, recommendation):
    """
    用 MiMo 生成个性化营养建议。
    根据用户完整健康情况（含自定义疾病）生成贴合建议。
    """
    gender_label = '男性' if profile.get('gender') == 'male' else '女性'
    age = profile.get('age', '未设置')
    height = profile.get('height', '未设置')
    weight = profile.get('weight', '未设置')
    condition = profile.get('conditionLabel', '一般健康')
    custom_condition = profile.get('customCondition', '')

    # 构建健康情况描述
    health_desc = condition
    if custom_condition:
        health_desc = f"{condition} + 自定义：{custom_condition}"

    # 构建营养摄入描述
    nutrition_lines = []
    nutrient_map = [
        ('cal', '热量', '千卡'), ('protein', '蛋白质', 'g'), ('fat', '脂肪', 'g'),
        ('carb', '碳水', 'g'), ('fiber', '膳食纤维', 'g'), ('na', '钠', 'mg'),
        ('ca', '钙', 'mg'), ('fe', '铁', 'mg'), ('zn', '锌', 'mg'),
        ('va', '维生素A', 'μg'), ('vc', '维生素C', 'mg')
    ]
    for key, label, unit in nutrient_map:
        val = today_nutrition.get(key, 0)
        if val:
            nutrition_lines.append(f"  {label}：{val}{unit}")

    nutrition_text = '\n'.join(nutrition_lines) if nutrition_lines else '  暂无数据'

    # 构建目标描述
    target_lines = []
    for key, label, unit in nutrient_map:
        val = recommendation.get(key, 0)
        if val:
            target_lines.append(f"  {label}：{val}{unit}")
    target_text = '\n'.join(target_lines) if target_lines else f"  热量：{recommendation.get('cal', 0)}千卡"

    prompt = (
        f"你是一位营养师助手，请根据以下用户的今日饮食数据给出简短建议。\n\n"
        f"用户信息：{age}岁，{gender_label}，身高{height}cm，体重{weight}kg\n"
        f"健康情况：{health_desc}\n"
        f"今日营养目标：\n{target_text}\n"
        f"今日已摄入：\n{nutrition_text}\n\n"
        f"请根据以上信息给出2-4条具体的饮食建议。\n"
        f"要求：\n"
        f"- 适合老人和家庭照护者阅读，语言通俗易懂\n"
        f"- 每条建议具体、可执行，不超过50字\n"
        f"- 用数字编号，每条一行\n\n"
        f"特殊情况处理：\n"
        f"- 如果用户有胃病/消化差，建议少量多餐、温和饮食、避免辛辣刺激\n"
        f"- 如果用户控糖/糖尿病，提醒主食分量、优先高纤维、避免含糖饮料\n"
        f"- 如果用户术后恢复，关注蛋白质和能量补充\n"
        f"- 如果用户有高血压，提醒少盐、低钠饮食\n"
        f"- 如果用户有肾病，提醒控制蛋白质和钠的摄入\n"
        f"- 如果用户有痛风，提醒避免高嘌呤食物\n"
        f"- 如果用户有自定义疾病，谨慎参考并提醒遵医嘱\n\n"
        f"重要安全提示：你不是医生，不能诊断疾病。建议只能作为饮食记录参考。"
        f"如涉及疾病治疗、用药、肾病、糖尿病、孕期等情况，请提醒用户遵医嘱。"
    )

    result = mimo_chat(
        [{'role': 'user', 'content': prompt}],
        max_tokens=1024,
        temperature=0.7
    )

    if result.get('success'):
        return {'success': True, 'advice': result['text']}
    return result


# ============ AI 趋势分析（新增能力） ============

def generate_ai_trend_analysis(daily_data, avg, recommendation, profile):
    """
    用 MiMo 分析多日饮食趋势。
    这是百度API做不到的，MiMo 的新增能力。
    """
    gender_label = '男性' if profile.get('gender') == 'male' else '女性'

    # 简化数据给 AI
    days_summary = []
    for d in daily_data[-7:]:  # 最多取最近7天
        t = d.get('totals', {})
        days_summary.append(
            f"{d.get('dateStr', '')}: 热量{t.get('cal', 0)}千卡, "
            f"蛋白质{t.get('protein', 0)}g, 脂肪{t.get('fat', 0)}g"
        )

    prompt = (
        f"你是一位营养师助手，请分析以下用户近{len(days_summary)}天的饮食趋势。\n\n"
        f"用户：{profile.get('age', '未设置')}岁，{gender_label}\n"
        f"营养目标：热量{recommendation.get('cal', 0)}千卡/天，蛋白质{recommendation.get('protein', 0)}g/天\n"
        f"日均摄入：热量{avg.get('cal', 0)}千卡，蛋白质{avg.get('protein', 0)}g\n\n"
        f"每日数据：\n" + '\n'.join(days_summary) + '\n\n'
        f"请从以下3个方面分析（每个方面2-3句话，通俗易懂，适合老人阅读）：\n"
        f"1. 整体趋势（热量和蛋白质是否达标，有没有波动）\n"
        f"2. 需要注意的问题（如果有）\n"
        f"3. 下一步建议\n"
        f"不要用专业术语，不要超过200字。"
    )

    result = mimo_chat(
        [{'role': 'user', 'content': prompt}],
        max_tokens=1024,
        temperature=0.7
    )

    if result.get('success'):
        return {'success': True, 'analysis': result['text']}
    return result


# ============ 路由 ============

@app.route('/')
def index():
    return send_from_directory(BASE_DIR, 'index.html')


@app.route('/assets/<path:path>')
def serve_assets(path):
    return send_from_directory(os.path.join(BASE_DIR, 'assets'), path)


@app.route('/_shared/<path:path>')
def serve_shared(path):
    return send_from_directory(os.path.join(BASE_DIR, '_shared'), path)


@app.route('/manifest.json')
def serve_manifest():
    return send_from_directory(BASE_DIR, 'manifest.json')


@app.route('/sw.js')
def serve_sw():
    return send_from_directory(BASE_DIR, 'sw.js')


# ====== 食物识别 ======

@app.route('/api/recognize', methods=['POST'])
def recognize_food():
    """
    接收图片，用 MiMo-V2.5 识别食物。
    保持 task_id 轮询机制以兼容前端，但结果会很快返回（1-3秒）。
    """
    try:
        # 限流检查
        limited = _rate_limit_check()
        if limited:
            return limited

        data = request.get_json()
        if not data or 'image' not in data:
            return jsonify({'error': '没有收到图片数据'}), 400

        image_b64 = data['image']
        # 不再提前剥离 data:image 前缀，让 recognize_by_mimo → mimo_chat_with_image 统一处理

        # 图片大小检查
        size_check = _check_image_size(image_b64)
        if size_check:
            return size_check

        # 未配置 MiMo 时直接返回友好提示，不写临时文件
        if not MIMO_READY:
            return jsonify({
                'success': False,
                'error': 'MiMo API 未配置，请设置环境变量 MIMO_API_KEY'
            })

        task_id = str(uuid.uuid4())[:8]
        result_path = os.path.join(RESULTS_DIR, f'{task_id}.json')

        if os.path.exists(result_path):
            os.remove(result_path)

        # 启动后台线程用 MiMo 识别（同步API，但放在线程中避免阻塞）
        t = threading.Thread(target=_bg_recognize_food, args=(task_id, image_b64, result_path), daemon=True)
        t.start()
        print(f"[MiMo] 食物识别后台线程已启动: {task_id}", flush=True)

        return jsonify({
            'success': True,
            'task_id': task_id,
            'source': 'mimo',
            'message': 'MiMo AI 正在识别中...'
        })

    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


def _bg_recognize_food(task_id, image_b64, result_path):
    """后台线程：用 MiMo 识别食物"""
    try:
        # 立即写入 pending 状态，让前端轮询时知道正在处理（不再返回 404）
        pending_data = {
            'status': 'pending',
            'message': 'MiMo AI 正在识别中...',
            'timestamp': time.time()
        }
        with open(result_path, 'w', encoding='utf-8') as f:
            json.dump(pending_data, f, ensure_ascii=False)

        start_time = time.time()
        mimo_result = recognize_by_mimo(image_b64)
        elapsed = time.time() - start_time
        print(f"[MiMo] 食物识别耗时: {elapsed:.1f}秒", flush=True)

        if mimo_result.get('success'):
            result_data = {
                'success': True,
                'status': 'done',
                'source': 'mimo',
                'foods': mimo_result['foods'],
                'raw_text': mimo_result.get('raw_text', ''),
                'timestamp': time.time()
            }
            with open(result_path, 'w', encoding='utf-8') as f:
                json.dump(result_data, f, ensure_ascii=False, indent=2)
            print(f"[MiMo] 食物识别成功: {[f['name'] for f in mimo_result['foods']]}", flush=True)
        else:
            error_msg = mimo_result.get('error', '识别失败')
            print(f"[MiMo] 食物识别失败: {error_msg}", flush=True)
            result_data = {
                'success': False,
                'status': 'error',
                'error': error_msg,
                'source': 'mimo',
                'timestamp': time.time()
            }
            with open(result_path, 'w', encoding='utf-8') as f:
                json.dump(result_data, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"[MiMo] 食物识别异常: {e}", flush=True)
        traceback.print_exc()
        result_data = {
            'success': False,
            'status': 'error',
            'error': str(e),
            'source': 'mimo',
            'timestamp': time.time()
        }
        with open(result_path, 'w', encoding='utf-8') as f:
            json.dump(result_data, f, ensure_ascii=False, indent=2)


@app.route('/api/mimo_status')
def mimo_status():
    """检查 MiMo API 是否已配置（不发起真实调用）"""
    return jsonify({
        'configured': MIMO_READY,
        'model': MIMO_MODEL,
        'message': f'MiMo {MIMO_MODEL} 已配置，可直接识别' if MIMO_READY else 'MiMo API 未配置，请设置环境变量 MIMO_API_KEY'
    })


@app.route('/api/mimo_health')
def mimo_health():
    """
    MiMo API 健康检查：真实调用一次 MiMo 文本模型，验证端到端可用性。
    用极短 prompt "回复OK"，不泄露密钥。
    """
    # 限流检查
    limited = _rate_limit_check()
    if limited:
        return limited

    result = {
        'configured': MIMO_READY,
        'ok': False,
        'model': MIMO_MODEL,
        'error': None,
        'raw_preview': None
    }

    if not MIMO_READY:
        result['error'] = '未配置 MIMO_API_KEY'
        result['raw_preview'] = '环境变量 MIMO_API_KEY 未设置，请在启动前设置'
        return jsonify(result)

    # 真实调用一次 MiMo（极短 prompt）
    start = time.time()
    test_result = mimo_chat(
        [{'role': 'user', 'content': '回复OK'}],
        max_tokens=512,
        temperature=0.0
    )
    elapsed = round(time.time() - start, 2)

    if test_result.get('success'):
        result['ok'] = True
        result['raw_preview'] = test_result['text'][:100]
        result['latency'] = f'{elapsed}秒'
        print(f"[MiMo Health] 检查成功，耗时 {elapsed}秒，返回: {test_result['text'][:50]}", flush=True)
    else:
        result['error'] = test_result.get('error', '未知错误')
        result['raw_preview'] = test_result.get('error', '')[:200]
        print(f"[MiMo Health] 检查失败: {result['error']}", flush=True)

    return jsonify(result)


# 兼容旧的前端调用
@app.route('/api/baidu_status')
def baidu_status_compat():
    """兼容前端 /api/baidu_status 调用，返回 MiMo 状态"""
    return mimo_status()


@app.route('/api/result/<task_id>')
def get_result(task_id):
    """获取识别结果，前端轮询此接口"""
    result_path = os.path.join(RESULTS_DIR, f'{task_id}.json')

    if os.path.exists(result_path):
        with open(result_path, 'r', encoding='utf-8') as f:
            result = json.load(f)
        return jsonify(result)

    img_path = os.path.join(PENDING_DIR, f'{task_id}.jpg')
    if os.path.exists(img_path):
        return jsonify({
            'status': 'pending',
            'message': 'AI 正在识别中...'
        })

    return jsonify({'error': '任务不存在'}), 404


@app.route('/api/tasks')
def list_pending_tasks():
    """列出所有待处理的任务（调试用）"""
    pending = []
    for fname in os.listdir(PENDING_DIR):
        task_id = fname.replace('.jpg', '')
        result_path = os.path.join(RESULTS_DIR, f'{task_id}.json')
        if not os.path.exists(result_path):
            pending.append(task_id)
    return jsonify({'pending_tasks': pending})


# ====== 营养成分表扫描 ======

@app.route('/api/scan_label', methods=['POST'])
def scan_label():
    """
    用 MiMo-V2.5 识别营养成分表。
    同步返回结果，无需轮询。
    """
    try:
        # 限流检查
        limited = _rate_limit_check()
        if limited:
            return limited

        data = request.get_json()
        if not data or 'image' not in data:
            return jsonify({'error': '没有收到图片数据'}), 400

        image_b64 = data['image']

        # 图片大小检查
        size_check = _check_image_size(image_b64)
        if size_check:
            return size_check

        if not MIMO_READY:
            return jsonify({'success': False, 'error': 'MiMo API 未配置，请设置环境变量 MIMO_API_KEY'})

        # 诊断日志
        has_data_prefix = image_b64.startswith('data:image')
        img_size_kb = round(len(image_b64) * 0.75 / 1024)
        print(f"[MiMo] /api/scan_label 收到图片: 大小={img_size_kb}KB, 含data前缀={has_data_prefix}", flush=True)

        print("[MiMo] 开始识别营养成分表...", flush=True)
        start_time = time.time()

        result = scan_label_by_mimo(image_b64)

        elapsed = time.time() - start_time
        print(f"[MiMo] 营养成分表识别耗时: {elapsed:.1f}秒", flush=True)

        if result.get('success'):
            print(f"[MiMo] 营养成分表识别成功: 产品名={result.get('label', {}).get('name', '')}, raw_text长度={len(result.get('label', {}).get('raw_text', ''))}", flush=True)
            return jsonify(result)
        else:
            error_msg = result.get('error', '识别失败')
            raw_preview = result.get('raw_preview', error_msg[:100])
            print(f"[MiMo] 营养成分表识别失败: {error_msg}, raw_preview={raw_preview[:100]}", flush=True)
            return jsonify({
                'success': False,
                'error': error_msg,
                'source': 'mimo',
                'raw_preview': raw_preview[:200]
            })

    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


# 兼容旧的前端轮询调用
@app.route('/api/scan_label_result', methods=['GET'])
def scan_label_result_compat():
    """兼容前端轮询调用（MiMo 是同步的，不需要轮询）"""
    return jsonify({'status': 'error', 'error': 'MiMo 为同步调用，请直接使用 /api/scan_label'})


# ====== AI 营养建议（新增接口） ======

@app.route('/api/ai_advice', methods=['POST'])
def ai_advice():
    """
    用 MiMo 生成今日营养建议。
    这是 MiMo 的新增能力，百度API无法实现。
    """
    try:
        # 限流检查
        limited = _rate_limit_check()
        if limited:
            return limited

        data = request.get_json()
        if not data:
            return jsonify({'error': '没有收到数据'}), 400

        today_nutrition = data.get('todayNutrition', {})
        profile = data.get('profile', {})
        recommendation = data.get('recommendation', {})

        result = generate_ai_advice(today_nutrition, profile, recommendation)

        if result.get('success'):
            return jsonify({'success': True, 'advice': result['advice']})
        else:
            return jsonify({'success': False, 'error': result.get('error', '建议生成失败')})

    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


# ====== AI 趋势分析（新增接口） ======

@app.route('/api/ai_trend', methods=['POST'])
def ai_trend():
    """
    用 MiMo 分析多日饮食趋势。
    这是 MiMo 的新增能力，百度API无法实现。
    """
    try:
        # 限流检查
        limited = _rate_limit_check()
        if limited:
            return limited

        data = request.get_json()
        if not data:
            return jsonify({'error': '没有收到数据'}), 400

        daily_data = data.get('dailyData', [])
        avg = data.get('avg', {})
        recommendation = data.get('recommendation', {})
        profile = data.get('profile', {})

        result = generate_ai_trend_analysis(daily_data, avg, recommendation, profile)

        if result.get('success'):
            return jsonify({'success': True, 'analysis': result['analysis']})
        else:
            return jsonify({'success': False, 'error': result.get('error', '趋势分析失败')})

    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


# ====== 语音/文字解析（MiMo AI） ======

def parse_voice_by_mimo(text):
    """
    用 MiMo-V2.5 解析语音/文字输入，提取食物名称和份量。
    比前端本地关键词匹配更智能，能理解口语化表达。

    例如："我早上吃了一碗米饭和两个鸡蛋" → [{"name":"白米饭","weight":200}, {"name":"鸡蛋","weight":100}]
    """
    prompt = (
        "请分析这句话中提到的所有食物和饮品，以及对应的份量。\n"
        "只返回JSON数组格式，每个食物包含name（食物名称）和weight（估算克数）。\n"
        "例如：[{\"name\":\"白米饭\",\"weight\":200},{\"name\":\"鸡蛋\",\"weight\":100}]\n"
        "注意：\n"
        "1. 食物名称用常见中文名（如\"白米饭\"而不是\"饭\"）\n"
        "2. 份量根据描述估算克数（一碗米饭约200g，一个鸡蛋约50g，一盘菜约200g）\n"
        "3. 最多返回8个食物\n"
        "4. 只返回JSON数组，不要加其他文字\n\n"
        f"输入：{text}"
    )

    result = mimo_chat(
        [{'role': 'user', 'content': prompt}],
        max_tokens=4096,
        temperature=0.1
    )

    if not result.get('success'):
        return result

    ai_text = result['text'].strip()
    print(f"[MiMo] 语音解析返回: {ai_text[:200]}", flush=True)

    # 提取 JSON 数组
    try:
        # 去掉可能的 markdown 代码块标记；如果模型多说了话，只截取 JSON 数组。
        ai_text = re.sub(r'^```json\s*', '', ai_text)
        ai_text = re.sub(r'\s*```$', '', ai_text)
        ai_text = ai_text.strip()
        if '[' in ai_text and ']' in ai_text:
            ai_text = ai_text[ai_text.find('['):ai_text.rfind(']') + 1]

        food_list = json.loads(ai_text)
        if not isinstance(food_list, list):
            food_list = [food_list]

        # 匹配数据库
        matched_foods = []
        matched_keys = set()
        unmatched_names = []
        weight_map = {}
        for item in food_list[:8]:
            name = _normalize_food_name(item.get('name', ''))
            weight = item.get('weight', 200)

            if not name or name == '无':
                continue
            if _food_key(name) in matched_keys:
                continue
            weight_map[name] = weight

            # 尝试匹配数据库
            db_match = match_food_from_text(name)
            if db_match:
                food = db_match[0].copy()
                # 用 AI 估算的重量覆盖
                if weight and weight > 0:
                    ratio = weight / food['weight']
                    food['weight'] = weight
                    food['cal'] = round(food['cal'] * ratio)
                    food['protein'] = round(food['protein'] * ratio, 1)
                    food['fat'] = round(food['fat'] * ratio, 1)
                    food['carb'] = round(food['carb'] * ratio, 1)
                    food['fiber'] = round(food['fiber'] * ratio, 1)
                    food['multiplier'] = round(ratio, 2)
                matched_foods.append(food)
                matched_keys.add(_food_key(food.get('name', name)))
            else:
                # 数据库没有，用 MiMo 查询真实营养
                unmatched_names.append(name)

        # 批量查询 MiMo 获取未匹配食物的营养
        if unmatched_names:
            print(f"[MiMo] 语音解析未匹配，查询AI营养: {unmatched_names}", flush=True)
            mimo_nutrition = get_food_nutrition_from_mimo(unmatched_names)
            for name in unmatched_names:
                key = _food_key(name)
                if key in matched_keys:
                    continue
                nutrition_item = _find_mimo_nutrition(mimo_nutrition, name)
                if nutrition_item:
                    food = nutrition_item
                    # 用 AI 估算的重量调整
                    w = weight_map.get(name, 200)
                    if w and w > 0 and food['weight'] > 0:
                        ratio = w / food['weight']
                        food['weight'] = w
                        food['cal'] = round(food['cal'] * ratio)
                        food['protein'] = round(food['protein'] * ratio, 1)
                        food['fat'] = round(food['fat'] * ratio, 1)
                        food['carb'] = round(food['carb'] * ratio, 1)
                        food['fiber'] = round(food['fiber'] * ratio, 1)
                        food['multiplier'] = round(ratio, 2)
                    matched_foods.append(food)
                    matched_keys.add(key)
                else:
                    # MiMo 也查不到，用基础估算
                    matched_foods.append(_build_estimated_food(name, weight=weight, source='mimo_voice_estimated'))
                    matched_keys.add(key)

        if matched_foods:
            return {'success': True, 'foods': matched_foods[:8], 'source': 'mimo_voice'}
        else:
            return {'success': False, 'error': '未识别到食物'}

    except json.JSONDecodeError:
        # JSON 解析失败，用文本匹配兜底
        print(f"[MiMo] 语音解析JSON失败，尝试文本匹配: {ai_text[:100]}", flush=True)
        matched = match_food_from_text(ai_text)
        if matched:
            return {'success': True, 'foods': matched[:5], 'source': 'mimo_voice_fallback'}
        return {'success': False, 'error': '无法解析识别结果'}


@app.route('/api/parse_voice', methods=['POST'])
def parse_voice():
    """
    用 MiMo-V2.5 解析语音/文字输入。
    比前端本地关键词匹配更智能，能理解口语化表达。
    """
    try:
        # 限流检查
        limited = _rate_limit_check()
        if limited:
            return limited

        data = request.get_json()
        if not data or 'text' not in data:
            return jsonify({'error': '没有收到文字数据'}), 400

        text = data['text'].strip()
        if not text:
            return jsonify({'success': False, 'error': '输入为空'})

        if not MIMO_READY:
            return jsonify({'success': False, 'error': 'MiMo API 未配置'})

        print(f"[MiMo] 语音解析请求: {text[:100]}", flush=True)
        start_time = time.time()

        result = parse_voice_by_mimo(text)

        elapsed = time.time() - start_time
        print(f"[MiMo] 语音解析耗时: {elapsed:.1f}秒", flush=True)

        if result.get('success'):
            return jsonify(result)
        else:
            return jsonify({'success': False, 'error': result.get('error', '解析失败')})

    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


# ====== 食物搜索（本地库 + MiMo AI 兜底） ======

@app.route('/api/search_food', methods=['POST'])
def search_food():
    """
    搜索食物：先查本地数据库，找不到再用 MiMo AI 查询。
    前端手动添加食物时调用此接口。
    """
    try:
        # 限流检查
        limited = _rate_limit_check()
        if limited:
            return limited

        data = request.get_json()
        if not data or 'name' not in data:
            return jsonify({'error': '没有收到食物名称'}), 400

        name = data['name'].strip()
        if not name:
            return jsonify({'success': False, 'error': '名称为空'})

        # 1. 先查本地数据库
        matched = match_food_from_text(name)
        if matched:
            return jsonify({
                'success': True,
                'food': matched[0],
                'source': 'local_db'
            })

        # 2. 本地没有，用 MiMo 查询
        if MIMO_READY:
            print(f"[MiMo] 食物搜索：本地库无 '{name}'，查询AI...", flush=True)
            mimo_nutrition = get_food_nutrition_from_mimo([name])
            if name in mimo_nutrition:
                return jsonify({
                    'success': True,
                    'food': mimo_nutrition[name],
                    'source': 'mimo_ai'
                })

        # 3. 都查不到
        return jsonify({
            'success': False,
            'error': '未找到该食物',
            'query': name
        })

    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


# ====== AI 报告增强（MiMo 生成分析文字） ======

def generate_ai_report_analysis(daily_data, avg, recommendation, profile, scripts, condition_label):
    """
    用 MiMo 增强饮食报告：
    1. 生成营养分析总结（替代纯模板）
    2. 优化就医话术（更自然）
    """
    gender_label = '男性' if profile.get('gender') == 'male' else '女性'
    age = profile.get('age', '未设置')
    n_days = len(daily_data)

    # 计算达标率
    cal_target = recommendation.get('cal', 0)
    protein_target = recommendation.get('protein', 0)
    cal_pct = round(avg.get('cal', 0) / cal_target * 100) if cal_target else 0
    protein_pct = round(avg.get('protein', 0) / protein_target * 100) if protein_target else 0

    # 简化每日数据
    days_summary = []
    for d in daily_data[-7:]:
        t = d.get('totals', {})
        days_summary.append(
            f"{d.get('dateStr', '')}: 热量{t.get('cal', 0)}千卡, "
            f"蛋白质{t.get('protein', 0)}g, 脂肪{t.get('fat', 0)}g, "
            f"碳水{t.get('carb', 0)}g, 纤维{t.get('fiber', 0)}g"
        )

    prompt = (
        f"你是一位营养师，请根据以下数据生成一份饮食报告的分析文字。\n\n"
        f"用户信息：{age}岁，{gender_label}，健康情况：{condition_label}\n"
        f"记录天数：{n_days}天\n"
        f"营养目标：热量{cal_target}千卡/天，蛋白质{protein_target}g/天\n"
        f"日均摄入：热量{avg.get('cal',0)}千卡，蛋白质{avg.get('protein',0)}g，"
        f"脂肪{avg.get('fat',0)}g，碳水{avg.get('carb',0)}g，"
        f"膳食纤维{avg.get('fiber',0)}g，钠{avg.get('na',0)}mg\n"
        f"热量达标率：{cal_pct}%，蛋白质达标率：{protein_pct}%\n\n"
        f"每日数据：\n" + '\n'.join(days_summary) + '\n\n'
        f"请按以下格式返回（用===分隔各部分）：\n"
        f"第一部分：整体营养评估（2-3句话，通俗易懂）\n"
        f"===\n"
        f"第二部分：主要问题与建议（列出2-3个需要注意的营养问题，每个一句话）\n"
        f"===\n"
        f"第三部分：就医话术（用第一人称，像跟医生说话一样自然，100字以内）\n"
        f"只返回以上三部分内容，用===分隔。"
    )

    result = mimo_chat(
        [{'role': 'user', 'content': prompt}],
        max_tokens=2048,
        temperature=0.7
    )

    if not result.get('success'):
        return {'success': False, 'error': result.get('error')}

    text = result['text']
    parts = text.split('===')

    analysis = {
        'summary': parts[0].strip() if len(parts) > 0 else '',
        'issues': parts[1].strip() if len(parts) > 1 else '',
        'doctor_script': parts[2].strip() if len(parts) > 2 else scripts.get('main', '')
    }

    print(f"[MiMo] 报告分析生成完成", flush=True)
    return {'success': True, 'analysis': analysis}


# ====== 饮食报告导出 ======

@app.route('/api/export_report', methods=['POST'])
def export_report():
    """生成HTML格式的饮食报告，含完整营养分析和就医话术"""
    try:
        data = request.get_json()
        if not data:
            return '<html><body>报告数据为空</body></html>', 400

        profile = data.get('profile', {})
        reco = data.get('recommendation', {})
        daily_data = data.get('dailyData', [])
        avg = data.get('avg', {})
        scripts = data.get('scripts', {})
        condition_label = data.get('conditionLabel', '一般健康')
        top_foods = data.get('topFoods', [])
        food_variety = data.get('foodVariety', 0)
        nutrient_defs = data.get('nutrientDefs', [])
        generated_at = data.get('generatedAt', '')

        cal_target = reco.get('cal', 0)
        protein_target = reco.get('protein', 0)
        cal_pct = round(avg.get('cal', 0) / cal_target * 100) if cal_target else 0
        protein_pct = round(avg.get('protein', 0) / protein_target * 100) if protein_target else 0

        # ====== MiMo AI 增强分析 ======
        ai_analysis = None
        if MIMO_READY and daily_data:
            print("[MiMo] 开始生成报告AI分析...", flush=True)
            ai_result = generate_ai_report_analysis(daily_data, avg, reco, profile, scripts, condition_label)
            if ai_result.get('success'):
                ai_analysis = ai_result['analysis']
                print("[MiMo] 报告AI分析生成成功", flush=True)
            else:
                print(f"[MiMo] 报告AI分析失败: {ai_result.get('error')}", flush=True)

        # ====== 生成完整营养素达标分析表 ======
        nutrient_rows = ''
        for nd in nutrient_defs:
            key = nd['key']
            val = avg.get(key, 0)
            target = reco.get(key, 0)
            if target > 0:
                pct = round(val / target * 100)
                if pct >= 80:
                    status_cls = 'status-good'
                    status_txt = '达标'
                elif pct >= 50:
                    status_cls = 'status-warn'
                    status_txt = '偏低'
                else:
                    status_cls = 'status-bad'
                    status_txt = '严重不足'
                bar_color = '#6B9E7A' if pct >= 80 else '#D4875A' if pct >= 50 else '#E55'
                bar_width = min(pct, 100)
                nutrient_rows += f'''<tr>
                  <td>{nd['icon']} {nd['name']}</td>
                  <td>{val}</td>
                  <td>{target}</td>
                  <td>{nd['unit']}</td>
                  <td><div class="bar-container"><div class="bar-fill" style="width:{bar_width}%;background:{bar_color};"></div><span class="bar-text">{pct}%</span></div></td>
                  <td class="{status_cls}">{status_txt}</td>
                </tr>'''
            elif val > 0:
                nutrient_rows += f'''<tr>
                  <td>{nd['icon']} {nd['name']}</td>
                  <td>{val}</td>
                  <td>—</td>
                  <td>{nd['unit']}</td>
                  <td colspan="2"><span style="color:#8A847C;">无目标值</span></td>
                </tr>'''

        # ====== 每日明细表格行（桌面端表格 + 移动端卡片）======
        daily_rows = ''
        daily_cards = ''
        for d in daily_data:
            t = d['totals']
            cal_p = round(t['cal'] / cal_target * 100) if cal_target else 0
            cal_color = '#6B9E7A' if cal_p >= 80 else '#D4875A' if cal_p >= 60 else '#E55'
            # 桌面端表格行
            daily_rows += f'''<tr>
              <td>{d['dateStr']} 周{d['weekday']}</td>
              <td>{d['mealCount']}餐</td>
              <td><strong>{t['cal']}</strong></td>
              <td>{t['protein']}g</td>
              <td>{t['fat']}g</td>
              <td>{t['carb']}g</td>
              <td>{t['fiber']}g</td>
              <td>{t['na']}mg</td>
              <td><span style="color:{cal_color};font-weight:600;">{cal_p}%</span></td>
            </tr>'''
            # 移动端卡片
            daily_cards += f'''<div class="daily-card">
              <div class="daily-card-header">
                <span class="daily-card-date">{d['dateStr']} 周{d['weekday']}</span>
                <span class="daily-card-meals">{d['mealCount']}餐</span>
                <span class="daily-card-pct" style="color:{cal_color};">达标{cal_p}%</span>
              </div>
              <div class="daily-card-grid">
                <div class="daily-card-item"><span class="dc-label">热量</span><span class="dc-value"><strong>{t['cal']}</strong>千卡</span></div>
                <div class="daily-card-item"><span class="dc-label">蛋白质</span><span class="dc-value">{t['protein']}g</span></div>
                <div class="daily-card-item"><span class="dc-label">脂肪</span><span class="dc-value">{t['fat']}g</span></div>
                <div class="daily-card-item"><span class="dc-label">碳水</span><span class="dc-value">{t['carb']}g</span></div>
                <div class="daily-card-item"><span class="dc-label">纤维</span><span class="dc-value">{t['fiber']}g</span></div>
                <div class="daily-card-item"><span class="dc-label">钠</span><span class="dc-value">{t['na']}mg</span></div>
              </div>
            </div>'''

        # ====== 三餐分布分析 ======
        meal_dist_html = ''
        all_meal_types = {}
        for d in daily_data:
            for mt, info in d.get('mealDist', {}).items():
                if mt not in all_meal_types:
                    all_meal_types[mt] = {'count': 0, 'cal': 0}
                all_meal_types[mt]['count'] += info['count']
                all_meal_types[mt]['cal'] += info['cal']
        ndays = len(daily_data)
        for mt in ['早餐', '午餐', '下午茶', '晚餐', '加餐']:
            if mt in all_meal_types:
                info = all_meal_types[mt]
                avg_cal = round(info['cal'] / ndays)
                pct_of_total = round(info['cal'] / sum(i['cal'] for i in all_meal_types.values()) * 100) if sum(i['cal'] for i in all_meal_types.values()) > 0 else 0
                bar_w = min(pct_of_total, 100)
                meal_dist_html += f'''<div class="meal-dist-row">
                  <span class="meal-dist-name">{mt}</span>
                  <div class="meal-dist-bar"><div class="meal-dist-fill" style="width:{bar_w}%;"></div></div>
                  <span class="meal-dist-cal">日均{avg_cal}千卡（{pct_of_total}%）</span>
                </div>'''

        # ====== 食物多样性 ======
        top_foods_html = ''
        for i, fname in enumerate(top_foods):
            top_foods_html += f'<span class="food-tag">{i+1}. {fname}</span>'

        # ====== 每日餐食明细 ======
        meal_details = ''
        for d in daily_data:
            meal_details += f'<div class="day-section"><h3>📅 {d["dateStr"]} 周{d["weekday"]}（{d["mealCount"]}餐）</h3>'
            for m in d['meals']:
                meal_details += f'<div class="meal-detail"><span class="meal-type">{m["type"]}</span><span class="meal-time">{m["time"]}</span><span class="meal-foods">{m["items"]}</span><span class="meal-cal">{m["cal"]}千卡</span></div>'
            meal_details += '</div>'

        # ====== 就医话术 ======
        scripts_html = ''
        # 如果 MiMo 生成了优化的话术，优先使用
        if ai_analysis and ai_analysis.get('doctor_script'):
            scripts_html += f'<div class="script-card main-script"><h4>📋 AI 优化话术（推荐使用）</h4><p>{ai_analysis["doctor_script"]}</p></div>'
        if scripts.get('main'):
            scripts_html += f'<div class="script-card"><h4>📋 通用话术（模板生成）</h4><p>{scripts["main"]}</p></div>'
        if scripts.get('stomach'):
            scripts_html += f'<div class="script-card"><h4>🩺 消化科话术</h4><p>{scripts["stomach"]}</p></div>'
        if scripts.get('diabetes'):
            scripts_html += f'<div class="script-card"><h4>🩺 内分泌科话术</h4><p>{scripts["diabetes"]}</p></div>'
        if scripts.get('elderly'):
            scripts_html += f'<div class="script-card"><h4>🩺 老年科话术</h4><p>{scripts["elderly"]}</p></div>'
        if scripts.get('recovery'):
            scripts_html += f'<div class="script-card"><h4>🩺 外科/营养科话术</h4><p>{scripts["recovery"]}</p></div>'

        # ====== AI 分析段落 ======
        ai_analysis_html = ''
        if ai_analysis:
            if ai_analysis.get('summary'):
                ai_analysis_html += f'<div class="summary-box"><p>🤖 <strong>AI 营养评估：</strong>{ai_analysis["summary"]}</p></div>'
            if ai_analysis.get('issues'):
                ai_analysis_html += f'<div class="summary-box" style="border-left-color:#D4875A;"><p>⚠️ <strong>主要问题与建议：</strong></p><p style="white-space:pre-line;">{ai_analysis["issues"]}</p></div>'

        cal_status = '偏低' if cal_pct < 80 else ('偏高' if cal_pct > 110 else '基本达标')
        protein_status = '偏低' if protein_pct < 80 else ('偏高' if protein_pct > 120 else '基本达标')
        gender_label = '男' if profile.get('gender') == 'male' else '女'

        # 营养素分组
        core_nutrients = ['cal', 'protein', 'fat', 'carb', 'fiber']
        mineral_nutrients = ['na', 'ca', 'fe', 'zn', 'se', 'k', 'mg', 'p', 'cu', 'mn', 'i']
        vitamin_nutrients = ['va', 'vc', 'vd', 've', 'vk', 'vb1', 'vb2', 'vb6', 'vb12', 'niacin', 'folate', 'pantothenic']

        def gen_nutrient_group(keys, title, icon):
            rows = ''
            has_data = False
            for key in keys:
                nd = None
                for d in nutrient_defs:
                    if d['key'] == key:
                        nd = d
                        break
                if not nd:
                    continue
                val = avg.get(key, 0)
                target = reco.get(key, 0)
                if val > 0 or target > 0:
                    has_data = True
                if target > 0:
                    pct = round(val / target * 100) if val > 0 else 0
                    status_cls = 'status-good' if pct >= 80 else ('status-warn' if pct >= 50 else 'status-bad')
                    bar_color = '#6B9E7A' if pct >= 80 else '#D4875A' if pct >= 50 else '#E55'
                    rows += f'''<tr><td>{nd['icon']} {nd['name']}</td><td>{val}</td><td>{target}</td><td>{nd['unit']}</td><td><div class="bar-container"><div class="bar-fill" style="width:{min(pct,100)}%;background:{bar_color};"></div><span class="bar-text">{pct}%</span></div></td><td class="{status_cls}">{'达标' if pct>=80 else '偏低' if pct>=50 else '不足'}</td></tr>'''
                elif val > 0:
                    rows += f'''<tr><td>{nd['icon']} {nd['name']}</td><td>{val}</td><td>—</td><td>{nd['unit']}</td><td colspan="2" style="color:#8A847C;">无目标值</td></tr>'''
            if not has_data:
                return ''
            return f'<div class="nutrient-group"><h3>{icon} {title}</h3><table class="nutrient-table"><thead><tr><th>营养素</th><th>日均摄入</th><th>推荐量</th><th>单位</th><th>达标率</th><th>状态</th></tr></thead><tbody>{rows}</tbody></table></div>'

        core_html = gen_nutrient_group(core_nutrients, '核心营养素', '🔥')
        mineral_html = gen_nutrient_group(mineral_nutrients, '矿物质', '🪨')
        vitamin_html = gen_nutrient_group(vitamin_nutrients, '维生素', '💊')

        html = f'''<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>饮食记录报告 - 吃得明白</title>
<style>
* {{ margin:0; padding:0; box-sizing:border-box; }}
body {{ font-family: -apple-system, 'PingFang SC', 'Microsoft YaHei', sans-serif; background:#FFF8F0; color:#2D2A24; line-height:1.7; padding:20px; overflow-x:hidden; word-wrap:break-word; }}
.container {{ max-width:800px; margin:0 auto; background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 2px 12px rgba(0,0,0,0.08); }}
.header {{ background:linear-gradient(135deg, #D4875A, #E8A070); color:#fff; padding:30px; text-align:center; }}
.header h1 {{ font-size:1.8rem; margin-bottom:8px; }}
.header .sub {{ font-size:0.9rem; opacity:0.9; }}
.section {{ padding:24px 30px; border-bottom:1px solid #F0E8DE; }}
.section h2 {{ font-size:1.2rem; color:#D4875A; margin-bottom:16px; border-left:4px solid #D4875A; padding-left:12px; }}
.info-grid {{ display:grid; grid-template-columns:repeat(4,1fr); gap:12px; }}
.info-item {{ background:#FDF0E6; padding:12px; border-radius:8px; text-align:center; }}
.info-item .label {{ font-size:0.8rem; color:#8A847C; }}
.info-item .value {{ font-size:1.1rem; font-weight:700; color:#2D2A24; margin-top:4px; }}
table {{ width:100%; border-collapse:collapse; font-size:0.88rem; }}
thead th {{ background:#D4875A; color:#fff; padding:10px 8px; text-align:center; }}
tbody td {{ padding:8px; border-bottom:1px solid #F0E8DE; text-align:center; }}
tbody tr:hover {{ background:#FDF0E6; }}
.summary-box {{ background:#EEF5F0; border-left:4px solid #6B9E7A; padding:16px; border-radius:0 8px 8px 0; margin:12px 0; }}
.summary-box p {{ margin-bottom:6px; }}
.status-good {{ color:#6B9E7A; font-weight:700; }}
.status-warn {{ color:#D4875A; font-weight:700; }}
.status-bad {{ color:#E55; font-weight:700; }}
.day-section {{ margin-bottom:16px; }}
.day-section h3 {{ font-size:1rem; color:#2D2A24; margin-bottom:8px; padding-bottom:4px; border-bottom:1px dashed #E0D5C8; }}
.meal-detail {{ display:flex; gap:12px; padding:6px 0; font-size:0.88rem; align-items:center; }}
.meal-type {{ background:#D4875A; color:#fff; padding:2px 10px; border-radius:12px; font-size:0.8rem; white-space:nowrap; }}
.meal-time {{ color:#8A847C; font-size:0.82rem; white-space:nowrap; }}
.meal-foods {{ flex:1; }}
.meal-cal {{ color:#D4875A; font-weight:600; white-space:nowrap; }}
.script-card {{ background:#FDF0E6; border-radius:8px; padding:16px; margin-bottom:12px; }}
.script-card h4 {{ color:#D4875A; margin-bottom:8px; font-size:0.95rem; }}
.script-card p {{ font-size:0.92rem; line-height:1.8; }}
.main-script {{ border:2px solid #D4875A; }}
.footer {{ padding:20px 30px; background:#F5EDE4; font-size:0.82rem; color:#8A847C; text-align:center; }}
.bar-container {{ position:relative; width:100px; height:20px; background:#F0E8DE; border-radius:10px; overflow:hidden; margin:0 auto; }}
.bar-fill {{ height:100%; border-radius:10px; transition:width 0.3s; }}
.bar-text {{ position:absolute; top:0; left:0; right:0; text-align:center; font-size:0.72rem; line-height:20px; color:#2D2A24; font-weight:600; }}
.nutrient-group {{ margin-bottom:20px; }}
.nutrient-group h3 {{ font-size:1rem; color:#2D2A24; margin-bottom:8px; }}
.nutrient-table {{ font-size:0.82rem; }}
.meal-dist-row {{ display:flex; align-items:center; gap:12px; padding:6px 0; }}
.meal-dist-name {{ width:60px; font-weight:600; font-size:0.88rem; }}
.meal-dist-bar {{ flex:1; height:20px; background:#F0E8DE; border-radius:10px; overflow:hidden; }}
.meal-dist-fill {{ height:100%; background:#D4875A; border-radius:10px; }}
.meal-dist-cal {{ font-size:0.82rem; color:#8A847C; white-space:nowrap; }}
.food-tag {{ display:inline-block; background:#FDF0E6; padding:4px 12px; border-radius:12px; font-size:0.82rem; margin:4px 4px 4px 0; }}
@media print {{ body {{ padding:0; }} .container {{ box-shadow:none; }} }}
@media (max-width:600px) {{
  body {{ padding:8px; }}
  .container {{ border-radius:8px; }}
  .header {{ padding:20px 16px; }}
  .header h1 {{ font-size:1.4rem; }}
  .section {{ padding:16px; }}
  .section h2 {{ font-size:1rem; }}
  table {{ font-size:0.78rem; }}
  .meal-detail {{ flex-wrap:wrap; gap:6px; }}
  .bar-container {{ width:60px; }}
  .daily-table-wrapper {{ display:none; }}
  .daily-cards {{ display:block; }}
  .daily-card {{
    background:#FDF0E6; border-radius:10px; padding:14px; margin-bottom:12px;
    border:1px solid #F0E0D0;
  }}
  .daily-card-header {{
    display:flex; align-items:center; justify-content:space-between;
    margin-bottom:10px; padding-bottom:8px; border-bottom:1px dashed #E0D5C8;
    flex-wrap:wrap; gap:4px;
  }}
  .daily-card-date {{ font-weight:700; font-size:0.95rem; color:#2D2A24; }}
  .daily-card-meals {{ font-size:0.82rem; color:#8A847C; }}
  .daily-card-pct {{ font-size:0.85rem; font-weight:600; }}
  .daily-card-grid {{
    display:grid; grid-template-columns:repeat(2,1fr); gap:8px;
  }}
  .daily-card-item {{
    display:flex; flex-direction:column; gap:2px;
    padding:6px 8px; background:#fff; border-radius:6px;
  }}
  .dc-label {{ font-size:0.75rem; color:#8A847C; }}
  .dc-value {{ font-size:0.9rem; font-weight:600; color:#2D2A24; }}
  .meal-type {{ font-size:0.75rem; padding:1px 8px; }}
  .meal-time {{ font-size:0.75rem; }}
  .meal-cal {{ font-size:0.82rem; }}
  .nutrient-table {{ font-size:0.75rem; }}
  .nutrient-table th, .nutrient-table td {{ padding:4px 4px; }}
}}
@media (min-width:601px) {{
  .daily-cards {{ display:none; }}
  .daily-table-wrapper {{ display:block; }}
}}
</style>
</head>
<body>
<div class="container">

  <div class="header">
    <h1>📄 饮食记录报告</h1>
    <div class="sub">吃得明白 · 生成于 {generated_at}</div>
  </div>

  <div class="section">
    <h2>👤 基本信息</h2>
    <div class="info-grid">
      <div class="info-item"><div class="label">年龄</div><div class="value">{profile.get('age', '未设置')}岁</div></div>
      <div class="info-item"><div class="label">性别</div><div class="value">{gender_label}</div></div>
      <div class="info-item"><div class="label">身高</div><div class="value">{profile.get('height', '未设置')}cm</div></div>
      <div class="info-item"><div class="label">体重</div><div class="value">{profile.get('weight', '未设置')}kg</div></div>
    </div>
    <div style="margin-top:12px; text-align:center; font-size:0.9rem;">
      健康情况：<strong>{condition_label}</strong>
      <span style="margin-left:16px;">记录天数：<strong>{len(daily_data)}天</strong></span>
      <span style="margin-left:16px;">食物种类：<strong>{food_variety}种</strong></span>
    </div>
  </div>

  <div class="section">
    <h2>📊 营养摄入分析（近{len(daily_data)}天平均）</h2>
    <div class="info-grid">
      <div class="info-item"><div class="label">日均热量</div><div class="value">{avg.get('cal',0)}千卡</div></div>
      <div class="info-item"><div class="label">日均蛋白质</div><div class="value">{avg.get('protein',0)}g</div></div>
      <div class="info-item"><div class="label">日均脂肪</div><div class="value">{avg.get('fat',0)}g</div></div>
      <div class="info-item"><div class="label">日均碳水</div><div class="value">{avg.get('carb',0)}g</div></div>
    </div>
    <div class="summary-box">
      <p>🎯 营养目标：{cal_target}千卡/天，{protein_target}克蛋白质/天</p>
      <p>📈 热量达标率：<span class="{'status-good' if cal_pct>=80 else 'status-warn' if cal_pct>=60 else 'status-bad'}">{cal_pct}%（{cal_status}）</span></p>
      <p>📈 蛋白质达标率：<span class="{'status-good' if protein_pct>=80 else 'status-warn' if protein_pct>=60 else 'status-bad'}">{protein_pct}%（{protein_status}）</span></p>
      <p>🧂 日均钠摄入：{avg.get('na',0)}mg {'<span class="status-warn">（偏高，注意控盐）</span>' if avg.get('na',0)>2000 else '<span class="status-good">（在推荐范围内）</span>'}</p>
      <p>🥦 日均膳食纤维：{avg.get('fiber',0)}g {'<span class="status-warn">（偏低，多吃蔬菜粗粮）</span>' if avg.get('fiber',0)<20 else '<span class="status-good">（达标）</span>'}</p>
    </div>
    {ai_analysis_html}
  </div>

  <div class="section">
    <h2>📋 完整营养素达标分析</h2>
    {core_html}
    {mineral_html}
    {vitamin_html}
  </div>

  <div class="section">
    <h2>🕐 三餐热量分布</h2>
    {meal_dist_html}
  </div>

  <div class="section">
    <h2>🍎 食物多样性</h2>
    <p style="font-size:0.9rem;margin-bottom:12px;">近{len(daily_data)}天共记录了 <strong>{food_variety}</strong> 种不同食物{'，多样性丰富' if food_variety>=10 else '，建议增加食物种类' if food_variety>=5 else '，种类偏少，建议多样化饮食'}。</p>
    <div>{top_foods_html if top_foods_html else '<span style="color:#8A847C;">暂无数据</span>'}</div>
  </div>

  <div class="section">
    <h2>📅 每日饮食明细</h2>
    <div class="daily-table-wrapper">
      <table class="daily-table">
        <thead>
          <tr><th>日期</th><th>餐次</th><th>热量</th><th>蛋白质</th><th>脂肪</th><th>碳水</th><th>纤维</th><th>钠</th><th>达标率</th></tr>
        </thead>
        <tbody>{daily_rows}
        </tbody>
      </table>
    </div>
    <div class="daily-cards">{daily_cards}
    </div>
  </div>

  <div class="section">
    <h2>🍽️ 餐食记录详情</h2>
    {meal_details}
  </div>

  <div class="section">
    <h2>💬 就医沟通话术</h2>
    <p style="font-size:0.88rem;color:#8A847C;margin-bottom:16px;">看医生时可以直接念以下话术，帮助医生快速了解您的饮食情况：</p>
    {scripts_html}
  </div>

  <div class="footer">
    <p>本报告由「吃得明白」自动生成，AI 分析由 MiMo-V2.5 提供支持。</p>
    <p>所有数据为估算值，仅供参考，不替代医生或营养师的专业建议。</p>
  </div>

</div>
</body>
</html>'''

        return html

    except Exception as e:
        traceback.print_exc()
        return f'<html><body>报告生成失败: {str(e)}</body></html>', 500


if __name__ == '__main__':
    print("=" * 50)
    print("吃得明白 - 后端服务已启动（MiMo-V2.5 版本）")
    print(f"MiMo API 状态: {'已配置' if MIMO_READY else '未配置'}")
    print(f"模型: {MIMO_MODEL}")
    print("访问 http://localhost:8080 体验 Demo")
    print("=" * 50)
    debug = os.environ.get('FLASK_DEBUG') == '1'
    if debug:
        print("⚠️ Debug 模式已开启（FLASK_DEBUG=1），公开部署时请勿开启")
    app.run(host='0.0.0.0', port=8080, debug=debug)
