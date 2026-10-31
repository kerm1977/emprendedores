/* 00-alias.js - Sinonimos de busqueda por rubro (alias del buscador) */

var ALIAS_PLAGAS = [
    'alimaña', 'alimañas', 'cucaracha', 'abejon', 'abejón', 'avispa',
    'enjambre', 'raton', 'ratón', 'rata', 'pulga', 'zancudo', 'mosca',
    'garrapata', 'piojo', 'acaro', 'ácaro', 'termita', 'comejen',
    'comején', 'chinche', 'gusano', 'hormiga', 'araña', 'murcielago',
    'murciélago', 'plaga', 'fumigar', 'fumigador', 'desinsectar',
    'desinfeccion', 'desinfección', 'sanitizar', 'larva'
];

var ALIAS_ACEITE_TXT = [
    'aceite', 'aceites', 'lubricante', 'cambio de aceite', 'engrase',
    'grasa', 'hidraulico', 'transmision', 'filtro de aceite',
    'viscosidad', 'sae', 'atf', 'motor oil'
];

/* Calibres de aceite por digitos: "20/50", "20W50", "2050" -> 2050 */
var ALIAS_ACEITE_NUM = [
    '2050', '1040', '1540', '1030', '530', '020', '1035', '2060',
    '2560', '8090', '7590', '85140', '1090', '9040', '1015'
];

function esCalibreAceite(q) {
    var d = (q || '').replace(/\D/g, '');
    if (d.length >= 3 && ALIAS_ACEITE_NUM.some(function (a) {
        return a.indexOf(d) !== -1 || d.indexOf(a) !== -1;
    })) return true;
    return ALIAS_ACEITE_TXT.some(function (a) { return aliasCoincide(a, q); });
}

var ALIAS_JOYERIA = [
    'joyeria', 'joya', 'perla', 'perlas', 'plata', 'oro', 'bronce',
    'cobre', 'anillo', 'collar', 'pulsera', 'aretes', 'dije', 'cadena',
    'bisuteria', 'diamante', 'esmeralda', 'rubi', 'compromiso',
    'argolla', 'argollas', 'alianza', 'relojeria', 'baño de oro'
];

var ALIAS_METAL = [
    'chatarra', 'chatarrero', 'chatarreros', 'fierro viejo', 'fierros',
    'metal', 'metales', 'reciclaje', 'reciclador', 'recolector',
    'aluminio', 'hierro', 'acero', 'desperdicio de metal',
    'compra de chatarra', 'chatarra electronica'
];

/* Sinonimos de busqueda: productos del verdurero y plantas */
var ALIAS_VERDURERO = [
    'tomate', 'pepino', 'zanahoria', 'naranja', 'limon', 'chayote',
    'aguacate', 'ayote', 'papa', 'cebolla', 'repollo', 'lechuga',
    'culantro', 'yuca', 'platano', 'banano', 'mango', 'piña',
    'papaya', 'melon', 'sandia', 'maracuya', 'fresa', 'uchuva',
    'guayaba', 'mandarina', 'pomelo', 'vainica', 'brocoli',
    'coliflor', 'chile dulce', 'apio', 'betarraga', 'rabano',
    'elote', 'camote', 'tiquisque', 'ñampi', 'pejibaye', 'caimito',
    'granadilla', 'guanabana', 'nispero', 'zapote', 'jocote',
    'carambola', 'toronja', 'ayote sazon', 'verdura', 'verduras',
    'fruta', 'frutas', 'hortaliza', 'legumbre', 'mini super'
];

var ALIAS_PLANTAS = [
    'vivero', 'planta', 'plantas', 'flor', 'flores', 'semilla',
    'oregano', 'albahaca', 'manzanilla', 'menta', 'hierbabuena',
    'romero', 'tomillo', 'lavanda', 'aloe vera', 'sabila',
    'eucalipto', 'ruda', 'pasiflora', 'valeriana', 'jengibre',
    'curcuma', 'tilo', 'salvia', 'toronjil', 'estevia', 'calendula',
    'boldo', 'llanten', 'sarsaparilla', 'arnica', 'equinacea',
    'maca', 'moringa', 'neem', 'anis', 'diente de leon', 'rosa',
    'orquidea', 'helecho', 'cactus', 'suculenta', 'bonsai',
    'palma', 'ficus', 'dracena', 'potus', 'sansevieria', 'monstera',
    'calatea', 'filodendro', 'anturio', 'buganvilia', 'hortensia',
    'gardenia', 'lirio', 'tulipan', 'margarita', 'geranio',
    'violeta', 'begonia', 'petunia', 'clavel', 'crisantemo',
    'girasol', 'medicinal', 'aromatica', 'hierba',
    'anis', 'cedron', 'hinojo', 'comino', 'cardamomo', 'epazote',
    'ortiga', 'siempreviva', 'lengua de suegra', 'insulina',
    'citronela', 'melisa', 'verbena', 'regaliz', 'artemisa',
    'borraja', 'damiana', 'ginseng', 'ginkgo', 'hamamelis',
    'hiperico', 'kava', 'linaza', 'milhojas', 'muicle',
    'prodigiosa', 'rompepiedras', 'sangre de grado',
    'suelda con suelda', 'te de limon', 'uva ursi',
    'yerba santa', 'zapote blanco', 'azahar', 'jazmin',
    'mano de leon', 'cordoncillo', 'guaco', 'parietaria',
    'sen', 'tila', 'espino blanco', 'fenogreco', 'mirra',
    'papaverina', 'centella asiatica', 'ashwagandha', 'alcanfor',
    'mirto', 'salvia blanca', 'mastuerzo', 'cola de caballo',
    'yerba mora', 'chaparro', 'chicalote', 'escorzonera',
    'hoja santa', 'aciano', 'barrilla', 'canela', 'clavo'
];

/* Sinonimos de busqueda: microbiotica, vitaminas y suplementos CR */
var ALIAS_MICROBIOTICA = [
    'microbiotica', 'macrobiotica', 'probiotico', 'prebiotico',
    'kefir', 'kombucha', 'flora intestinal', 'lactobacilo', 'bifidus',
    'enzima', 'fermentado', 'chucrut', 'tempeh', 'miso', 'natto',
    'vitamina', 'vitaminas', 'vitamina a', 'vitamina b', 'vitamina c',
    'vitamina d', 'vitamina e', 'vitamina k', 'complejo b', 'b12',
    'b6', 'b1', 'acido folico', 'biotina', 'niacina', 'riboflavina',
    'colageno', 'omega 3', 'omega3', 'omega 6', 'magnesio', 'zinc',
    'hierro', 'calcio', 'potasio', 'selenio', 'cromo', 'yodo',
    'coenzima q10', 'glutamina', 'luteina', 'resveratrol',
    'espirulina', 'clorella', 'te verde', 'proteina', 'creatina',
    'prostata', 'prostatitis', 'saw palmetto', 'palmito', 'licopeno',
    'sabal', 'pygeum', 'beta sitosterol', 'salud masculina',
    'neurobion', 'bedoyecta', 'tribedoce', 'redoxon', 'pharmaton',
    'centrum', 'supradyn', 'ensure', 'calcibon', 'suplemento',
    'multivitaminico', 'minerales', 'antioxidante', 'inmunologico'
];

/* Mascotas: articulos, salud y servicios -> Veterinaria / Pet shop */
var ALIAS_MASCOTAS = [
    'mascota', 'mascotas', 'perro', 'perros', 'gato', 'gatos',
    'ave', 'aves', 'loro', 'periquito', 'cachorro', 'puppy',
    'veterinaria', 'veterinario', 'pet shop', 'petshop',
    'alimento para perros', 'alimento para gatos', 'concentrado',
    'comida para perros', 'comedero', 'bebedero', 'collar',
    'collarin', 'collarines', 'correa', 'arnes', 'placa de mascota',
    'desparasitante', 'vermifugo', 'antipulgas', 'pipeta',
    'castracion', 'esterilizacion', 'esterilizar', 'vacunas',
    'vacuna antirrabica', 'jaula', 'transportin', 'arenero',
    'arena para gatos', 'shampoo para perros', 'peluqueria canina',
    'baño para perros', 'juguete para perro', 'hueso', 'raza',
    'adopcion', 'adoptar', 'sarnicida', 'garrapaticida'
];

/* Grooming / estetica canina */
var ALIAS_GROOMING = [
    'grooming', 'peinar', 'peinado', 'cepillar', 'cepillado',
    'limpieza', 'lavado', 'bañado', 'baño', 'bañar',
    'peluqueria canina', 'peluqueria de mascotas', 'estetica canina',
    'estetica de mascotas', 'spa para perros', 'corte de pelo',
    'corte de uñas', 'corta uñas', 'cortauñas', 'recorte',
    'limpieza de oidos', 'higiene canina', 'higiene de mascotas',
    'arreglo de mascota', 'aseo de mascotas', 'deslanado',
    'peinado de perro', 'perfume para perros', 'desenredado'
];

/* Tabla de recomendaciones por rubro: [alias, [[categoria, grupo, icono]]] */
var ALIAS_TABLA = [
    [ALIAS_PLAGAS, [
        ['Fumigación', 'Hogar y construcción', 'fa-spray-can-sparkles'],
        ['Exterminio de plagas', 'Hogar y construcción', 'fa-bug-slash']]],
    [ALIAS_JOYERIA, [
        ['Joyería', 'Comercio y ventas', 'fa-gem']]],
    [ALIAS_METAL, [
        ['Reciclaje de metales', 'Comercio y ventas', 'fa-recycle']]],
    [ALIAS_VERDURERO, [
        ['Verdurero', 'Alimentación', 'fa-carrot']]],
    [ALIAS_PLANTAS, [
        ['Vivero / Venta de plantas', 'Hogar y construcción', 'fa-leaf']]],
    [ALIAS_MICROBIOTICA, [
        ['Microbiótica', 'Salud', 'fa-bacteria']]],
    [ALIAS_MASCOTAS, [
        ['Veterinaria', 'Mascotas', 'fa-user-doctor'],
        ['Pet shop', 'Mascotas', 'fa-paw']]],
    [ALIAS_GROOMING, [
        ['Grooming', 'Mascotas', 'fa-scissors'],
        ['Pet shop', 'Mascotas', 'fa-paw']]]
];

/* Palabras clave por categoria: cubre terminos comunes de busqueda
   para los ~150 rubros del catalogo. [ [aliases], [[cat,grupo,icono]] ] */
var ALIAS_GENERAL = [
    [['pizza','hamburguesa','sushi','pollo','comida rapida','almuerzo','desayuno','cena','cafesito','bufet','mariscos','ceviche','gallo pinto','casado','soda tipica'], [['Restaurante','Alimentación','fa-utensils'],['Cafetería','Alimentación','fa-mug-saucer'],['Soda','Alimentación','fa-bowl-food']]],
    [['pan','panes','bizcocho','queque','torta','pastel','galleta','donas','empanada','croissant','repostera'], [['Panadería','Alimentación','fa-bread-slice'],['Pastelería','Alimentación','fa-cake-candles'],['Repostería','Alimentación','fa-ice-cream']]],
    [['chef','comida a domicilio','catering','banquete','buffet evento'], [['Cocinero','Alimentación','fa-kitchen-set'],['Catering','Alimentación','fa-bell-concierge']]],
    [['hotel','hostal','cabina','cabaña','hospedaje','posada','airbnb','alojamiento','quedarse','dormir','motel','resort','albergue'], [['Hotel','Estadía','fa-hotel'],['Hostal','Estadía','fa-bed'],['Cabañas','Estadía','fa-house']],],
    [['agencia de viajes','tour','tours','guia turistico','paseo','excursion','viajes','paquete turistico','centro turistico','atracciones','mirador','parque tematico'], [['Agencia de viajes','Estadía','fa-plane'],['Agencia de turismo local','Estadía','fa-map-location-dot'],['Centro turístico','Estadía','fa-mountain-city']]],
    [['peluqueria','barberia','corte de cabello','corte de pelo','tinte','alisado','uñas','manicure','pedicure','pestañas','cejas','maquillaje','mica','micropigmentacion','depilacion','wax','facial','barbero'], [['Peluquería','Belleza y cuidado','fa-scissors'],['Barbería','Belleza y cuidado','fa-scissors'],['Manicurista','Belleza y cuidado','fa-hand-sparkles'],['Depilación','Belleza y cuidado','fa-spa']]],
    [['perfume','fragancia','colonia','aroma'], [['Perfumería','Belleza y cuidado','fa-spray-can']]],
    [['masaje','masajes','relajante','terapeutico','espalda','quiropractico','quiropraxia','ajuste quiropractico'], [['Masajista','Belleza y cuidado','fa-hands'],['Fisioterapia','Salud','fa-hospital-user'],['Quiropráctico','Salud','fa-spine']]],
    [['arreglo de carro','taller','taller mecanico','frenos','llantas','pailas','cauchos','alineacion','aceite motor','mecanico','mecanico automotriz','motor','transmision','suspension','bateria','radiador','escape','inyeccion','scaner','diagnostico'], [['Mecánico automotriz','Mecánica','fa-car'],['Cambio de aceite','Mecánica','fa-oil-can'],['Llantas','Mecánica','fa-circle-notch'],['Autorrepuestos','Mecánica','fa-gears']]],
    [['moto','motocicleta','taller de motos','arreglo moto'], [['Mecánico de motos','Mecánica','fa-motorcycle']]],
    [['laminado','enderezado','pintura de carro','carroceria','choque','abolladura','pulitura'], [['Enderezado y pintura','Mecánica','fa-spray-can']]],
    [['lavadora','refrigeradora','cocina','estufa','secadora','microondas','nevera','linea blanca','electrodomestico','televisor','pantalla','radio','parlante','celular','tablet','impresora'], [['Técnico en electrónica','Electrónica','fa-microchip'],['Línea blanca','Electrónica','fa-plug']]],
    [['computadora','laptop','pc','software','pagina web','programacion','app','aplicacion','desarrollador','hacker','virus computadora','formateo','instalacion de programas','redes','wifi','cableado','camara de seguridad'], [['Soporte técnico informático','Informática','fa-laptop'],['Programador','Informática','fa-code'],['Desarrollo web','Informática','fa-globe'],['Redes y cableado','Informática','fa-network-wired'],['Reparación de impresoras','Informática','fa-print']]],
    [['impresora 3d','3d print','figura 3d','prototipo','sublimar','sublimacion','taza personalizada','camiseta personalizada','laser','grabado','corte laser','vinilo','rotulo'], [['Impresión 3D','Informática','fa-cube'],['Sublimado','Informática','fa-shirt'],['Corte y grabado láser','Informática','fa-bolt']]],
    [['veterinario','vet','castrar','esterilizar','vacuna perro','vacuna gato','emergencia mascota','animal enfermo'], [['Veterinaria','Mascotas','fa-user-doctor']]],
    [['plomero','plomero urgente','fuga','tuberia','destape','inodoro','sanitario','grifo','llave de agua','calentador','agua caliente'], [['Fontanería','Hogar y construcción','fa-faucet']]],
    [['madera','carpintero','mueble','closet','cocina integral','tarima','puerta','ventana de madera'], [['Carpintería','Hogar y construcción','fa-hammer']]],
    [['electricidad','luz','apagon','interruptor','tomacorriente','cable','breaker','panel electrico','corto circuito'], [['Electricista','Hogar y construcción','fa-plug-circle-bolt']]],
    [['construccion','obra','cemento','block','repello','ceramica','techo','cielorraso','cimiento','remodelacion','ampliacion'], [['Albañilería','Hogar y construcción','fa-trowel-bricks']]],
    [['pintar casa','pintor','pintura de pared','barniz','lacado'], [['Pintura','Hogar y construcción','fa-paint-roller'],['Pintor artístico','Arte','fa-palette']]],
    [['llave','copia de llave','cerradura','cerrado','abrir carro','abrir casa','combinacion'], [['Cerrajería','Hogar y construcción','fa-key']]],
    [['farmacia','medicina','medicamento','receta','pastilla','antibiotico','inyeccion','suero','curita'], [['Farmacia','Salud','fa-prescription-bottle-medical']]],
    [['lentes','gafas','anteojos','lente de contacto','vista','optometria','armazon'], [['Óptica','Salud','fa-glasses']]],
    [['dentista','diente','muela','ortodoncia','brackets','limpieza dental','calza','endodoncia','dolor de muela'], [['Odontología','Salud','fa-tooth']]],
    [['psicologo','terapia','ansiedad','depresion','estres','terapeuta','consejeria'], [['Psicología','Salud','fa-brain']]],
    [['hospital','clinica','doctor','medico','consulta medica','emergencia','enfermo','diabetes','presion','chequeo'], [['Clínica médica','Salud','fa-hospital'],['Médico general','Salud','fa-user-doctor']]],
    [['embarazo','ultrasonido','radiografia','placa','radiologia','analisis de sangre','examen de sangre','orina','heces','laboratorio'], [['Ultrasonido','Salud','fa-heart-pulse'],['Rayos X','Salud','fa-x-ray'],['Laboratorio clínico','Salud','fa-vials']]],
    [['gym','pesas','entrenamiento','crossfit','yoga','pilates','zumba','box','karate','taekwondo','judo','artes marciales','personal trainer','natacion','piscina','senderismo','trail','caminata','montaña'], [['Gimnasio','Deporte','fa-dumbbell'],['CrossFit','Deporte','fa-dumbbell'],['Yoga','Deporte','fa-spa'],['Zumba','Deporte','fa-music'],['Natación','Deporte','fa-person-swimming'],['Artes marciales','Deporte','fa-hand-fist'],['Personal trainer','Deporte','fa-dumbbell'],['Senderismo','Deporte','fa-person-hiking'],['Trail running','Deporte','fa-person-running']]],
    [['abogado','legal','demanda','divorcio','sucesion','testamento','notario','escritura','contrato','contador','contadora','impuestos','hacienda','planilla','contabilidad','patente','permiso','traspaso','herencia'], [['Abogado','Legal y contable','fa-gavel'],['Notario','Legal y contable','fa-stamp'],['Contador','Legal y contable','fa-calculator']]],
    [['costura','costurera','sastre','modista','arreglo de ropa','dobladillo','zipper','cierre','ropa a medida','confeccion','patron','maquina de coser'], [['Costura','Costura y confección','fa-scissors'],['Sastrería','Costura y confección','fa-user-tie'],['Confección','Costura y confección','fa-shirt'],['Diseño','Costura y confección','fa-pen-ruler'],['Reparaciones de ropa','Costura y confección','fa-shirt']]],
    [['zapato','zapatos','tenis','calzado','arreglo de zapatos','suela','tacon','bolso','maleta','cartera','cinturon','cuero'], [['Zapatero','Costura y confección','fa-shoe-prints']]],
    [['tapizado','tapiceria','sofa','sillon','colchon','cojines'], [['Tapicería','Costura y confección','fa-couch']]],
    [['tejido','crochet','amigurumi','manualidades','bordado','tejer'], [['Tejido y crochet','Costura y confección','fa-shirt'],['Amigurumi','Costura y confección','fa-palette'],['Profesor de manualidades','Costura y confección','fa-palette'],['Artesanía','Otros servicios','fa-palette']]],
    [['piñata','cumpleaños','fiesta infantil','arco de globos','globos','regalo','souvenir','flores','arreglo floral','ramo','floristeria','evento','boda','matrimonio','quince años','bautizo','animador','dj','sonido','karaoke'], [['Piñatas','Fiesta y regalos','fa-gift'],['Decoración con globos','Fiesta y regalos','fa-gifts'],['Globoflexia','Fiesta y regalos','fa-wand-magic-sparkles'],['Confitería','Fiesta y regalos','fa-candy-cane'],['Floristería','Fiesta y regalos','fa-seedling'],['Organización de eventos','Fiesta y regalos','fa-champagne-glasses'],['Decoración de fiestas','Fiesta y regalos','fa-wand-magic-sparkles'],['Alquiler de trajes','Fiesta y regalos','fa-user-tie'],['Alquiler trajes de matrimonio','Fiesta y regalos','fa-ring'],['Alquiler trajes de fiesta','Fiesta y regalos','fa-champagne-glasses'],['Alquiler trajes de disfraces','Fiesta y regalos','fa-mask']]],
    [['mudanza','flete','camion','traslado','envio','paquete','correo','encomienda','delivery','motorizado','taxi','uber','didi','bus','viaje'], [['Mudanzas','Transporte y mensajería','fa-truck-moving'],['Flete','Transporte y mensajería','fa-truck'],['Mensajería','Transporte y mensajería','fa-boxes'],['Mensajero en moto','Transporte y mensajería','fa-motorcycle'],['Mensajero en auto','Transporte y mensajería','fa-car-side'],['Envíos y paquetería','Transporte y mensajería','fa-box'],['Taxi','Transporte y mensajería','fa-taxi'],['Taxi alternativo','Transporte y mensajería','fa-car'],['Transporte','Transporte y mensajería','fa-van-shuttle']]],
    [['musica','canto','cantante','coro','iglesia','adoracion','alabanza','ministerio','banda','grupo musical','marimba','cimarrona','musica en vivo','musica para fiesta','guitarra','piano','violin','clases de musica','solfeo','clases de canto'], [['Ministerio musical','Música','fa-music'],['Coros','Música','fa-people-group'],['Profesor de música','Música','fa-graduation-cap'],['Banda o grupo musical','Música','fa-guitar']]],
    [['tienda','pulperia','abastecedor','minisuper','abarrotes','licorera','cigarros','vape','comisariato','viveres'], [['Pulpería / Abastecedor','Comercio y ventas','fa-basket-shopping'],['Verdurero','Alimentación','fa-carrot'],['Huevero','Alimentación','fa-egg']]],
    [['carro usado','auto usado','vehiculo','vendo carro','compra venta de autos','agencia de autos','financiamiento'], [['Venta de autos','Comercio y ventas','fa-car-side']]],
    [['ferreteria','tornillos','herramientas','clavos','zinc','materiales de construccion'], [['Ferretería','Comercio y ventas','fa-toolbox']]],
    [['bicicleta','bici','ciclismo','arreglo de bici','repuestos de bici','rin 26','rin 29'], [['Bicicletas','Comercio y ventas','fa-bicycle']]],
    [['gas','cilindro de gas','gas lp','propano','cocina de gas'], [['Distribuidor de gas','Comercio y ventas','fa-fire']]],
    [['rifa','chance','tiempos','loteria nacional','jps','numero ganador'], [['Lotería / Chances / Tiempos','Comercio y ventas','fa-ticket']]],
    [['ingles','español','matematica','fisica','quimica','estudios sociales','frances','tutor','tutoria','clases particulares','profesor','maestro','examen','admision','colegio','escuela','kinder','preescolar','niñera','guarderia'], [['Profesor de inglés','Educación y clases','fa-graduation-cap'],['Profesor de español','Educación y clases','fa-graduation-cap'],['Profesor de matemáticas','Educación y clases','fa-graduation-cap'],['Profesor de estudios sociales','Educación y clases','fa-graduation-cap'],['Profesor de francés','Educación y clases','fa-graduation-cap'],['Profesor particular','Educación y clases','fa-graduation-cap'],['Tutorías','Educación y clases','fa-book-open']]],
    [['foto','fotografia','fotografo','sesion de fotos','foto de boda','foto profesional','drone','video'], [['Fotografía','Otros servicios','fa-camera']]],
    [['ropa','vestido','camisa','pantalon','moda','boutique','accesorios','reloj','lentes de sol'], [['Moda y accesorios','Otros servicios','fa-shirt'],['Joyería','Comercio y ventas','fa-gem']]],
    [['velorio','funeral','ataud','urna','cementerio','cremacion','servicio funebre'], [['Funeraria','Otros servicios','fa-dove']]],
    [['lavar ropa','lavanderia','planchado','tintoreria','edredon','cobija'], [['Lavandería','Otros servicios','fa-soap']]],
    [['empeno','casa de empeno','prendario','prenda','compra venta usados','pawn'], [['Casa de empeño','Comercio y ventas','fa-hand-holding-dollar']]],
    [['salon de fiestas','salon de eventos','animador','payaso','payasito','animacion infantil','show infantil','sonido','luces','iluminacion','sonido para fiesta','animador de fiestas'], [['Salón de fiestas','Fiesta y regalos','fa-people-roof'],['Sonido e iluminación','Fiesta y regalos','fa-volume-high'],['Animador / Payaso','Fiesta y regalos','fa-face-grin-stars'],['Animación infantil','Fiesta y regalos','fa-children'],['Organización de eventos','Fiesta y regalos','fa-champagne-glasses']]],
    [['mariachi','mariachis','serenata','rancheras','musica mexicana'], [['Mariachi','Música','fa-guitar'],['Banda o grupo musical','Música','fa-drum']]],
    [['inmobiliaria','bienes raices','real estate','vendo casa','compra casa','alquiler casa','corredor de propiedades','agente de bienes raices'], [['Agente inmobiliario','Bienes raíces','fa-house-user'],['Administrador de condominios','Bienes raíces','fa-building-user']]],
    [['condominio','administrador de condominio','junta de condominio','administrar condominio'], [['Administrador de condominios','Bienes raíces','fa-building-user']]],
    [['bodega','guardamuebles','almacenamiento','deposito','self storage','alquiler de bodega'], [['Guardamuebles / Bodega','Bienes raíces','fa-warehouse']]],
    [['guarderia','cuido','kinder','prekinder','niñera','cuidado de niños','daycare','preescolar','maternal'], [['Guardería / Cuido / Kinder','Educación y clases','fa-baby-carriage']]],
    [['baile','danza','academia de baile','clases de baile','ballet','salsa','bachata','folclor','tango','hip hop dance'], [['Academia de baile','Educación y clases','fa-person-dancing'],['Zumba','Deporte','fa-person-dancing']]],
    [['escuela de manejo','clases de manejo','licencia','conducir','aprender a manejar','instructor de manejo','sacar licencia','b1'], [['Escuela de manejo','Educación y clases','fa-id-card']]],
    [['nutricionista','nutricion','dieta','bajar de peso','plan alimenticio','dietista','alimentacion saludable','control de peso'], [['Nutricionista','Salud','fa-apple-whole']]],
    [['enfermera','enfermeria','enfermera a domicilio','cuidado en casa','inyeccion a domicilio','suero a domicilio','curaciones'], [['Enfermera a domicilio','Salud','fa-user-nurse'],['Cuidador de pacientes','Salud','fa-hand-holding-heart']]],
    [['fruta','frutas','fruteria','fruta fresca','piña','mango','banano','papaya'], [['Frutería','Alimentación','fa-lemon'],['Verdurero','Alimentación','fa-carrot']]],
    [['helado','helados','heladeria','paleta','pops','nieve','granizado'], [['Heladería','Alimentación','fa-ice-cream'],['Repostería','Alimentación','fa-ice-cream']]],
    [['taekwondo','karate','jiu jitsu','jiujitsu','judo','mma','kickboxing','full contact','artes mixtas','artes marciales mixtas','defensa personal','dojo','artes marciales academia','clases de karate','clases de taekwondo'], [['Artes marciales','Deporte','fa-hand-fist']]],
    [['instrumentos musicales','venta de instrumentos','teclado','bateria musical','alquiler de equipos musicales','equipos de sonido','sonidista','tecnico de sonido','bocina','amplificador','consola de sonido','dj','deejay','disc jockey'], [['DJ','Música','fa-compact-disc'],['Venta de instrumentos musicales','Música','fa-guitar'],['Alquiler de equipos musicales','Música','fa-dolly'],['Sonidista','Música','fa-headphones'],['Sonido e iluminación','Fiesta y regalos','fa-volume-high']]]
];

ALIAS_GENERAL.forEach(function (t) { ALIAS_TABLA.push(t); });

/* Ferreteria: ~100 herramientas y materiales */
var ALIAS_FERRETERIA = [
    'ferreteria', 'martillo', 'mazo', 'destornillador plano',
    'destornillador philips', 'destornillador estrella',
    'destornillador corona', 'destornillador', 'serrucho', 'sierra',
    'sierra circular', 'sierra caladora', 'taladro', 'taladro inalambrico',
    'broca', 'mecha', 'amoladora', 'esmeril', 'lijadora', 'laja',
    'pulidora', 'remachadora', 'remache', 'tuerca', 'tornillo',
    'aronela', 'arandela', 'taquete', 'clavo', 'clavos', 'alambre',
    'alambre de puas', 'alambre galvanizado', 'grapa', 'grapas',
    'pegamento', 'pegamento pvc', 'silicona', 'silicone', 'epoxico',
    'resina', 'cinta adhesiva', 'cinta de aislar', 'cinta metrica',
    'flexometro', 'nivel', 'plomada', 'regla metalica', 'escuadra',
    'compas', 'lapiz de carpintero', 'tiza', 'marcador',
    'tubo pvc', 'tubo galvanizado', 'tubo', 'codo pvc', 'tee pvc',
    'union pvc', 'adaptador pvc', 'laminas de zinc', 'zinc',
    'clavo de zinc', 'tornillo autoperforante', 'cemento', 'cal',
    'arena', 'gravilla', 'lastre', 'concreto', 'mortero', 'yeso',
    'estuco', 'sellador', 'impermeabilizante', 'pintura en lata',
    'brocha', 'rodillo', 'bandeja de pintura', 'cubeta', 'carretilla',
    'pala', 'rastrillo', 'azadon', 'barreta', 'pico', 'machete',
    'hacha', 'llave ajustable', 'llave inglesa', 'llave de tubo',
    'llave allen', 'dados', 'matraca', 'extension', 'pinza',
    'pinzas', 'alicate', 'tenaza', 'cortafio', 'navaja', 'cuchilla',
    'caja de herramientas', 'cinturon de herramientas', 'guantes',
    'casco', 'gafas de seguridad', 'mascarilla', 'tapon auditivo',
    'extension electrica', 'foco', 'bombillo', 'cable electrico',
    'cinta aislante', 'breaker', 'fusible', 'toma corriente',
    'conduit', 'canaleta', 'interruptor', 'lampara'
];

ALIAS_TABLA.push([ALIAS_FERRETERIA, [
    ['Ferretería', 'Comercio y ventas', 'fa-toolbox']
]]);
