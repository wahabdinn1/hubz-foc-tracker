// Component Tests for Dashboard Components
// Test React components with React Testing Library

import { test, expect, describe, afterEach } from '@vitest/runner';
import { render, screen, fireEvent, waitFor } from '@test-utils';
import { DashboardClient } from '@/components/dashboard/DashboardClient';
import { server } from '@./mocks/server';

// Mock server responses
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('DashboardClient Component', () => {
  test('should render dashboard with all panels', async () => {
    render(<DashboardClient />);

    expect(screen.getByText('FOC Tracker Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Overdue Devices')).toBeInTheDocument();
    expect(screen.getByText('Return Tracking')).toBeInTheDocument();
    expect(screen.getByText('Activity Feed')).toBeInTheDocument();
    expect(screen.getByText('Return History')).toBeInTheDocument();
  });

  test('should show loading state initially', async () => {
    server.use(
      rest.get('*/inventory', () => ({ status: 200, body: [] })),
      rest.get('*/audit', () => ({ status: 200, body: [] }))
    );

    render(<DashboardClient />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  test('should handle error state gracefully', async () => {
    server.use(
      rest.get('*/inventory', () => ({ status: 500, body: { error: 'Server error' } })),
      rest.get('*/audit', () => ({ status: 500, body: { error: 'Server error' } }))
    );

    render(<DashboardClient />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load dashboard')).toBeInTheDocument();
    });
  });

  test('should display device quick view', async () => {
    render(<DashboardClient />);

    // Click on a device to open quick view
    const deviceRow = await screen.findByText('IMEI: 123456789012345');
    await fireEvent.click(deviceRow);

    await waitFor(() => {
      expect(screen.getByText('Device Details')).toBeInTheDocument();
    });
  });

  test('should refresh dashboard data', async () => {
    render(<DashboardClient />);

    // Simulate data refresh
    const refreshButton = screen.getByRole('button', { name: 'Refresh' });
    await fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(screen.getByText('Data refreshed')).toBeInTheDocument();
    });
  });
});