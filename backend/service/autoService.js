const conexion = require("../database");

function obtenerAutos(callback) {
    conexion.query("SELECT * FROM autos", callback);
}

function buscarAutos(data, callback) {
    const id = Number(data.id);

    if (!id || id > 50000) {
        return callback(new Error("Datos invalidos"));
    }

    conexion.query("SELECT * FROM autos WHERE id = ?", [id], callback);
}

function crearAuto(data, callback) {
    const { nombre, HP, Torque, Agarre, Precio, rareza } = data;
    if (!nombre || !HP || !Torque || !Agarre || !Precio || !rareza) {
        return callback(new Error("Datos invalidos"));
    }

    conexion.query(
        "INSERT INTO autos (nombre, HP, Torque, Agarre, Precio, rareza) VALUES (?, ?, ?, ?, ?, ?)",
        [nombre, HP, Torque, Agarre, Precio, rareza],
        callback
    );
}

function actualizarAuto(id, data, callback) {
    const { nombre, HP, Torque, Agarre, Precio, rareza } = data;

    if (!nombre || !HP || !Torque || !Agarre || !Precio || !rareza) {
        return callback(new Error("Datos invalidos"));
    }

    conexion.query(
        "UPDATE autos SET nombre = ?, HP = ?, Torque = ?, Agarre = ?, Precio = ?, rareza = ? WHERE id = ?",
        [nombre, HP, Torque, Agarre, Precio, rareza, id],
        callback
    );
}

function eliminarAuto(id, callback) {
    if (!id || id > 50000) {
        return callback(new Error("Datos invalidos"));
    }

    conexion.query("DELETE FROM autos WHERE id = ?", [id], callback);
}


module.exports = {
    obtenerAutos,
    crearAuto,
    actualizarAuto,
    eliminarAuto,
    buscarAutos,
};