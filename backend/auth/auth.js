let usuarioLogueado = null;

function setUsuario(usuario) {
    usuarioLogueado = usuario;
}

function getUsuario() {
    return usuarioLogueado;
}

module.exports = {
    setUsuario,
    getUsuario
};
