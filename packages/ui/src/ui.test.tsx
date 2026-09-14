// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { Badge } from './Badge';
import { Button, buttonClasses } from './Button';
import { Card } from './Card';
import { Modal } from './Modal';
import { ProgressBar } from './ProgressBar';
import { SegmentedControl } from './SegmentedControl';
import { Switch } from './Switch';

afterEach(cleanup);

describe('Button', () => {
  it('defaults to type="button" so it never submits a surrounding form', () => {
    render(<Button>Play</Button>);
    expect(screen.getByRole('button', { name: 'Play' })).toHaveProperty('type', 'button');
  });

  it('keeps an explicit type', () => {
    render(<Button type="submit">Send</Button>);
    expect(screen.getByRole('button', { name: 'Send' })).toHaveProperty('type', 'submit');
  });

  it('applies the variant, the size and a caller class', () => {
    const classes = buttonClasses({ variant: 'danger', size: 'lg', block: true, className: 'mt-2' });
    expect(classes).toContain('bg-danger');
    expect(classes).toContain('h-14');
    expect(classes).toContain('w-full');
    expect(classes).toContain('mt-2');
  });

  it('defaults to the primary variant at medium size and is not block', () => {
    const classes = buttonClasses();
    expect(classes).toContain('bg-primary');
    expect(classes).toContain('h-12');
    expect(classes).not.toContain('w-full');
  });

  it('forwards clicks and honours disabled', () => {
    const onClick = vi.fn();
    render(
      <>
        <Button onClick={onClick}>Go</Button>
        <Button onClick={onClick} disabled>
          Stop
        </Button>
      </>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Go' }));
    fireEvent.click(screen.getByRole('button', { name: 'Stop' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe('Badge', () => {
  it('uses the neutral tone by default and the named tone otherwise', () => {
    const { rerender } = render(<Badge>New</Badge>);
    expect(screen.getByText('New').className).toContain('bg-surface-2');
    rerender(<Badge tone="gold">New</Badge>);
    expect(screen.getByText('New').className).toContain('bg-gold');
  });
});

describe('Card', () => {
  it('adds hover affordances only when interactive', () => {
    const { rerender } = render(<Card>plain</Card>);
    expect(screen.getByText('plain').className).not.toContain('cursor-pointer');
    rerender(<Card interactive>plain</Card>);
    expect(screen.getByText('plain').className).toContain('cursor-pointer');
  });

  it('tones the border and background together', () => {
    render(<Card tone="danger">bad</Card>);
    const className = screen.getByText('bad').className;
    expect(className).toContain('border-danger/30');
    expect(className).toContain('bg-danger-soft');
  });
});

describe('Modal', () => {
  beforeAll(() => {
    // happy-dom does not implement the modal dialog methods; model them on the open property.
    HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
      this.open = true;
    };
    HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
      this.open = false;
      this.dispatchEvent(new Event('close'));
    };
  });

  it('opens and closes with the open prop', () => {
    const { rerender } = render(
      <Modal open={false} onClose={() => {}} title="Settings">
        body
      </Modal>,
    );
    const dialog = document.querySelector('dialog') as HTMLDialogElement;
    expect(dialog.open).toBe(false);
    rerender(
      <Modal open onClose={() => {}} title="Settings">
        body
      </Modal>,
    );
    expect(dialog.open).toBe(true);
    rerender(
      <Modal open={false} onClose={() => {}} title="Settings">
        body
      </Modal>,
    );
    expect(dialog.open).toBe(false);
  });

  it('closes when the backdrop is clicked but not when the content is', () => {
    const onClose = vi.fn();
    render(
      <Modal open onClose={onClose} title="Settings">
        <p>body</p>
      </Modal>,
    );
    const dialog = document.querySelector('dialog') as HTMLDialogElement;
    fireEvent.click(screen.getByText('body'));
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.click(dialog);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('labels itself and its heading with the title', () => {
    render(
      <Modal open onClose={() => {}} title="Settings">
        body
      </Modal>,
    );
    expect(screen.getByRole('heading', { level: 2 })).toHaveProperty('textContent', 'Settings');
    expect(document.querySelector('dialog')?.getAttribute('aria-label')).toBe('Settings');
  });
});

describe('ProgressBar', () => {
  it('reports a percentage and clamps out-of-range values', () => {
    const { rerender } = render(<ProgressBar value={0.42} label="XP" />);
    const bar = screen.getByRole('progressbar', { name: 'XP' });
    expect(bar.getAttribute('aria-valuenow')).toBe('42');
    rerender(<ProgressBar value={2} label="XP" />);
    expect(bar.getAttribute('aria-valuenow')).toBe('100');
    rerender(<ProgressBar value={-1} label="XP" />);
    expect(bar.getAttribute('aria-valuenow')).toBe('0');
  });

  it('fills to the same width as the reported value', () => {
    render(<ProgressBar value={0.25} label="XP" tone="gold" />);
    const fill = screen.getByRole('progressbar').firstElementChild as HTMLElement;
    expect(fill.style.width).toBe('25%');
    expect(fill.className).toContain('bg-gold');
  });
});

describe('SegmentedControl', () => {
  const options = [
    { value: 'th', label: 'ไทย' },
    { value: 'en', label: 'English' },
  ] as const;

  it('marks the selected option and reports a change', () => {
    const onChange = vi.fn();
    render(<SegmentedControl value="th" options={options} onChange={onChange} label="Language" />);
    expect(screen.getByRole('radiogroup', { name: 'Language' })).toBeTruthy();
    expect(screen.getByRole('radio', { name: 'ไทย' }).getAttribute('aria-checked')).toBe('true');
    expect(screen.getByRole('radio', { name: 'English' }).getAttribute('aria-checked')).toBe('false');
    fireEvent.click(screen.getByRole('radio', { name: 'English' }));
    expect(onChange).toHaveBeenCalledWith('en');
  });
});

describe('Switch', () => {
  it('exposes its state and toggles to the opposite value', () => {
    const onChange = vi.fn();
    const { rerender } = render(<Switch checked={false} onChange={onChange} label="Sound" />);
    const control = screen.getByRole('switch', { name: 'Sound' });
    expect(control.getAttribute('aria-checked')).toBe('false');
    fireEvent.click(control);
    expect(onChange).toHaveBeenCalledWith(true);

    rerender(<Switch checked onChange={onChange} label="Sound" />);
    expect(control.getAttribute('aria-checked')).toBe('true');
    fireEvent.click(control);
    expect(onChange).toHaveBeenLastCalledWith(false);
  });
});

describe('token contract', () => {
  it('carries no product palette: no hex or rgb literal in any primitive', () => {
    const dir = dirname(fileURLToPath(import.meta.url));
    const offenders = readdirSync(dir)
      .filter((file) => /\.tsx?$/.test(file) && !file.endsWith('.test.tsx'))
      .flatMap((file) => {
        const matches = readFileSync(join(dir, file), 'utf8').match(/#[0-9a-fA-F]{3,8}\b|\brgba?\(/g) ?? [];
        return matches.map((match) => `${file}: ${match}`);
      });
    expect(offenders).toEqual([]);
  });
});
