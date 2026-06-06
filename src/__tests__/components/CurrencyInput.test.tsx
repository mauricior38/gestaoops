import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CurrencyInput from '@/components/CurrencyInput';

describe('CurrencyInput', () => {
  it('renders with initial value formatted', () => {
    render(<CurrencyInput value={1500.5} onChange={() => {}} />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.value).toBe('1.500,50');
  });

  it('renders 0 as "0,00"', () => {
    render(<CurrencyInput value={0} onChange={() => {}} />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.value).toBe('0,00');
  });

  it('calls onChange with numeric value on input', () => {
    const handleChange = vi.fn();
    render(<CurrencyInput value={0} onChange={handleChange} />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    
    fireEvent.change(input, { target: { value: '15000' } });
    expect(handleChange).toHaveBeenCalledWith(150);
  });

  it('strips non-numeric characters', () => {
    const handleChange = vi.fn();
    render(<CurrencyInput value={0} onChange={handleChange} />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    
    fireEvent.change(input, { target: { value: 'R$ abc 500' } });
    expect(handleChange).toHaveBeenCalledWith(5);
  });

  it('resets to 0,00 when input is cleared', () => {
    const handleChange = vi.fn();
    render(<CurrencyInput value={100} onChange={handleChange} />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    
    fireEvent.change(input, { target: { value: '' } });
    expect(handleChange).toHaveBeenCalledWith(0);
    expect(input.value).toBe('0,00');
  });

  it('applies custom className', () => {
    render(<CurrencyInput value={0} onChange={() => {}} className="custom-class" />);
    const input = screen.getByRole('textbox');
    expect(input.className).toBe('custom-class');
  });

  it('uses custom placeholder', () => {
    render(<CurrencyInput value={0} onChange={() => {}} placeholder="Valor" />);
    const input = screen.getByRole('textbox');
    expect(input.getAttribute('placeholder')).toBe('Valor');
  });

  it('defaults placeholder to "0,00"', () => {
    render(<CurrencyInput value={0} onChange={() => {}} />);
    const input = screen.getByRole('textbox');
    expect(input.getAttribute('placeholder')).toBe('0,00');
  });

  it('syncs display when external value changes', () => {
    const { rerender } = render(<CurrencyInput value={100} onChange={() => {}} />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.value).toBe('100,00');
    
    rerender(<CurrencyInput value={250.75} onChange={() => {}} />);
    expect(input.value).toBe('250,75');
  });
});
