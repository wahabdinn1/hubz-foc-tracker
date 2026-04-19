// Component Tests for Settings Dashboard
// Test React components with React Testing Library

import { test, expect, describe, beforeEach, afterEach } from '@vitest/runner';
import { render, screen, fireEvent, waitFor } from '@test-utils';
import { SettingsDashboard } from '@/components/SettingsDashboard';
import { server } from '@./mocks/server';

// Mock server responses
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('SettingsDashboard Component', () => {
  test('should render settings page with CC email recipients', async () => {
    render(<SettingsDashboard 
      initialRecipients={[{ id: 1, email: 'test@example.com' }]}
      initialDropdownOptions={[]}
    />);

    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('CC Email Recipients')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  test('should add new CC email recipient', async () => {
    render(<SettingsDashboard 
      initialRecipients={[]}
      initialDropdownOptions={[]}
    />);

    const emailInput = screen.getByPlaceholderText('name@wppmedia.com');
    const addButton = screen.getByText('Add');

    await fireEvent.change(emailInput, { target: { value: 'new@test.com' } });
    await fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('new@test.com')).toBeInTheDocument();
    });
  });

  test('should show error for invalid email', async () => {
    render(<SettingsDashboard 
      initialRecipients={[]}
      initialDropdownOptions={[]}
    />);

    const emailInput = screen.getByPlaceholderText('name@wppmedia.com');
    const addButton = screen.getByText('Add');

    await fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    await fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('Email required')).toBeInTheDocument();
    });
  });

  test('should delete CC email recipient', async () => {
    render(<SettingsDashboard 
      initialRecipients={[{ id: 1, email: 'test@example.com' }]}
      initialDropdownOptions={[]}
    />);

    const deleteButton = screen.getByRole('button', { name: 'Trash' });
    await fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(screen.queryByText('test@example.com')).not.toBeInTheDocument();
    });
  });

  test('should edit CC email recipient', async () => {
    render(<SettingsDashboard 
      initialRecipients={[{ id: 1, email: 'test@example.com' }]}
      initialDropdownOptions={[]}
    />);

    const editButton = screen.getByRole('button', { name: 'Pencil' });
    await fireEvent.click(editButton);

    const editInput = screen.getByRole('textbox', { name: 'Email' });
    await fireEvent.change(editInput, { target: { value: 'edited@test.com' } });

    const saveButton = screen.getByRole('button', { name: 'Check' });
    await fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('edited@test.com')).toBeInTheDocument();
    });
  });

  test('should show bulk add functionality', async () => {
    render(<SettingsDashboard 
      initialRecipients={[]}
      initialDropdownOptions={[]}
    />);

    const bulkButton = screen.getByText('Bulk');
    await fireEvent.click(bulkButton);

    expect(screen.getByText('Paste multiple emails')).toBeInTheDocument();
  });
});