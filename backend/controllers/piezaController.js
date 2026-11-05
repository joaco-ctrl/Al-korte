const gameservice = require("../service/piezaService");

function buscarPiezas(req, res) {
    const { id } = req.params;

    gameservice.buscarPiezas({ id }, (err, results) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }

        if (!results.length) {
            return res.status(404).json({ error: "Pieza no encontrada" });
        }

        res.json(results[0]);
    });
}

function obtenerPiezas(req, res) {
    gameservice.obtenerPiezas((err, results) => {
        if (err) {
            res.status(500).json({ error: "error" });
        } else {
            res.json(results);
        }
    });
}

function crearPieza(req, res) {
    const { nombre, HP, Torque, Agarre, Precio } = req.body;
    gameservice.crearPieza({ nombre, HP, Torque, Agarre, Precio }, (err, results) => {
        if (err) {
            res.status(400).json({ error: err.message });
        } else {
            res.status(201).json({ mensaje: "pieza creada correctamente" });
        }
    });
}

function actualizarPieza    (req, res) {
    const { nombre, HP, Torque, Agarre, Precio } = req.body;
    const { id } = req.params;
    gameservice.actualizarPieza(id, { nombre, HP, Torque, Agarre, Precio }, (err, results) => {
        if (err) {
            res.status(400).json({ error: err.message });
        } else {
            res.json({ mensaje: "Pieza actualizada correctamente" });
        }
    });
}

function eliminarPieza(req, res) {
    const { id } = req.params;
    gameservice.eliminarPieza(id, (err, results) => {
        if (err) {
            res.status(400).json({ error: err.message });
        } else {
            res.json({ mensaje: "Pieza borrada correctamente" });
        }
    });
}

module.exports = {
    obtenerPiezas,
    crearPieza,
    actualizarPieza,
    eliminarPieza,
    buscarPiezas,
};