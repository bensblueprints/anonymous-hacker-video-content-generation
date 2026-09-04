export type CardPosition = 'upper' | 'center' | 'lower';

export interface CapabilityCardData {
  startSec: number;
  endSec: number;
  kicker: string;
  headline: string;
  bullets?: string[];
  accent: string;
  position: CardPosition;
}

// Concise presentation cards keyed to the accepted masked-narration SRT.
// These are summaries, not subtitles, and contain no operational attack steps.
export const CAPABILITY_CARDS: CapabilityCardData[] = [
  {startSec: 2.1, endSec: 5.7, kicker: 'THE DEVICE', headline: 'LOOKS LIKE A HARMLESS DIGITAL PET', accent: '#7ef29d', position: 'upper'},
  {startSec: 5.72, endSec: 10.5, kicker: 'REAL-WORLD IMPACT', headline: 'SMALL TOOL. SERIOUS CONSEQUENCES.', bullets: ['Real damage', 'Potential federal case'], accent: '#ff5f69', position: 'lower'},
  {startSec: 11.24, endSec: 15.64, kicker: 'WHAT YOU WILL LEARN', headline: '5 MISTAKES — AND SAFER ALTERNATIVES', accent: '#4dc3ff', position: 'upper'},
  {startSec: 18.74, endSec: 23.4, kicker: 'SCOPE', headline: 'EDUCATIONAL + ETHICAL USE ONLY', accent: '#b96dff', position: 'lower'},
  {startSec: 23.64, endSec: 28.4, kicker: 'THE RULE', headline: 'AUTHORIZATION IS MANDATORY', accent: '#ff9e3d', position: 'upper'},
  {startSec: 28.92, endSec: 32.1, kicker: 'TEST ONLY', headline: 'YOUR EQUIPMENT — OR WRITTEN PERMISSION', accent: '#7ef29d', position: 'lower'},

  {startSec: 45.62, endSec: 50.42, kicker: 'BADUSB CAPABILITY', headline: 'CAN EMULATE A USB KEYBOARD', bullets: ['Computers normally trust keyboards'], accent: '#ff5f69', position: 'lower'},
  {startSec: 51.58, endSec: 54.22, kicker: 'AUTOMATION', headline: 'TYPES FASTER THAN A PERSON', accent: '#ff5f69', position: 'upper'},
  {startSec: 55.06, endSec: 58.32, kicker: 'LEGITIMATE USE', headline: 'CONTROLLED LAB DEMONSTRATION', accent: '#7ef29d', position: 'lower'},
  {startSec: 58.74, endSec: 62.38, kicker: 'DANGER SIGNAL', headline: 'UNLOCKED PC + UNKNOWN USB', accent: '#ff9e3d', position: 'upper'},
  {startSec: 62.88, endSec: 67.68, kicker: 'PROHIBITED ABUSE', headline: 'A BADUSB CAN BE MISUSED TO…', bullets: ['Download files', 'Create hidden accounts', 'Collect passwords'], accent: '#ff3f4d', position: 'center'},
  {startSec: 67.86, endSec: 71.66, kicker: 'ALSO PROHIBITED', headline: 'THIS IS NOT A PRANK', bullets: ['Disable security tools', 'Install remote access'], accent: '#ff3f4d', position: 'center'},
  {startSec: 72.16, endSec: 76.7, kicker: 'LEGAL REALITY', headline: 'UNAUTHORIZED ACCESS HAS CONSEQUENCES', accent: '#ff5f69', position: 'upper'},
  {startSec: 77.68, endSec: 80.3, kicker: 'SAFE PRACTICE', headline: 'USE A SPARE PC OR VIRTUAL MACHINE', accent: '#7ef29d', position: 'lower'},
  {startSec: 80.4, endSec: 84.2, kicker: 'HARMLESS DEMO', headline: 'OPEN A TEXT EDITOR + TYPE A MESSAGE', accent: '#4dc3ff', position: 'upper'},
  {startSec: 86.28, endSec: 90.08, kicker: 'SAFE LAB LIMITS', headline: 'NO PERSISTENCE. NO STOLEN DATA.', bullets: ['No network connection required'], accent: '#7ef29d', position: 'lower'},

  {startSec: 96.2, endSec: 101.0, kicker: 'ACCESS-CARD CAPABILITY', headline: 'READS SOME LOW-FREQUENCY RFID + NFC', accent: '#ff9e3d', position: 'lower'},
  {startSec: 101.9, endSec: 104.84, kicker: 'SECURITY LESSON', headline: 'REVEALS WEAK LEGACY ACCESS CONTROL', accent: '#ffd166', position: 'upper'},
  {startSec: 105.4, endSec: 110.18, kicker: 'NO PERMISSION IMPLIED', headline: 'DO NOT COPY BADGES, FOBS OR KEYS', bullets: ['Employee badge', 'Apartment or hotel key', 'Transit or gym pass'], accent: '#ff5f69', position: 'center'},
  {startSec: 112.22, endSec: 116.86, kicker: 'CLONING + REPLAY', headline: 'RESTRICTED ACCESS CAN BECOME UNLAWFUL', accent: '#ff5f69', position: 'upper'},
  {startSec: 120.74, endSec: 125.34, kicker: 'MODERN PROTECTION', headline: 'SECURE CARDS USE CRYPTOGRAPHY', bullets: ['A quick scan is not a duplicate'], accent: '#4dc3ff', position: 'lower'},
  {startSec: 126.02, endSec: 129.04, kicker: 'IDENTITY', headline: 'READING A SIGNAL ≠ OWNING IT', accent: '#ff9e3d', position: 'upper'},
  {startSec: 129.32, endSec: 133.0, kicker: 'SAFE RFID LAB', headline: 'BLANK TEST TAGS + YOUR OWN READER', accent: '#7ef29d', position: 'lower'},
  {startSec: 133.3, endSec: 137.8, kicker: 'COMPARE SAFELY', headline: 'FIXED IDENTIFIER vs CRYPTO CREDENTIAL', accent: '#4dc3ff', position: 'upper'},

  {startSec: 147.1, endSec: 150.56, kicker: 'RADIO CAPABILITY', headline: 'SUB-GHz SIGNAL ANALYSIS', accent: '#ffe14d', position: 'lower'},
  {startSec: 150.98, endSec: 155.78, kicker: 'WHAT IT CAN STUDY', headline: 'SIMPLE WIRELESS DEVICES', bullets: ['Test outlets', 'Doorbells', 'Sensors'], accent: '#ffe14d', position: 'center'},
  {startSec: 156.44, endSec: 160.72, kicker: 'TRANSMISSION RULE', headline: 'ONLY EQUIPMENT YOU OWN', accent: '#ff5f69', position: 'upper'},
  {startSec: 160.78, endSec: 164.2, kicker: 'LEGAL LIMITS', headline: 'RADIO RULES + COMPUTER-CRIME LAWS', accent: '#ff9e3d', position: 'lower'},
  {startSec: 164.64, endSec: 168.2, kicker: 'MODERN REMOTES', headline: 'ROLLING CODES CHANGE EACH USE', accent: '#4dc3ff', position: 'upper'},
  {startSec: 168.28, endSec: 171.98, kicker: 'MYTH', headline: 'ONE RECORDING ≠ A MASTER KEY', accent: '#ff5f69', position: 'lower'},
  {startSec: 172.38, endSec: 176.78, kicker: 'CARELESS TESTING', headline: 'CAN BREAK NORMAL OPERATION', bullets: ['Desynchronize a remote', 'Trigger an alarm', 'Lock the owner out'], accent: '#ff3f4d', position: 'center'},
  {startSec: 177.3, endSec: 180.52, kicker: 'SAFE RADIO LAB', headline: 'YOUR RECEIVER + YOUR REMOTE', accent: '#7ef29d', position: 'upper'},
  {startSec: 180.92, endSec: 184.7, kicker: 'RESPONSIBLE TESTING', headline: 'LOW POWER. FOLLOW FREQUENCY RULES.', accent: '#7ef29d', position: 'lower'},

  {startSec: 195.0, endSec: 199.3, kicker: 'ADD-ON HARDWARE', headline: 'EXPANDS WIRELESS CAPABILITIES', accent: '#4dff88', position: 'upper'},
  {startSec: 199.34, endSec: 202.84, kicker: 'PROHIBITED MISUSE', headline: 'WIRELESS INTERFERENCE', bullets: ['Deauthentication attempts', 'Bluetooth spam', 'Other disruption'], accent: '#ff3f4d', position: 'center'},
  {startSec: 203.48, endSec: 207.86, kicker: 'HARM WITHOUT THEFT', headline: 'KNOCKING USERS OFFLINE IS STILL DISRUPTIVE', accent: '#ff5f69', position: 'lower'},
  {startSec: 211.18, endSec: 215.2, kicker: 'NOT A LAB', headline: 'COFFEE SHOP. SCHOOL. HOTEL. AIRPORT.', accent: '#ff9e3d', position: 'upper'},
  {startSec: 217.2, endSec: 219.8, kicker: 'AUTHORIZATION', headline: '“JUST TESTING” IS NOT PERMISSION', accent: '#ff5f69', position: 'lower'},
  {startSec: 220.0, endSec: 224.32, kicker: 'SAFE WI-FI LAB', headline: 'ISOLATED ROUTER YOU OWN', bullets: ['Disconnect from the internet', 'Connect only your test devices'], accent: '#7ef29d', position: 'upper'},
  {startSec: 227.5, endSec: 231.76, kicker: 'DEFENSIVE GOAL', headline: 'REDUCE DISRUPTION', bullets: ['Protected management frames', 'Monitoring', 'Good network design'], accent: '#4dc3ff', position: 'center'},

  {startSec: 238.4, endSec: 243.0, kicker: 'CAPTURED DATA', headline: 'MAY IDENTIFY REAL PEOPLE', bullets: ['Radio data', 'Infrared codes', 'Badge or device IDs'], accent: '#4dc3ff', position: 'center'},
  {startSec: 244.14, endSec: 248.94, kicker: 'SHARING RISK', headline: 'A CAPTURE CAN EXPOSE…', bullets: ['A home or workplace', 'A vehicle', 'An account'], accent: '#ff5f69', position: 'center'},
  {startSec: 249.76, endSec: 252.6, kicker: 'PRIVACY', headline: 'PERSONAL INFORMATION CAN LEAK', accent: '#ff9e3d', position: 'upper'},
  {startSec: 252.96, endSec: 256.68, kicker: 'DO NOT PUBLISH', headline: 'NO DISCORD, FORUM OR PUBLIC-REPO UPLOADS', accent: '#ff3f4d', position: 'lower'},
  {startSec: 257.0, endSec: 261.66, kicker: 'DATA HYGIENE', headline: 'DO NOT BUILD PERSONAL CAPTURE LIBRARIES', accent: '#ff5f69', position: 'upper'},
  {startSec: 262.26, endSec: 267.06, kicker: 'RESPONSIBLE DISCLOSURE', headline: 'PRESERVE MINIMUM EVIDENCE', bullets: ['Report privately to the owner'], accent: '#7ef29d', position: 'lower'},
  {startSec: 267.26, endSec: 269.6, kicker: 'DISCLOSURE', headline: 'GIVE THE OWNER TIME TO FIX IT', accent: '#7ef29d', position: 'upper'},

  {startSec: 278.04, endSec: 282.84, kicker: 'POSITIVE USE', headline: 'UNDERSTAND SYSTEMS. TEST YOUR DEFENSES.', bullets: ['Become the person who fixes security problems'], accent: '#b96dff', position: 'upper'},
  {startSec: 284.24, endSec: 288.92, kicker: 'THE ETHICAL METHOD', headline: 'LEARN · TEST · DOCUMENT · GET PERMISSION', accent: '#7ef29d', position: 'upper'},
];
