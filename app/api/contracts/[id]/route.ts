import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Contract from '@/models/Contract'
import mongoose from 'mongoose'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()
    const { id } = await params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid contract ID' }, { status: 400 })
    }

    const contract = await Contract.findById(id).lean()

    if (!contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
    }

    return NextResponse.json({
      ...contract,
      id: contract._id.toString(),
    })
  } catch (error: any) {
    console.error('GET /api/contracts/[id] error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch contract' },
      { status: 500 }
    )
  }
}
