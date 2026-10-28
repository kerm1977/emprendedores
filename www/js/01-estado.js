/* 01-estado.js - Estado global y datos de muestra */

var App = {
    data: null,
    vistaActual: 'view-inicio',
    filtroCategoria: '',
    syncEstado: 'off' // 'ok' | 'pend' | 'off' | 'spin'
};

var STORAGE_KEY = 'emprende-data';
var DATA_VERSION = 3;
var API_URL = '/api/data';

/* Datos de muestra para la primera ejecución (offline-first) */
function datosSemilla() {
    return {
        version: DATA_VERSION,
        emprendimientos: [
            {
                id: 1,
                nombre: 'Café Nube',
                categoria: 'Cafetería',
                lugar: 'San José Centro',
                estado: 'destacado',
                telefono: '+506 2222 1001'
            },
            {
                id: 2,
                nombre: 'TechFix CR',
                categoria: 'Computación y celulares',
                lugar: 'Heredia',
                estado: 'activo',
                telefono: '+506 2222 1002'
            },
            {
                id: 3,
                nombre: 'Boutique Luna',
                categoria: 'Moda y accesorios',
                lugar: 'Alajuela',
                estado: 'nuevo',
                telefono: '+506 2222 1003'
            },
            {
                id: 4,
                nombre: 'Artesanías Mora',
                categoria: 'Artesanía',
                lugar: 'Cartago',
                estado: 'activo',
                telefono: '+506 2222 1004'
            },
            {
                id: 5,
                nombre: 'Sabor Casero',
                categoria: 'Restaurante',
                lugar: 'San José',
                estado: 'activo',
                telefono: '+506 2222 1005'
            },
            {
                id: 6,
                nombre: 'Verde Hogar',
                categoria: 'Jardinería',
                lugar: 'Heredia',
                estado: 'nuevo',
                telefono: '+506 2222 1006'
            }
        ],
        emprendedores: [
            { id: 1, nombre: 'Ana Solís', emprendimiento: 'Café Nube', telefono: '+506 8888 1111', whatsapp: true },
            { id: 2, nombre: 'Carlos Mora', emprendimiento: 'Artesanías Mora', telefono: '+506 8888 2222', whatsapp: true },
            { id: 3, nombre: 'Lucía Fernández', emprendimiento: 'Boutique Luna', telefono: '+506 8888 3333', whatsapp: false },
            { id: 4, nombre: 'Pedro Vargas', emprendimiento: 'TechFix CR', telefono: '+506 8888 4444', whatsapp: true }
        ],
        notas: [
            {
                id: 1,
                titulo: 'Feria de emprendedores',
                texto: 'Confirmar espacio, mesa, mantel y material promocional.'
            },
            {
                id: 2,
                titulo: 'Ideas de alianzas',
                texto: 'Contactar emprendimientos de comida para combos cruzados.'
            }
        ]
    };
}
