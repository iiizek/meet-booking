import {
	Projector,
	Tv,
	Monitor,
	Video,
	Phone,
	Mic,
	Speaker,
	PenTool,
	FileText,
	Wind,
	Coffee,
	Droplets,
	Cable,
	Usb,
	Wifi,
	Network,
	Plug,
	Sun,
	VolumeX,
	Accessibility,
	HelpCircle,
} from 'lucide-react';

export const AMENITY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
	projector: Projector,
	tv: Tv,
	screen: Monitor,
	video_conferencing: Video,
	phone: Phone,
	microphone: Mic,
	speakers: Speaker,
	whiteboard: PenTool,
	flipchart: FileText,
	air_conditioning: Wind,
	coffee_machine: Coffee,
	water_cooler: Droplets,
	hdmi: Cable,
	usb_c: Usb,
	wifi: Wifi,
	ethernet: Network,
	power_outlets: Plug,
	natural_light: Sun,
	soundproof: VolumeX,
	wheelchair_accessible: Accessibility,
};

export const AMENITY_LABELS: Record<string, string> = {
	projector: 'Проектор',
	tv: 'ТВ',
	screen: 'Экран',
	video_conferencing: 'Видеосвязь',
	whiteboard: 'Маркерная доска',
	wifi: 'Wi-Fi',
	air_conditioning: 'Кондиционер',
	coffee_machine: 'Кофемашина',
	// ...
};

export const getAmenityIcon = (code: string) => {
	return AMENITY_ICONS[code] || HelpCircle;
};

export const getAmenityLabel = (code: string) => {
	return AMENITY_LABELS[code] || code;
};

// Список для селекта в форме
export const AVAILABLE_AMENITIES = Object.keys(AMENITY_ICONS).map((code) => ({
	value: code,
	label: AMENITY_LABELS[code] || code,
	icon: AMENITY_ICONS[code],
}));

