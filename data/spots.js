// Locales recomendados por parada. Verificados el 7-11-2026: cada uno tiene una fuente de 2025–2026
// que muestra que sigue abierto. Quedaron fuera Ópera Catedral (cerró), la Fuente Alemana de
// Plaza Italia (se fue del centro), el Bar Nacional de Huérfanos (cerró) y los locales sin rastro reciente.
// kind: comer | brindar | antojo | cultura. coord: OpenStreetMap (Nominatim), ajustada a mano dentro del mercado.

window.SPOTS = [
  // 3 · Bajada, Bellavista y Parque Forestal
  {
    id: "chascona", stop: "parque-forestal", kind: "cultura",
    name: "La Chascona", type: "Casa museo de Pablo Neruda", price: "$9.500 entrada general",
    note: "A dos cuadras de la base del cerro, justo al bajar. Mar–dom 10:00–18:00, lunes cerrado.",
    address: "Fernando Márquez de la Plata 0192", coord: [-70.634155, -33.43126],
    url: "https://www.encancha.cl/enlahora/panoramas/2026/02/22/casa-museo-la-chascona-ubicacion-horarios-precios-y-todo-lo-que-necesitas-saber-antes-de-visitarla/",
  },
  {
    id: "terrazas-sc", stop: "parque-forestal", kind: "brindar",
    name: "Terrazas San Cristóbal", type: "Bulevar gastronómico, abrió en 2025",
    order: "Un vermut en La Pobre Vermutería o un negroni en 7 Negronis; para comer, nikkei en Ozaki o un sándwich en Donde Zacarías.",
    note: "Frente a La Chascona, con entradas por Constitución y Chucre Manzur.",
    address: "Constitución con Chucre Manzur", coord: [-70.634649, -33.431505],
    url: "https://www.meganoticias.cl/nacional/496070-terrazas-san-cristobal-restaurantes-pdp-20-08-2025.html",
  },
  {
    id: "patio-bellavista", stop: "parque-forestal", kind: "comer",
    name: "Patio Bellavista", type: "Patio de restaurantes y tiendas",
    order: "Una vuelta por las tiendas de artesanía chilena y algo para picar en una terraza.",
    note: "Más de 20 restaurantes. Las guías recomiendan esquivar los cafés turísticos de la calle Pío Nono.",
    address: "Constitución 30–70", coord: [-70.634822, -33.434256],
    url: "https://www.patiobellavista.cl/",
  },
  {
    id: "galindo", stop: "parque-forestal", kind: "comer",
    name: "Galindo", type: "Comida chilena clásica", price: "$10.000–30.000 por persona",
    order: "Pastel de choclo o cazuela.",
    note: "Mar–jue 11:30–23:00, vie–sáb hasta 00:00, dom hasta 22:00. Lunes cerrado.",
    address: "Dardignac 098", coord: [-70.634954, -33.433091],
    url: "https://restaurantguru.com/Galindo-Santiago",
  },
  {
    id: "castillo-forestal", stop: "parque-forestal", kind: "antojo",
    name: "Castillo Forestal", type: "Brasserie francesa en un castillito del parque", price: "Brunch ~$12.000–20.000",
    order: "Brunch en la terraza.",
    note: "Todos los días desde las 10:00. Reserven la terraza el fin de semana.",
    address: "Cardenal José María Caro 390", coord: [-70.642667, -33.435152],
    url: "https://www.encancha.cl/enlahora/panoramas/2025/05/04/la-magia-de-francia-en-el-corazon-de-santiago-este-castillo-es-ideal-para-disfrutar-del-otono/",
  },
  {
    id: "mnba", stop: "parque-forestal", kind: "cultura",
    name: "Museo Nacional de Bellas Artes", type: "Museo · entrada gratis",
    note: "Mar–dom 10:00–18:30, lunes cerrado. En noviembre de 2026 hay muestras de Enrique Ramírez y de Matta.",
    address: "José Miguel de la Barra 650", coord: [-70.643578, -33.435339],
    url: "https://www.mnba.gob.cl/",
  },

  // 4 · Mercado Central
  {
    id: "el-galeon", stop: "mercado-central", kind: "comer",
    name: "El Galeón", type: "Marisquería desde 1935 · locales 26 y 80", price: "~$12.000–16.000 por persona; la centolla, bastante más",
    order: "Ceviche mixto, paila marina, pastel de jaibas o pescado «cancato» (con ajo, cebolla, tomate y queso).",
    note: "La mejor evaluada del mercado: 4,7 en Google con más de 8.000 opiniones.",
    address: "San Pablo 943, local 26", coord: [-70.65092, -33.43411],
    url: "https://restaurantguru.com/El-Galeon-Restaurante-and-Mariscos-Santiago",
  },
  {
    id: "pailas-blancas", stop: "mercado-central", kind: "comer",
    name: "Pailas Blancas", type: "Cocinería clásica · local 121", price: "$5.000–30.000 por persona",
    order: "Paila marina «suprema», ceviche XL o empanadas de camarón queso.",
    note: "Mar–dom 10:30–17:00. Más barata y menos turística que los restaurantes del centro de la nave.",
    address: "Mercado Central, local 121", coord: [-70.65068, -33.43362],
    url: "https://www.santiagoturismo.cl/en/pailas-blanca-2/",
  },
  {
    id: "el-ancestral", stop: "mercado-central", kind: "comer",
    name: "El Ancestral", type: "Cocina chilena sin mariscos",
    order: "«La Reina de la Casa» (empanada de prieta con queso azul), croquetas de pernil y, de postre, leche asada.",
    note: "Para la amiga que no come mariscos. Todos los días 12:00–17:00.",
    address: "San Pablo 943", coord: [-70.65124, -33.43402],
    url: "https://www.santiagoturismo.cl/es/el-ancestral/",
  },
  {
    id: "zunino", stop: "mercado-central", kind: "antojo",
    name: "Emporio Zunino", type: "Empanadas desde 1930, en la esquina del mercado", price: "Pino $2.300 · queso $2.550",
    order: "Empanada de pino, de pie en el mesón.",
    note: "Lun–vie 9:30–17:30, sáb hasta 14:00, domingo cerrado. Suele haber fila.",
    address: "Puente 801", coord: [-70.651527, -33.434076],
    url: "https://www.encancha.cl/enlahora/panoramas/2026/04/17/el-rincon-mas-crujiente-de-santiago-donde-probar-la-empanada-con-mas-historia-y-tradicion-de-la-capital/",
  },
  {
    id: "donde-augusto", stop: "mercado-central", kind: "comer",
    name: "Donde Augusto", type: "El clásico bajo la cúpula", price: "$15.000–50.000 por persona",
    order: "Vayan por la foto y el ambiente; si se sientan, centolla o paila marina.",
    note: "Ojo: hay reseñas de cobros de más y cuentas escritas a mano. Pidan la carta con precios antes de ordenar.",
    address: "San Pablo 967", coord: [-70.65104, -33.43378],
    url: "https://restaurantguru.com/Donde-Augusto-Santiago",
  },
  {
    id: "la-piojera", stop: "mercado-central", kind: "brindar",
    name: "La Piojera", type: "Bar histórico, a una cuadra", price: "$5.000–15.000 por persona",
    order: "Un terremoto (pipeño con helado de piña) y una chorrillana para compartir.",
    note: "Lun–sáb 12:00–22:00, domingo cerrado. Es un bar de batalla en una calle movida: vayan de día.",
    address: "Aillavilú 1030", coord: [-70.65212, -33.433551],
    url: "https://www.24horas.cl/actualidad/nacional/la-piojera-anuncia-nueva-sucursal-con-capacidad-para-400-personas",
  },

  // 5 · Plaza de Armas
  {
    id: "el-rapido", stop: "plaza-de-armas", kind: "antojo",
    name: "El Rápido", type: "Fuente de soda de más de 80 años", price: "Empanada $2.950 · schop $3.990",
    order: "Empanada de pino o de queso, en el mesón.",
    note: "Bandera con Huérfanos. Lun–vie 8:00–19:00, sáb 9:00–16:00, domingo cerrado.",
    address: "Bandera 347", coord: [-70.652301, -33.439202],
    url: "https://www.latercera.com/opinion/noticia/el-rapido-al-final-como-siempre/",
  },

  // 6 · Catedral
  {
    id: "precolombino", stop: "catedral", kind: "cultura",
    name: "Museo Chileno de Arte Precolombino", type: "Museo, a una cuadra", price: "Extranjeros $12.000 · residentes $3.000 (tarifas 2025)",
    note: "Mar–dom 10:00–18:00, lunes cerrado. Gratis el día de su cumpleaños, con una acompañante.",
    address: "Bandera 361", coord: [-70.652195, -33.439025],
    url: "https://visit.precolombino.cl/",
  },
  {
    id: "cafe-precolombino", stop: "catedral", kind: "antojo",
    name: "Café Precolombino", type: "Café en el patio del museo", price: "Torta de zanahoria $5.500",
    order: "Un café con torta de zanahoria.",
    note: "Lo atiende la Fundación Edudown, que da trabajo a personas con síndrome de Down.",
    address: "Bandera 361, patio norte", coord: [-70.65206, -33.43884],
    url: "https://www.eldinamo.cl/gastronomia/resenas/2025/11/15/ojo-al-charqui-paz-en-el-centro/",
  },

  // 7 · Santa Lucía y Lastarria
  {
    id: "la-rosa", stop: "santa-lucia", kind: "antojo",
    name: "Emporio La Rosa", type: "Heladería artesanal",
    order: "Chocolate naranja, albahaca-menta-limón, miel de ulmo o maqui.",
    note: "La original, con mesas, está en Merced 291; hay otra en Lastarria 71 para llevar.",
    address: "Merced 291", coord: [-70.640698, -33.436951],
    url: "https://www.encancha.cl/enlahora/panoramas/2025/11/14/las-mejores-5-heladerias-en-santiago-ideales-para-visitar-en-este-caluroso-fin-de-semana/",
  },
  {
    id: "chipe-libre", stop: "santa-lucia", kind: "brindar",
    name: "Chipe Libre", type: "Bar de pisco · $$",
    order: "Un pisco sour con limón de verdad y un ceviche para compartir.",
    note: "Más de 100 piscos chilenos y peruanos.",
    address: "José Victorino Lastarria 282", coord: [-70.641215, -33.438333],
    url: "https://www.elmostrador.cl/revista-jengibre/gastronomia/2025/02/07/a-piscolear-se-ha-dicho-celebremos-el-dia-de-la-piscola-como-se-merece/",
  },
  {
    id: "bocanariz", stop: "santa-lucia", kind: "brindar",
    name: "Bocanáriz", type: "Bar de vinos · $$$",
    order: "Un vuelo de degustación de vinos chilenos.",
    note: "Más de 400 vinos chilenos. Reserven si van de jueves a sábado.",
    address: "José Victorino Lastarria 276", coord: [-70.64112, -33.43814],
    url: "https://www.emol.com/noticias/Economia/2026/07/23/1206371/emprendimiento-empresarios-bocanariz-vino-chile.html",
  },
  {
    id: "the-singular", stop: "santa-lucia", kind: "brindar",
    name: "Terraza de The Singular", type: "Bar en la azotea, piso 9", price: "Cócteles ~$11.000–16.000",
    order: "Un cóctel al atardecer mirando el San Cristóbal, donde partieron en la mañana.",
    note: "Abre desde las 16:00.",
    address: "Merced 294", coord: [-70.640689, -33.437277],
    url: "https://thesingular.com/santiago/dining",
  },
  {
    id: "morada", stop: "santa-lucia", kind: "antojo",
    name: "Morada Coffee", type: "Café de especialidad",
    order: "Café y torta de zanahoria, o algo de masa madre.",
    note: "Al costado poniente del cerro. Lun–vie 9:00–20:00.",
    address: "Santa Lucía 340", coord: [-70.644397, -33.439767],
    url: "https://www.santiagoturismo.cl/en/morada-coffee-2/",
  },
];
