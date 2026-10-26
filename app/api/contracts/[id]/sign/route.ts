import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Contract from '@/models/Contract'
import mongoose from 'mongoose'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()
    const { id } = await params
    const body = await req.json()

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid contract ID' }, { status: 400 })
    }

    const { signerName, signatureDataUrl } = body

    if (!signerName?.trim()) {
      return NextResponse.json(
        { error: 'Signer name is required' },
        { status: 400 }
      )
    }

    if (!signatureDataUrl || typeof signatureDataUrl !== 'string') {
      return NextResponse.json(
        { error: 'Signature is required' },
        { status: 400 }
      )
    }

    const contract = await Contract.findById(id)

    if (!contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
    }

    if (contract.status === 'signed') {
      return NextResponse.json(
        { error: 'This contract has already been signed' },
        { status: 400 }
      )
    }

    contract.signerName = signerName.trim()
    contract.signatureDataUrl = signatureDataUrl
    contract.signedAt = new Date()
    contract.status = 'signed'

    await contract.save()

    return NextResponse.json({
      message: 'Contract signed successfully',
      id: contract._id.toString(),
      signerName: contract.signerName,
      signedAt: contract.signedAt,
      status: contract.status,
    })
  } catch (error: any) {
    console.error('POST /api/contracts/[id]/sign error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to sign contract' },
      { status: 500 }
    )
  }
}
