import { STUDENT_DIVISIONS, STUDENT_DIVISION_INFO } from './schemas/member-application.schema';

describe('Student Network Divisions', () => {
  it('defines the three official divisions', () => {
    expect(STUDENT_DIVISIONS).toEqual([
      'student_finance',
      'student_enterprise',
      'governance_records',
    ]);
  });

  it('has exact division names', () => {
    expect(STUDENT_DIVISION_INFO.student_finance.name).toBe('Student Finance Division');
    expect(STUDENT_DIVISION_INFO.student_enterprise.name).toBe('Student Enterprise Division');
    expect(STUDENT_DIVISION_INFO.governance_records.name).toBe('Governance & Records Division');
  });

  it('does not contain prohibited legacy names', () => {
    const names = Object.values(STUDENT_DIVISION_INFO).map((d) => d.name.toLowerCase());
    for (const name of names) {
      expect(name).not.toContain('campus operations');
      expect(name).not.toContain('enterprise development');
    }
  });
});
