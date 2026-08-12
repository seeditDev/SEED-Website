import { db } from '../firebase-config';
import { 
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, 
  query, orderBy, serverTimestamp 
} from 'firebase/firestore';

/**
 * Service for managing assessments in Firestore ('assessments' collection).
 * Follows the data contract for Staff MCQ and Coding creators.
 */
class AssessmentAdminService {
  /**
   * Fetch all assessments from Firestore
   */
  static async listAssessments() {
    try {
      const colRef = collection(db, 'assessments');
      const q = query(colRef, orderBy('updatedAt', 'desc'));
      const snap = await getDocs(q).catch(() => getDocs(colRef));
      
      const list = [];
      snap.forEach(d => {
        const data = d.data();
        list.push({
          id: d.id,
          ...data,
          title: data.title || data.name || d.id,
          type: (data.type || 'mcq').toLowerCase(),
          status: data.status || 'Draft',
          durationMinutes: Number(data.durationMinutes || data.duration_minutes || 60),
          totalMarks: Number(data.totalMarks || 100),
          version: Number(data.version || 1),
          questionsCount: Array.isArray(data.questions) ? data.questions.length : (Array.isArray(data.challenges) ? data.challenges.length : 0),
          cdnUrl: data.cdnUrl || ''
        });
      });
      return list;
    } catch (err) {
      console.error('[AssessmentAdminService] Error listing assessments:', err);
      return [];
    }
  }

  /**
   * List Courses & Series from Firestore ('courses' collection)
   */
  static async listCourses() {
    try {
      const snap = await getDocs(collection(db, 'courses'));
      const list = [];
      for (const d of snap.docs) {
        const cData = d.data();
        const seriesSnap = await getDocs(collection(db, 'courses', d.id, 'series')).catch(() => ({ docs: [] }));
        const seriesList = [];
        for (const sDoc of seriesSnap.docs) {
          const sData = sDoc.data();
          const testsSnap = await getDocs(collection(db, 'courses', d.id, 'series', sDoc.id, 'tests')).catch(() => ({ docs: [] }));
          const testsList = testsSnap.docs.map(tDoc => ({ id: tDoc.id, ...tDoc.data() }));
          seriesList.push({
            id: sDoc.id,
            ...sData,
            title: sData.title || sData.name || sDoc.id,
            tests: testsList
          });
        }
        list.push({
          id: d.id,
          ...cData,
          title: cData.title || cData.name || d.id,
          series: seriesList
        });
      }
      return list;
    } catch (err) {
      console.error('[AssessmentAdminService] Error listing courses:', err);
      return [];
    }
  }


  /**
   * Fetch single assessment by ID
   */
  static async getAssessment(assessmentId) {
    if (!assessmentId) return null;
    try {
      const snap = await getDoc(doc(db, 'assessments', assessmentId));
      if (!snap.exists()) return null;
      const data = snap.data();
      return {
        id: snap.id,
        ...data,
        title: data.title || data.name || snap.id,
        type: (data.type || 'mcq').toLowerCase(),
        status: data.status || 'Draft',
        durationMinutes: Number(data.durationMinutes || data.duration_minutes || 60),
        totalMarks: Number(data.totalMarks || 100),
        version: Number(data.version || 1)
      };
    } catch (err) {
      console.error('[AssessmentAdminService] Error fetching assessment:', err);
      return null;
    }
  }

  /**
   * Save MCQ assessment according to Data Contract (Part 8)
   */
  static async saveMcqAssessment(data) {
    const id = data.id || `mcq_${Date.now()}`;
    const ref = doc(db, 'assessments', id);
    
    // Check if existing document to preserve status/version unless explicitly updating
    const existing = await this.getAssessment(id);
    const version = existing ? (existing.version || 1) + 1 : Number(data.version || 1);
    
    const payload = {
      id,
      title: data.title || 'Untitled MCQ Assessment',
      description: data.description || '',
      type: 'mcq',
      status: data.status || existing?.status || 'Draft',
      durationMinutes: Number(data.durationMinutes || 60),
      totalMarks: Number(data.totalMarks || 100),
      questions: Array.isArray(data.questions) ? data.questions : [],
      passPercentage: Number(data.passPercentage || 40),
      negativeMarking: Number(data.negativeMarking || 0),
      shuffleQuestions: Boolean(data.shuffleQuestions),
      shuffleOptions: Boolean(data.shuffleOptions),
      targeting: data.targeting || { tenantIds: data.college ? [data.college] : [], years: data.year ? [data.year] : [] },
      proctorConfig: data.proctorConfig || {
        proctored: Boolean(data.proctored),
        audioProctored: Boolean(data.audioProctored),
        maxViolations: Number(data.maxViolations || 5),
        maxAudioViolations: Number(data.maxAudioViolations || 3)
      },
      schedule: data.schedule || { type: 'none' },
      cdnUrl: data.cdnUrl || existing?.cdnUrl || `/mcq/testbank/${id}.json`,
      version,
      updatedAt: serverTimestamp()
    };

    if (!existing) {
      payload.createdAt = serverTimestamp();
    }

    await setDoc(ref, payload, { merge: true });
    return { id, ...payload };
  }

  /**
   * Save Coding assessment according to Data Contract (Part 9)
   */
  static async saveCodingAssessment(data) {
    const id = data.id || `coding_${Date.now()}`;
    const ref = doc(db, 'assessments', id);
    
    const existing = await this.getAssessment(id);
    const version = existing ? (existing.version || 1) + 1 : Number(data.version || 1);

    const payload = {
      id,
      title: data.title || 'Untitled Coding Assessment',
      description: data.description || '',
      type: 'coding',
      status: data.status || existing?.status || 'Draft',
      durationMinutes: Number(data.durationMinutes || 60),
      totalMarks: Number(data.totalMarks || 100),
      challenges: Array.isArray(data.challenges) ? data.challenges : [],
      questionIds: Array.isArray(data.questionIds) ? data.questionIds : (data.challenges ? data.challenges.map(c => c.id || c.questionId) : []),
      targeting: data.targeting || { tenantIds: data.college ? [data.college] : [], years: data.year ? [data.year] : [] },
      proctorConfig: data.proctorConfig || {
        proctored: Boolean(data.proctored),
        audioProctored: Boolean(data.audioProctored),
        maxViolations: Number(data.maxViolations || 5),
        maxAudioViolations: Number(data.maxAudioViolations || 3)
      },
      schedule: data.schedule || { type: 'none' },
      cdnUrl: data.cdnUrl || existing?.cdnUrl || `/coding/testbank/${id}.json`,
      version,
      updatedAt: serverTimestamp()
    };

    if (!existing) {
      payload.createdAt = serverTimestamp();
    }

    await setDoc(ref, payload, { merge: true });
    return { id, ...payload };
  }

  /**
   * Update status without modifying duration, totalMarks, or version (Part 8 & 9)
   */
  static async updateStatus(assessmentId, newStatus) {
    if (!assessmentId) return;
    const ref = doc(db, 'assessments', assessmentId);
    await updateDoc(ref, {
      status: newStatus,
      updatedAt: serverTimestamp()
    });
  }

  /**
   * Duplicate assessment under new ID
   */
  static async duplicateAssessment(assessmentId) {
    const source = await this.getAssessment(assessmentId);
    if (!source) throw new Error('Source assessment not found');

    const newId = `${source.type}_dup_${Date.now()}`;
    const newTitle = `${source.title} (Copy)`;
    
    if (source.type === 'mcq') {
      return await this.saveMcqAssessment({
        ...source,
        id: newId,
        title: newTitle,
        status: 'Draft',
        version: 1
      });
    } else {
      return await this.saveCodingAssessment({
        ...source,
        id: newId,
        title: newTitle,
        status: 'Draft',
        version: 1
      });
    }
  }

  /**
   * Delete assessment
   */
  static async deleteAssessment(assessmentId) {
    if (!assessmentId) return;
    await deleteDoc(doc(db, 'assessments', assessmentId));
  }
}

export default AssessmentAdminService;
