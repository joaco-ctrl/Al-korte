const express = require("express");
const router = express.Router();
const {
    login,
    registro
} = require("../controllers/controller");

const{
    obtenerAutos,
    crearAuto,
    actualizarAuto,
    eliminarAuto,
    buscarAutos
} = require("../controllers/autoController");

const{
    obtenerPiezas,
    crearPieza,
    actualizarPieza,
    eliminarPieza,
    buscarPiezas
} = require("../controllers/piezaController");

// Rutas para la gestión de autos
router.get("/autos", obtenerAutos);
router.get("/autos/:id", buscarAutos);
router.post("/autos", crearAuto);
router.put("/autos/:id", actualizarAuto);
router.delete("/autos/:id", eliminarAuto);

// Rutas para la gestión de piezas
router.get("/piezas", obtenerPiezas);
router.get("/piezas/:id", buscarPiezas);
router.post("/piezas", crearPieza);
router.put("/piezas/:id", actualizarPieza);
router.delete("/piezas/:id", eliminarPieza);

router.post("/login", login);
router.post("/registro", registro);

module.exports = router;
