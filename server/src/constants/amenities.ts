// Словарь удобств/оборудования комнат
// Ключ - код для хранения в БД
// Значение - информация для отображения на фронтенде

export interface AmenityInfo {
  code: string;
  name: string;
  nameEn: string;
  icon: string; // Название иконки (Lucide React)
  description?: string;
}

export const AMENITIES: Record<string, AmenityInfo> = {
  // Техника для презентаций
  projector: {
    code: 'projector',
    name: 'Проектор',
    nameEn: 'Projector',
    icon: 'Projector',
    description: 'Проектор для презентаций',
  },
  tv: {
    code: 'tv',
    name: 'Телевизор',
    nameEn: 'TV',
    icon: 'Tv',
    description: 'Телевизор / монитор',
  },
  screen: {
    code: 'screen',
    name: 'Экран',
    nameEn: 'Screen',
    icon: 'Monitor',
    description: 'Проекционный экран',
  },

  // Связь и конференции
  video_conferencing: {
    code: 'video_conferencing',
    name: 'Видеоконференцсвязь',
    nameEn: 'Video Conferencing',
    icon: 'Video',
    description: 'Оборудование для видеозвонков',
  },
  phone: {
    code: 'phone',
    name: 'Телефон',
    nameEn: 'Phone',
    icon: 'Phone',
    description: 'Конференц-телефон',
  },
  microphone: {
    code: 'microphone',
    name: 'Микрофон',
    nameEn: 'Microphone',
    icon: 'Mic',
    description: 'Микрофон / звуковое оборудование',
  },
  speakers: {
    code: 'speakers',
    name: 'Колонки',
    nameEn: 'Speakers',
    icon: 'Speaker',
    description: 'Аудиосистема',
  },

  // Рабочие инструменты
  whiteboard: {
    code: 'whiteboard',
    name: 'Маркерная доска',
    nameEn: 'Whiteboard',
    icon: 'PenTool',
    description: 'Доска для записей маркером',
  },
  flipchart: {
    code: 'flipchart',
    name: 'Флипчарт',
    nameEn: 'Flipchart',
    icon: 'FileText',
    description: 'Флипчарт с бумагой',
  },

  // Комфорт
  air_conditioning: {
    code: 'air_conditioning',
    name: 'Кондиционер',
    nameEn: 'Air Conditioning',
    icon: 'Wind',
    description: 'Кондиционер / климат-контроль',
  },
  coffee_machine: {
    code: 'coffee_machine',
    name: 'Кофемашина',
    nameEn: 'Coffee Machine',
    icon: 'Coffee',
    description: 'Кофемашина в комнате',
  },
  water_cooler: {
    code: 'water_cooler',
    name: 'Кулер с водой',
    nameEn: 'Water Cooler',
    icon: 'Droplets',
    description: 'Кулер с питьевой водой',
  },

  // Подключения
  hdmi: {
    code: 'hdmi',
    name: 'HDMI',
    nameEn: 'HDMI',
    icon: 'Cable',
    description: 'HDMI подключение',
  },
  usb_c: {
    code: 'usb_c',
    name: 'USB-C',
    nameEn: 'USB-C',
    icon: 'Usb',
    description: 'USB-C подключение',
  },
  wifi: {
    code: 'wifi',
    name: 'Wi-Fi',
    nameEn: 'Wi-Fi',
    icon: 'Wifi',
    description: 'Беспроводной интернет',
  },
  ethernet: {
    code: 'ethernet',
    name: 'Ethernet',
    nameEn: 'Ethernet',
    icon: 'Network',
    description: 'Проводной интернет',
  },
  power_outlets: {
    code: 'power_outlets',
    name: 'Розетки',
    nameEn: 'Power Outlets',
    icon: 'Plug',
    description: 'Достаточно розеток для всех',
  },

  // Особенности
  natural_light: {
    code: 'natural_light',
    name: 'Естественное освещение',
    nameEn: 'Natural Light',
    icon: 'Sun',
    description: 'Окна с естественным светом',
  },
  soundproof: {
    code: 'soundproof',
    name: 'Звукоизоляция',
    nameEn: 'Soundproof',
    icon: 'VolumeX',
    description: 'Звукоизолированное помещение',
  },
  wheelchair_accessible: {
    code: 'wheelchair_accessible',
    name: 'Доступная среда',
    nameEn: 'Wheelchair Accessible',
    icon: 'Accessibility',
    description: 'Доступно для людей с ограниченными возможностями',
  },
};

// Получить информацию об удобстве по коду
export function getAmenityInfo(code: string): AmenityInfo | null {
  return AMENITIES[code] || null;
}

// Получить список всех удобств
export function getAllAmenities(): AmenityInfo[] {
  return Object.values(AMENITIES);
}

// Получить информацию о нескольких удобствах
export function getAmenitiesInfo(codes: string[]): AmenityInfo[] {
  return codes
    .map((code) => AMENITIES[code])
    .filter((amenity): amenity is AmenityInfo => amenity !== undefined);
}

// Группы удобств для UI
export const AMENITY_GROUPS = {
  presentation: {
    name: 'Презентации',
    nameEn: 'Presentation',
    items: ['projector', 'tv', 'screen'],
  },
  communication: {
    name: 'Связь',
    nameEn: 'Communication',
    items: ['video_conferencing', 'phone', 'microphone', 'speakers'],
  },
  tools: {
    name: 'Инструменты',
    nameEn: 'Tools',
    items: ['whiteboard', 'flipchart'],
  },
  comfort: {
    name: 'Комфорт',
    nameEn: 'Comfort',
    items: ['air_conditioning', 'coffee_machine', 'water_cooler'],
  },
  connectivity: {
    name: 'Подключения',
    nameEn: 'Connectivity',
    items: ['hdmi', 'usb_c', 'wifi', 'ethernet', 'power_outlets'],
  },
  features: {
    name: 'Особенности',
    nameEn: 'Features',
    items: ['natural_light', 'soundproof', 'wheelchair_accessible'],
  },
};
