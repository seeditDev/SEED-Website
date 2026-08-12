import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { collectionGroup, getDocs } from 'firebase/firestore';
import { db } from '../firebase-config';

/**
 * ReportService — Canonical Report Calculation & Export Engine for SEED Platform.
 * Implements Part 4, 19, 20, 21, 22 requirement for unified Excel, CSV, PDF, and ZIP reporting.
 */
class ReportService {
  /**
   * Fetch all student attempt results directly from canonical Firestore path:
   * assessmentResults/{assessmentId}/students/{firebaseUid}
   * Strictly reads from Firestore — NO GitHub fetch or static JSON fallback used.
   */
  static async fetchFirestoreResults(staffAuth = null) {
    try {
      const snap = await getDocs(collectionGroup(db, 'students'));
      const rawRows = [];

      snap.docs.forEach((docSnap) => {
        if (!docSnap.ref.path.startsWith("assessmentResults/")) return;

        const data = docSnap.data();
        const proctor = data.proctorSummary || {};
        const score = Number(data.score ?? data.totalScore ?? 0);
        const maxScore = Number(data.totalMarks ?? data.maxScore ?? 100);
        const pct = Math.round(data.percentage ?? (maxScore > 0 ? (score / maxScore) * 100 : 0));
        const email = String(data.email ?? data.Email ?? "");
        const userId = String(data.userId ?? email || docSnap.id);
        const assessmentId = String(data.assessmentId ?? data.testID ?? docSnap.ref.path.split("/")[1] ?? "");

        rawRows.push({
          id: docSnap.id,
          path: docSnap.ref.path,
          userId,
          assessmentId,
          name: String(data.name ?? data.Name ?? data.displayName ?? email.split('@')[0] ?? "Student"),
          Name: String(data.name ?? data.Name ?? data.displayName ?? email.split('@')[0] ?? "Student"),
          email,
          Email: email,
          college: String(data.college ?? data.College ?? data.tenantId ?? ""),
          College: String(data.college ?? data.College ?? data.tenantId ?? ""),
          tenantId: String(data.college ?? data.College ?? data.tenantId ?? ""),
          department: String(data.department ?? data.Department ?? "General"),
          Department: String(data.department ?? data.Department ?? "General"),
          year: String(data.year ?? data.Year ?? data.cohortId ?? ""),
          Year: String(data.year ?? data.Year ?? data.cohortId ?? ""),
          rollNumber: String(data.rollNumber ?? data['Roll Number'] ?? ""),
          'Roll Number': String(data.rollNumber ?? data['Roll Number'] ?? ""),
          testName: String(data.assessmentName ?? data.testName ?? data.assessmentTitle ?? assessmentId),
          assessmentTitle: String(data.assessmentName ?? data.testName ?? data.assessmentTitle ?? assessmentId),
          type: String(data.type ?? data.assessmentType ?? "mcq"),
          score,
          totalMarks: maxScore,
          percentage: pct,
          passed: pct >= Number(data.passPercentage ?? 40),
          violationCount: Number(proctor.totalViolations ?? data.violationCount ?? (Array.isArray(proctor.violations) ? proctor.violations.length : 0)),
          submittedAt: data.submittedAt || data.submittedAtISO || ''
        });
      });

      // Deduplicate: keep latest submission per userId + assessmentId
      const dedupeMap = new Map();
      for (const row of rawRows) {
        const key = `${row.userId}::${row.assessmentId}`;
        const existing = dedupeMap.get(key);
        if (!existing) {
          dedupeMap.set(key, row);
        } else {
          const tExisting = new Date(existing.submittedAt || 0).getTime();
          const tRow = new Date(row.submittedAt || 0).getTime();
          if (tRow > tExisting) dedupeMap.set(key, row);
        }
      }

      const deduplicated = Array.from(dedupeMap.values());
      return this.filterByTenant(deduplicated, staffAuth);
    } catch (err) {
      console.warn('[ReportService] Error fetching collectionGroup results from Firestore:', err);
      return [];
    }
  }


  /**
   * Filter results by tenant/college and role authorization.
   * If staff has a specific tenantId/College, filter ONLY to their tenant (Part 22 security rule).
   */
  static filterByTenant(results, staffAuthData) {

    if (!Array.isArray(results)) return [];
    if (!staffAuthData) return results;

    const staffTenant = (staffAuthData.tenantId || staffAuthData.College || staffAuthData.college || '').trim().toUpperCase();
    const staffRole = (staffAuthData.role || staffAuthData.Role || '').trim().toLowerCase();

    // System admins or SEEDIT superusers can view all
    if (staffRole === 'admin' || staffTenant === 'SEEDIT' || !staffTenant) {
      return results;
    }

    return results.filter(r => {
      const studentCollege = (r.college || r.College || r.tenantId || '').trim().toUpperCase();
      return studentCollege === staffTenant;
    });
  }

  /**
   * Generate canonical Excel Marks Workbook
   */
  static exportMarksExcel(results, filename = 'Assessment_Report.xlsx') {
    if (!results || results.length === 0) {
      alert('No data available to export.');
      return;
    }

    const rows = results.map((r, idx) => ({
      'S.No': idx + 1,
      'Student Name': r.Name || r.name || r.studentName || 'N/A',
      'Roll Number': r['Roll Number'] || r.rollNumber || 'N/A',
      'Email': r.Email || r.email || 'N/A',
      'College': r.College || r.college || 'N/A',
      'Department': r.Department || r.department || 'N/A',
      'Batch Year': r.Year || r.year || 'N/A',
      'Assessment Name': r.testName || r.assessmentName || r.testID || 'N/A',
      'Score': r.score !== undefined ? r.score : (r.correctAnswers || 0),
      'Total Marks': r.totalMarks || r.maxScore || r.totalQuestions || 100,
      'Percentage': `${Math.round(r.percentage !== undefined ? r.percentage : ((r.score || 0) / (r.totalMarks || 100)) * 100)}%`,
      'Status': (r.percentage || 0) >= 40 ? 'PASS' : 'FAIL',
      'Violations': r.violationCount || 0,
      'Time Taken': r.timeTaken || r.timeTakenFormatted || 'N/A',
      'Submitted At': r.submittedAtISO || r.submittedAt || 'N/A'
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Marks Sheet');
    XLSX.writeFile(wb, filename);
  }

  /**
   * Generate CSV Report
   */
  static exportCsv(results, filename = 'Assessment_Report.csv') {
    if (!results || results.length === 0) {
      alert('No data available to export.');
      return;
    }

    const headers = ['S.No', 'Student Name', 'Roll Number', 'Email', 'College', 'Department', 'Year', 'Assessment', 'Score', 'Total Marks', 'Percentage', 'Status', 'Violations'];
    const csvRows = [headers.join(',')];

    results.forEach((r, idx) => {
      const row = [
        idx + 1,
        `"${(r.Name || r.name || '').replace(/"/g, '""')}"`,
        `"${(r['Roll Number'] || r.rollNumber || '').replace(/"/g, '""')}"`,
        `"${(r.Email || r.email || '').replace(/"/g, '""')}"`,
        `"${(r.College || r.college || '').replace(/"/g, '""')}"`,
        `"${(r.Department || r.department || '').replace(/"/g, '""')}"`,
        `"${(r.Year || r.year || '').replace(/"/g, '""')}"`,
        `"${(r.testName || r.assessmentName || '').replace(/"/g, '""')}"`,
        r.score !== undefined ? r.score : 0,
        r.totalMarks || 100,
        Math.round(r.percentage || 0),
        (r.percentage || 0) >= 40 ? 'PASS' : 'FAIL',
        r.violationCount || 0
      ];
      csvRows.push(row.join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, filename);
  }

  /**
   * Generate PDF Report for single student
   */
  static generateStudentPdf(student, assessmentData) {
    const doc = new jsPDF();
    const pw = doc.internal.pageSize.getWidth();

    // Header
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, pw, 35, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('SEED-IT ASSESSMENT SCORECARD', 14, 22);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, pw - 14, 22, { align: 'right' });

    // Student Profile Box
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('STUDENT INFORMATION', 14, 48);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const profile = [
      [`Name: ${student.Name || student.name || 'N/A'}`, `Roll No: ${student['Roll Number'] || student.rollNumber || 'N/A'}`],
      [`College: ${student.College || student.college || 'N/A'}`, `Department: ${student.Department || student.department || 'N/A'}`],
      [`Email: ${student.Email || student.email || 'N/A'}`, `Batch Year: ${student.Year || student.year || 'N/A'}`]
    ];

    let yPos = 55;
    profile.forEach(line => {
      doc.text(line[0], 14, yPos);
      doc.text(line[1], 110, yPos);
      yPos += 7;
    });

    // Score Summary Box
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, yPos + 2, pw - 28, 25, 3, 3, 'F');
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    const score = student.score !== undefined ? student.score : 0;
    const total = student.totalMarks || 100;
    const pct = Math.round(student.percentage || (score / total) * 100);

    doc.text(`Score: ${score} / ${total}`, 20, yPos + 16);
    doc.text(`Percentage: ${pct}%`, 80, yPos + 16);
    doc.text(`Result: ${pct >= 40 ? 'PASSED' : 'FAILED'}`, 140, yPos + 16);

    // Assessment Details Table
    yPos += 35;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('ASSESSMENT SUMMARY', 14, yPos);

    const tableData = [
      ['Assessment', student.testName || student.assessmentName || 'Assessment'],
      ['Type', (student.type || 'MCQ').toUpperCase()],
      ['Time Taken', student.timeTaken || student.timeTakenFormatted || 'N/A'],
      ['Proctoring Violations', String(student.violationCount || 0)],
      ['Submission Date', student.submittedAtISO || student.submittedAt || new Date().toISOString().split('T')[0]]
    ];

    doc.autoTable({
      startY: yPos + 4,
      head: [['Metric', 'Detail']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [99, 102, 241] },
      styles: { fontSize: 10 }
    });

    doc.save(`${student.Name || 'Student'}_Scorecard.pdf`);
  }

  /**
   * Generate Bulk ZIP of student scorecards
   */
  static async generateBulkZip(students, assessmentName = 'Assessment') {
    if (!students || students.length === 0) {
      alert('No students selected for ZIP export.');
      return;
    }

    const zip = new JSZip();
    const folder = zip.folder(`${assessmentName}_Scorecards`);

    students.forEach((s, idx) => {
      const doc = new jsPDF();
      doc.text(`SEED-IT SCORECARD: ${s.Name || s.name}`, 14, 20);
      doc.text(`College: ${s.College || s.college}`, 14, 30);
      doc.text(`Score: ${s.score || 0} / ${s.totalMarks || 100}`, 14, 40);
      doc.text(`Percentage: ${Math.round(s.percentage || 0)}%`, 14, 50);

      const pdfArrayBuffer = doc.output('arraybuffer');
      const filename = `${idx + 1}_${(s.Name || 'Student').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      folder.file(filename, pdfArrayBuffer);
    });

    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, `${assessmentName}_Bulk_Reports.zip`);
  }
}

export default ReportService;
