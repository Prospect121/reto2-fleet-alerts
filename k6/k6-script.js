// k6 load test — Reto 2
// 1000 iteraciones compartidas entre 10 VUs, máximo 30s.
// Espera salida: checks 100%, http_req_failed 0%.
//
// Uso:
//   k6 run \
//     -e API_URL=https://xxxxx.execute-api.us-east-1.amazonaws.com/prod/events \
//     -e API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx \
//     k6/k6-script.js
//
// Obtener la API key después del deploy:
//   terraform output -raw api_key
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
  throw new Error('Falta variable de entorno API_URL. Usa: k6 run -e API_URL=<endpoint> -e API_KEY=<key> k6-script.js');
}

const API_KEY = __ENV.API_KEY;
if (!API_KEY) {
  throw new Error('Falta variable de entorno API_KEY. Obtén la key con: terraform output -raw api_key');
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
  // sent_at: timestamp cliente en ISO-8601 UTC — Lambda lo usará para calcular
  // delta sent→received y delta TOTAL (sent→email_sent). Se incluye en TODOS
  // los eventos (Position y Emergency) pero solo aparece en el email de Emergency.
  const payload = JSON.stringify({
    type: isEmergency ? 'Emergency' : 'Position',
    vehicle_plate: randomPlate(),
    coordinates: {
      latitude:  (Math.random() * 180 - 90).toFixed(6),
      longitude: (Math.random() * 360 - 180).toFixed(6),
    },
    status: 'OK',
    sent_at: new Date().toISOString(),
  });

  const res = http.post(API_URL, payload, {
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
    },
  });

  check(res, { 'is status 200': (r) => r.status === 200 });
}
