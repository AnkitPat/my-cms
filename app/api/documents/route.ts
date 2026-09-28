import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET(request: Request) {
  try {
console.log(process.env.MONGODB_URI,  'MONGODB_URI')

    const client = await clientPromise;
    const db = client.db('my_cms');
    const collection = db.collection('documents');

    const documents = await collection.find({}).toArray();
    return NextResponse.json({ success: true, documents });
  } catch (error: any) {
    console.error('Failed to fetch documents from MongoDB:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { document } = body;

    if (!document || !document._id) {
      return NextResponse.json(
        { success: false, error: 'Invalid document structure provided' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('my_cms');
    const collection = db.collection('documents');

    // Upsert document by _id
    await collection.updateOne(
      { _id: document._id },
      { $set: { ...document, _updatedAt: new Date().toISOString() } },
      { upsert: true }
    );

    const savedDoc = await collection.findOne({ _id: document._id });

    return NextResponse.json({ success: true, document: savedDoc });
  } catch (error: any) {
    console.error('Failed to save document to MongoDB:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save document' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Document ID is required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('my_cms');
    const collection = db.collection('documents');

    await collection.deleteOne({ _id: id } as any);

    return NextResponse.json({ success: true, deletedId: id });
  } catch (error: any) {
    console.error('Failed to delete document from MongoDB:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete document' },
      { status: 500 }
    );
  }
}
