# Al-Korte

Juego web de carreras callejeras con React/Vite, API Node.js/Express y MySQL. Incluye registro e inicio de sesión, garaje, tuning, tienda, cajas, carreras, campeonatos, Blacklist y casino con fichas virtuales.

## Requisitos

- Node.js 18 o posterior.
- MySQL/MariaDB con la base `al korte`.
- Importar `al_korte (1).sql` en MySQL antes de iniciar la API.

## Configuración

En `backend/.env`, configurá la conexión a MySQL y una clave privada para firmar las sesiones:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=al korte
JWT_SECRET=reemplazar-por-una-clave-larga-y-aleatoria
PORT=3000
FRONTEND_ORIGIN=http://localhost:5173
```

La clave de desarrollo predeterminada de JWT no debe utilizarse fuera del entorno local.

## Iniciar en desarrollo

En una terminal:

```powershell
cd backend
npm install
npm start
```

En otra terminal:

```powershell
cd frontend
npm install
npm run dev
```

Abrí `http://localhost:5173`. La API queda disponible en `http://localhost:3000/api`; `GET /api/health` comprueba la conexión a MySQL. Para apuntar el frontend a otra API, definí `VITE_API_URL`.

El panel de administración solo aparece para cuentas con `rol = 'admin'`. El registro crea pilotos con su primer auto y 100 fichas virtuales. No se procesan pagos reales.

## Reglas y persistencia

- `saldo` paga autos, piezas, cajas, carreras y campeonatos. `fichas_casino` se usa solo en la ruleta, Blackjack y la tienda especial.
- Las compras de autos y las recompensas Blacklist/cajas agregan piezas iniciales. El inventario permite equipar una pieza por categoría y auto; las piezas libres y los autos no activos se revenden al 50%.
- Las carreras se simulan en el servidor con PR, avance por turnos y riesgo de pérdida de tracción. Perder un desafío Blacklist elimina permanentemente el auto activo del garaje.
- La ruleta y los saldos se resuelven en el backend. El estado de una mano de Blackjack se mantiene en memoria del proceso; reiniciar la API termina cualquier mano que estuviera en curso.
- Los datos del jugador se guardan en las tablas existentes del dump SQL. Los campeonatos son desafíos de una carrera y no mantienen una tabla de clasificación.
