// modules/Session/data/session.service.ts
import axios from "@/lib/axios";
import type { Session, SessionData } from "../session.interface";

const BASE_URL = "/sessions";

const KG_TO_NEWTON = 9.80665;

// Convierte todos los campos p1..p5 de kg → N
function transformRecordToNewtons(r: SessionData): SessionData {
  return {
    ...r,
    p1: r.p1 * KG_TO_NEWTON,
    p2: r.p2 * KG_TO_NEWTON,
    p3: r.p3 * KG_TO_NEWTON,
    p4: r.p4 * KG_TO_NEWTON,
    p5: r.p5 * KG_TO_NEWTON,
  };
}

export const sessionService = {
  listByPatient: async (patientId: string): Promise<Session[]> => {
    const res = await axios.get(`${BASE_URL}/patient/${patientId}`);

    return res.data.map((session: Session) => ({
      ...session,
      records: session.records.map(transformRecordToNewtons),
    }));
  },
};
