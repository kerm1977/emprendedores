/* 00-categorias.js - Catálogo de categorías de emprendimientos.
   Cada grupo tiene ícono propio; los chips filtran la vista Negocios. */

var CATEGORIAS = [
    { grupo: 'Alimentación', icono: 'fa-utensils', items: [
        ['Cafetería', 'fa-mug-saucer'],
        ['Restaurante', 'fa-utensils'],
        ['Soda', 'fa-bowl-food'],
        ['Panadería', 'fa-bread-slice'],
        ['Pastelería', 'fa-cake-candles'],
        ['Repostería', 'fa-ice-cream'],
        ['Huevero', 'fa-egg'],
        ['Verdurero', 'fa-carrot'],
        ['Cocinero', 'fa-kitchen-set'],
        ['Catering', 'fa-bell-concierge']
    ]},
    { grupo: 'Estadía', icono: 'fa-bed', items: [
        ['Hotel', 'fa-hotel'],
        ['Hostal', 'fa-bed'],
        ['Cabinas', 'fa-house-chimney'],
        ['Camping', 'fa-tent'],
        ['Agencia de viajes', 'fa-plane'],
        ['Agencia de turismo local', 'fa-map-location-dot']
    ]},
    { grupo: 'Belleza y cuidado', icono: 'fa-spa', items: [
        ['Peluquería', 'fa-scissors'],
        ['Barbería', 'fa-user'],
        ['Manicurista', 'fa-hand-sparkles'],
        ['Pedicurista', 'fa-foot'],
        ['Podólogo', 'fa-user-doctor'],
        ['Estética', 'fa-face-smile'],
        ['Perfumería', 'fa-spray-can-sparkles'],
        ['Masajista', 'fa-hands']
    ]},
    { grupo: 'Mecánica', icono: 'fa-gears', items: [
        ['Mecánico automotriz', 'fa-car'],
        ['Mecánico de motos', 'fa-motorcycle'],
        ['Electromecánico', 'fa-bolt'],
        ['Enderezado y pintura', 'fa-spray-can'],
        ['Llantas', 'fa-circle-notch'],
        ['Autorrepuestos', 'fa-gears'],
        ['Cambio de aceite', 'fa-oil-can'],
        ['Fibra de vidrio', 'fa-layer-group']
    ]},
    { grupo: 'Comercio y ventas', icono: 'fa-tag', items: [
        ['Venta de autos', 'fa-car-side'],
        ['Ferretería', 'fa-toolbox'],
        ['Bicicletas', 'fa-bicycle'],
        ['Pulpería / Abastecedor', 'fa-basket-shopping'],
        ['Distribuidor de gas', 'fa-fire'],
        ['Lotería / Chances / Tiempos', 'fa-ticket'],
        ['Joyería', 'fa-gem'],
        ['Reciclaje de metales', 'fa-recycle']
    ]},
    { grupo: 'Electrónica', icono: 'fa-plug', items: [
        ['Técnico en electrónica', 'fa-microchip'],
        ['Línea blanca', 'fa-jug-detergent'],
        ['Refrigeración', 'fa-snowflake'],
        ['Computación y celulares', 'fa-laptop']
    ]},
    { grupo: 'Informática', icono: 'fa-laptop-code', items: [
        ['Soporte técnico informático', 'fa-headset'],
        ['Programador', 'fa-code'],
        ['Desarrollo web', 'fa-globe'],
        ['Redes y cableado', 'fa-network-wired'],
        ['Impresión 3D', 'fa-cube'],
        ['Sublimado', 'fa-mug-hot'],
        ['Corte y grabado láser', 'fa-bolt-lightning'],
        ['Reparación de impresoras', 'fa-print']
    ]},
    { grupo: 'Mascotas', icono: 'fa-paw', items: [
        ['Veterinaria', 'fa-stethoscope'],
        ['Grooming', 'fa-dog'],
        ['Pet shop', 'fa-paw'],
        ['Paseador de perros', 'fa-person-walking'],
        ['Cuidador de mascotas', 'fa-heart']
    ]},
    { grupo: 'Hogar y construcción', icono: 'fa-house-chimney', items: [
        ['Fontanería', 'fa-faucet'],
        ['Carpintería', 'fa-hammer'],
        ['Electricista', 'fa-plug-circle-bolt'],
        ['Albañilería', 'fa-trowel-bricks'],
        ['Pintura', 'fa-paint-roller'],
        ['Decoración de interiores', 'fa-couch'],
        ['Jardinería', 'fa-seedling'],
        ['Cerrajería', 'fa-key'],
        ['Fumigación', 'fa-spray-can-sparkles'],
        ['Exterminio de plagas', 'fa-bug-slash'],
        ['Limpieza de tanques sépticos', 'fa-bucket'],
        ['Vidrios y acrílicos', 'fa-window-restore'],
        ['Vivero / Venta de plantas', 'fa-leaf']
    ]},
    { grupo: 'Salud', icono: 'fa-briefcase-medical', items: [
        ['Farmacia', 'fa-prescription-bottle-medical'],
        ['Óptica', 'fa-glasses'],
        ['Odontología', 'fa-tooth'],
        ['Fisioterapia', 'fa-hospital-user'],
        ['Psicología', 'fa-brain'],
        ['Clínica médica', 'fa-hospital'],
        ['Médico general', 'fa-user-doctor'],
        ['Laboratorio clínico', 'fa-vials'],
        ['Ultrasonido', 'fa-heart-pulse'],
        ['Rayos X', 'fa-x-ray'],
        ['Cuidador de pacientes', 'fa-hand-holding-heart'],
        ['Cuidador de adulto mayor', 'fa-person-cane'],
        ['Microbiótica', 'fa-bacteria']
    ]},
    { grupo: 'Deporte', icono: 'fa-dumbbell', items: [
        ['Gimnasio', 'fa-dumbbell'],
        ['CrossFit', 'fa-weight-hanging'],
        ['Yoga', 'fa-hands-praying'],
        ['Natación', 'fa-person-swimming'],
        ['Artes marciales', 'fa-hand-fist'],
        ['Personal trainer', 'fa-person-running'],
        ['Senderismo', 'fa-person-hiking'],
        ['Zumba', 'fa-person-dancing'],
        ['Trail running', 'fa-mountain-sun']
    ]},
    { grupo: 'Educación y clases', icono: 'fa-graduation-cap', items: [
        ['Profesor de inglés', 'fa-language'],
        ['Profesor de español', 'fa-book'],
        ['Profesor de estudios sociales', 'fa-landmark'],
        ['Profesor de matemáticas', 'fa-square-root-variable'],
        ['Profesor de francés', 'fa-language'],
        ['Profesor particular', 'fa-chalkboard-user'],
        ['Tutorías', 'fa-graduation-cap']
    ]},
    { grupo: 'Legal y contable', icono: 'fa-scale-balanced', items: [
        ['Abogado', 'fa-scale-balanced'],
        ['Contador', 'fa-calculator'],
        ['Notario', 'fa-file-signature']
    ]},
    { grupo: 'Costura y confección', icono: 'fa-shirt', items: [
        ['Diseño', 'fa-pen-ruler'],
        ['Confección', 'fa-shirt'],
        ['Costura', 'fa-scissors'],
        ['Reparaciones de ropa', 'fa-wrench'],
        ['Zapatero', 'fa-shoe-prints'],
        ['Sastrería', 'fa-user-tie'],
        ['Tapicería', 'fa-couch'],
        ['Tejido y crochet', 'fa-socks'],
        ['Amigurumi', 'fa-cat'],
        ['Profesor de manualidades', 'fa-person-chalkboard']
    ]},
    { grupo: 'Arte', icono: 'fa-palette', items: [
        ['Pintor artístico', 'fa-palette'],
        ['Ilustrador', 'fa-pen-nib'],
        ['Muralista', 'fa-paint-roller'],
        ['Escultor', 'fa-monument'],
        ['Cuentacuentos', 'fa-book-open-reader'],
        ['Caricaturista', 'fa-face-laugh'],
        ['Tatuador', 'fa-pen-fancy']
    ]},
    { grupo: 'Fiesta y regalos', icono: 'fa-gift', items: [
        ['Piñatas', 'fa-gift'],
        ['Confitería', 'fa-candy-cane'],
        ['Floristería', 'fa-seedling'],
        ['Organización de eventos', 'fa-champagne-glasses'],
        ['Decoración de fiestas', 'fa-wand-magic-sparkles'],
        ['Decoración con globos', 'fa-gifts'],
        ['Globoflexia', 'fa-wand-magic-sparkles'],
        ['Alquiler de trajes', 'fa-user-tie'],
        ['Alquiler trajes de matrimonio', 'fa-ring'],
        ['Alquiler trajes de fiesta', 'fa-champagne-glasses'],
        ['Alquiler trajes de disfraces', 'fa-mask']
    ]},
    { grupo: 'Transporte y mensajería', icono: 'fa-truck-fast', items: [
        ['Transporte', 'fa-van-shuttle'],
        ['Flete', 'fa-truck'],
        ['Mudanzas', 'fa-truck-moving'],
        ['Mensajería', 'fa-boxes'],
        ['Mensajero en moto', 'fa-motorcycle'],
        ['Mensajero en auto', 'fa-car-side'],
        ['Envíos y paquetería', 'fa-box'],
        ['Taxi', 'fa-taxi'],
        ['Taxi alternativo', 'fa-car']
    ]},
    { grupo: 'Música', icono: 'fa-music', items: [
        ['Ministerio musical', 'fa-music'],
        ['Coros', 'fa-people-group'],
        ['Profesor de música', 'fa-person-chalkboard'],
        ['Banda o grupo musical', 'fa-drum']
    ]},
    { grupo: 'Otros servicios', icono: 'fa-briefcase', items: [
        ['Fotografía', 'fa-camera'],
        ['Lavandería', 'fa-soap'],
        ['Moda y accesorios', 'fa-shirt'],
        ['Artesanía', 'fa-palette'],
        ['Funeraria', 'fa-dove']
    ]}
];
