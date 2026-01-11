import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// Директория для загрузки файлов
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
const ROOMS_DIR = path.join(UPLOAD_DIR, 'rooms');

// Создаём директории если не существуют
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}
if (!fs.existsSync(ROOMS_DIR)) {
  fs.mkdirSync(ROOMS_DIR, { recursive: true });
}

// Допустимые типы файлов
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
];

// Максимальный размер файла (5 MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Настройка хранилища
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, ROOMS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const filename = `${uuidv4()}${ext}`;
    cb(null, filename);
  },
});

// Фильтр файлов
const fileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Недопустимый тип файла. Разрешены: JPEG, PNG, WebP, GIF'));
  }
};

// Multer instance для загрузки изображений комнат
export const uploadRoomImage = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
});

// Удалить файл
export function deleteFile(filePath: string): void {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error('Error deleting file:', error);
  }
}

// Получить полный путь к файлу
export function getFilePath(filename: string, type: 'rooms' = 'rooms'): string {
  const dirs: Record<string, string> = {
    rooms: ROOMS_DIR,
  };
  return path.join(dirs[type], filename);
}

// Получить URL файла
export function getFileUrl(filename: string, type: 'rooms' = 'rooms'): string {
  return `/uploads/${type}/${filename}`;
}

// Извлечь имя файла из URL
export function extractFilename(url: string): string | null {
  const match = url.match(/\/uploads\/\w+\/(.+)$/);
  return match ? match[1] : null;
}

export { UPLOAD_DIR, ROOMS_DIR };
