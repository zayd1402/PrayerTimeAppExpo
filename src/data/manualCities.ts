import { AppLocation } from '../types';

export const MANUAL_CITIES: AppLocation[] = [
  // Australia / Oceania
  { name: 'Sydney, NSW', latitude: -33.8688, longitude: 151.2093, source: 'manual-city', timezone: 'Australia/Sydney' },
  { name: 'Melbourne, VIC', latitude: -37.8136, longitude: 144.9631, source: 'manual-city', timezone: 'Australia/Melbourne' },
  { name: 'Brisbane, QLD', latitude: -27.4698, longitude: 153.0251, source: 'manual-city', timezone: 'Australia/Brisbane' },
  { name: 'Perth, WA', latitude: -31.9505, longitude: 115.8605, source: 'manual-city', timezone: 'Australia/Perth' },
  { name: 'Adelaide, SA', latitude: -34.9285, longitude: 138.6007, source: 'manual-city', timezone: 'Australia/Adelaide' },
  { name: 'Canberra, ACT', latitude: -35.2809, longitude: 149.13, source: 'manual-city', timezone: 'Australia/Sydney' },
  { name: 'Gold Coast, QLD', latitude: -28.0167, longitude: 153.4, source: 'manual-city', timezone: 'Australia/Brisbane' },
  { name: 'Auckland, New Zealand', latitude: -36.8509, longitude: 174.7645, source: 'manual-city', timezone: 'Pacific/Auckland' },

  // North America
  { name: 'New York, USA', latitude: 40.7128, longitude: -74.006, source: 'manual-city', timezone: 'America/New_York' },
  { name: 'Los Angeles, USA', latitude: 34.0522, longitude: -118.2437, source: 'manual-city', timezone: 'America/Los_Angeles' },
  { name: 'Chicago, USA', latitude: 41.8781, longitude: -87.6298, source: 'manual-city', timezone: 'America/Chicago' },
  { name: 'Houston, USA', latitude: 29.7604, longitude: -95.3698, source: 'manual-city', timezone: 'America/Chicago' },
  { name: 'Toronto, Canada', latitude: 43.6532, longitude: -79.3832, source: 'manual-city', timezone: 'America/Toronto' },
  { name: 'Vancouver, Canada', latitude: 49.2827, longitude: -123.1207, source: 'manual-city', timezone: 'America/Vancouver' },
  { name: 'Mexico City, Mexico', latitude: 19.4326, longitude: -99.1332, source: 'manual-city', timezone: 'America/Mexico_City' },

  // Europe
  { name: 'London, UK', latitude: 51.5074, longitude: -0.1278, source: 'manual-city', timezone: 'Europe/London' },
  { name: 'Birmingham, UK', latitude: 52.4862, longitude: -1.8904, source: 'manual-city', timezone: 'Europe/London' },
  { name: 'Paris, France', latitude: 48.8566, longitude: 2.3522, source: 'manual-city', timezone: 'Europe/Paris' },
  { name: 'Berlin, Germany', latitude: 52.52, longitude: 13.405, source: 'manual-city', timezone: 'Europe/Berlin' },
  { name: 'Munich, Germany', latitude: 48.1351, longitude: 11.582, source: 'manual-city', timezone: 'Europe/Berlin' },
  { name: 'Amsterdam, Netherlands', latitude: 52.3676, longitude: 4.9041, source: 'manual-city', timezone: 'Europe/Amsterdam' },
  { name: 'Brussels, Belgium', latitude: 50.8503, longitude: 4.3517, source: 'manual-city', timezone: 'Europe/Brussels' },
  { name: 'Madrid, Spain', latitude: 40.4168, longitude: -3.7038, source: 'manual-city', timezone: 'Europe/Madrid' },
  { name: 'Barcelona, Spain', latitude: 41.3851, longitude: 2.1734, source: 'manual-city', timezone: 'Europe/Madrid' },
  { name: 'Rome, Italy', latitude: 41.9028, longitude: 12.4964, source: 'manual-city', timezone: 'Europe/Rome' },
  { name: 'Milan, Italy', latitude: 45.4642, longitude: 9.19, source: 'manual-city', timezone: 'Europe/Rome' },
  { name: 'Stockholm, Sweden', latitude: 59.3293, longitude: 18.0686, source: 'manual-city', timezone: 'Europe/Stockholm' },
  { name: 'Oslo, Norway', latitude: 59.9139, longitude: 10.7522, source: 'manual-city', timezone: 'Europe/Oslo' },
  { name: 'Copenhagen, Denmark', latitude: 55.6761, longitude: 12.5683, source: 'manual-city', timezone: 'Europe/Copenhagen' },
  { name: 'Vienna, Austria', latitude: 48.2082, longitude: 16.3738, source: 'manual-city', timezone: 'Europe/Vienna' },
  { name: 'Zurich, Switzerland', latitude: 47.3769, longitude: 8.5417, source: 'manual-city', timezone: 'Europe/Zurich' },
  { name: 'Istanbul, Türkiye', latitude: 41.0082, longitude: 28.9784, source: 'manual-city', timezone: 'Europe/Istanbul' },
  { name: 'Moscow, Russia', latitude: 55.7558, longitude: 37.6173, source: 'manual-city', timezone: 'Europe/Moscow' },

  // Middle East
  { name: 'Jeddah, Saudi Arabia', latitude: 21.4858, longitude: 39.1925, source: 'manual-city', timezone: 'Asia/Riyadh' },
  { name: 'Riyadh, Saudi Arabia', latitude: 24.7136, longitude: 46.6753, source: 'manual-city', timezone: 'Asia/Riyadh' },
  { name: 'Mecca, Saudi Arabia', latitude: 21.3891, longitude: 39.8579, source: 'manual-city', timezone: 'Asia/Riyadh' },
  { name: 'Medina, Saudi Arabia', latitude: 24.5247, longitude: 39.5692, source: 'manual-city', timezone: 'Asia/Riyadh' },
  { name: 'Dubai, UAE', latitude: 25.2048, longitude: 55.2708, source: 'manual-city', timezone: 'Asia/Dubai' },
  { name: 'Abu Dhabi, UAE', latitude: 24.4539, longitude: 54.3773, source: 'manual-city', timezone: 'Asia/Dubai' },
  { name: 'Doha, Qatar', latitude: 25.2854, longitude: 51.531, source: 'manual-city', timezone: 'Asia/Qatar' },
  { name: 'Kuwait City, Kuwait', latitude: 29.3759, longitude: 47.9774, source: 'manual-city', timezone: 'Asia/Kuwait' },
  { name: 'Manama, Bahrain', latitude: 26.2285, longitude: 50.586, source: 'manual-city', timezone: 'Asia/Bahrain' },
  { name: 'Muscat, Oman', latitude: 23.5859, longitude: 58.4059, source: 'manual-city', timezone: 'Asia/Muscat' },
  { name: 'Amman, Jordan', latitude: 31.9454, longitude: 35.9284, source: 'manual-city', timezone: 'Asia/Amman' },
  { name: 'Cairo, Egypt', latitude: 30.0444, longitude: 31.2357, source: 'manual-city', timezone: 'Africa/Cairo' },
  { name: 'Alexandria, Egypt', latitude: 31.2001, longitude: 29.9187, source: 'manual-city', timezone: 'Africa/Cairo' },
  { name: 'Jerusalem, Palestine', latitude: 31.7683, longitude: 35.2137, source: 'manual-city', timezone: 'Asia/Jerusalem' },
  { name: 'Beirut, Lebanon', latitude: 33.8938, longitude: 35.5018, source: 'manual-city', timezone: 'Asia/Beirut' },
  { name: 'Baghdad, Iraq', latitude: 33.3152, longitude: 44.3661, source: 'manual-city', timezone: 'Asia/Baghdad' },
  { name: 'Tehran, Iran', latitude: 35.6892, longitude: 51.389, source: 'manual-city', timezone: 'Asia/Tehran' },

  // South Asia
  { name: 'Karachi, Pakistan', latitude: 24.8607, longitude: 67.0011, source: 'manual-city', timezone: 'Asia/Karachi' },
  { name: 'Lahore, Pakistan', latitude: 31.5204, longitude: 74.3587, source: 'manual-city', timezone: 'Asia/Karachi' },
  { name: 'Islamabad, Pakistan', latitude: 33.6844, longitude: 73.0479, source: 'manual-city', timezone: 'Asia/Karachi' },
  { name: 'Mumbai, India', latitude: 19.076, longitude: 72.8777, source: 'manual-city', timezone: 'Asia/Kolkata' },
  { name: 'Delhi, India', latitude: 28.6139, longitude: 77.209, source: 'manual-city', timezone: 'Asia/Kolkata' },
  { name: 'Bangalore, India', latitude: 12.9716, longitude: 77.5946, source: 'manual-city', timezone: 'Asia/Kolkata' },
  { name: 'Dhaka, Bangladesh', latitude: 23.8103, longitude: 90.4125, source: 'manual-city', timezone: 'Asia/Dhaka' },

  // Southeast / East Asia
  { name: 'Jakarta, Indonesia', latitude: -6.2088, longitude: 106.8456, source: 'manual-city', timezone: 'Asia/Jakarta' },
  { name: 'Kuala Lumpur, Malaysia', latitude: 3.139, longitude: 101.6869, source: 'manual-city', timezone: 'Asia/Kuala_Lumpur' },
  { name: 'Singapore', latitude: 1.3521, longitude: 103.8198, source: 'manual-city', timezone: 'Asia/Singapore' },
  { name: 'Bangkok, Thailand', latitude: 13.7563, longitude: 100.5018, source: 'manual-city', timezone: 'Asia/Bangkok' },
  { name: 'Manila, Philippines', latitude: 14.5995, longitude: 120.9842, source: 'manual-city', timezone: 'Asia/Manila' },
  { name: 'Hong Kong', latitude: 22.3193, longitude: 114.1694, source: 'manual-city', timezone: 'Asia/Hong_Kong' },
  { name: 'Tokyo, Japan', latitude: 35.6762, longitude: 139.6503, source: 'manual-city', timezone: 'Asia/Tokyo' },
  { name: 'Seoul, South Korea', latitude: 37.5665, longitude: 126.978, source: 'manual-city', timezone: 'Asia/Seoul' },
  { name: 'Beijing, China', latitude: 39.9042, longitude: 116.4074, source: 'manual-city', timezone: 'Asia/Shanghai' },

  // Africa
  { name: 'Lagos, Nigeria', latitude: 6.5244, longitude: 3.3792, source: 'manual-city', timezone: 'Africa/Lagos' },
  { name: 'Abuja, Nigeria', latitude: 9.0765, longitude: 7.3986, source: 'manual-city', timezone: 'Africa/Lagos' },
  { name: 'Nairobi, Kenya', latitude: -1.2921, longitude: 36.8219, source: 'manual-city', timezone: 'Africa/Nairobi' },
  { name: 'Johannesburg, South Africa', latitude: -26.2041, longitude: 28.0473, source: 'manual-city', timezone: 'Africa/Johannesburg' },
  { name: 'Cape Town, South Africa', latitude: -33.9249, longitude: 18.4241, source: 'manual-city', timezone: 'Africa/Johannesburg' },
  { name: 'Casablanca, Morocco', latitude: 33.5731, longitude: -7.5898, source: 'manual-city', timezone: 'Africa/Casablanca' },
  { name: 'Algiers, Algeria', latitude: 36.7538, longitude: 3.0588, source: 'manual-city', timezone: 'Africa/Algiers' },
  { name: 'Tunis, Tunisia', latitude: 36.8065, longitude: 10.1815, source: 'manual-city', timezone: 'Africa/Tunis' },
  { name: 'Khartoum, Sudan', latitude: 15.5007, longitude: 32.5599, source: 'manual-city', timezone: 'Africa/Khartoum' },
  { name: 'Addis Ababa, Ethiopia', latitude: 9.145, longitude: 40.4897, source: 'manual-city', timezone: 'Africa/Addis_Ababa' },
];

export function findManualCity(name: string): AppLocation | undefined {
  return MANUAL_CITIES.find(city => city.name === name);
}
