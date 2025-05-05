// CloudFarm Service Worker - Versão 1.0
const CACHE_NAME = 'cloudfarm-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/css/main.css',
  '/css/farm-icons.css',
  '/css/popups.css',
  '/css/position-controls.css',
  '/css/chat.css',
  '/js/main.js',
  '/js/utils/appState.js',
  '/js/utils/themeManager.js',
  '/js/modules/positionManager.js',
  '/js/modules/moduleManager.js',
  '/js/modules/chatManager.js',
  '/js/modules/uiManager.js',
  '/public/Images/littlefarm.png',
  '/public/Images/FUEL.png',
  '/public/Images/FUEL2.png',
  '/public/favicon.ico'
];

// Instalação do Service Worker - Cache dos recursos estáticos
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Instalando...');
  
  // Pré-cache dos recursos essenciais
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Cache aberto');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Ativação do Service Worker - Limpeza de caches antigos
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Ativando...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Estratégia de cache: "Cache first, then network"
self.addEventListener('fetch', (event) => {
  // Ignora requisições para a API
  if (event.request.url.includes('/api/')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Retorna do cache se encontrado
        if (response) {
          return response;
        }
        
        // Clone da requisição, pois ela só pode ser usada uma vez
        const fetchRequest = event.request.clone();
        
        return fetch(fetchRequest)
          .then((response) => {
            // Valida resposta
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clone da resposta, pois ela só pode ser usada uma vez
            const responseToCache = response.clone();
            
            // Armazena em cache para uso futuro
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          })
          .catch((error) => {
            console.error('[Service Worker] Erro de fetch:', error);
            // Poderia retornar uma página offline personalizada aqui
          });
      })
  );
});
