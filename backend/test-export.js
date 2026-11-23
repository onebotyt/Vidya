const fs = require('fs');
const svc = require('./src/services/excelExportService');

const data = {
  institution_name: 'Government Polytechnic Nainital',
  session_label: '2026-27 (Winter Session)',
  department_name: 'Information Technology',
  department_code: 'IT',
  subject_name: 'Web Technology & Frameworks',
  year: 3,
  semester: 5,
  scope: 'THEORY',
  range: 'all_months',
  overview_months: [{ key: '2026-11', label: 'Nov 2026' }],
  overview_students: [
    { sr_no: 1, roll_no: '01', registration_no: '24011090001', enrollment_no: 'UBTER2026001', name: 'Girdhar Dhami', overall_present: 20, overall_absent: 2, overall_total: 22, percentage: 90.9, month_breakdown: { '2026-11': { present: 20, total: 22 } } }
  ],
  monthly_sheets: [
    {
      month_label: 'November 2026',
      month_key: '2026-11',
      days: Array.from({ length: 30 }, (_, i) => ({ day: i + 1 })),
      students: [
        { roll_no: '01', registration_no: '24011090001', enrollment_no: 'UBTER2026001', name: 'Girdhar Dhami', marks: { 1: 'P', 2: 'P', 3: 'A', 4: 'P' } }
      ]
    }
  ]
};

async function run() {
  const xlsx = await svc.generateAttendanceRegisterExcel(data);
  fs.writeFileSync('test-attendance.xlsx', xlsx);
  console.log('Written test-attendance.xlsx:', xlsx.length);

  const pdf = await svc.generateAttendanceRegisterPdf(data);
  fs.writeFileSync('test-attendance.html', pdf);
  console.log('Written test-attendance.html:', pdf.length);

  const testPdf = await svc.generateClassTestPdf({
    institution_name: 'Govt Poly Nainital',
    session_label: '2026-27',
    department_name: 'IT',
    department_code: 'IT',
    subject_name: 'Web Tech',
    year: 3,
    semester: 5,
    title: 'Unit Test 1',
    max_marks: 20,
    roster: [{ roll_no: '01', registration_no: '24011090001', official_enrollment_no: 'UBTER2026001', full_name: 'Girdhar Dhami', marks_obtained: 18 }]
  });
  fs.writeFileSync('test-test.html', testPdf);
  console.log('Written test-test.html:', testPdf.length);
}

run().catch(console.error);
