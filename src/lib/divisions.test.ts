import { STUDENT_DIVISIONS, STUDENT_DIVISION_INFO } from './schemas/member-application.schema';

describe('Student Network Divisions', () => {
  it('defines the three official divisions', () => {
    expect(STUDENT_DIVISIONS).toEqual([
      'student_finance',
      'student_enterprise',
      'governance_records',
    ]);
  });

  it('has exact division names matching Student Finance, Student Enterprise, Governance & Records', () => {
    expect(STUDENT_DIVISION_INFO.student_finance.name).toBe('Student Finance');
    expect(STUDENT_DIVISION_INFO.student_enterprise.name).toBe('Student Enterprise');
    expect(STUDENT_DIVISION_INFO.governance_records.name).toBe('Governance & Records');
  });

  it('does not contain prohibited legacy names or division suffixes in exact names', () => {
    const names = Object.values(STUDENT_DIVISION_INFO).map((d) => d.name);
    expect(names).toEqual(['Student Finance', 'Student Enterprise', 'Governance & Records']);
    for (const name of names) {
      expect(name.toLowerCase()).not.toContain('campus operations');
      expect(name.toLowerCase()).not.toContain('enterprise development');
    }
  });
});
