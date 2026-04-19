// Mock Server for MSW
// Mock API responses for testing

import { setupServer } from '@mswjs/node';
import { rest } from '@mswjs/node';

// Types for mock request bodies
interface RequestPayload {
  username: string;
  requestor: string;
  customRequestor?: string;
  campaignName: string;
  customCampaign?: string;
  devices: Array<{
    unitName: string;
    imeiIfAny: string;
    kolName: string;
    kolAddress: string;
    kolPhoneNumber: string;
    typeOfDelivery: string;
    typeOfFoc: string;
    deliveryDate: string;
  }>;
}

interface ReturnPayload {
  username: string;
  requestor: string;
  customRequestor?: string;
  unitName: string;
  imei: string;
  fromKol: string;
  kolAddress: string;
  kolPhoneNumber: string;
  typeOfFoc: string;
}

// Mock API endpoints
export const server = setupServer(
  // Inventory endpoints
  rest.get('*/inventory', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([
        {
          imei: '123456789012345',
          kol: 'Test KOL',
          campaign: 'Test Campaign',
          status: 'Active',
          requestDate: '2024-01-15',
          returnDate: null,
          overdueDays: 0,
        },
        {
          imei: '987654321098765',
          kol: 'Another KOL',
          campaign: 'Another Campaign',
          status: 'Active',
          requestDate: '2024-01-01',
          returnDate: null,
          overdueDays: 15,
        },
      ])
    );
  }),

  rest.post('*/inventory/request', (req, res, ctx) => {
    const body = req.body as RequestPayload;
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: {
          ...body,
          id: 1,
          status: 'Requested',
          createdAt: new Date().toISOString(),
        },
      })
    );
  }),

  rest.post('*/inventory/return', (req, res, ctx) => {
    const body = req.body as ReturnPayload;
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: {
          ...body,
          id: 1,
          status: 'Returned',
          returnedAt: new Date().toISOString(),
        },
      })
    );
  }),

  // Settings endpoints
  rest.get('*/settings/cc-recipients', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([
        { id: 1, email: 'test@example.com' },
        { id: 2, email: 'admin@example.com' },
      ])
    );
  }),

  rest.post('*/settings/cc-recipients', (req, res, ctx) => {
    const body = req.body as { email: string };
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: {
          id: 3,
          email: body.email,
        },
      })
    );
  }),

  rest.delete('*/settings/cc-recipients/*', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({ success: true })
    );
  }),

  // Audit log endpoints
  rest.get('*/audit', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([
        {
          id: 1,
          action: 'FOC_REQUEST_CREATED',
          imei: '123456789012345',
          kol: 'Test KOL',
          campaign: 'Test Campaign',
          user: 'admin',
          timestamp: '2024-01-15T10:30:00Z',
          details: 'FOC request created for Test KOL',
        },
      ])
    );
  }),

  // Error simulation
  rest.get('*/error', (req, res, ctx) => {
    return res(
      ctx.status(500),
      ctx.json({ error: 'Simulated server error' })
    );
  }),

  // Fallback for unmatched requests
  rest.get('*\/*', (req, res, ctx) => {
    return res(
      ctx.status(404),
      ctx.json({ error: 'Not found' })
    );
  })
);

// Export server for testing
export { server };