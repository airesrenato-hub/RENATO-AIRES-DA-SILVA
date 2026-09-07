import { Experience } from '../types';

export const DEFAULT_EXPERIENCES: Experience[] = [
  {
    id: 'fin-de-semana-que-se-complica',
    title: 'Un fin de semana que se complica',
    level: 'B1',
    duration: '45-60 min',
    theme: 'Viajes, convivencia, toma de decisiones y negociación',
    communicativeObjective:
      'Gestionar imprevistos grupales, negociar soluciones bajo presión y mantener el consenso sin arruinar el viaje.',
    linguisticObjective:
      'Uso natural de estructuras de hipótesis sencillas («¿Y si...?», «Si cambiamos...»), expresiones para discrepar y proponer («Me parece mejor...», «Yo opino que...»), y justificación de decisiones en pasado y presente.',
    vocabularyTopics: [
      'Viajes por carretera y alojamiento',
      'Presupuesto y dinero',
      'Averías mecánicas y meteorología',
      'Relaciones interpersonales y acuerdos'
    ],
    variety: 'spain',
    setting:
      'Viernes por la tarde en España. Tú y tres amigos os disponéis a pasar el fin de semana en una casa rural aislada en la sierra. Tenéis un coche algo viejo, 300 € en el fondo común y muchas ganas de desconectar, pero los planes empezarán a torcerse desde el primer kilómetro.',
    mainMission: {
      id: 'main-plan',
      title: 'Conseguir que el viaje salga bien',
      description:
        'Llegar a un destino adecuado, pasar el fin de semana juntos y regresar el domingo sin que el grupo se rompa.',
      isMain: true,
      completed: false,
      progressPercent: 10
    },
    secondaryMissions: [
      {
        id: 'sec-budget',
        title: 'Cuidar el bolsillo',
        description: 'Terminar el viaje con al menos 60 € en el fondo común para imprevistos de vuelta.',
        isMain: false,
        completed: false,
        progressPercent: 0
      },
      {
        id: 'sec-peace',
        title: 'Mantener la paz grupal',
        description: 'Evitar una ruptura o discusión grave entre Alejandro y Lucía.',
        isMain: false,
        completed: false,
        progressPercent: 20
      },
      {
        id: 'sec-owner',
        title: 'Trato con Don Tomás',
        description: 'Negociar las condiciones y el alojamiento con el dueño de la casa rural sin pagar de más.',
        isMain: false,
        completed: false,
        progressPercent: 0
      }
    ],
    characters: [
      {
        id: 'alejandro',
        name: 'Alejandro',
        avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
        role: 'El organizador meticuloso',
        personality: 'Prudente, ahorrador, algo cuadriculado y muy propenso al estrés si las cosas se salen del horario.',
        goal: 'Que no nos salgamos del presupuesto inicial de 300 € y llegar antes de que anochezca.',
        relationshipWithPlayer: 20,
        trust: 65,
        stress: 40,
        currentEmotion: 'preocupado',
        speechStyle: 'Habla directo, suele usar cifras y listas: «Mira, si gastamos eso nos quedamos sin gasolina».',
        register: 'coloquial',
        gender: 'male',
        voiceId: 'Fenrir',
        voicePitch: 0.95,
        voiceRate: 0.97,
        voice: {
          provider: 'gemini',
          voiceId: 'Fenrir',
          pitch: 0.95,
          speed: 0.97,
          stability: 0.6,
          similarity: 0.75,
        },
        voiceProfile: {
          approxAge: 27,
          energy: 'calma',
          speed: 0.97,
          pitch: 0.95,
          expressiveness: 'moderada',
          tendencyToInterrupt: 'media',
          pauses: 'normales',
          confidence: 'seguro',
          humor: 'serio',
          register: 'coloquial',
          provider: 'gemini'
        },
        knownInfo: [
          'Lleva la cuenta de cada euro gastado en una libreta.',
          'Sabe que la reserva del hotel expiraba a las 20:00.'
        ],
        secrets: [
          'Está pasando por un mal momento económico y no tiene ni un euro más de su propio bolsillo.'
        ],
        limits: [
          'Se negará en redondo a gastar más de 30 € adicionales por persona.'
        ]
      },
      {
        id: 'lucia',
        name: 'Lucía',
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
        role: 'La hedonista espontánea',
        personality: 'Optimista, amante del confort y la buena comida. Odia los planes rígidos y prefiere improvisar.',
        goal: 'Disfrutar al máximo, comer bien y no estar encerrada en un sitio cutre.',
        relationshipWithPlayer: 25,
        trust: 70,
        stress: 15,
        currentEmotion: 'animada',
        speechStyle: 'Entusiasta, persuasiva: «¡Venga ya, que un fin de semana es para disfrutar, no para sufrir!».',
        register: 'coloquial',
        gender: 'female',
        voiceId: 'Kore',
        voicePitch: 1.18,
        voiceRate: 1.02,
        voice: {
          provider: 'gemini',
          voiceId: 'Kore',
          pitch: 1.18,
          speed: 1.02,
          stability: 0.45,
          similarity: 0.8,
        },
        voiceProfile: {
          approxAge: 25,
          energy: 'alta',
          speed: 1.02,
          pitch: 1.18,
          expressiveness: 'muy expresiva',
          tendencyToInterrupt: 'alta',
          pauses: 'escasas',
          confidence: 'seguro',
          humor: 'bromista',
          register: 'coloquial',
          provider: 'gemini'
        },
        knownInfo: [
          'Conoce un mesón fantástico en el pueblo siguiente.',
          'Tiene el teléfono de unos amigos que están por la zona.'
        ],
        secrets: [
          'No le apetecía mucho la casa rural aislada; preferiría quedarse cerca de un pueblo con ambiente.'
        ],
        limits: [
          'Si la hacen dormir en el coche o pasar frío, amenazará con coger el primer tren de vuelta.'
        ]
      },
      {
        id: 'marcos',
        name: 'Marcos',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        role: 'El dueño del coche y mediador despistado',
        personality: 'Tranquilo, bondadoso, detesta los conflictos entre amigos pero a veces oculta problemas por no preocupar.',
        goal: 'Que todos nos llevemos bien y que su querido coche "El Trueno" aguante el trayecto.',
        relationshipWithPlayer: 30,
        trust: 75,
        stress: 30,
        currentEmotion: 'nervioso',
        speechStyle: 'Relajado, apaciguador: «Tranquilos, chicos, que no cunda el pánico, seguro que tiene arreglo».',
        register: 'coloquial',
        gender: 'male',
        voiceId: 'Puck',
        voicePitch: 1.06,
        voiceRate: 1.03,
        voice: {
          provider: 'gemini',
          voiceId: 'Puck',
          pitch: 1.06,
          speed: 1.03,
          stability: 0.5,
          similarity: 0.75,
        },
        voiceProfile: {
          approxAge: 26,
          energy: 'media',
          speed: 1.03,
          pitch: 1.06,
          expressiveness: 'cálida',
          tendencyToInterrupt: 'baja',
          pauses: 'frecuentes',
          confidence: 'dubitativo',
          humor: 'afable',
          register: 'coloquial',
          provider: 'gemini'
        },
        knownInfo: [
          'Sabe conducir por caminos de tierra.',
          'Conoce a un mecánico del pueblo vecino.'
        ],
        secrets: [
          'El coche lleva dos semanas encendiendo la luz del radiador; reza para que no hierva en la subida.'
        ],
        limits: [
          'Si le gritan o le insultan por culpa del coche, se bloqueará y se negará a seguir conduciendo.'
        ]
      },
      {
        id: 'don-tomas',
        name: 'Don Tomás',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
        role: 'El dueño de la casa rural "El Olivo Silvestre"',
        personality: 'Hombre de campo veterano, desconfiado con los jóvenes de ciudad pero hospitalario si se le trata con educación y respeto.',
        goal: 'Asegurarse de que no le destrocen la casa rural y cobrar una fianza adecuada.',
        relationshipWithPlayer: 0,
        trust: 35,
        stress: 20,
        currentEmotion: 'escéptico',
        speechStyle: 'Voz seca, formal pero de pueblo: «Miren ustedes, yo las normas las tengo muy claras en mi casa».',
        register: 'formal',
        gender: 'male',
        voiceId: 'Charon',
        voicePitch: 0.82,
        voiceRate: 0.89,
        voice: {
          provider: 'gemini',
          voiceId: 'Charon',
          pitch: 0.82,
          speed: 0.89,
          stability: 0.75,
          similarity: 0.85,
        },
        voiceProfile: {
          approxAge: 62,
          energy: 'pausada',
          speed: 0.89,
          pitch: 0.82,
          expressiveness: 'seca',
          tendencyToInterrupt: 'media',
          pauses: 'frecuentes',
          confidence: 'autoritario',
          humor: 'serio',
          register: 'formal',
          provider: 'gemini'
        },
        knownInfo: [
          'Tiene la llave de la casa y otra casa anexa más pequeña disponible.',
          'Hay un corte de leña y la chimenea es de pago aparte.'
        ],
        secrets: [
          'Tuvo una mala experiencia el mes pasado con unos inquilinos que rompieron una mesa.'
        ],
        limits: [
          'Si le hablan con prepotencia o de mala educación, cancelará la estancia en el acto.'
        ]
      }
    ],
    locations: [
      {
        id: 'loc-salida',
        name: 'Punto de Salida (Madrid)',
        icon: 'Car',
        description: 'La plaza donde habéis quedado todos. Las maletas están en el maletero y empieza la aventura.',
        unlocked: true,
        isCurrent: true,
        coordinates: { x: 15, y: 70 }
      },
      {
        id: 'loc-gasolinera',
        name: 'Gasolinera & Venta "El Reventón"',
        icon: 'Fuel',
        description: 'Parada en el km 94 de la autovía. Café rápido, repostaje y primeras tensiones de ruta.',
        unlocked: true,
        isCurrent: false,
        coordinates: { x: 35, y: 55 }
      },
      {
        id: 'loc-carretera',
        name: 'Puerto de Montaña (Desvío comarcal)',
        icon: 'Mountain',
        description: 'Carretera secundaria de curvas cerradas y subidas pronunciadas entre pinares.',
        unlocked: false,
        isCurrent: false,
        coordinates: { x: 55, y: 40 }
      },
      {
        id: 'loc-pueblo',
        name: 'Pueblo de San Millán',
        icon: 'Store',
        description: 'Pueblo serrano con plaza mayor empedrada, mesón con chimenea y un taller mecánico.',
        unlocked: false,
        isCurrent: false,
        coordinates: { x: 70, y: 65 }
      },
      {
        id: 'loc-casa-rural',
        name: 'Casa Rural "El Olivo Silvestre"',
        icon: 'Home',
        description: 'Antigua casona de piedra en medio del valle, rodeada de robles. Aislada y tranquila.',
        unlocked: false,
        isCurrent: false,
        coordinates: { x: 85, y: 35 }
      },
      {
        id: 'loc-mirador',
        name: 'Mirador de las Cumbres',
        icon: 'Compass',
        description: 'El punto más alto de la sierra con vistas espectaculares al valle y atardecer mágico.',
        unlocked: false,
        isCurrent: false,
        coordinates: { x: 92, y: 20 }
      }
    ],
    initialState: {
      budget: 300,
      timeHour: 17,
      day: 'Viernes',
      relationships: 25,
      trust: 70,
      stress: 20,
      reputation: 50,
      location: 'loc-salida',
      goal_progress: 5,
      resources: {
        carFuel: 60,
        carWorking: true,
        hotelBooked: true,
        luggageSafe: true,
        foodSupplies: false
      },
      language_level: 'B1',
      variety: 'spain'
    },
    possibleEvents: [
      {
        id: 'ev-lucia-cancel',
        title: 'Lucía duda en el último momento',
        description: 'Lucía recibe un mensaje y dice que tal vez debería quedarse a estudiar para unas oposiciones.',
        triggerCondition: 'Turno inicial si no se la anima',
        consequencesText: 'El grupo debe convencerla o perderá un tercio del fondo común.',
        applied: false,
        impact: { stressDelta: 10, relationshipDelta: -5 }
      },
      {
        id: 'ev-gas-price',
        title: 'Subida imprevista en la gasolinera',
        description: 'La gasolina está 20 céntimos más cara y Marcos dice que no le llega el dinero para llenar el depósito.',
        triggerCondition: 'Al llegar a la gasolinera',
        consequencesText: 'Hay que decidir cuánto combustible repostar y quién lo abona.',
        applied: false,
        impact: { budgetDelta: -45, stressDelta: 5 }
      },
      {
        id: 'ev-car-smoke',
        title: 'Humo blanco en el radiador',
        description: 'En plena cuesta, la aguja de temperatura se dispara y empieza a salir vapor del capó del coche.',
        triggerCondition: 'En el puerto de montaña',
        consequencesText: 'Tienen que parar en el arcén, decidir qué hacer y Marcos confiesa que faltaba refrigerante.',
        applied: false,
        impact: { stressDelta: 25, trustDelta: -10 }
      },
      {
        id: 'ev-tomas-call',
        title: 'Llamada tensa de Don Tomás',
        description: 'Don Tomás llama al móvil diciendo que si no llegan antes de las 21:00 se marchará a cenar y cobrará suplemento de check-in tardío (50 €).',
        triggerCondition: 'Tras un retraso temporal significativo',
        consequencesText: 'El estudiante debe hablar por teléfono con Don Tomás para negociar la hora de llegada.',
        applied: false,
        impact: { stressDelta: 15 }
      },
      {
        id: 'ev-restaurant-dilemma',
        title: 'El dilema de la cena',
        description: 'Lucía insiste en parar a cenar lechazo asado en el Mesón del pueblo, pero Alejandro dice que trajo latas de atún y pan de molde.',
        triggerCondition: 'Al pasar cerca del pueblo de San Millán',
        consequencesText: 'Discusión sobre prioridades de gasto y convivencia.',
        applied: false,
        impact: { relationshipDelta: -10, stressDelta: 10 }
      },
      {
        id: 'ev-storm',
        title: 'Tormenta de montaña imprevista',
        description: 'El cielo se oscurece y cae un aguacero torrencial con granizo fino que resbala en la carretera.',
        triggerCondition: 'Sábado por la mañana o viernes noche',
        consequencesText: 'Afecta la visibilidad y exige buscar cobijo o cambiar la ruta.',
        applied: false,
        impact: { stressDelta: 20 }
      },
      {
        id: 'ev-local-mechanic',
        title: 'La ayuda del lugareño Paco',
        description: 'Un vecino jubilado del pueblo se acerca y ofrece revisar el coche a cambio de charlar un rato y que le compren una botella de vino artesano.',
        triggerCondition: 'Si piden ayuda en el pueblo de San Millán',
        consequencesText: 'Oportunidad de resolver la avería muy barato mediante conversación cordial.',
        applied: false,
        impact: { budgetDelta: -15, stressDelta: -20, trustDelta: 15 }
      },
      {
        id: 'ev-heating-extra',
        title: 'El enigma de la calefacción',
        description: 'En la casa rural hace un frío polar y Don Tomás dice que el saco de leña de encina son 25 € adicionales en efectivo.',
        triggerCondition: 'En la casa rural',
        consequencesText: 'Requiere negociar con Don Tomás o apañarse con mantas.',
        applied: false,
        impact: { budgetDelta: -25, stressDelta: 10 }
      },
      {
        id: 'ev-night-hike',
        title: 'Propuesta de senderismo nocturno',
        description: 'Marcos propone subir al mirador a ver las estrellas fugaces, pero Alejandro teme perderse en la oscuridad.',
        triggerCondition: 'Noche de sábado',
        consequencesText: 'Decisión sobre actividad grupal de aventura.',
        applied: false,
        impact: { relationshipDelta: 15 }
      },
      {
        id: 'ev-unexpected-fiesta',
        title: 'Fiestas patronales de San Millán',
        description: 'En la plaza del pueblo hay verbena popular, música en directo y reparto gratuito de migas y chocolate caliente.',
        triggerCondition: 'Si deciden cenar o dar una vuelta por el pueblo',
        consequencesText: 'Alternativa festiva y económica que puede salvar el ánimo del grupo.',
        applied: false,
        impact: { relationshipDelta: 20, stressDelta: -25, budgetDelta: -10 }
      }
    ],
    possibleEndings: [
      {
        type: 'perfect',
        title: 'Armonía en las Cumbres (Final Perfecto)',
        description:
          'Lograste gestionar el dinero con sensatez, Don Tomás os trató como a su propia familia, el coche aguantó y los tres amigos terminaron el viaje brindando en el mirador más unidos que nunca.',
        triggerCondition: 'budget >= 80 && stress < 40 && relationships >= 50 && goal_progress >= 85'
      },
      {
        type: 'acceptable',
        title: 'Aventuras con Cicatrices (Final Aceptable)',
        description:
          'El viaje tuvo sus altibajos: tuvisteis que apretaros el cinturón, Don Tomás cobró algún suplemento y el coche dio guerra, pero la experiencia mereció la pena y regresáis todos a casa con buenas anécdotas.',
        triggerCondition: 'budget >= 20 && stress < 70 && relationships >= 15 && goal_progress >= 60'
      },
      {
        type: 'chaotic',
        title: 'Supervivientes por los Pelos (Final Caótico)',
        description:
          'Fue un auténtico caos: Marcos tuvo que llamar a la grúa, cenasteis bocadillos fríos y Alejandro pasó el sábado de morros, pero al menos no hubo heridos ni denuncias.',
        triggerCondition: 'stress >= 70 || budget < 20 || relationships < 0'
      },
      {
        type: 'disastrous',
        title: 'Naufragio Amistoso (Final Desastroso)',
        description:
          'La discusión fue insostenible. Lucía cogió un autobús de vuelta el sábado por la mañana, Alejandro se negó a hablar con nadie y la casa rural se canceló con pérdida total de la fianza.',
        triggerCondition: 'relationships <= -30 || stress >= 90 || budget <= 0'
      },
      {
        type: 'unexpected',
        title: 'El Giro del Destino (Final Inesperado)',
        description:
          'Olvidasteis por completo la casa rural de Don Tomás y os quedasteis en las fiestas patronales de San Millán invitados por los lugareños. Marcos conoció a un grupo de músicos y Alejandro hasta bailó un pasodoble.',
        triggerCondition: 'location === "loc-pueblo" && goal_progress >= 70 && stress < 30'
      }
    ]
  },
  {
    id: 'el-banquete-en-apuros',
    title: 'El banquete en apuros',
    level: 'A2',
    duration: '35-45 min',
    theme: 'Gastronomía, compras en el mercado y hospitalidad familiar',
    communicativeObjective:
      'Organizar una comida tradicional para diez personas con ingredientes frescos, ajustarse a alergias alimentarias y resolver contratiempos con los tenderos.',
    linguisticObjective:
      'Uso de cuantificadores, pedir precios, expresar gustos y preferencias («Me gustaría...», «Prefiero...»), y dar instrucciones sencillas.',
    vocabularyTopics: ['Comida e ingredientes', 'Mercado y compras', 'Números y medidas', 'Cortesía en comercios'],
    variety: 'mexico',
    setting:
      'Sábado por la mañana en Coyoacán, Ciudad de México. Tienes que cocinar una taquiza familiar para el cumpleaños de tu tía. Tu primo Beto y tu prima Sofía te acompañan al mercado, pero faltan ingredientes clave y el dinero está contado.',
    mainMission: {
      id: 'banquete-main',
      title: 'Completar la comida a tiempo',
      description: 'Conseguir todos los ingredientes para los tacos antes de las 14:00 sin exceder el presupuesto.',
      isMain: true,
      completed: false,
      progressPercent: 10
    },
    secondaryMissions: [
      {
        id: 'banquete-sec-1',
        title: 'Opciones sin picante y vegetarianas',
        description: 'Asegurar que hay comida apta para la tía Carmen que no tolera el chile.',
        isMain: false,
        completed: false,
        progressPercent: 0
      },
      {
        id: 'banquete-sec-2',
        title: 'Regateo respetuoso',
        description: 'Negociar con Doña Rosa en la verdulería para obtener un buen descuento sin ofender.',
        isMain: false,
        completed: false,
        progressPercent: 0
      }
    ],
    characters: [
      {
        id: 'beto',
        name: 'Primo Beto',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        role: 'El primo goloso y bromista',
        personality: 'Simpático, siempre quiere probar todo en los puestos y sugiere platillos extravagantes.',
        goal: 'Comprar carnitas y chicharrón antes que las verduras.',
        relationshipWithPlayer: 30,
        trust: 80,
        stress: 10,
        currentEmotion: 'hambriento',
        speechStyle: 'Cálido, mexicano coloquial: «¡Órale primo, huele bien sabroso por acá!».',
        register: 'coloquial',
        gender: 'male',
        voiceId: 'Puck',
        voicePitch: 1.05,
        voiceRate: 1.04,
        voice: {
          provider: 'gemini',
          voiceId: 'Puck',
          pitch: 1.05,
          speed: 1.04,
          stability: 0.5,
          similarity: 0.75,
        },
        knownInfo: ['Sabe dónde está la mejor tortillería artesanal.'],
        secrets: ['Se comió la lista original de compras que le dio su mamá.'],
        limits: ['Si le piden cargar más de 20 kilos de bolsas se quejará sin parar.']
      },
      {
        id: 'dona-rosa',
        name: 'Doña Rosa',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
        role: 'Dueña del puesto de verduras y chiles',
        personality: 'Diligente, orgullosa de su género, muy amable si la saludas bien.',
        goal: 'Vender sus aguacates y jitomates de primera calidad.',
        relationshipWithPlayer: 10,
        trust: 50,
        stress: 15,
        currentEmotion: 'atenta',
        speechStyle: 'Trato cariñoso mexicano: «¿Qué le damos, güerito? Pásele marchante».',
        register: 'coloquial',
        gender: 'female',
        voiceId: 'Aoede',
        voicePitch: 1.14,
        voiceRate: 0.95,
        voice: {
          provider: 'gemini',
          voiceId: 'Aoede',
          pitch: 1.14,
          speed: 0.95,
          stability: 0.65,
          similarity: 0.8,
        },
        knownInfo: ['Sabe preparar la salsa borracha tradicional.'],
        secrets: ['Le quedan los últimos tres aguacates hass maduros en el cajón de atrás.'],
        limits: ['Si alguien desprecia su verdura diciendo que está fea, no le venderá nada.']
      }
    ],
    locations: [
      {
        id: 'loc-cocina',
        name: 'Cocina familiar',
        icon: 'Home',
        description: 'Ollas sobre la estufa, cazuelas de barro y poco tiempo en el reloj.',
        unlocked: true,
        isCurrent: true
      },
      {
        id: 'loc-mercado',
        name: 'Mercado de Coyoacán',
        icon: 'Store',
        description: 'Pasillos coloridos con olor a especias, flores frescas y frutas exóticas.',
        unlocked: true,
        isCurrent: false
      }
    ],
    initialState: {
      budget: 800, // Pesos
      timeHour: 10,
      day: 'Sábado',
      relationships: 35,
      trust: 80,
      stress: 15,
      reputation: 60,
      location: 'loc-cocina',
      goal_progress: 10,
      resources: {
        tortillas: false,
        carne: false,
        verduras: false,
        refrescos: false
      },
      language_level: 'A2',
      variety: 'mexico'
    },
    possibleEvents: [],
    possibleEndings: [
      {
        type: 'perfect',
        title: 'Taquiza Legendaria',
        description: 'Todos los invitados quedaron fascinados y la tía Carmen felicitó al chef por el sazón.',
        triggerCondition: 'goal_progress >= 90 && budget >= 50'
      }
    ]
  },
  {
    id: 'el-piso-en-granada',
    title: 'El dilema del alojamiento en Granada',
    level: 'B1',
    duration: '35-45 min',
    theme: 'Viajes, resolución de problemas y convivencia en grupo',
    communicativeObjective: 'Gestionar una cancelación de hotel de última hora con amigos, negociar alternativas y mantener la calma.',
    linguisticObjective: 'Uso de condicional para sugerencias («Podríamos mirar...», «Sería mejor...»), fórmulas de acuerdo y desacuerdo, y justificación de decisiones.',
    vocabularyTopics: ['Alojamiento y hoteles', 'Precios y reservas', 'Ciudad de noche y transporte', 'Relaciones interpersonales'],
    variety: 'spain',
    setting: 'Son las diez de la noche en una plaza del centro de Granada. Marta, Carlos y tú acabáis de recibir una notificación de que vuestra reserva de hostal ha sido cancelada por avería. Estáis cansados, empieza a refrescar y debéis decidir qué hacer.',
    mainMission: {
      id: 'mision-granada',
      title: 'Conseguir un alojamiento para esta noche',
      description: 'Acordar un lugar para dormir antes de medianoche sin sobrepasar el presupuesto restante.',
      isMain: true,
      completed: false,
      progressPercent: 15
    },
    secondaryMissions: [
      {
        id: 'sec-presupuesto-granada',
        title: 'Límite presupuestario',
        description: 'No pagar más de 30 € por persona por el alojamiento de emergencia.',
        isMain: false,
        completed: false,
        progressPercent: 0
      },
      {
        id: 'sec-armonia-granada',
        title: 'Paz entre Marta y Carlos',
        description: 'Mediar para que la impaciencia de Marta no choque con las dudas de Carlos.',
        isMain: false,
        completed: false,
        progressPercent: 30
      }
    ],
    characters: [
      {
        id: 'marta',
        name: 'Marta',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        role: 'La resolutiva e impaciente',
        personality: 'Enérgica, pragmática, odia perder el tiempo discutiendo y prefiere reservar ya mismo la primera opción decente.',
        goal: 'Estar en una cama antes de las 23:00 cueste lo que cueste.',
        relationshipWithPlayer: 25,
        trust: 70,
        stress: 40,
        currentEmotion: 'preocupada',
        speechStyle: 'Rápida, directa: «A ver, tenemos un problema. El hotel ha cancelado nuestra reserva y no nos podemos quedar en la calle».',
        register: 'coloquial',
        gender: 'female',
        voiceId: 'Kore',
        voicePitch: 1.22,
        voiceRate: 1.04,
        voice: {
          provider: 'gemini',
          voiceId: 'Kore',
          pitch: 1.22,
          speed: 1.04,
          stability: 0.45,
          similarity: 0.8
        },
        voiceProfile: {
          approxAge: 25,
          energy: 'alta',
          speed: 1.04,
          pitch: 1.22,
          expressiveness: 'muy expresiva',
          tendencyToInterrupt: 'alta',
          pauses: 'escasas',
          confidence: 'seguro',
          humor: 'bromista',
          register: 'coloquial',
          provider: 'gemini'
        },
        knownInfo: ['Tiene una app de reservas de última hora con descuentos.'],
        secrets: ['Tiene un fuerte dolor de cabeza del viaje y necesita descansar ya.'],
        limits: ['Se negará a dormir en el coche o en la estación.']
      },
      {
        id: 'carlos',
        name: 'Carlos',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        role: 'El prudente y analítico',
        personality: 'Tranquilo, cuidadoso con los gastos, teme que les cobren un sobreprecio abusivo por ser de noche.',
        goal: 'No pagar más de 25 € por persona y exigir explicaciones a la plataforma.',
        relationshipWithPlayer: 20,
        trust: 65,
        stress: 30,
        currentEmotion: 'sorprendido',
        speechStyle: 'Pausado, reflexivo: «¿Qué ha pasado exactamente? No nos precipitemos, seguro que podemos encontrar algo mejor».',
        register: 'coloquial',
        gender: 'male',
        voiceId: 'Puck',
        voicePitch: 0.98,
        voiceRate: 1.00,
        voice: {
          provider: 'gemini',
          voiceId: 'Puck',
          pitch: 0.98,
          speed: 1.00,
          stability: 0.6,
          similarity: 0.75
        },
        voiceProfile: {
          approxAge: 27,
          energy: 'media',
          speed: 1.00,
          pitch: 0.98,
          expressiveness: 'cálida',
          tendencyToInterrupt: 'baja',
          pauses: 'normales',
          confidence: 'dubitativo',
          humor: 'afable',
          register: 'coloquial',
          provider: 'gemini'
        },
        knownInfo: ['Tiene el teléfono de atención de la plataforma de reservas.'],
        secrets: ['Lleva 60 € en efectivo de reserva por si las tarjetas fallan.'],
        limits: ['No aceptará un hotel de lujo que supere los 50 € por cabeza.']
      }
    ],
    locations: [
      {
        id: 'loc-plaza-bib-rambla',
        name: 'Plaza Bib-Rambla (Granada)',
        icon: 'MapPin',
        description: 'Plaza histórica con farolas de hierro forjado, cafeterías cerrando y ambiente nocturno.',
        unlocked: true,
        isCurrent: true,
        coordinates: { x: 30, y: 50 }
      },
      {
        id: 'loc-hostal-albaicin',
        name: 'Hostal Las Palmeras (Albaicín)',
        icon: 'Home',
        description: 'Pequeño hostal tradicional en las cuestas empedradas con habitaciones libres.',
        unlocked: true,
        isCurrent: false,
        coordinates: { x: 60, y: 35 }
      }
    ],
    initialState: {
      budget: 180,
      timeHour: 22,
      day: 'Viernes',
      relationships: 25,
      trust: 70,
      stress: 35,
      reputation: 60,
      location: 'loc-plaza-bib-rambla',
      goal_progress: 15,
      resources: {
        maletas: true,
        bateriaMovil: true
      },
      language_level: 'B1',
      variety: 'spain'
    },
    possibleEvents: [],
    possibleEndings: [
      {
        type: 'perfect',
        title: 'Noche Salvada en Granada',
        description: 'Encontrasteis un hostal con encanto a buen precio, cenasteis unas tapas y el grupo se fue a dormir con una sonrisa.',
        triggerCondition: 'goal_progress >= 90 && stress < 40'
      }
    ]
  }
];
