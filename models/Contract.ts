import mongoose, { Schema, models, model } from 'mongoose'

export interface IWorkItem {
  id: number
  name: string
  detail: string
  hours: number
  rate: number
  discount: number
}

export interface IContract {
  _id: mongoose.Types.ObjectId
  client: string
  project: string
  projectType: string
  contractTitle: string
  items: IWorkItem[]
  tax: number
  deposit: number
  currency: string
  total: number
  dueNow: number
  remaining: number
  paymentTerms: string
  contractTerms: string
  recipientEmail?: string
  status: 'draft' | 'sent' | 'signed'
  signerName?: string
  signatureDataUrl?: string
  signedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const WorkItemSchema = new Schema(
  {
    id: { type: Number, required: true },
    name: { type: String, required: true },
    detail: { type: String, default: '' },
    hours: { type: Number, required: true },
    rate: { type: Number, required: true },
    discount: { type: Number, default: 0 },
  },
  { _id: false }
)

const ContractSchema = new Schema<IContract>(
  {
    client: { type: String, required: true, trim: true },
    project: { type: String, required: true, trim: true },
    projectType: { type: String, default: 'Website' },
    contractTitle: { type: String, required: true },
    items: { type: [WorkItemSchema], default: [] },
    tax: { type: Number, default: 0 },
    deposit: { type: Number, default: 50 },
    currency: { type: String, default: 'USD' },
    total: { type: Number, required: true },
    dueNow: { type: Number, required: true },
    remaining: { type: Number, required: true },
    paymentTerms: { type: String, default: '' },
    contractTerms: { type: String, default: '' },
    recipientEmail: { type: String, trim: true },
    status: {
      type: String,
      enum: ['draft', 'sent', 'signed'],
      default: 'draft',
    },
    signerName: { type: String },
    signatureDataUrl: { type: String },
    signedAt: { type: Date },
  },
  {
    timestamps: true,
  }
)

const Contract = models.Contract || model<IContract>('Contract', ContractSchema)

export default Contract
