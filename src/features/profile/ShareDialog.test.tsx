import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ShareDialog } from './ShareDialog';

function renderDialog(onClose = vi.fn()) {
  render(
    <ShareDialog
      username="alice"
      url="https://beam.test/@alice"
      qrSvg="<svg aria-label='qr'></svg>"
      isLoading={false}
      onClose={onClose}
    />,
  );
  return { onClose };
}

describe('ShareDialog', () => {
  it('shows the handle, URL and share actions', () => {
    renderDialog();
    expect(screen.getByText('@alice')).toBeInTheDocument();
    expect(screen.getByText('https://beam.test/@alice')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /copy link/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^print$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /download png/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /download svg/i })).toBeInTheDocument();
  });

  it('closes on Escape', () => {
    const { onClose } = renderDialog();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('disables download/print until the QR is loaded', () => {
    render(
      <ShareDialog username="alice" url="https://beam.test/@alice" qrSvg={undefined} isLoading onClose={vi.fn()} />,
    );
    expect(screen.getByText(/generating/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /download png/i })).toBeDisabled();
  });
});
