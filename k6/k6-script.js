// k6 load test — Reto 2
// 1000 iteraciones compartidas entre 10 VUs, máximo 30s.
// Espera salida: checks 100%, http_req_failed 0%.
//
// Uso:
//   k6 run -e API_URL=https://xxxxx.execute-api.us-east-1.amazonaws.com/prod/events k6/k6-script.js
//
// Variables opcionales:
//   EMERGENCY_RATE  (default 0.05 = 5% de eventos Emergency)

import http from 'k6/http';
import { check } from 'k6';

export const options = {
  scenarios: {
    default: {
      executor: 'shared-iterations',
      vus: 10,
      iterations: 1000,
      maxDuration: '30s',
      gracefulStop: '30s',
    },
  },
  thresholds: {
    http_req_failed: ['rate==0.00'],       // 0% fallos — requisito del reto
    checks:          ['rate==1.00'],       // 100% status 200
  },
};

const API_URL = __ENV.API_URL;
if (!API_URL) {
  throw new Error('Falta variable de entorno API_URL. Usa: k6 run -e API_URL=<endpoint> k6-script.js');
}

const EMERGENCY_RATE = parseFloat(__ENV.EMERGENCY_RATE || '0.05');

function randomPlate() {
  const letters = 'ABCDEFGHJKLMNPRSTUVWXYZ';
  const l = () => letters[Math.floor(Math.random() * letters.length)];
  const n = () => Math.floor(Math.random() * 10);
  return `${l()}${l()}${l()}-${n()}${n()}${n()}`;
}

export default function () {
  const isEmergency = Math.random() < EMERGENCY_RATE;
  const payload = JSON.stringify({
    type: isEmergency ? 'Emergency' : 'Position',
    vehicle_plate: randomPlate(),
    coordinates: {
      latitude:  (Math.random() * 180 - 90).toFixed(6),
      longitude: (Math.random() * 360 - 180).toFixed(6),
    },
    status: 'OK',
  });

  const res = http.post(API_URL, payload, {
    headers: { 'Content-Type': 'application/json' },
  });

  check(res, { 'is status 200': (r) => r.status === 200 });
}
