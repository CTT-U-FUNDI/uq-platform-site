import { KnowledgeEntry } from './borbContent.fr';

export const KNOWLEDGE_ES: KnowledgeEntry[] = [
  {
    id: 'borb_overview',
    keywords: ['borb', 'que es', 'borb', 'moneda', 'presentacion', 'introduccion'],
    category: 'borb',
    icon: '💰',
    response: {
      title: '¿Qué es BORB?',
      content: 'BORB (BORB) es la moneda digital descentralizada de UQ Platform.\n\n• Suministro fijo: 40 mil millones BORB\n• Respaldado por una referencia de oro: el precio sigue la tasa de oro captada por el motor\n• El precio actual no está escrito en la aplicación: lo publican el regulador y la captura del mercado, y la billetera muestra su fuente y su antigüedad',
      suggestions: ['Las 6 unidades', 'Las 6 cajas'],
    },
  },
  {
    id: 'borb_units',
    keywords: ['unidades', 'fractal', 'micro', 'nano', 'pico', 'femto'],
    category: 'borb',
    icon: '💱',
    response: {
      title: 'Las 6 unidades fractales',
      content: 'BORB → borb → mborb → nborb → pborb → fborb\n\n1 BORB = 1 billón de fborb',
      suggestions: ['Las 6 cajas'],
    },
  },
  {
    id: 'borb_cases',
    keywords: ['cajas', 'tesoro', 'tarifas', 'recompensas', 'ahorro', 'credito', 'escudo'],
    category: 'borb',
    icon: '📦',
    response: {
      title: 'Las 6 cajas económicas',
      content: '💰 Tesoro 77.8%\n💸 Tarifas 5.6%\n🏆 Recompensas 5.6%\n❄️ Ahorro 5.6%\n💳 Crédito 3.3%\n🛡️ Escudo 2.2%',
      suggestions: ['Burbujas'],
    },
  },
  // ===== LAS 6 CAJAS — DETALLE COMPLETO =====
  {
    id: 'cases_overview',
    keywords: ['6 cajas', 'seis cajas', 'las cajas', 'cajas economicas', 'reparto', 'vista general'],
    category: 'borb',
    icon: '📦',
    response: {
      title: 'Las 6 Cajas económicas — Vista general',
      content: 'Los 40 mil millones de BORB se reparten en 6 Cajas:\n\n💰 Tesoro: 77.8% → UBI + conversión burbujas\n💸 Tarifas: 5.6% → Infraestructura\n🏆 Recompensas: 5.6% → Motivación\n❄️ Ahorro: 5.6% → Congelar + escasez\n💳 Crédito: 3.3% → Préstamos\n🛡️ Escudo: 2.2% → Protección\n\n🔄 CICLO ETERNO:\nTesoro distribuye → usuarios gastan → Tarifas vuelven → Tesoro se recarga → NADA se pierde.\n\n¡Pregúntame sobre una caja específica!',
      suggestions: ['El Tesoro', 'Las Tarifas', 'Las Recompensas', 'El Ahorro'],
    },
  },
  {
    id: 'case_treasury',
    keywords: ['tesoro', 'caja 1', 'ubi', 'distribucion', 'ingreso basico'],
    category: 'borb',
    icon: '💰',
    response: {
      title: '💰 El Tesoro (77.8% — 31.120.000.000 BORB)',
      content: 'El Tesoro es el CORAZÓN del sistema.\n\n📋 ROL:\n• Distribuye el UBI (2 puntos/día)\n• Convierte Burbujas en BORB (100 burbujas = 1 borb)\n• Recibe BORB reciclados\n• Alimenta otras cajas si es necesario\n\n⚠️ SUELO DE SEGURIDAD: 6 MIL MILLONES BORB\nSi el Tesoro baja de 6B:\n→ El UBI se pausa\n→ Las tarifas se redirigen 80% al Tesoro\n→ El sistema SE RECUPERA solo',
      suggestions: ['Las Tarifas', 'Las Recompensas', 'Cómo ganar BORB'],
    },
  },
  {
    id: 'case_fees',
    keywords: ['tarifas', 'caja 2', 'comision', 'infraestructura', 'validadores'],
    category: 'borb',
    icon: '💸',
    response: {
      title: '💸 Las Tarifas (5.6% — 2.240.000.000 BORB)',
      content: 'Las Tarifas alimentan el sistema.\n\n📋 ROL:\n• Recogen 0.1% de cada transacción\n• Recargan las 6 Cajas\n• Pagan a validadores y relés\n\n📊 TASAS:\n• Transferencia BORB: 0.1%\n• Marketplace: 1%\n• Lector UQ: 10%\n• Starlink: 10%\n• Préstamos: 2%\n\n🔄 DISTRIBUCIÓN:\n• 30% → Tesoro\n• 40% → Validadores\n• 30% → Relés P2P\n• 0% → NUNCA QUEMADO',
      suggestions: ['El Tesoro', 'El Crédito', 'Cómo ganar BORB'],
    },
  },
  {
    id: 'case_rewards',
    keywords: ['recompensas', 'caja 3', 'motivacion', 'referidos', 'desafios', 'creadores'],
    category: 'borb',
    icon: '🏆',
    response: {
      title: '🏆 Las Recompensas (5.6% — 2.240.000.000 BORB)',
      content: 'Las Recompensas motivan la actividad.\n\n📋 TIPOS:\n\n🤝 REFERIDOS:\n• 1 BORB por referido activo\n• 0.5 BORB por referido de referido\n• Cascada de 3 niveles\n\n🏆 DESAFÍOS DE BARRIO:\n• "100 transacciones" → 10 BORB\n• "10 nuevas tiendas" → 5 BORB cada una\n\n🎨 CREADORES:\n• Músicos: 90% del Lector UQ\n• Vendedores: insignias y reputación\n\n🫧 BURBUJAS:\n• Actividad diaria → burbujas\n• Burbujas → BORB',
      suggestions: ['El Tesoro', 'Cómo ganar BORB', 'Invitar amigos'],
    },
  },
  {
    id: 'case_savings',
    keywords: ['ahorro', 'caja 4', 'congelar', 'escasez', 'contrato', 'interes', 'rendimiento'],
    category: 'borb',
    icon: '❄️',
    response: {
      title: '❄️ El Ahorro (5.6% — 2.240.000.000 BORB)',
      content: 'El Ahorro congela BORB.\n\n📋 ROL:\n• Retira BORB de circulación\n• Crea escasez (precio sube)\n• Recompensa ahorradores\n• Protege fortunas\n\n📊 CONTRATOS:\n• 3 meses: 1%/año\n• 1 año: 2%/año\n• 3 años: 3%/año\n• 5 años: 4%/año\n• 10 años: 5%/año\n• 50 años: 6%/año\n\n❄️ CONGELACIÓN PROGRESIVA (inactivos):\n• 1 año: recordatorio\n• 2 años: 10% congelado\n• 5 años: 50% congelado\n• 10 años: 50% al Tesoro\n• 50 años: 100% al Tesoro',
      suggestions: ['El Crédito', 'Ahorrar inteligentemente', 'El Tesoro'],
    },
  },
  {
    id: 'case_credit',
    keywords: ['credito', 'caja 5', 'prestamo', 'micro-credito', 'deuda', 'pedir prestado'],
    category: 'borb',
    icon: '💳',
    response: {
      title: '💳 El Crédito (3.3% — 1.320.000.000 BORB)',
      content: 'El Crédito presta.\n\n📋 TIPOS DE PRÉSTAMOS:\n\n🔹 MICRO-CRÉDITO:\n• 1-50 BORB, 1-6 meses, 2-5%\n\n🔹 CRÉDITO EMPRESA:\n• 50-500 BORB, 6-24 meses\n\n🔹 CRÉDITO COMUNITARIO:\n• Los vecinos garantizan\n• Tasa reducida (2%)\n\n⚠️ BORB NEGATIVO (DEUDA):\n• Descubierto normal: -5 BORB\n• Descubierto Marketer: -50 BORB\n• Deducción AUTOMÁTICA de ingresos\n• Garantías (ahorros bloqueados)\n• Perdón vía Escudo (50 años)',
      suggestions: ['Pedir prestado', 'El Escudo', 'El Ahorro'],
    },
  },
  {
    id: 'case_shield',
    keywords: ['escudo', 'caja 6', 'proteccion', 'emergencia', 'ayuda', 'perdon', 'clave perdida'],
    category: 'borb',
    icon: '🛡️',
    response: {
      title: '🛡️ El Escudo (2.2% — 840.000.000 BORB)',
      content: 'El Escudo protege.\n\n📋 TIPOS:\n\n🔐 CLAVE PERDIDA:\n• Verificación de identidad reforzada\n• Recuperación Shamir (3/5)\n• Ayuda hasta 50% del saldo\n\n🚨 EMERGENCIA:\n• Enfermedad grave → ayuda inmediata\n• Catástrofe → ayuda colectiva\n\n🤝 AYUDA MUTUA:\n• Declaración de necesidad\n• Voto de la comunidad\n\n💚 PERDÓN DE DEUDAS:\n• Después de 50 años\n• El Escudo PERDONA la deuda\n• Nadie es APLASTADO',
      suggestions: ['Usar el Escudo', 'El Crédito', 'Seguridad'],
    },
  },
  {
    id: 'case_cycle',
    keywords: ['ciclo', 'bucle', 'circulacion', 'como funciona', 'ciclo 6 cajas', 'puentes'],
    category: 'borb',
    icon: '🔄',
    response: {
      title: '🔄 El ciclo eterno de las 6 Cajas',
      content: 'CÓMO SE ALIMENTAN LAS 6 CAJAS:\n\n1. 💰 Tesoro distribuye\n2. 👥 Usuarios gastan\n3. 💸 Tarifas vuelven (30% al Tesoro)\n4. ❄️ Ahorro congela (escasez)\n5. 💳 Crédito presta (interés → ahorro)\n6. 🛡️ Escudo protege (confianza)\n7. 🔄 Reciclaje (10/50 años → Tesoro)\n\n🔗 PUENTES:\n• Tesoro → Tarifas: si Tarifas < 224M\n• Tesoro → Escudo: si agotado\n• Ahorro → Crédito: liquidez\n\n♾️ CICLO INFINITO:\nDistribución → Gasto → Tarifas → Retorno → Congelar → Préstamo → Protección → Reciclaje → ∞\n\n💡 NADA SE DESTRUYE NUNCA.',
      suggestions: ['El Tesoro', 'Reciclaje', 'Cómo ganar BORB'],
    },
  },
  // ===== FAQ — CUENTA =====
  {
    id: 'faq_create_account',
    keywords: ['crear cuenta', 'registrarse', 'inscribirse', 'nueva cuenta'],
    category: 'faq',
    icon: '👤',
    response: {
      title: 'Cómo crear una cuenta UQ',
      content: '1. Abre la aplicación\n2. Rellena el formulario\n3. Verifica tu teléfono por SMS\n4. Recibe tu pseudo UQ, número UQ y email UQ\n\n🎁 ¡Bienvenido a la familia UQ!',
      suggestions: ['Iniciar sesión', 'Olvidé contraseña'],
    },
  },
  {
    id: 'faq_forgot_password',
    keywords: ['olvide contraseña', 'recuperar contraseña', 'contraseña perdida'],
    category: 'faq',
    icon: '🔑',
    response: {
      title: 'Olvidé mi contraseña',
      content: 'Usa la recuperación Shamir 3/5:\n\n→ 3 de 5 fragmentos son suficientes\n→ Contacta a tus guardianes\n→ O usa tu biometría',
      suggestions: ['Shamir 3/5', 'Biometría'],
    },
  },
  {
    id: 'faq_fees',
    keywords: ['tarifas', 'comision', 'cuanto cuesta'],
    category: 'faq',
    icon: '💸',
    response: {
      title: '¿Cuáles son las tarifas?',
      content: '0.1% por transacción.\n\n📊 EJEMPLO:\n• 5 BORB → 0.005 BORB\n• 100 BORB → 0.1 BORB',
      suggestions: ['Tarifas', 'Transacciones'],
    },
  },
  {
    id: 'faq_borb_value',
    keywords: ['valor borb', 'cuanto vale', 'precio borb'],
    category: 'faq',
    icon: '💰',
    response: {
      title: '¿Cuánto vale 1 BORB?',
      content: '1 BORB vale el precio que el motor publica en el momento en que preguntas — no un valor escrito en la aplicación.\n\n📈 DE DÓNDE VIENE EL PRECIO:\n• El regulador, a partir de la demanda real sobre la masa en circulación\n• La captura en vivo de la tasa de oro de las fuentes consultadas\n\n📊 DÓNDE LEERLO:\n• La billetera muestra el precio actual, su fuente y su antigüedad\n• Sin conexión, sigue aplicándose el último valor captado y la app lo indica',
      suggestions: ['Cómo ganar', 'Trayectoria'],
    },
  },
  {
    id: 'faq_earn_borb',
    keywords: ['ganar borb', 'ganar dinero', 'como ganar'],
    category: 'faq',
    icon: '🌾',
    response: {
      title: 'Cómo ganar BORB',
      content: '🌾 UBI diario\n🏪 Vender productos\n🔧 Ofrecer servicios\n🎵 Crear contenido\n📡 Vender conexión\n🚗 Ser repartidor\n🤝 Referir amigos\n💱 Trading\n💳 Ser Marketer\n💤 Ahorrar',
      suggestions: ['12 métodos', 'Hacerse rico'],
    },
  },
  // ===== INICIO DE SESIÓN =====
  {
    id: 'login_flow',
    keywords: ['iniciar sesion', 'conexion', 'como iniciar'],
    category: 'guide',
    icon: '🔐',
    response: {
      title: 'Cómo iniciar sesión en UQ',
      content: 'Inicio de sesión en 7 pasos:\n\n1. 📛 Número UQ (UQ-XXXXXXXX)\n2. 🔑 Si eres propietario → código de desbloqueo\n3. 📧 Email UQ + Contraseña\n4. 🔢 Código 2FA automático\n5. 🫆 Biometría\n6. ✅ Inicio exitoso\n7. 🤖 UQ AI te saluda\n\n💡 Sin nombre de usuario, sin CAPTCHA.',
      suggestions: ['Número UQ', '2FA', 'Biometría'],
    },
  },
  {
    id: 'login_number',
    keywords: ['numero uq', 'mi numero', 'identificacion'],
    category: 'guide',
    icon: '📛',
    response: {
      title: 'Tu Número UQ',
      content: 'Formato: UQ-XXXXXXXX\nEjemplo: UQ-00000001\n\n💡 Tu ÚNICO identificador.',
      suggestions: ['Iniciar sesión', 'Crear cuenta'],
    },
  },
  {
    id: 'login_2fa',
    keywords: ['2fa', 'email uq', 'contraseña'],
    category: 'guide',
    icon: '📧',
    response: {
      title: 'Verificación 2FA',
      content: '📧 EMAIL UQ\n🔑 CONTRASEÑA (8+ caracteres)\n\n⚠️ Si hay error:\n• Borde ROJO\n• El cajón tiembla',
      suggestions: ['Olvidé contraseña', 'Código 2FA'],
    },
  },
  {
    id: 'login_biometric',
    keywords: ['biometria', 'huella', 'rostro'],
    category: 'guide',
    icon: '🫆',
    response: {
      title: 'Confirmación biométrica',
      content: 'Último paso: BIOMETRÍA.\n\n🫆 HUELLA\nO\n👁️ RECONOCIMIENTO FACIAL\n\n💚 Éxito → sonrisa 😊',
      suggestions: ['Iniciar sesión', 'Seguridad'],
    },
  },

  {
    id: 'uq_organism',
    keywords: ['organismo', 'vivo', 'uq vivo', 'moneda viva'],
    category: 'borb',
    icon: 'UQ',
    response: {
      title: 'UQ - El Organismo Monetario Vivo',
      content: 'UQ no es una simple blockchain. Es un ORGANISMO MONETARIO VIVO.\n\nCerebro: Contador y Calculadora\nCorazon: Tesoro\nPulmones: Tarifas\nHormonas: Recompensas\nGrasa: Ahorro\nMusculos: Credito\nInmunidad: Escudo\nSangre: BORB\nADN: Blockchain\nSistema nervioso: P2P\n\nUQ es 75% autonomo.',
      suggestions: ['Las 6 Cajas', 'El Contador', 'Autonomia 75%', 'El Invariante'],
    },
  },
  {
    id: 'uq_counter',
    keywords: ['contador', 'calculadora', '7mo organo', 'cerebro uq'],
    category: 'borb',
    icon: 'CALC',
    response: {
      title: 'El Contador y Calculadora',
      content: 'El Contador es el CEREBRO de UQ.\n\nCUENTA :\n- Numero de usuarios\n- Suma total de BORB\n- Precision (femto -> infinito)\n\nCALCULA :\n- Flujos en tiempo real\n- Tarifas por transaccion\n- Derechos por Caja\n\nDISTRIBUYE :\n- Tesoro: 30%\n- Tarifas: 40%\n- Recompensas: 15%\n- Ahorro: 10%\n- Credito: 5%\n\nVERIFICA :\n- Suma(6 Cajas) + Contador = 40 Bn',
      suggestions: ['Las 6 Cajas', 'El Invariante', 'Autonomia'],
    },
  },
  {
    id: 'uq_autonomy_75',
    keywords: ['autonomia', '75%', 'autonomo'],
    category: 'borb',
    icon: 'AI',
    response: {
      title: 'Autonomia 75% de UQ',
      content: 'UQ es 75% autonomo.\n\nAUTONOMO (100%) :\n- 6 Cajas\n- Distribucion UBI\n- Tarifas\n- Puentes\n- Reciclaje\n- Tasa\n- Contador\n\nSEMI-AUTONOMO (50%) :\n- Anuncios Zando\n- Trading P2P\n\nMANUAL (0%) :\n- KYC\n- Soporte\n\n75% automatizado, 25% manual.',
      suggestions: ['El Contador', 'Las 6 Cajas', 'El Propietario'],
    },
  },
  {
    id: 'uq_anti_inflation',
    keywords: ['anti inflacion', 'inflacion', 'precio sube'],
    category: 'borb',
    icon: 'UP',
    response: {
      title: 'Anti-inflacion UQ',
      content: 'CUANDO EL PRECIO SUBE DEMASIADO :\n\nSI Inflacion > 5% :\n- Aumentar Ahorro (congelar mas)\n- Reducir UBI\n- Aumentar tarifas\n-> Precio baja\n\nEl Contador detecta y ajusta automaticamente.',
      suggestions: ['Anti-deflacion', 'El Contador', 'Las 6 Cajas'],
    },
  },
  {
    id: 'uq_anti_deflation',
    keywords: ['anti deflacion', 'deflacion', 'precio baja'],
    category: 'borb',
    icon: 'DOWN',
    response: {
      title: 'Anti-deflacion UQ',
      content: 'CUANDO EL PRECIO BAJA DEMASIADO :\n\nSI Deflacion > 5% :\n- Reducir Ahorro (liberar)\n- Aumentar UBI\n- Reducir tarifas\n-> Precio sube\n\nEl Contador detecta y ajusta automaticamente.',
      suggestions: ['Anti-inflacion', 'El Contador', 'Las 6 Cajas'],
    },
  },
  {
    id: 'uq_infinite_precision',
    keywords: ['precision', 'infinita', 'femto', 'fractal'],
    category: 'borb',
    icon: 'PREC',
    response: {
      title: 'Precision infinita del BORB',
      content: 'El BORB tiene precision INFINITA.\n\nNIVELES :\n- 1 BORB = 1\n- 1 borb = 0.0001 BORB\n- 1 mborb = 0.000001 BORB\n- 1 nborb = 0.00000001 BORB\n- 1 pborb = 0.0000000001 BORB\n- 1 fborb = 0.000000000001 BORB\n- ... (extension fractal)\n- infinito\n\nSin perdida de valor.',
      suggestions: ['Las 6 unidades', 'Extension fractal', 'Tasa dinamica'],
    },
  },
  {
    id: 'uq_dynamic_rate',
    keywords: ['tasa dinamica', 'tasa', 'oraculo', 'prediccion'],
    category: 'borb',
    icon: 'RATE',
    response: {
      title: 'Tasa dinamica UQ',
      content: 'La tasa UQ es DINAMICA.\n\nECUACION :\nTasa(T) = Tasa_base x Factor_demanda x Factor_escasez x Factor_velocidad\n\nEl Contador puede PREDECIR la tasa.\nPrecision: mas que femtonal.',
      suggestions: ['El Contador', 'Precision infinita', 'Las 6 Cajas'],
    },
  },
  {
    id: 'uq_invariant_40_bn',
    keywords: ['invariante', '40 mil millones', '40 bn'],
    category: 'borb',
    icon: 'OK',
    response: {
      title: 'El Invariante - 40 Mil Millones',
      content: 'El invariante UQ es SIMPLE :\n\nSuma(6 Cajas) + Contador = 40 000 000 000 BORB\n\nVerificado en CADA transaccion.\n\nSI diferente :\n- ALERTA\n- BLOQUEO de transacciones\n- Identificacion de fuga\n- Autocorreccion\n- Reanudacion\n\nSin fuga posible.',
      suggestions: ['Las 6 Cajas', 'El Contador', 'Anti-fuga'],
    },
  },
  {
    id: 'uq_blockchain_comparison',
    keywords: ['comparacion', 'bitcoin', 'ethereum', 'xrp'],
    category: 'borb',
    icon: 'VS',
    response: {
      title: 'UQ vs otras blockchains',
      content: 'Lo que hace UQ unico :\n\n- Suministro fijo : UQ SI / Otros NO\n- Indexacion oro : UQ SI / Otros NO\n- 6 Cajas : UQ SI / Otros NO\n- Contador : UQ SI / Otros NO\n- Precision infinita : UQ SI / Otros NO\n- Autonomia 75% : UQ SI / Otros NO\n- Anti-inflacion : UQ SI / Otros NO\n- Tasa dinamica : UQ SI / Otros NO\n\nUQ es una INNOVACION MUNDIAL.',
      suggestions: ['El organismo vivo', 'El Contador', 'Innovacion'],
    },
  },
  {
    id: 'uq_worldwide_innovation',
    keywords: ['innovacion', 'unico', 'mundial'],
    category: 'borb',
    icon: 'WORLD',
    response: {
      title: 'UQ - Innovacion mundial',
      content: 'UQ es una INNOVACION MUNDIAL.\n\nLO QUE HACE UQ UNICO :\n1. 6 Cajas economicas\n2. Contador central\n3. Precision infinita\n4. Autonomia 75%\n5. Anti-inflacion/deflacion\n6. Tasa dinamica\n7. Invariante simple\n8. Organismo vivo\n\nNinguna otra blockchain tiene esto.',
      suggestions: ['Comparacion', 'El Contador', 'El organismo vivo'],
    },
  },];

export default KNOWLEDGE_ES;



