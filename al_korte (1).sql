-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 05-11-2026 a las 18:56:57
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `al korte`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `autos`
--

CREATE TABLE `autos` (
  `id` int(11) NOT NULL,
  `nombre` varchar(50) NOT NULL,
  `precio` int(11) NOT NULL DEFAULT 0,
  `precio_fichas` int(11) NOT NULL DEFAULT 0,
  `HP` int(11) NOT NULL,
  `NM` int(11) NOT NULL,
  `Agarre` int(11) NOT NULL,
  `id_rareza` int(11) NOT NULL DEFAULT 1,
  `imagen` varchar(255) DEFAULT 'default_auto.png'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `autos`
--

INSERT INTO `autos` (`id`, `nombre`, `precio`, `precio_fichas`, `HP`, `NM`, `Agarre`, `id_rareza`, `imagen`) VALUES
(1, 'Honda Civic EG', 1500, 0, 25, 20, 15, 2, 'default_auto.png'),
(2, 'Nissan 240SX', 2800, 0, 40, 35, 20, 3, '240sx.png'),
(3, 'Toyota Supra MK4', 12000, 0, 90, 85, 45, 4, 'supra.png');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `blacklist_rivales`
--

CREATE TABLE `blacklist_rivales` (
  `id` int(11) NOT NULL,
  `nivel` int(11) NOT NULL,
  `nombre_rival` varchar(50) NOT NULL,
  `auto_recompensa_id` int(11) NOT NULL,
  `hp_rival` int(11) NOT NULL,
  `nm_rival` int(11) NOT NULL,
  `agarre_rival` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `blacklist_rivales`
--

INSERT INTO `blacklist_rivales` (`id`, `nivel`, `nombre_rival`, `auto_recompensa_id`, `hp_rival`, `nm_rival`, `agarre_rival`) VALUES
(1, 1, 'Nico El Rayo', 1, 30, 25, 20),
(2, 2, 'Marcos Drift', 2, 60, 50, 30),
(3, 3, 'El Patrón del Milla', 3, 120, 110, 60);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `categorias`
--

CREATE TABLE `categorias` (
  `id` int(11) NOT NULL,
  `nombre` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `categorias`
--

INSERT INTO `categorias` (`id`, `nombre`) VALUES
(1, 'Escapes'),
(2, 'Turbos / Inducción Forzada'),
(3, 'Admisión y Filtros'),
(4, 'Electrónica / Repro ECU'),
(5, 'Motor (Bloque, Pistones, Bujías)'),
(6, 'Transmisión (Caja y Embrague)'),
(7, 'Neumáticos');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `cuenta_autos`
--

CREATE TABLE `cuenta_autos` (
  `id` int(11) NOT NULL,
  `id_auto` int(11) NOT NULL,
  `id_cuenta` int(11) NOT NULL,
  `activo` tinyint(4) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `cuenta_piezas`
--

CREATE TABLE `cuenta_piezas` (
  `id` int(11) NOT NULL,
  `id_cuenta` int(11) NOT NULL,
  `id_auto` int(11) DEFAULT NULL,
  `id_pieza` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `piezas`
--

CREATE TABLE `piezas` (
  `id` int(11) NOT NULL,
  `nombre` varchar(50) NOT NULL,
  `precio` int(11) NOT NULL DEFAULT 0,
  `precio_fichas` int(11) NOT NULL DEFAULT 0,
  `HP` int(11) NOT NULL,
  `NM` int(11) NOT NULL,
  `Agarre` int(11) NOT NULL,
  `id_categoria` int(11) NOT NULL,
  `id_rareza` int(11) NOT NULL DEFAULT 1,
  `imagen` varchar(255) DEFAULT 'default_pieza.png'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `piezas`
--

INSERT INTO `piezas` (`id`, `nombre`, `precio`, `precio_fichas`, `HP`, `NM`, `Agarre`, `id_categoria`, `id_rareza`, `imagen`) VALUES
(1, 'Filtro K&N', 300, 0, 5, 2, 0, 3, 1, 'filtro.png'),
(2, 'Escape Akrapovic', 800, 0, 12, 8, 0, 1, 2, 'escape.png'),
(3, 'Turbo Garret T3', 2500, 0, 35, 30, -5, 2, 3, 'turbo.png');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `rarezas`
--

CREATE TABLE `rarezas` (
  `id` int(11) NOT NULL,
  `nombre` varchar(25) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `rarezas`
--

INSERT INTO `rarezas` (`id`, `nombre`) VALUES
(1, 'Común'),
(2, 'Raro'),
(3, 'Épico'),
(4, 'Legendario'),
(5, 'Especial');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `transacciones`
--

CREATE TABLE `transacciones` (
  `id` int(11) NOT NULL,
  `id_cuenta` int(11) NOT NULL,
  `tipo` enum('AUTO','PIEZA','CAJA','CASINO') NOT NULL,
  `moneda` enum('SALDO','FICHAS') NOT NULL,
  `monto` int(11) NOT NULL,
  `fecha` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL,
  `nombre` varchar(25) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `saldo` int(11) NOT NULL DEFAULT 1000,
  `fichas_casino` int(11) NOT NULL DEFAULT 0,
  `blacklist_nivel` int(11) NOT NULL DEFAULT 1,
  `rol` varchar(25) NOT NULL DEFAULT 'user'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id`, `nombre`, `email`, `password`, `saldo`, `fichas_casino`, `blacklist_nivel`, `rol`) VALUES
(1, 'admin', 'admin@alkorte.com', '$2b$10$6qPTgXqt1M/rn5NxxPWW7OtmBazYj6/xhe3/fldY6FOB2YCYmubf6', 1000, 0, 1, 'admin'),
(3, 'user', 'hola@alkorte.com', '$2b$10$cKtec2EpL36bF.USm46bxunzfvPwvEO60hoNzrZ1OMNHW0eNzygtq', 1000, 0, 1, 'user');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `autos`
--
ALTER TABLE `autos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_autos_rarezas` (`id_rareza`);

--
-- Indices de la tabla `blacklist_rivales`
--
ALTER TABLE `blacklist_rivales`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_blacklist_auto` (`auto_recompensa_id`);

--
-- Indices de la tabla `categorias`
--
ALTER TABLE `categorias`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `cuenta_autos`
--
ALTER TABLE `cuenta_autos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_garaje_autos` (`id_auto`),
  ADD KEY `fk_garaje_cuentas` (`id_cuenta`);

--
-- Indices de la tabla `cuenta_piezas`
--
ALTER TABLE `cuenta_piezas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_inventario_piezas` (`id_pieza`),
  ADD KEY `fk_inventario_autos` (`id_auto`),
  ADD KEY `fk_inventario_cuentas` (`id_cuenta`);

--
-- Indices de la tabla `piezas`
--
ALTER TABLE `piezas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_piezas_categorias` (`id_categoria`),
  ADD KEY `fk_piezas_rarezas` (`id_rareza`);

--
-- Indices de la tabla `rarezas`
--
ALTER TABLE `rarezas`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `transacciones`
--
ALTER TABLE `transacciones`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_transacciones_cuenta` (`id_cuenta`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `fk_usuarios_roles` (`rol`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `autos`
--
ALTER TABLE `autos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `blacklist_rivales`
--
ALTER TABLE `blacklist_rivales`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `categorias`
--
ALTER TABLE `categorias`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT de la tabla `cuenta_autos`
--
ALTER TABLE `cuenta_autos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `cuenta_piezas`
--
ALTER TABLE `cuenta_piezas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `piezas`
--
ALTER TABLE `piezas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `rarezas`
--
ALTER TABLE `rarezas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `transacciones`
--
ALTER TABLE `transacciones`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `autos`
--
ALTER TABLE `autos`
  ADD CONSTRAINT `fk_autos_rarezas` FOREIGN KEY (`id_rareza`) REFERENCES `rarezas` (`id`);

--
-- Filtros para la tabla `blacklist_rivales`
--
ALTER TABLE `blacklist_rivales`
  ADD CONSTRAINT `fk_blacklist_auto` FOREIGN KEY (`auto_recompensa_id`) REFERENCES `autos` (`id`);

--
-- Filtros para la tabla `cuenta_autos`
--
ALTER TABLE `cuenta_autos`
  ADD CONSTRAINT `fk_garaje_autos` FOREIGN KEY (`id_auto`) REFERENCES `autos` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_garaje_cuentas` FOREIGN KEY (`id_cuenta`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `cuenta_piezas`
--
ALTER TABLE `cuenta_piezas`
  ADD CONSTRAINT `fk_inventario_autos` FOREIGN KEY (`id_auto`) REFERENCES `autos` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_inventario_cuentas` FOREIGN KEY (`id_cuenta`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_inventario_piezas` FOREIGN KEY (`id_pieza`) REFERENCES `piezas` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `piezas`
--
ALTER TABLE `piezas`
  ADD CONSTRAINT `fk_piezas_categorias` FOREIGN KEY (`id_categoria`) REFERENCES `categorias` (`id`),
  ADD CONSTRAINT `fk_piezas_rarezas` FOREIGN KEY (`id_rareza`) REFERENCES `rarezas` (`id`);

--
-- Filtros para la tabla `transacciones`
--
ALTER TABLE `transacciones`
  ADD CONSTRAINT `fk_transacciones_cuenta` FOREIGN KEY (`id_cuenta`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
