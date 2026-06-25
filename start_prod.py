"""
吃得明白 - 生产环境启动脚本
使用 waitress 作为 WSGI 服务器（Windows/Linux 通用）

使用方式：
  1. 设置环境变量 MIMO_API_KEY
  2. python start_prod.py
  3. 访问 http://localhost:8080

Windows PowerShell:
  $env:MIMO_API_KEY="sk-你的key"
  python start_prod.py

Linux/Mac:
  export MIMO_API_KEY="sk-你的key"
  python start_prod.py

Render/Railway/Zeabur 部署：
  Build Command:  pip install -r requirements.txt
  Start Command:  python start_prod.py
  Environment:    MIMO_API_KEY=你的真实key
"""
import os
import sys

# 确保从项目根目录启动
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
os.chdir(BASE_DIR)
sys.path.insert(0, BASE_DIR)

# 检查 API Key（不依赖 mimo_config.py，直接从环境变量读取）
_api_key = os.environ.get('MIMO_API_KEY', '')
if not _api_key or len(_api_key) <= 10:
    print("=" * 50)
    print("错误：MIMO_API_KEY 未设置或无效")
    print("请设置环境变量后再启动：")
    print("  PowerShell: $env:MIMO_API_KEY='sk-你的key'")
    print("  Linux/Mac:  export MIMO_API_KEY='sk-你的key'")
    print("  Render/Railway/Zeabur: 在平台环境变量中配置 MIMO_API_KEY")
    print("=" * 50)
    sys.exit(1)

from server import app

PORT = int(os.environ.get('PORT', 8080))

print("=" * 50)
print("吃得明白 - 生产模式启动（waitress WSGI）")
print(f"端口: {PORT}")
print(f"工作线程: 8")
print(f"Debug: False（生产模式）")
print(f"MiMo: 已配置（从环境变量读取）")
print(f"访问 http://0.0.0.0:{PORT} 体验 Demo")
print("=" * 50)

try:
    from waitress import serve
    serve(app, host='0.0.0.0', port=PORT, threads=8)
except ImportError:
    print("waitress 未安装，回退到 Flask 开发服务器")
    print("安装生产依赖：pip install waitress")
    app.run(host='0.0.0.0', port=PORT, debug=False)
