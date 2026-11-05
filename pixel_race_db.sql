-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 05-11-2026 a las 15:30:00
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
-- Base de datos: `pixel_race_db`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `autos_base`
--

CREATE TABLE `autos_base` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `marca` varchar(50) NOT NULL,
  `hp_base` int(11) NOT NULL,
  `agarre_base` int(11) NOT NULL,
  `peso_kg` int(11) NOT NULL,
  `precio` decimal(10,2) DEFAULT 0.00,
  `precio_fichas` int(11) DEFAULT 0,
  `categoria` enum('NORMAL','ESPECIAL_CASINO','ESPECIAL_CAJA') DEFAULT 'NORMAL',
  `disponible_tienda` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `autos_jugador`
--

CREATE TABLE `autos_jugador` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `auto_base_id` int(11) NOT NULL,
  `pr_total` int(11) DEFAULT 0,
  `en_uso` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `auto_piezas_equipadas`
--

CREATE TABLE `auto_piezas_equipadas` (
  `id` int(11) NOT NULL,
  `auto_jugador_id` int(11) NOT NULL,
  `pieza_base_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `inventario_piezas`
--

CREATE TABLE `inventario_piezas` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `pieza_base_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `piezas_base`
--

CREATE TABLE `piezas_base` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `tipo` enum('BLOCK_MOTOR','ESCAPE','PISTONES','BUJIAS','ADMISION','FILTRO_AIRE','MARIPOSA','CAJA_CAMBIOS','EMBRAGUE','INTERCOOLER','INDUCCION_FORZADA','ECU','NEUMATICOS') NOT NULL,
  `bonus_hp` int(11) DEFAULT 0,
  `bonus_agarre` int(11) DEFAULT 0,
  `peso_extra` int(11) DEFAULT 0,
  `precio` decimal(10,2) DEFAULT 0.00,
  `precio_fichas` int(11) DEFAULT 0,
  `raridad` enum('COMUN','RARO','EPICO','LEGENDARIO','ESPECIAL') DEFAULT 'COMUN',
  `disponible_tienda` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `transacciones_tienda`
--

CREATE TABLE `transacciones_tienda` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `tipo_item` enum('AUTO','PIEZA') NOT NULL,
  `item_id` int(11) NOT NULL,
  `moneda_usada` enum('DINERO','FICHAS') NOT NULL,
  `monto` decimal(12,2) NOT NULL,
  `fecha` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `rol` enum('USER','ADMIN') DEFAULT 'USER',
  `dinero` decimal(12,2) DEFAULT 1000.00,
  `fichas_casino` int(11) DEFAULT 0,
  `blacklist_nivel` int(11) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `autos_base`
--
ALTER TABLE `autos_base`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `autos_jugador`
--
ALTER TABLE `autos_jugador`
  ADD PRIMARY KEY (`id`),
  ADD KEY `usuario_id` (`usuario_id`),
  ADD KEY `auto_base_id` (`auto_base_id`);

--
-- Indices de la tabla `auto_piezas_equipadas`
--
ALTER TABLE `auto_piezas_equipadas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `auto_jugador_id` (`auto_jugador_id`),
  ADD KEY `pieza_base_id` (`pieza_base_id`);

--
-- Indices de la tabla `inventario_piezas`
--
ALTER TABLE `inventario_piezas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `usuario_id` (`usuario_id`),
  ADD KEY `pieza_base_id` (`pieza_base_id`);

--
-- Indices de la tabla `piezas_base`
--
ALTER TABLE `piezas_base`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `transacciones_tienda`
--
ALTER TABLE `transacciones_tienda`
  ADD PRIMARY KEY (`id`),
  ADD KEY `usuario_id` (`usuario_id`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `autos_base`
--
ALTER TABLE `autos_base`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `autos_jugador`
--
ALTER TABLE `autos_jugador`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `auto_piezas_equipadas`
--
ALTER TABLE `auto_piezas_equipadas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `inventario_piezas`
--
ALTER TABLE `inventario_piezas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `piezas_base`
--
ALTER TABLE `piezas_base`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `transacciones_tienda`
--
ALTER TABLE `transacciones_tienda`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `autos_jugador`
--
ALTER TABLE `autos_jugador`
  ADD CONSTRAINT `autos_jugador_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `autos_jugador_ibfk_2` FOREIGN KEY (`auto_base_id`) REFERENCES `autos_base` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `auto_piezas_equipadas`
--
ALTER TABLE `auto_piezas_equipadas`
  ADD CONSTRAINT `auto_piezas_equipadas_ibfk_1` FOREIGN KEY (`auto_jugador_id`) REFERENCES `autos_jugador` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `auto_piezas_equipadas_ibfk_2` FOREIGN KEY (`pieza_base_id`) REFERENCES `piezas_base` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `inventario_piezas`
--
ALTER TABLE `inventario_piezas`
  ADD CONSTRAINT `inventario_piezas_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `inventario_piezas_ibfk_2` FOREIGN KEY (`pieza_base_id`) REFERENCES `piezas_base` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `transacciones_tienda`
--
ALTER TABLE `transacciones_tienda`
  ADD CONSTRAINT `transacciones_tienda_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
