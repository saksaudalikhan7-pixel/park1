import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
    const token = cookies().get('admin_token')?.value;
    if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

    try {
        const contentType = req.headers.get('content-type');
        if (!contentType?.includes('multipart/form-data')) {
            return NextResponse.json({ error: 'Content-Type must be multipart/form-data' }, { status: 400 });
        }

        // Forward raw stream to Django
        const response = await fetch(`${API_URL}/cms/upload/`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': contentType, // Pass boundary intact
            },
            body: req.body, // Stream
            // @ts-ignore - duplex is needed for streaming bodies in Node fetch
            duplex: 'half',
        });

        if (!response.ok) {
            const text = await response.text();
            console.error('Backend upload failed:', text);
            return NextResponse.json({ error: 'Backend upload failed: ' + text.substring(0, 100) }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json({ success: true, url: data.url });
    } catch (error: any) {
        console.error('Upload proxy error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
