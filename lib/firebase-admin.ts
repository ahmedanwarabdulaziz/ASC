import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as path from 'path';
import * as fs from 'fs';

if (getApps().length === 0) {
  // Try to load from service account file first
  const serviceAccountPath = path.join(process.cwd(), 'ascclub-dbd02-firebase-adminsdk-fbsvc-91d3b1099c.json');
  
  let serviceAccount;
  if (fs.existsSync(serviceAccountPath)) {
    serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
  } else {
    // Fallback to inline credentials
    serviceAccount = {
      projectId: "ascclub-dbd02",
      privateKeyId: "91d3b1099c37eccd28d2c3b0d1c66ebfb7c8a2b3",
      privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDAa2nhkB7lXKKz\nu/9YGJIqlqJKQ6x9dfKpuSMmoGlsJGPqkjKs55Dwz94pB2H3yJEbZgH/VY/xIqwl\n4W+Lpp/1ufjKwYQmD1r/IHHEykgVJt0sH+uhTOIrRZZOQOhrg2JvRxfyMbgi3rot\nbATuAj56k2/DUX+KE61OSHuLQ5teRyX90iouzJILTk/wAr0FvifTrh8L/5T/q0xL\nIVhxGK3NxJCVW7Nd9F1qZ8WaekS6X1H3pkI2kjAfUyc3XMSs02TzYTdbe6thTQ32\neH1KumAXZdokjXVS7LE58P82+yXRhoYun1oEzUUSFgwOZmowmORZzyTmq5zHd14D\n18jHRCWlAgMBAAECggEAFrkIi6fMkjrehtmaVZGvPyLDPwBfYAB7+9F+ZmsWj/v7\nJaIGpHcDHYD6o/84cT2o7yKcdUXqJeh5ik6lMMloRekkiXMRUzpIfWzcKohVu1O3\n1iRd29I7ui7xSUPufnXJO8laOVJoQ4voUgFZ0q6GqMx87ASVil14/4/dMQy2jgsl\nhjU61lvxh6ICUSaQ/AA3j4r5AInmUzahQXIcLVtv3vtd3mHqd9YYuWljwz8d2nYF\n9rb66tad+4gAvXhlw55+UaNnXi8UgO8xIikGJ2OJaaYS5cfiiRmTpLS4l4Z/ru6p\nGf51sZ48dFy8zlshRmClNmypmakhaKlI9QmqTZKfaQKBgQD8UN7BQyij7hxvf+Mh\nTVG4EqE5rowP3qbF2eKB8OO4+UONb6vbR7weB91EPhrb4L3vecG42vnS2IjsMfGZ\nqROecweoCCWQcmo1SU8x+ggkCoX1TInpTLKG8077dix3UL8Qs/WSw92z6Ev2JUYq\nXyXDebRFRyRheBSOULjh4siJmQKBgQDDOqhN7xzPQgSNlInAZt777kAkChsZMPZ8\nCWrpE0S8QKt9VGJBiBSvxIPEpUGPv1h7pekt/mNasyVrApo44dGn+4ArjPoK48gs\nxjI9Xg2xpSzQy4R7vfsX91DjkXgzQZSK0VWMAhTV3x4OoV+StBZVPnsliibyepq7\n+XUTZCq77QKBgQCOL/SX7ITGfLTBkMwqRCw9EyKQIvEDMHHDJVoj5+AsqSuMVNYA\nKJi2Q7BJeMYiCrB+d5rX1W7bhvMCR9LiyQkpTaGO66hfklqP1NQwUbqstNFwvsUp\nF/OzYQGta5b7ViGWBBPrtT0G2W2VNMQptJzPX5JbSBAUbVsIKC1H/kkMYQKBgAdw\nN7Nodd+Ls2K1kx4KjVpp9HWrEOc/z1Rgg3tH6amGiUIoMeovRiKASUj3xuy0LKnh\nY2YGOEDfbICMQ9YA/Jz63yJJp8k8bocOMiHWcI0hLvjxmCWi0mtSV/mjtEG3sPIt\nEaZY+fRAIQQLr/mF9Qfgbo66mctJUpXw5j4L5fjtAoGBAKeqx+yJHC6Vjiqbw5Nn\nbr0kJpo8Qur6Wgut5NOU7vNQN0iDPCAp4VT3cQ70cIq7CyjhvdAD4CP2kQ8EZ3HE\n8mkySnsbVsNimcnIpuZ/HrWBgdPNV6Fsj83NKr7l6+TkbLohJV8+x/x06ttO0zp6\nq+CII89QsbjawPEzvSmB2lbD\n-----END PRIVATE KEY-----\n",
      clientEmail: "firebase-adminsdk-fbsvc@ascclub-dbd02.iam.gserviceaccount.com",
    };
  }

  initializeApp({
    credential: cert(serviceAccount as any),
  });
}

export const adminDb = getFirestore();

