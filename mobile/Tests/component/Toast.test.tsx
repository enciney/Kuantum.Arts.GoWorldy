import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react-native';

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

import { Toast } from '../../src/components/Toast';

describe('Toast', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('TST-01: visible=false → render etmez', () => {
    render(<Toast visible={false} message="hi" onClose={() => {}} />);
    expect(screen.queryByTestId('toast')).toBeNull();
  });

  test('TST-02: visible=true → mesaj görünür', () => {
    render(<Toast visible={true} message="Konunuz alındı" onClose={() => {}} />);
    expect(screen.getByText('Konunuz alındı')).toBeTruthy();
  });

  test('TST-03: duration sonra onClose çağrılır', () => {
    const onClose = jest.fn();
    render(<Toast visible={true} message="bye" duration={1000} onClose={onClose} />);
    expect(onClose).not.toHaveBeenCalled();
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(onClose).toHaveBeenCalled();
  });

  test('TST-04: kapatma butonu onClose çağırır', () => {
    const onClose = jest.fn();
    render(<Toast visible={true} message="x" duration={99999} onClose={onClose} />);
    fireEvent.press(screen.getByTestId('toast-close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('TST-05: variant=info uygulanır (mesaj yine görünür)', () => {
    render(<Toast visible={true} message="info msg" variant="info" onClose={() => {}} />);
    expect(screen.getByText('info msg')).toBeTruthy();
  });
});
