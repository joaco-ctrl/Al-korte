# Estructura del backend

La API mantiene capas (`routes`, `controllers`, `services`) y separa cada módulo de juego en su propia carpeta:

```text
backend/
├── config/
│   └── database.js
├── controllers/
│   ├── admin/
│   ├── auth/
│   ├── casino/
│   ├── game/
│   ├── garage/
│   ├── racing/
│   ├── shared/
│   └── shop/
├── middlewares/
│   └── auth.js
├── routes/
│   ├── admin/
│   ├── auth/
│   ├── casino/
│   ├── game/
│   ├── garage/
│   ├── racing/
│   ├── shop/
│   └── rutas.js
└── services/
    ├── admin/
    ├── auth/
    ├── casino/
    ├── game/
    ├── garage/
    ├── loot-box/
    ├── racing/
    ├── shared/
    └── shop/
```

`services/shared/gameUtils.js` concentra transacciones, validación, estadísticas y simulación común. `routes/rutas.js` monta las rutas por módulo. El juego usa las tablas existentes del dump `al_korte (1).sql`.

## Carreras para cuentas existentes

El dump inicial puede tener cuentas sin autos asociados. Al cargar `/api/game`, el servicio asigna a esas cuentas el auto más económico disponible, lo marca como activo y agrega las piezas iniciales de categorías que falten. Si el catálogo de autos está vacío, la API responde `503` con un mensaje que pide cargar el catálogo.

La primera asignación gratuita se marca con una transacción `AUTO / SALDO / 0`. Esto permite reparar cuentas antiguas sin volver a regalar un auto después de una derrota Pink Slip. Para continuar jugando tras perder el último auto, se debe comprar otro en la tienda.

## Inicio

```powershell
npm install
npm start
```

Configurá `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` y `JWT_SECRET` en `.env`.
