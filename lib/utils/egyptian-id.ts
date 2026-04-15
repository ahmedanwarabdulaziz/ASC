/**
 * Parses a 14-digit Egyptian National ID to extract vital information mapping.
 * Examples: 28305252400037
 * 2 = 1900s
 * 83 = Year
 * 05 = Month
 * 25 = Day
 * 24 = Governorate
 * 0003 = Sequence (Odd ending denotes Male, Even ending denotes Female)
 */
export function parseEgyptianNationalId(nationalId: string) {
  if (!nationalId || nationalId.length !== 14 || !/^\d+$/.test(nationalId)) {
    return { valid: false, error: 'الرقم القومي يجب أن يتكون من 14 رقم باللغة الإنجليزية' };
  }

  const centuryChar = nationalId.charAt(0);
  const yearStr = nationalId.substring(1, 3);
  const monthStr = nationalId.substring(3, 5);
  const dayStr = nationalId.substring(5, 7);
  
  // Supports 1900s (2) and 2000s (3). (4 for 2100s when we get there)
  if (centuryChar !== '2' && centuryChar !== '3') {
    return { valid: false, error: 'كود القرن في الرقم القومي غير صحيح' };
  }
  const century = centuryChar === '2' ? 1900 : 2000;

  const fullYear = century + parseInt(yearStr);
  const month = parseInt(monthStr);
  const day = parseInt(dayStr);
  
  if (month < 1 || month > 12) {
    return { valid: false, error: 'شهر الميلاد غير صحيح بالرقم القومي' };
  }
  if (day < 1 || day > 31) {
    return { valid: false, error: 'يوم الميلاد غير صحيح بالرقم القومي' };
  }
  
  const birthDate = new Date(fullYear, month - 1, day);
  
  // 13th digit (index 12) determines gender
  const genderCode = parseInt(nationalId.charAt(12));
  const gender = genderCode % 2 !== 0 ? 'male' : 'female';
  
  // Calculate relative active Age safely
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  const isoDate = `${fullYear}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  
  return {
    valid: true,
    birthDate: isoDate,
    gender,
    age,
    error: null
  }
}
