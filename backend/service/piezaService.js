const conexion = require("../database");

function obtenerPiezas(callback) {
    conexion.query("SELECT * FROM piezas", callback);
}

function buscarPiezas(data, callback) {
    const id = Number(data.id);

    if (!id || id > 50000) {
        return callback(new Error("Datos invalidos"));
    }

    conexion.query("SELECT * FROM piezas WHERE id = ?", [id], callback);
}

function crearPieza(data, callback) {
    const { nombre, HP, Torque, Agarre, Precio } = data;
    if (!nombre || !HP || !Torque || !Agarre || !Precio) {
        return callback(new Error("Datos invalidos"));
    }

    conexion.query(
        "INSERT INTO piezas (nombre, HP, Torque, Agarre, Precio) VALUES (?, ?, ?, ?, ?)",
        [nombre, HP, Torque, Agarre, Precio],
        callback
    );
}

function actualizarPieza(id, data, callback) {
    const { nombre, HP, Torque, Agarre, Precio } = data;

    if (!nombre || !HP || !Torque || !Agarre || !Precio) {
        return callback(new Error("Datos invalidos"));
    }

    conexion.query(
        "UPDATE piezas SET nombre = ?, HP = ?, Torque = ?, Agarre = ?, Precio = ? WHERE id = ?",
        [nombre, HP, Torque, Agarre, Precio, id],
        callback
    );
}

function eliminarPieza(id, callback) {
    if (!id || id > 50000) {
        return callback(new Error("Datos invalidos"));
    }

    conexion.query("DELETE FROM piezas WHERE id = ?", [id], callback);
}


module.exports = {
    obtenerPiezas,
    crearPieza,
    actualizarPieza,
    eliminarPieza,
    buscarPiezas,
};