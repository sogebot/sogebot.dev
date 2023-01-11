import React, { useEffect, useState } from 'react';

export const useLocalStorage = <S>(
  key: string,
  initialState?: S | (() => S)
): [S | null, React.Dispatch<React.SetStateAction<S | null>>] => {
  const [state, setState] = useState<S | null>(null);
  const [init, setInit] = useState(false);

  const [initialValue] = useState(initialState);

  useEffect(() => {
    const item = localStorage.getItem(key);
    setInit(true);
    if (item) {
      setState(parse(item));
    } else {
      setState(initialValue!);
    }
  }, [initialValue, key]);

  useEffect(() => {
    if (init) {
      localStorage.setItem(key, JSON.stringify(state));
    }
  }, [state, init, key]);

  return [state, setState];
};

const parse = (value: string) => {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};