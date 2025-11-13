/**
 * Utilities for testing Next.js API routes
 */

import { NextRequest } from 'next/server';

/**
 * Create a mock NextRequest with FormData (for file uploads)
 */
export function createMockRequestWithFile(pdfContent: string, filename = 'test.pdf'): NextRequest {
  // Create a mock PDF file from text content
  const blob = new Blob([pdfContent], { type: 'application/pdf' });
  const file = new File([blob], filename, { type: 'application/pdf' });

  // Create FormData
  const formData = new FormData();
  formData.append('pdf', file);

  // Create mock Request
  const request = new NextRequest('http://localhost:3000/api/pdf-upload', {
    method: 'POST',
    body: formData as any,
  });

  return request;
}

/**
 * Create a mock NextRequest with query parameters (for share link)
 */
export function createMockRequestWithParams(
  params: Record<string, string>,
  origin = 'http://localhost:3000'
): NextRequest {
  const url = new URL('/api/share-link', origin);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  const request = new NextRequest(url, {
    method: 'GET',
  });

  return request;
}

/**
 * Create a mock NextRequest with JSON body (for share link POST)
 */
export function createMockRequestWithBody(
  body: any,
  url = 'http://localhost:3000/api/share-link'
): NextRequest {
  const request = new NextRequest(url, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return request;
}

/**
 * Mock fetch for internal API calls
 */
export function createMockFetch(productDatabase: Record<string, any>) {
  return jest.fn((url: string) => {
    // Extract product ID from URL like /api/product/12345678
    const productIdMatch = url.match(/\/api\/product\/(\d{8})/);
    if (!productIdMatch) {
      return Promise.resolve({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: 'Invalid product ID' }),
      });
    }

    const productId = productIdMatch[1];
    const productData = productDatabase[productId];

    if (!productData) {
      return Promise.resolve({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ error: 'Product not found' }),
      });
    }

    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve(productData),
    });
  });
}

/**
 * Mock fetch for IKEA applink redirects
 */
export function createMockFetchWithRedirect(redirectTarget: string) {
  return jest.fn((url: string, options?: RequestInit) => {
    if (options?.method === 'HEAD' && url.includes('applink')) {
      // Simulate redirect response
      return Promise.resolve({
        ok: true,
        status: 302,
        url: redirectTarget,
        headers: new Headers({
          location: redirectTarget,
        }),
      } as Response);
    }

    // Default response for other requests
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
    } as Response);
  });
}

/**
 * Mock fetch that fails (network error)
 */
export function createFailingMockFetch(errorMessage = 'Network error') {
  return jest.fn(() => {
    return Promise.reject(new Error(errorMessage));
  });
}

/**
 * Mock fetch that times out
 */
export function createTimeoutMockFetch(delay = 5000) {
  return jest.fn(() => {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), delay);
    });
  });
}

/**
 * Extract JSON from NextResponse
 */
export async function getResponseJSON(response: any): Promise<any> {
  // NextResponse.json() returns a Response object
  // We need to extract the JSON body
  if (response.json && typeof response.json === 'function') {
    return await response.json();
  }

  // If it's already a plain object (from our mock)
  if (typeof response === 'object' && response !== null) {
    return response;
  }

  throw new Error('Could not extract JSON from response');
}

/**
 * Assert response status and extract JSON body
 */
export async function expectResponseStatus(
  response: any,
  expectedStatus: number
): Promise<any> {
  expect(response.status).toBe(expectedStatus);
  return await getResponseJSON(response);
}

/**
 * Create a mock NextRequest with path parameters and query params (for availability route)
 */
export function createMockRequestWithPathAndQuery(
  pathParams: { productId: string },
  queryParams: Record<string, string>,
  origin = 'http://localhost:3000'
): NextRequest {
  const url = new URL(`/api/availability/${pathParams.productId}`, origin);
  Object.entries(queryParams).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  const request = new NextRequest(url, {
    method: 'GET',
  });

  return request;
}

/**
 * Mock axios for IKEA availability API calls
 */
export function createMockAxios(ikeaApiResponse: any, shouldFail = false) {
  return {
    default: {
      get: jest.fn((url: string) => {
        if (shouldFail) {
          return Promise.reject(new Error('IKEA API request failed'));
        }

        return Promise.resolve({
          data: ikeaApiResponse,
          status: 200,
          statusText: 'OK',
        });
      }),
    },
  };
}

/**
 * Mock axios that times out
 */
export function createMockAxiosTimeout(delay = 5000) {
  return {
    default: {
      get: jest.fn(() => {
        return new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Request timeout')), delay);
        });
      }),
    },
  };
}

/**
 * Mock axios that returns error response
 */
export function createMockAxiosError(statusCode: number, errorData: any) {
  return {
    default: {
      get: jest.fn(() => {
        const error: any = new Error('Request failed');
        error.response = {
          status: statusCode,
          data: errorData,
        };
        return Promise.reject(error);
      }),
    },
  };
}
