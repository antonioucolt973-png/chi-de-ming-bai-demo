// 吃得明白 - Service Worker
// PWA 离线缓存 + 全屏 App 体验

var CACHE_NAME = 'chidemingbai-v17';
var CACHE_URLS = [
  '/assets/style.css',
  '/assets/food-db.js',
  '/assets/icon-512.jpg',
  '/assets/icon-192.jpg',
  '/manifest.json'
];

// 安装：预缓存核心资源（不缓存 index.html 和 app.js，确保开发阶段始终取最新）
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(CACHE_URLS).catch(function(err) {
        console.log('[SW] 部分资源缓存失败，不影响使用:', err);
      });
    })
  );
  self.skipWaiting();
});

// 激活：清理旧缓存
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(
        names.map(function(name) {
          if (name !== CACHE_NAME) return caches.delete(name);
        })
      );
    })
  );
  self.clients.claim();
});

// 请求拦截
self.addEventListener('fetch', function(event) {
  var url = new URL(event.request.url);

  // API 请求不走缓存
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // HTML、JS 和 CSS 请求：始终走网络（确保最新代码）
  if (url.pathname === '/' ||
      url.pathname === '/index.html' ||
      url.pathname === '/assets/app.js' ||
      url.pathname === '/assets/style.css' ||
      url.pathname === '/assets/food-db.js' ||
      url.pathname === '/assets/charts.js' ||
      url.pathname === '/assets/nutrient-system.js') {
    event.respondWith(
      fetch(event.request).then(function(resp) {
        return resp;
      }).catch(function() {
        // 离线时才用缓存
        return caches.match(event.request);
      })
    );
    return;
  }

  // 其他 GET 请求：缓存优先
  if (event.request.method === 'GET') {
    event.respondWith(
      caches.match(event.request).then(function(cached) {
        return cached || fetch(event.request).then(function(resp) {
          if (resp.status === 200 && url.origin === self.location.origin) {
            var respClone = resp.clone();
            caches.open(CACHE_NAME).then(function(cache) {
              cache.put(event.request, respClone);
            });
          }
          return resp;
        }).catch(function() {
          return caches.match(event.request);
        });
      })
    );
  }
});
