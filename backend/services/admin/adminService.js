const { db, httpError, positiveInt } = require("../shared/gameUtils");

const adminTables = {
    autos: { fields: ["nombre", "precio", "precio_fichas", "HP", "NM", "Agarre", "id_rareza", "imagen"] },
    piezas: { fields: ["nombre", "precio", "precio_fichas", "HP", "NM", "Agarre", "id_categoria", "id_rareza", "imagen"] },
    categorias: { fields: ["nombre"] },
    rarezas: { fields: ["nombre"] },
};

async function adminList(type) {
    if (!adminTables[type]) throw httpError("Recurso de administración inválido.");
    const [rows] = await db.query(`SELECT * FROM ${type} ORDER BY id DESC`);
    return rows;
}

async function adminSave(type, id, data) {
    const schema = adminTables[type];
    if (!schema) throw httpError("Recurso de administración inválido.");
    const fields = schema.fields;
    const values = fields.map((field) => data[field]);
    if (fields.some((field, index) => values[index] === undefined || values[index] === null || values[index] === "")) {
        throw httpError("Completá todos los campos requeridos.");
    }
    for (const field of ["precio", "precio_fichas", "HP", "NM", "Agarre", "id_categoria", "id_rareza"]) {
        if (data[field] !== undefined && !Number.isFinite(Number(data[field]))) throw httpError(`${field} debe ser numérico.`);
    }
    if (typeof data.nombre !== "string" || data.nombre.trim().length < 2) throw httpError("El nombre es obligatorio.");
    if (id) {
        await db.execute(
            `UPDATE ${type} SET ${fields.map((field) => `${field} = ?`).join(", ")} WHERE id = ?`,
            [...values.map((value, index) => fields[index] === "nombre" ? String(value).trim() : value), positiveInt(id, "ID")],
        );
    } else {
        await db.execute(
            `INSERT INTO ${type} (${fields.join(", ")}) VALUES (${fields.map(() => "?").join(", ")})`,
            values.map((value, index) => fields[index] === "nombre" ? String(value).trim() : value),
        );
    }
    return adminList(type);
}

async function adminDelete(type, id) {
    if (!adminTables[type]) throw httpError("Recurso de administración inválido.");
    const [result] = await db.execute(`DELETE FROM ${type} WHERE id = ?`, [positiveInt(id, "ID")]);
    if (!result.affectedRows) throw httpError("Registro no encontrado.", 404);
    return adminList(type);
}

module.exports = { adminDelete, adminList, adminSave };
