// apps/api/src/shared/constants/indianStates.js
const INDIAN_STATES = {
  '01': { code: '01', name: 'Jammu & Kashmir', tin: '01' },
  '02': { code: '02', name: 'Himachal Pradesh', tin: '02' },
  '03': { code: '03', name: 'Punjab', tin: '03' },
  '04': { code: '04', name: 'Chandigarh', tin: '04' },
  '05': { code: '05', name: 'Uttarakhand', tin: '05' },
  '06': { code: '06', name: 'Haryana', tin: '06' },
  '07': { code: '07', name: 'Delhi', tin: '07' },
  '08': { code: '08', name: 'Rajasthan', tin: '08' },
  '09': { code: '09', name: 'Uttar Pradesh', tin: '09' },
  '10': { code: '10', name: 'Bihar', tin: '10' },
  '11': { code: '11', name: 'Sikkim', tin: '11' },
  '12': { code: '12', name: 'Arunachal Pradesh', tin: '12' },
  '13': { code: '13', name: 'Nagaland', tin: '13' },
  '14': { code: '14', name: 'Manipur', tin: '14' },
  '15': { code: '15', name: 'Mizoram', tin: '15' },
  '16': { code: '16', name: 'Tripura', tin: '16' },
  '17': { code: '17', name: 'Meghalaya', tin: '17' },
  '18': { code: '18', name: 'Assam', tin: '18' },
  '19': { code: '19', name: 'West Bengal', tin: '19' },
  '20': { code: '20', name: 'Jharkhand', tin: '20' },
  '21': { code: '21', name: 'Odisha', tin: '21' },
  '22': { code: '22', name: 'Chhattisgarh', tin: '22' },
  '23': { code: '23', name: 'Madhya Pradesh', tin: '23' },
  '24': { code: '24', name: 'Gujarat', tin: '24' },
  '25': { code: '25', name: 'Daman & Diu', tin: '25' },
  '26': { code: '26', name: 'Dadra & Nagar Haveli', tin: '26' },
  '27': { code: '27', name: 'Maharashtra', tin: '27' },
  '28': { code: '28', name: 'Andhra Pradesh (Old)', tin: '28' },
  '29': { code: '29', name: 'Karnataka', tin: '29' },
  '30': { code: '30', name: 'Goa', tin: '30' },
  '31': { code: '31', name: 'Lakshadweep', tin: '31' },
  '32': { code: '32', name: 'Kerala', tin: '32' },
  '33': { code: '33', name: 'Tamil Nadu', tin: '33' },
  '34': { code: '34', name: 'Puducherry', tin: '34' },
  '35': { code: '35', name: 'Andaman & Nicobar', tin: '35' },
  '36': { code: '36', name: 'Telangana', tin: '36' },
  '37': { code: '37', name: 'Andhra Pradesh', tin: '37' },
  '38': { code: '38', name: 'Ladakh', tin: '38' },
};

function getStateByCode(code) {
  return INDIAN_STATES[code] || null;
}

function getAllStates() {
  return Object.values(INDIAN_STATES);
}

module.exports = { INDIAN_STATES, getStateByCode, getAllStates };
