import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Contract from '@/models/Contract'

export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const body = await req.json()

    const required = ['client', 'project', 'contractTitle', 'total', 'dueNow', 'remaining']
    for (const field of required) {
      if (body[field] === undefined || body[field] === null || body[field] === '') {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        )
      }
    }

    const contract = await Contract.create({
      client: body.client,
      project: body.project,
      projectType: body.projectType || 'Website',
      contractTitle: body.contractTitle,
      items: body.items || [],
      tax: body.tax ?? 0,
      deposit: body.deposit ?? 50,
      currency: body.currency || 'USD',
      total: body.total,
      dueNow: body.dueNow,
      remaining: body.remaining,
      paymentTerms: body.paymentTerms || '',
      contractTerms: body.contractTerms || '',
      recipientEmail: body.recipientEmail || undefined,
      status: 'sent',
    })

    return NextResponse.json(
      {
        id: contract._id.toString(),
        message: 'Contract created successfully',
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('POST /api/contracts error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create contract' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    await connectDB()
    const contracts = await Contract.find()
      .sort({ createdAt: -1 })
      .select('-signatureDataUrl')
      .lean()

    return NextResponse.json(
      contracts.map((c) => ({
        ...c,
        id: c._id.toString(),
      }))
    )
  } catch (error: any) {
    console.error('GET /api/contracts error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch contracts' },
      { status: 500 }
    )
  }
}
