import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

async function proxyRequest(
  request: NextRequest,
  method: string
): Promise<NextResponse> {
  const path = request.nextUrl.pathname.replace(/^\/api/, '');
  const searchParams = request.nextUrl.searchParams.toString();
  const url = `${BACKEND_URL}${path}${searchParams ? `?${searchParams}` : ''}`;

  const headers = new Headers();

  // 필요한 헤더만 전달
  const authHeader = request.headers.get('authorization');
  if (authHeader) {
    headers.set('Authorization', authHeader);
  }

  const contentType = request.headers.get('content-type');
  if (contentType) {
    headers.set('Content-Type', contentType);
  }

  try {
    const fetchOptions: RequestInit = {
      method,
      headers,
    };

    // Body가 있는 메서드의 경우
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      const contentType = request.headers.get('content-type') || '';

      if (contentType.includes('multipart/form-data')) {
        // FormData의 경우 그대로 전달 (boundary 포함)
        fetchOptions.body = await request.blob();
        // Content-Type은 자동 설정되도록 제거
        headers.delete('Content-Type');
      } else {
        fetchOptions.body = await request.text();
      }
    }

    const response = await fetch(url, fetchOptions);

    // SSE 스트림 처리
    if (response.headers.get('content-type')?.includes('text/event-stream')) {
      return new NextResponse(response.body, {
        status: response.status,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    }

    // 일반 응답
    const data = await response.text();

    return new NextResponse(data, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'application/json',
      },
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { code: 'PROXY_ERROR', message: 'Failed to connect to backend' },
      { status: 502 }
    );
  }
}

export async function GET(request: NextRequest) {
  return proxyRequest(request, 'GET');
}

export async function POST(request: NextRequest) {
  return proxyRequest(request, 'POST');
}

export async function PUT(request: NextRequest) {
  return proxyRequest(request, 'PUT');
}

export async function DELETE(request: NextRequest) {
  return proxyRequest(request, 'DELETE');
}

export async function PATCH(request: NextRequest) {
  return proxyRequest(request, 'PATCH');
}
