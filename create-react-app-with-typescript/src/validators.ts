import XRegExp from 'xregexp';

const required = (v?: string | null) => (v !== undefined && v !== null && String(v).trim().length > 0) || 'This value is required';
const minLength = (length: number) => {
  return (v?: string) => (typeof v === 'string' && v.length >= length) || 'Min length of this value is ' + length;
};
const minValue = (value: number) => {
  return (v?: string) => Number(v) >= value || 'Min value of this value is ' + value;
};
const maxValue = (value: number) => {
  return (v?: string) => Number(v) <= value || 'Max value of this value is ' + value;
};
const isHexColor = (v?: string) => {
  return String(v).match(/^#([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$/g) !== null || 'Expecting hexadecimal color in format #000 or #000000';
};

const startsWith = (chars: string[]) => {
  return (v?: string) => {
    return (
      typeof v === 'string'
        && v.length > 0
        && chars.map(char => v.startsWith(char)).includes(true)
    ) || 'Must start with ' + chars.join(', ');
  };
};

const restrictedChars = (chars: string[]) => {
  return (v?: string) => {
    return (
      typeof v === 'string'
        && v.length > 0
        && !chars.map(char => v.includes(char)).includes(true)
    ) || 'Contains restricted chars: ' + chars.map(o => '"' + o + '"').join(', ');
  };
};

const isValidRegex = (val: string) => {
  try {
    XRegExp(val);
    return true;
  } catch (e) {
    return 'Keyword is not valid regexp';
  }
};

const mustBeCompliant = (acceptedChars: string) => {
  const regexp = new RegExp(`^[${acceptedChars}]+$`, 'g');
  return (v?: string) => (typeof v === 'string' && !!v.match(regexp)) || 'This value can contain only ' + acceptedChars;
};

const expectedValuesCount = (count: number) => {
  return (v?: string[]) => {
    const err = 'Array needs to contain at least ' + count + ' values.';
    if (v) {
      const values = v.filter(o => o.length > 0);
      return values.length >= count || err;
    }
    return err;
  };
};

export {
  isHexColor, expectedValuesCount, mustBeCompliant, isValidRegex, required, minLength, maxValue, startsWith, minValue, restrictedChars,
};
