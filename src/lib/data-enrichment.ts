const KEYWORD_MAP: Record<string, string[]> = {
  salud: ["médico", "doctor", "clínica", "hospital", "salud", "consulta", "medicina general", "medicina"],
  dentistas: ["dental", "dentista", "odontología", "dientes", "ortodoncia", "endodoncia", "implantes", "blanqueamiento"],
  veterinarias: ["veterinaria", "vet", "mascota", "perro", "gato", "animales", "veterinario"],
  farmacias: ["farmacia", "medicamento", "botica", "drugstore"],
  opticas: ["óptica", "lentes", "optometrista", "ojos", "anteojos"],
  psicologos: ["psicólogo", "psicología", "terapia", "mental", "ansiedad", "depresión"],
  restaurantes: ["restaurante", "comida", "cena", "almuerzo", "buffet", "mariscos", "carnes", "italiano", "japonés", "chino", "mexicano"],
  tacos: ["taquería", "tacos", "tortas", "birria", "tortillería"],
  cafeterias: ["cafetería", "café", "capuchino", "espresso", "latte", "desayuno"],
  carnicerias: ["carnicería", "carne", "res", "cerdo", "pollo"],
  fruterias: ["frutería", "fruta", "verdura", "verdura"],
  pastelerias: ["pastelería", "pastel", "repostería", "pan", "panadería"],
  cerrajeros: ["cerrajero", "cerradura", "llaves", "candado", "apertura"],
  plomeros: ["plomero", "plomería", "tubería", "agua", "drenaje", "fontanero"],
  electricistas: ["electricista", "electricidad", "instalación eléctrica", "corto circuito"],
  jardineria: ["jardinería", "jardín", "poda", "césped", "plantas", "paisajismo"],
  limpieza: ["limpieza", "aseo", "limpia", "housekeeping", "sanitización"],
  mecanicos: ["mecánico", "taller", "llantero", "automotriz", "cambio de aceite", "frenos", "suspensión"],
  abogados: ["abogado", "legal", "bufete", "jurídico", "demanda", "divorcio", "penal", "civil"],
  contadores: ["contador", "contabilidad", "impuestos", "declaración", "facturación"],
  arquitectos: ["arquitecto", "arquitectura", "diseño", "planos", "construcción"],
  fotografos: ["fotógrafo", "fotografía", "video", "boda", "evento", "quinceañera"],
  gimnasios: ["gimnasio", "crossfit", "yoga", "pilates", "fitness", "entrenador", "pesas"],
  barberias: ["barbería", "barbero", "corte", "barba", "peluquería"],
  spas: ["spa", "masaje", "relajación", "bienestar", "sauna"],
  escuelas: ["escuela", "colegio", "kínder", "primaria", "secundaria", "preparatoria"],
  cursos: ["curso", "taller", "clase", "capacitación", "aprender"],
  idiomas: ["inglés", "idioma", "lengua", "traducción", "intérprete"],
  guarderias: ["guardería", "estancia infantil", "niños", "cuidado"],
  mantenimiento: ["mantenimiento", "reparación", "técnico", "compostura", "arreglo"],
  mudanzas: ["mudanza", "carga", "transporte", "fletes", "camión"],
  seguridad: ["seguridad", "alarma", "cámara", "vigilancia", "circuito cerrado"],
  talleres: ["taller mecánico", "mecánico", "automotriz", "afinación", "frenos", "suspensión", "motor"],
  llanteras: ["llantero", "llanta", "vulcanizadora", "neumático"],
  lavados: ["lavado", "carwash", "auto lavado", "detailing"],
}

export function suggestCategory(businessName: string): string | null {
  const name = businessName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  let bestMatch: string | null = null
  let bestScore = 0

  for (const [cat, keywords] of Object.entries(KEYWORD_MAP)) {
    let score = 0
    for (const kw of keywords) {
      if (name.includes(kw)) score += kw.length
    }
    if (score > bestScore) {
      bestScore = score
      bestMatch = cat
    }
  }

  return bestMatch
}
