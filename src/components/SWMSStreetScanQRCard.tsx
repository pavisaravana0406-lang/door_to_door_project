import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Printer, QrCode, Download, MapPin, Truck, User, Phone, Shield } from 'lucide-react';

export const SREE_NAGAR_SCAN_ROUTE = {
  routeId: 'CCMC-EZ-W24-SN-001',
  zone: 'EAST',
  wardNo: '24',
  streetName: 'sree nagar',
  households: 140,
  vehicleType: 'TATA ACE',
  vehicleNo: 'TN66AE6121',
  workerName: 'murali',
  workerContact: '9677971375',
  siName: 'S.R.GERALD SATHIYA PUNITHAN',
  siContact: '9442504589',
  ssName: 'vibin',
  ssContact: '9442504589',
  cssName: 'vengatesh',
  cssContact: '8072092485',
  type: 'SWMS_STREET_SCAN',
};

export const MAGESHWARI_NAGAR_SCAN_ROUTE = {
  routeId: 'CCMC-EZ-W24-MN-002',
  zone: 'EAST',
  wardNo: '24',
  streetName: 'MAGESHWARI NAGAR',
  households: 30,
  vehicleType: 'TATA ACE',
  vehicleNo: 'TN66AD6465',
  workerName: 'YOGARAJ',
  workerContact: '8220110220',
  siName: 'S.R.GERALD SATHIYA PUNITHAN',
  siContact: '9442504589',
  ssName: 'vibin',
  ssContact: '9442504589',
  cssName: 'vengatesh',
  cssContact: '8072092485',
  type: 'SWMS_STREET_SCAN',
};

export const THIYAGIKUMAR_STREET_SCAN_ROUTE = {
  routeId: 'CCMC-EZ-W24-TS-003',
  zone: 'EAST',
  wardNo: '24',
  streetName: 'THIYAGIKUMAR STREET',
  households: 211,
  vehicleType: 'PUSH CART',
  vehicleNo: 'PUSHCART',
  workerName: 'SUSILA',
  workerContact: '9790598785',
  siName: 'S.R.GERALD SATHIYA PUNITHAN',
  siContact: '9442504589',
  ssName: 'vibin',
  ssContact: '9442504589',
  cssName: 'vengatesh',
  cssContact: '8072092485',
  type: 'SWMS_STREET_SCAN',
};

export const MGR_VEEDHI_SCAN_ROUTE = {
  routeId: 'CCMC-EZ-W24-MV-004',
  zone: 'EAST',
  wardNo: '24',
  streetName: 'M.G.R.VEEDHI',
  households: 95,
  vehicleType: 'PUSH CART',
  vehicleNo: 'PUSHCART2',
  workerName: 'PRIYA',
  workerContact: '7397587127',
  siName: 'S.R.GERALD SATHIYA PUNITHAN',
  siContact: '9442504589',
  ssName: 'vibin',
  ssContact: '9442504589',
  cssName: 'vengatesh',
  cssContact: '8072092485',
  type: 'SWMS_STREET_SCAN',
};

export const KALYANAM_SUNDHARAM_STREET_SCAN_ROUTE = {
  routeId: 'CCMC-EZ-W24-KS-005',
  zone: 'EAST',
  wardNo: '24',
  streetName: 'KALYANAM SUNDHARAM STREET',
  households: 700,
  vehicleType: 'BOV',
  vehicleNo: 'BOV',
  workerName: 'ANADHAN',
  workerContact: '8098347628',
  siName: 'S.R.GERALD SATHIYA PUNITHAN',
  siContact: '9442504589',
  ssName: 'vibin',
  ssContact: '9442504589',
  cssName: 'vengatesh',
  cssContact: '8072092485',
  type: 'SWMS_STREET_SCAN',
};

export const PONNI_NAGAR_SCAN_ROUTE = {
  routeId: 'CCMC-CZ-W49-PN-006',
  zone: 'CENTRAL',
  wardNo: '49',
  streetName: 'ponni nagar',
  households: 530,
  vehicleType: 'TATA ACE',
  vehicleNo: 'TN66AD8373',
  workerName: 'surya',
  workerContact: '8870418209',
  siName: 'LOGANATHAN',
  siContact: '9489206052',
  ssName: 'MUTHUSAMY',
  ssContact: '9442104143',
  cssName: 'YAMUNA',
  cssContact: '6385728557',
  type: 'SWMS_STREET_SCAN',
};

export const PONNI_NAGAR_2_SCAN_ROUTE = {
  routeId: 'CCMC-CZ-W49-PN-007',
  zone: 'CENTRAL',
  wardNo: '49',
  streetName: 'ponni nagar',
  households: 250,
  vehicleType: 'TATA ACE',
  vehicleNo: 'TN66AQ1114',
  workerName: 'GOKULA KRISHNAN',
  workerContact: '9751099379',
  siName: 'LOGANATHAN',
  siContact: '9489206052',
  ssName: 'MUTHUSAMY',
  ssContact: '9442104143',
  cssName: 'YAMUNA',
  cssContact: '6385728557',
  type: 'SWMS_STREET_SCAN',
};

export const KANDHASAMY_LAYOUT_SCAN_ROUTE = {
  routeId: 'CCMC-CZ-W49-KL-008',
  zone: 'CENTRAL',
  wardNo: '49',
  streetName: 'KANDHASAMY LAYOUT',
  households: 250,
  vehicleType: 'PUSH CART',
  vehicleNo: 'PUSHCART3',
  workerName: 'PALANISAMY',
  workerContact: '9677966465',
  siName: 'LOGANATHAN',
  siContact: '9489206052',
  ssName: 'MUTHUSAMY',
  ssContact: '9442104143',
  cssName: 'YAMUNA',
  cssContact: '6385728557',
  type: 'SWMS_STREET_SCAN',
};

export const LAKSHMI_MILLS_SIGNAL_SCAN_ROUTE = {
  routeId: 'CCMC-CZ-W49-LM-009',
  zone: 'CENTRAL',
  wardNo: '49',
  streetName: 'LAKSHMI MILLS SIGNAL',
  households: 250,
  vehicleType: 'PUSH CART',
  vehicleNo: 'PUSHCART4',
  workerName: 'VADIVUKARASI',
  workerContact: '7667769132',
  siName: 'LOGANATHAN',
  siContact: '9489206052',
  ssName: 'MUTHUSAMY',
  ssContact: '9442104143',
  cssName: 'YAMUNA',
  cssContact: '6385728557',
  type: 'SWMS_STREET_SCAN',
};

export const MARIYAMMAN_KOVIL_STREET_SCAN_ROUTE = {
  routeId: 'CCMC-CZ-W49-MK-010',
  zone: 'CENTRAL',
  wardNo: '49',
  streetName: 'MARIYAMMAN KOVIL STREET',
  households: 215,
  vehicleType: 'BOV',
  vehicleNo: 'TN66AQ0794',
  workerName: 'UDHAYAKUMAR',
  workerContact: '8056960451',
  siName: 'LOGANATHAN',
  siContact: '9489206052',
  ssName: 'MUTHUSAMY',
  ssContact: '9442104143',
  cssName: 'YAMUNA',
  cssContact: '6385728557',
  type: 'SWMS_STREET_SCAN',
};

export const KK_NAGAR_SCAN_ROUTE = {
  routeId: 'CCMC-WZ-W35-KK-011',
  zone: 'WEST',
  wardNo: '35',
  streetName: 'KK NAGAR',
  households: 24,
  vehicleType: 'TATA ACE',
  vehicleNo: 'TN66AQ1287',
  workerName: 'SARAVANA KUMAR',
  workerContact: '9750545466',
  siName: 'RAJENDRAN',
  siContact: '8925968002',
  ssName: 'ANANDH',
  ssContact: '8925968018',
  cssName: 'BALACHANDAR',
  cssContact: '9043130350',
  type: 'SWMS_STREET_SCAN',
};

export const RANGANATHAN_KOVIL_STREET_SCAN_ROUTE = {
  routeId: 'CCMC-WZ-W35-RK-012',
  zone: 'WEST',
  wardNo: '35',
  streetName: 'RANGANATHAN KOVIL STREET',
  households: 45,
  vehicleType: 'TATA ACE',
  vehicleNo: 'TN66AC9176',
  workerName: 'SENRAJ',
  workerContact: '8489034317',
  siName: 'RAJENDRAN',
  siContact: '8925968002',
  ssName: 'ANANDH',
  ssContact: '8925968018',
  cssName: 'BALACHANDAR',
  cssContact: '9043130350',
  type: 'SWMS_STREET_SCAN',
};

export const BAJANA_KOVIL_VEEDHI_SCAN_ROUTE = {
  routeId: 'CCMC-WZ-W35-BK-013',
  zone: 'WEST',
  wardNo: '35',
  streetName: 'BAJANA KOVIL VEEDHI',
  households: 20,
  vehicleType: 'PUSH CART',
  vehicleNo: 'PUSHCART5',
  workerName: 'JOTHI MANI',
  workerContact: 'N/A',
  siName: 'RAJENDRAN',
  siContact: '8925968002',
  ssName: 'ANANDH',
  ssContact: '8925968018',
  cssName: 'BALACHANDAR',
  cssContact: '9043130350',
  type: 'SWMS_STREET_SCAN',
};

export const BAARI_NAGAR_VEEDHI_CUT_ROAD_SCAN_ROUTE = {
  routeId: 'CCMC-WZ-W35-BN-014',
  zone: 'WEST',
  wardNo: '35',
  streetName: 'BAARI NAGAR VEEDHI CUT ROAD',
  households: 18,
  vehicleType: 'PUSH CART',
  vehicleNo: 'PUSHCART6',
  workerName: 'MARAGADHAM',
  workerContact: '9047038346',
  siName: 'RAJENDRAN',
  siContact: '8925968002',
  ssName: 'ANANDH',
  ssContact: '8925968018',
  cssName: 'BALACHANDAR',
  cssContact: '9043130350',
  type: 'SWMS_STREET_SCAN',
};

export const RAMASAMY_KOONARCUT_ROAD_SCAN_ROUTE = {
  routeId: 'CCMC-WZ-W35-RKC-015',
  zone: 'WEST',
  wardNo: '35',
  streetName: 'RAMASAMY KOONARCUT ROAD',
  households: 9,
  vehicleType: 'BOV',
  vehicleNo: 'TN66AP1181',
  workerName: 'RAMKUMAR',
  workerContact: '7317634144',
  siName: 'RAJENDRAN',
  siContact: '8925968002',
  ssName: 'ANANDH',
  ssContact: '8925968018',
  cssName: 'BALACHANDAR',
  cssContact: '9043130350',
  type: 'SWMS_STREET_SCAN',
};

export const MADHURA_ENCLAVE_SCAN_ROUTE = {
  routeId: 'CCMC-NZ-W35-ME-016',
  zone: 'NORTH',
  wardNo: '35',
  streetName: 'MADHURA ENCLAVE',
  households: 13,
  vehicleType: 'TATA ACE',
  vehicleNo: 'TN66AC1906',
  workerName: 'ARUNACHALAM',
  workerContact: '7317634144',
  siName: 'DHANABALAN',
  siContact: '9442104133',
  ssName: 'SARAVANA KUMAR',
  ssContact: '8925968035',
  cssName: 'MURALI',
  cssContact: '8870591470',
  type: 'SWMS_STREET_SCAN',
};

export const SENTHOORA_PURAM_SCAN_ROUTE = {
  routeId: 'CCMC-NZ-W35-SP-017',
  zone: 'NORTH',
  wardNo: '35',
  streetName: 'SENTHOORA PURAM',
  households: 16,
  vehicleType: 'TATA ACE',
  vehicleNo: 'TN66AC1906',
  workerName: 'MANI',
  workerContact: '9566421341',
  siName: 'DHANABALAN',
  siContact: '9442104133',
  ssName: 'SARAVANA KUMAR',
  ssContact: '8925968035',
  cssName: 'MURALI',
  cssContact: '8870591470',
  type: 'SWMS_STREET_SCAN',
};

export const MEENAKSHI_NAGAR_SCAN_ROUTE = {
  routeId: 'CCMC-NZ-W35-MN-018',
  zone: 'NORTH',
  wardNo: '35',
  streetName: 'MEENAKSHI NAGAR,SMP ESTATE',
  households: 33,
  vehicleType: 'PUSH CART',
  vehicleNo: 'PUSHCART7',
  workerName: 'MUTHULAKSHMI',
  workerContact: '9786741096',
  siName: 'DHANABALAN',
  siContact: '9442104133',
  ssName: 'SARAVANA KUMAR',
  ssContact: '8925968035',
  cssName: 'MURALI',
  cssContact: '8870591470',
  type: 'SWMS_STREET_SCAN',
};

export const VISAGA_GARDEN_SCAN_ROUTE = {
  routeId: 'CCMC-NZ-W35-VG-019',
  zone: 'NORTH',
  wardNo: '35',
  streetName: 'VISAGA GARDEN',
  households: 19,
  vehicleType: 'PUSH CART',
  vehicleNo: 'PUSHCART8',
  workerName: 'LATHA',
  workerContact: '8148654687',
  siName: 'DHANABALAN',
  siContact: '9442104133',
  ssName: 'SARAVANA KUMAR',
  ssContact: '8925968035',
  cssName: 'MURALI',
  cssContact: '8870591470',
  type: 'SWMS_STREET_SCAN',
};

export const MARUTHI_ENVUE_SCAN_ROUTE = {
  routeId: 'CCMC-NZ-W35-MEV-020',
  zone: 'NORTH',
  wardNo: '35',
  streetName: 'MARUTHI ENVUE',
  households: 25,
  vehicleType: 'BOV',
  vehicleNo: 'TN66AP0965',
  workerName: 'PANEERSELVAM',
  workerContact: '9894051660',
  siName: 'DHANABALAN',
  siContact: '9442104133',
  ssName: 'SARAVANA KUMAR',
  ssContact: '8925968035',
  cssName: 'MURALI',
  cssContact: '8870591470',
  type: 'SWMS_STREET_SCAN',
};

export const PALANI_AANDAVAR_KOVIL_VEEDHI_SCAN_ROUTE = {
  routeId: 'CCMC-SZ-W88-PAKV-021',
  zone: 'SOUTH',
  wardNo: '88',
  streetName: 'PALANI AANDAVAR KOVIL VEEDHI',
  households: 762,
  vehicleType: 'TATA ACE',
  vehicleNo: 'TN66AM0219',
  workerName: 'KARTHIK',
  workerContact: '9080463024',
  siName: 'ZAHEER HUSSAIN',
  siContact: '7339404132',
  ssName: 'MUTHURAJ',
  ssContact: '8925975896',
  cssName: 'GURUMOORTHY',
  cssContact: '8903593614',
  type: 'SWMS_STREET_SCAN',
};

export const KGK_MAIN_ROAD_SCAN_ROUTE = {
  routeId: 'CCMC-SZ-W88-KMR-022',
  zone: 'SOUTH',
  wardNo: '88',
  streetName: 'KGK MAIN ROAD',
  households: 727,
  vehicleType: 'TATA ACE',
  vehicleNo: 'TN66AQ1153',
  workerName: 'SELVARAJ',
  workerContact: '9361613970',
  siName: 'ZAHEER HUSSAIN',
  siContact: '7339404132',
  ssName: 'MUTHURAJ',
  ssContact: '8925975896',
  cssName: 'GURUMOORTHY',
  cssContact: '8903593614',
  type: 'SWMS_STREET_SCAN',
};

export const NAGAMMA_NAYAGAR_VEEDHI_SCAN_ROUTE = {
  routeId: 'CCMC-SZ-W88-NNV-023',
  zone: 'SOUTH',
  wardNo: '88',
  streetName: 'NAGAMMA NAYAGAR VEEDHI',
  households: 56,
  vehicleType: 'PUSH CART',
  vehicleNo: 'PUSHCART9',
  workerName: 'CHELLAMUTHU',
  workerContact: 'N/A',
  siName: 'ZAHEER HUSSAIN',
  siContact: '7339404132',
  ssName: 'MUTHURAJ',
  ssContact: '8925975896',
  cssName: 'GURUMOORTHY',
  cssContact: '8903593614',
  type: 'SWMS_STREET_SCAN',
};

export const ALAGAACHI_THOTTAM_SCAN_ROUTE = {
  routeId: 'CCMC-SZ-W88-AT-024',
  zone: 'SOUTH',
  wardNo: '88',
  streetName: 'ALAGAACHI THOTTAM',
  households: 106,
  vehicleType: 'PUSH CART',
  vehicleNo: 'PUSHCART10',
  workerName: 'MAGENDRAN',
  workerContact: 'N/A',
  siName: 'ZAHEER HUSSAIN',
  siContact: '7339404132',
  ssName: 'MUTHURAJ',
  ssContact: '8925975896',
  cssName: 'GURUMOORTHY',
  cssContact: '8903593614',
  type: 'SWMS_STREET_SCAN',
};

export const MUTHUSAMY_SERKAI_VEEDHI_SCAN_ROUTE = {
  routeId: 'CCMC-SZ-W88-MSV-025',
  zone: 'SOUTH',
  wardNo: '88',
  streetName: 'MUTHUSAMY SERKAI VEEDHI',
  households: 70,
  vehicleType: 'BOV',
  vehicleNo: 'TN66PO982',
  workerName: 'SATHYA',
  workerContact: 'N/A',
  siName: 'ZAHEER HUSSAIN',
  siContact: '7339404132',
  ssName: 'MUTHURAJ',
  ssContact: '8925975896',
  cssName: 'GURUMOORTHY',
  cssContact: '8903593614',
  type: 'SWMS_STREET_SCAN',
};

export const SREE_NAGAR_QR_PAYLOAD = 'CCMC-QR1';
export const MAGESHWARI_NAGAR_QR_PAYLOAD = 'CCMC-QR2';
export const THIYAGIKUMAR_STREET_QR_PAYLOAD = 'CCMC-QR3';
export const MGR_VEEDHI_QR_PAYLOAD = 'CCMC-QR4';
export const KALYANAM_SUNDHARAM_STREET_QR_PAYLOAD = 'CCMC-QR5';
export const PONNI_NAGAR_QR_PAYLOAD = 'CCMC-QR6';
export const PONNI_NAGAR_2_QR_PAYLOAD = 'CCMC-QR7';
export const KANDHASAMY_LAYOUT_QR_PAYLOAD = 'CCMC-QR8';
export const LAKSHMI_MILLS_SIGNAL_QR_PAYLOAD = 'CCMC-QR9';
export const MARIYAMMAN_KOVIL_STREET_QR_PAYLOAD = 'CCMC-QR10';
export const KK_NAGAR_QR_PAYLOAD = 'CCMC-QR11';
export const RANGANATHAN_KOVIL_STREET_QR_PAYLOAD = 'CCMC-QR12';
export const BAJANA_KOVIL_VEEDHI_QR_PAYLOAD = 'CCMC-QR13';
export const BAARI_NAGAR_VEEDHI_CUT_ROAD_QR_PAYLOAD = 'CCMC-QR14';
export const RAMASAMY_KOONARCUT_ROAD_QR_PAYLOAD = 'CCMC-QR15';
export const MADHURA_ENCLAVE_QR_PAYLOAD = 'CCMC-QR16';
export const SENTHOORA_PURAM_QR_PAYLOAD = 'CCMC-QR17';
export const MEENAKSHI_NAGAR_QR_PAYLOAD = 'CCMC-QR18';
export const VISAGA_GARDEN_QR_PAYLOAD = 'CCMC-QR19';
export const MARUTHI_ENVUE_QR_PAYLOAD = 'CCMC-QR20';
export const PALANI_AANDAVAR_KOVIL_VEEDHI_QR_PAYLOAD = 'CCMC-QR21';
export const KGK_MAIN_ROAD_QR_PAYLOAD = 'CCMC-QR22';
export const NAGAMMA_NAYAGAR_VEEDHI_QR_PAYLOAD = 'CCMC-QR23';
export const ALAGAACHI_THOTTAM_QR_PAYLOAD = 'CCMC-QR24';
export const MUTHUSAMY_SERKAI_VEEDHI_QR_PAYLOAD = 'CCMC-QR25';

export interface StreetScanRoute {
  routeId: string;
  zone: string;
  wardNo: string;
  streetName: string;
  households: number;
  vehicleType: string;
  vehicleNo: string;
  workerName: string;
  workerContact: string;
  siName: string;
  siContact: string;
  ssName: string;
  ssContact: string;
  cssName: string;
  cssContact: string;
  type: string;
}

export const CCMC_QR_ROUTES: Record<string, StreetScanRoute> = {
  'CCMC-QR1': SREE_NAGAR_SCAN_ROUTE,
  'CCMC-QR2': MAGESHWARI_NAGAR_SCAN_ROUTE,
  'CCMC-QR3': THIYAGIKUMAR_STREET_SCAN_ROUTE,
  'CCMC-QR4': MGR_VEEDHI_SCAN_ROUTE,
  'CCMC-QR5': KALYANAM_SUNDHARAM_STREET_SCAN_ROUTE,
  'CCMC-QR6': PONNI_NAGAR_SCAN_ROUTE,
  'CCMC-QR7': PONNI_NAGAR_2_SCAN_ROUTE,
  'CCMC-QR8': KANDHASAMY_LAYOUT_SCAN_ROUTE,
  'CCMC-QR9': LAKSHMI_MILLS_SIGNAL_SCAN_ROUTE,
  'CCMC-QR10': MARIYAMMAN_KOVIL_STREET_SCAN_ROUTE,
  'CCMC-QR11': KK_NAGAR_SCAN_ROUTE,
  'CCMC-QR12': RANGANATHAN_KOVIL_STREET_SCAN_ROUTE,
  'CCMC-QR13': BAJANA_KOVIL_VEEDHI_SCAN_ROUTE,
  'CCMC-QR14': BAARI_NAGAR_VEEDHI_CUT_ROAD_SCAN_ROUTE,
  'CCMC-QR15': RAMASAMY_KOONARCUT_ROAD_SCAN_ROUTE,
  'CCMC-QR16': MADHURA_ENCLAVE_SCAN_ROUTE,
  'CCMC-QR17': SENTHOORA_PURAM_SCAN_ROUTE,
  'CCMC-QR18': MEENAKSHI_NAGAR_SCAN_ROUTE,
  'CCMC-QR19': VISAGA_GARDEN_SCAN_ROUTE,
  'CCMC-QR20': MARUTHI_ENVUE_SCAN_ROUTE,
  'CCMC-QR21': PALANI_AANDAVAR_KOVIL_VEEDHI_SCAN_ROUTE,
  'CCMC-QR22': KGK_MAIN_ROAD_SCAN_ROUTE,
  'CCMC-QR23': NAGAMMA_NAYAGAR_VEEDHI_SCAN_ROUTE,
  'CCMC-QR24': ALAGAACHI_THOTTAM_SCAN_ROUTE,
  'CCMC-QR25': MUTHUSAMY_SERKAI_VEEDHI_SCAN_ROUTE,
};

// The QR management system numbers checkpoints 1..25 and the legacy street cards
// use the same numbers, so "E-SCAN5" and "CCMC-QR5" are the same street.
const ZONE_SCAN_PREFIX_TO_CCMC: Record<string, string> = {
  C: 'CCMC-QR6',
  E: 'CCMC-QR1',
  W: 'CCMC-QR11',
  N: 'CCMC-QR16',
  S: 'CCMC-QR21',
};

// Zone block start + ordinal within the zone, matching the E-SCAN/C/E/W/N/S layout.
const SCAN_ZONE_BLOCKS: { prefix: string; start: number; count: number }[] = [
  { prefix: 'E', start: 1, count: 5 },
  { prefix: 'C', start: 6, count: 3 },
  { prefix: 'W', start: 9, count: 3 },
  { prefix: 'N', start: 12, count: 3 },
  { prefix: 'S', start: 15, count: 11 },
];

/**
 * Resolve a scanned checkpoint QR id to its street/route details.
 * Accepts both the QR-management format ("E-SCAN5", "C-SCAN6-P3") and the
 * legacy street-card format ("CCMC-QR5", "CCMC-QR5-P3"), so a printed card
 * and a freshly generated QR always resolve to the same street.
 */
export function getStreetScanRoute(qrText: string): StreetScanRoute | null {
  const text = (qrText || '').trim();

  // Legacy street-card id: CCMC-QR{n} (-P{k} optional)
  const ccmc = text.match(/^CCMC-QR(\d+)(?:-P\d+)?$/i);
  if (ccmc) return CCMC_QR_ROUTES[`CCMC-QR${ccmc[1]}`] || null;

  // QR-management id: {Z}-SCAN{n} (-P{k} optional)
  const scan = text.match(/^([A-Z])-SCAN(\d+)(?:-P\d+)?$/i);
  if (!scan) return null;

  const prefix = scan[1].toUpperCase();
  const n = parseInt(scan[2], 10);

  // Sequential 1..25 numbering shared with the street cards.
  for (const block of SCAN_ZONE_BLOCKS) {
    if (block.prefix === prefix && n >= block.start && n < block.start + block.count) {
      return CCMC_QR_ROUTES[`CCMC-QR${n}`] || null;
    }
  }

  // Fall back to the zone anchor when the ordinal is outside the block.
  const anchor = ZONE_SCAN_PREFIX_TO_CCMC[prefix];
  return anchor ? CCMC_QR_ROUTES[anchor] || null : null;
}

export const SWMSStreetScanQRCard: React.FC<{ lang?: 'en' | 'ta' }> = ({ lang = 'en' }) => {
  const [selectedQR, setSelectedQR] = useState<'qr1' | 'qr2' | 'qr3' | 'qr4' | 'qr5' | 'qr6' | 'qr7' | 'qr8' | 'qr9' | 'qr10' | 'qr11' | 'qr12' | 'qr13' | 'qr14' | 'qr15' | 'qr16' | 'qr17' | 'qr18' | 'qr19' | 'qr20' | 'qr21' | 'qr22' | 'qr23' | 'qr24' | 'qr25'>('qr25');
  const [selectedPoint, setSelectedPoint] = useState<number>(1);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [generating, setGenerating] = useState(true);

  const r = selectedQR === 'qr1' 
    ? SREE_NAGAR_SCAN_ROUTE 
    : selectedQR === 'qr2' 
    ? MAGESHWARI_NAGAR_SCAN_ROUTE 
    : selectedQR === 'qr3' 
    ? THIYAGIKUMAR_STREET_SCAN_ROUTE 
    : selectedQR === 'qr4' 
    ? MGR_VEEDHI_SCAN_ROUTE 
    : selectedQR === 'qr5'
    ? KALYANAM_SUNDHARAM_STREET_SCAN_ROUTE
    : selectedQR === 'qr6'
    ? PONNI_NAGAR_SCAN_ROUTE
    : selectedQR === 'qr7'
    ? PONNI_NAGAR_2_SCAN_ROUTE
    : selectedQR === 'qr8'
    ? KANDHASAMY_LAYOUT_SCAN_ROUTE
    : selectedQR === 'qr9'
    ? LAKSHMI_MILLS_SIGNAL_SCAN_ROUTE
    : selectedQR === 'qr10'
    ? MARIYAMMAN_KOVIL_STREET_SCAN_ROUTE
    : selectedQR === 'qr11'
    ? KK_NAGAR_SCAN_ROUTE
    : selectedQR === 'qr12'
    ? RANGANATHAN_KOVIL_STREET_SCAN_ROUTE
    : selectedQR === 'qr13'
    ? BAJANA_KOVIL_VEEDHI_SCAN_ROUTE
    : selectedQR === 'qr14'
    ? BAARI_NAGAR_VEEDHI_CUT_ROAD_SCAN_ROUTE
    : selectedQR === 'qr15'
    ? RAMASAMY_KOONARCUT_ROAD_SCAN_ROUTE
    : selectedQR === 'qr16'
    ? MADHURA_ENCLAVE_SCAN_ROUTE
    : selectedQR === 'qr17'
    ? SENTHOORA_PURAM_SCAN_ROUTE
    : selectedQR === 'qr18'
    ? MEENAKSHI_NAGAR_SCAN_ROUTE
    : selectedQR === 'qr19'
    ? VISAGA_GARDEN_SCAN_ROUTE
    : selectedQR === 'qr20'
    ? MARUTHI_ENVUE_SCAN_ROUTE
    : selectedQR === 'qr21'
    ? PALANI_AANDAVAR_KOVIL_VEEDHI_SCAN_ROUTE
    : selectedQR === 'qr22'
    ? KGK_MAIN_ROAD_SCAN_ROUTE
    : selectedQR === 'qr23'
    ? NAGAMMA_NAYAGAR_VEEDHI_SCAN_ROUTE
    : selectedQR === 'qr24'
    ? ALAGAACHI_THOTTAM_SCAN_ROUTE
    : MUTHUSAMY_SERKAI_VEEDHI_SCAN_ROUTE;

  const isMultiCheckpoint = r.vehicleType === 'TATA ACE';

  const basePayload = selectedQR === 'qr1' 
    ? SREE_NAGAR_QR_PAYLOAD 
    : selectedQR === 'qr2' 
    ? MAGESHWARI_NAGAR_QR_PAYLOAD 
    : selectedQR === 'qr3' 
    ? THIYAGIKUMAR_STREET_QR_PAYLOAD 
    : selectedQR === 'qr4' 
    ? MGR_VEEDHI_QR_PAYLOAD 
    : selectedQR === 'qr5'
    ? KALYANAM_SUNDHARAM_STREET_QR_PAYLOAD
    : selectedQR === 'qr6'
    ? PONNI_NAGAR_QR_PAYLOAD
    : selectedQR === 'qr7'
    ? PONNI_NAGAR_2_QR_PAYLOAD
    : selectedQR === 'qr8'
    ? KANDHASAMY_LAYOUT_QR_PAYLOAD
    : selectedQR === 'qr9'
    ? LAKSHMI_MILLS_SIGNAL_QR_PAYLOAD
    : selectedQR === 'qr10'
    ? MARIYAMMAN_KOVIL_STREET_QR_PAYLOAD
    : selectedQR === 'qr11'
    ? KK_NAGAR_QR_PAYLOAD
    : selectedQR === 'qr12'
    ? RANGANATHAN_KOVIL_STREET_QR_PAYLOAD
    : selectedQR === 'qr13'
    ? BAJANA_KOVIL_VEEDHI_QR_PAYLOAD
    : selectedQR === 'qr14'
    ? BAARI_NAGAR_VEEDHI_CUT_ROAD_QR_PAYLOAD
    : selectedQR === 'qr15'
    ? RAMASAMY_KOONARCUT_ROAD_QR_PAYLOAD
    : selectedQR === 'qr16'
    ? MADHURA_ENCLAVE_QR_PAYLOAD
    : selectedQR === 'qr17'
    ? SENTHOORA_PURAM_QR_PAYLOAD
    : selectedQR === 'qr18'
    ? MEENAKSHI_NAGAR_QR_PAYLOAD
    : selectedQR === 'qr19'
    ? VISAGA_GARDEN_QR_PAYLOAD
    : selectedQR === 'qr20'
    ? MARUTHI_ENVUE_QR_PAYLOAD
    : selectedQR === 'qr21'
    ? PALANI_AANDAVAR_KOVIL_VEEDHI_QR_PAYLOAD
    : selectedQR === 'qr22'
    ? KGK_MAIN_ROAD_QR_PAYLOAD
    : selectedQR === 'qr23'
    ? NAGAMMA_NAYAGAR_VEEDHI_QR_PAYLOAD
    : selectedQR === 'qr24'
    ? ALAGAACHI_THOTTAM_QR_PAYLOAD
    : MUTHUSAMY_SERKAI_VEEDHI_QR_PAYLOAD;

  const payload = isMultiCheckpoint ? (selectedPoint === 1 ? basePayload : `${basePayload}-P${selectedPoint}`) : basePayload;
  const downloadFileName = isMultiCheckpoint ? `${r.vehicleNo}_${r.zone}_P${selectedPoint}.png` : `${r.vehicleNo}_${r.zone}.png`;

  useEffect(() => {
    setGenerating(true);
    QRCode.toDataURL(payload, {
      margin: 1, width: 280, errorCorrectionLevel: 'H',
      color: { dark: '#000000', light: '#ffffff' },
    }).then((url) => { setQrDataUrl(url); setGenerating(false); })
      .catch(() => setGenerating(false));
  }, [selectedQR, selectedPoint, payload]);

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = downloadFileName;
    a.click();
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-start py-8 px-4 font-sans">
      {/* Route Switcher Pills */}
      <div className="print:hidden flex flex-col items-center gap-2 mb-4 bg-white p-2 rounded-2xl shadow border border-slate-200">
        <div className="flex items-center gap-2 flex-wrap justify-center">
          <button
            onClick={() => { setSelectedQR('qr1'); setSelectedPoint(1); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition ${
              selectedQR === 'qr1' ? 'bg-[#1E7A38] text-white shadow' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            QR 1: Sree Nagar (TATA ACE)
          </button>
          <button
            onClick={() => { setSelectedQR('qr2'); setSelectedPoint(1); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition ${
              selectedQR === 'qr2' ? 'bg-[#1E7A38] text-white shadow' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            QR 2: Mageshwari Nagar (TATA ACE)
          </button>
          <button
            onClick={() => { setSelectedQR('qr3'); setSelectedPoint(1); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition ${
              selectedQR === 'qr3' ? 'bg-[#1E7A38] text-white shadow' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            QR 3: PUSHCART
          </button>
          <button
            onClick={() => { setSelectedQR('qr4'); setSelectedPoint(1); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition ${
              selectedQR === 'qr4' ? 'bg-[#1E7A38] text-white shadow' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            QR 4: PUSHCART 2
          </button>
          <button
            onClick={() => { setSelectedQR('qr5'); setSelectedPoint(1); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition ${
              selectedQR === 'qr5' ? 'bg-[#1E7A38] text-white shadow' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            QR 5: Kalyanam Sundharam (BOV)
          </button>
          <button
            onClick={() => { setSelectedQR('qr6'); setSelectedPoint(1); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition ${
              selectedQR === 'qr6' ? 'bg-[#1E7A38] text-white shadow' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            QR 6: Ponni Nagar (surya)
          </button>
          <button
            onClick={() => { setSelectedQR('qr7'); setSelectedPoint(1); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition ${
              selectedQR === 'qr7' ? 'bg-[#1E7A38] text-white shadow' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            QR 7: Ponni Nagar (GOKULA)
          </button>
          <button
            onClick={() => { setSelectedQR('qr8'); setSelectedPoint(1); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition ${
              selectedQR === 'qr8' ? 'bg-[#1E7A38] text-white shadow' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            QR 8: Kandhasamy Layout (PUSHCART)
          </button>
          <button
            onClick={() => { setSelectedQR('qr9'); setSelectedPoint(1); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition ${
              selectedQR === 'qr9' ? 'bg-[#1E7A38] text-white shadow' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            QR 9: Lakshmi Mills Signal (PUSHCART)
          </button>
          <button
            onClick={() => { setSelectedQR('qr10'); setSelectedPoint(1); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition ${
              selectedQR === 'qr10' ? 'bg-[#1E7A38] text-white shadow' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            QR 10: Mariyamman Kovil (BOV)
          </button>
          <button
            onClick={() => { setSelectedQR('qr11'); setSelectedPoint(1); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition ${
              selectedQR === 'qr11' ? 'bg-[#1E7A38] text-white shadow' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            QR 11: KK Nagar (SARAVANA)
          </button>
          <button
            onClick={() => { setSelectedQR('qr12'); setSelectedPoint(1); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition ${
              selectedQR === 'qr12' ? 'bg-[#1E7A38] text-white shadow' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            QR 12: Ranganathan Kovil (SENRAJ)
          </button>
          <button
            onClick={() => { setSelectedQR('qr13'); setSelectedPoint(1); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition ${
              selectedQR === 'qr13' ? 'bg-[#1E7A38] text-white shadow' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            QR 13: Bajana Kovil Veedhi (PUSHCART)
          </button>
          <button
            onClick={() => { setSelectedQR('qr14'); setSelectedPoint(1); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition ${
              selectedQR === 'qr14' ? 'bg-[#1E7A38] text-white shadow' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            QR 14: Baari Nagar Cut Road (PUSHCART)
          </button>
          <button
            onClick={() => { setSelectedQR('qr15'); setSelectedPoint(1); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition ${
              selectedQR === 'qr15' ? 'bg-[#1E7A38] text-white shadow' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            QR 15: Ramasamy Koonarcut (BOV)
          </button>
          <button
            onClick={() => { setSelectedQR('qr16'); setSelectedPoint(1); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition ${
              selectedQR === 'qr16' ? 'bg-[#1E7A38] text-white shadow' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            QR 16: Madhura Enclave (ARUNACHALAM)
          </button>
          <button
            onClick={() => { setSelectedQR('qr17'); setSelectedPoint(1); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition ${
              selectedQR === 'qr17' ? 'bg-[#1E7A38] text-white shadow' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            QR 17: Senthoora Puram (MANI)
          </button>
          <button
            onClick={() => { setSelectedQR('qr18'); setSelectedPoint(1); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition ${
              selectedQR === 'qr18' ? 'bg-[#1E7A38] text-white shadow' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            QR 18: Meenakshi Nagar (PUSHCART)
          </button>
          <button
            onClick={() => { setSelectedQR('qr19'); setSelectedPoint(1); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition ${
              selectedQR === 'qr19' ? 'bg-[#1E7A38] text-white shadow' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            QR 19: Visaga Garden (PUSHCART)
          </button>
          <button
            onClick={() => { setSelectedQR('qr20'); setSelectedPoint(1); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition ${
              selectedQR === 'qr20' ? 'bg-[#1E7A38] text-white shadow' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            QR 20: Maruthi Envue (BOV)
          </button>
          <button
            onClick={() => { setSelectedQR('qr21'); setSelectedPoint(1); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition ${
              selectedQR === 'qr21' ? 'bg-[#1E7A38] text-white shadow' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            QR 21: Palani Aandavar Kovil Veedhi (TATA ACE)
          </button>
          <button
            onClick={() => { setSelectedQR('qr22'); setSelectedPoint(1); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition ${
              selectedQR === 'qr22' ? 'bg-[#1E7A38] text-white shadow' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            QR 22: KGK Main Road (TATA ACE)
          </button>
          <button
            onClick={() => { setSelectedQR('qr23'); setSelectedPoint(1); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition ${
              selectedQR === 'qr23' ? 'bg-[#1E7A38] text-white shadow' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            QR 23: Nagamma Nayagar Veedhi (PUSHCART)
          </button>
          <button
            onClick={() => { setSelectedQR('qr24'); setSelectedPoint(1); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition ${
              selectedQR === 'qr24' ? 'bg-[#1E7A38] text-white shadow' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            QR 24: Alagaachi Thottam (PUSHCART)
          </button>
          <button
            onClick={() => { setSelectedQR('qr25'); setSelectedPoint(1); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition ${
              selectedQR === 'qr25' ? 'bg-[#1E7A38] text-white shadow' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            QR 25: Muthusamy Serkai Veedhi (BOV)
          </button>
        </div>

        {/* 5 Checkpoints Sub-Selector for Multi-Checkpoint Vehicles */}
        {isMultiCheckpoint && (
          <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100 w-full justify-center">
            <span className="text-[11px] font-black text-slate-500 uppercase mr-1">5 Checkpoints:</span>
            {[1, 2, 3, 4, 5].map((pt) => (
              <button
                key={pt}
                onClick={() => setSelectedPoint(pt)}
                className={`px-2.5 py-1 rounded-lg text-xs font-black transition ${
                  selectedPoint === pt
                    ? 'bg-amber-500 text-slate-950 font-bold shadow'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Point {pt}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="print:hidden flex items-center gap-3 mb-6 w-full max-w-md">
        <button onClick={() => window.print()} className="flex items-center gap-2 bg-[#1E7A38] hover:bg-[#166534] text-white font-black text-sm px-5 py-2.5 rounded-xl shadow-lg transition active:scale-95 cursor-pointer">
          <Printer className="w-4 h-4" /> Print QR Card
        </button>
        <button onClick={handleDownload} disabled={!qrDataUrl} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-black text-sm px-5 py-2.5 rounded-xl shadow-lg transition active:scale-95 cursor-pointer disabled:opacity-50">
          <Download className="w-4 h-4" /> Download ({downloadFileName})
        </button>
        <div className="ml-auto text-xs text-slate-500 font-mono">{r.routeId}</div>
      </div>

      <div className="bg-white rounded-3xl shadow-2xl border-2 border-slate-200 w-full max-w-md overflow-hidden">
        <div className="bg-[#1E7A38] text-white px-5 py-4 text-center">
          <div className="text-[12px] font-bold tracking-widest uppercase text-emerald-200 mb-0.5">Coimbatore City Municipal Corporation</div>
          <div className="text-base font-black">Solid Waste Management System</div>
          <div className="text-[11px] font-semibold text-amber-300 mt-1 tracking-wide uppercase">Street QR Scan Card</div>
        </div>

        <div className="bg-amber-50 border-b border-amber-200 px-5 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#1E7A38]" />
            <span className="text-sm font-black text-slate-900">{r.streetName}</span>
          </div>
          <div className="text-[11px] font-bold text-slate-500 font-mono">{r.zone} &bull; Ward {r.wardNo}</div>
        </div>

        <div className="flex flex-col items-center py-6 px-4">
          <div className="p-3 bg-white border-2 border-slate-200 rounded-2xl shadow-inner">
            {generating ? (
              <div className="w-52 h-52 bg-slate-100 flex items-center justify-center rounded-xl">
                <QrCode className="w-10 h-10 text-slate-400 animate-pulse" />
              </div>
            ) : qrDataUrl ? (
              <img src={qrDataUrl} alt="Street Scan QR Code" className="w-52 h-52 object-contain" />
            ) : (
              <div className="w-52 h-52 bg-red-50 flex items-center justify-center rounded-xl text-xs text-red-500">QR generation failed</div>
            )}
          </div>
          <div className="mt-3 text-center">
            <div className="text-[11px] font-black text-slate-700 tracking-wider uppercase">Scan to view route details</div>
            <div className="text-[12px] text-slate-400 font-mono mt-0.5">{r.routeId}</div>
          </div>
        </div>

        <div className="px-5 pb-5 space-y-3">
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-start gap-3">
            <Truck className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs space-y-0.5">
              <div className="font-black text-blue-900 uppercase tracking-wide text-[12px]">Vehicle</div>
              <div className="font-bold text-slate-800">{r.vehicleType} &mdash; <span className="font-mono">{r.vehicleNo}</span></div>
            </div>
          </div>

          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex items-start gap-3">
            <User className="w-4 h-4 text-emerald-700 mt-0.5 flex-shrink-0" />
            <div className="text-xs space-y-0.5">
              <div className="font-black text-emerald-900 uppercase tracking-wide text-[12px]">Sanitary Worker</div>
              <div className="font-bold text-slate-800">{r.workerName}</div>
              <div className="flex items-center gap-1 text-slate-500"><Phone className="w-3 h-3" /><span className="font-mono">{r.workerContact}</span></div>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
            <div className="text-[12px] font-black text-slate-600 uppercase tracking-wide flex items-center gap-1"><Shield className="w-3 h-3" /> Supervisory Chain</div>
            {[
              { role: 'Sanitary Inspector (SI)', name: r.siName, contact: r.siContact },
              { role: 'Sanitary Supervisor (SS)', name: r.ssName, contact: r.ssContact },
              { role: 'Chief Sanitary Supervisor (CSS)', name: r.cssName, contact: r.cssContact },
            ].map((entry) => (
              <div key={entry.role} className="flex items-start justify-between gap-2 text-xs border-t border-slate-100 pt-1.5">
                <div>
                  <div className="font-black text-slate-800 leading-tight">{entry.name}</div>
                  <div className="text-[12px] text-slate-500">{entry.role}</div>
                </div>
                <div className="flex items-center gap-1 text-slate-500 flex-shrink-0"><Phone className="w-3 h-3" /><span className="font-mono text-[12px]">{entry.contact}</span></div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-800 text-white text-center px-4 py-2.5">
          <div className="text-[11px] font-mono text-slate-400 tracking-wider">CCMC-SWMS &bull; Solid Waste Management System &bull; {new Date().getFullYear()}</div>
        </div>
      </div>
    </div>
  );
};
