
import { zipPhotos, ZipPhotosOutput } from '@/ai/flows/zip-photos';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const input = await req.json();
    const result: ZipPhotosOutput = await zipPhotos(input);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in zipPhotos API route:', error);
    return NextResponse.json({ error: error.message || 'An unknown error occurred' }, { status: 500 });
  }
}
