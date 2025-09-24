'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  QrCode, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  FileText, 
  Calendar,
  CheckCircle,
  AlertCircle,
  ArrowLeft
} from 'lucide-react'
import toast from 'react-hot-toast'

interface Product {
  id: string
  name: string
  sku: string
  warrantyPeriod: number
  warrantyTerms: string
}

interface City {
  id: string
  name: string
  code: string
}

export default function WarrantyRegistration() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [qrCode, setQrCode] = useState('')
  const [product, setProduct] = useState<Product | null>(null)
  const [cities, setCities] = useState<City[]>([])
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    cityId: '',
    invoiceNumber: '',
    invoiceDate: '',
    purchaseDate: '',
    customerAddress: '',
    notes: ''
  })
  const router = useRouter()

  // Fetch cities on component mount
  useState(() => {
    fetchCities()
  }, [])

  const fetchCities = async () => {
    try {
      const response = await fetch('/api/cities')
      if (response.ok) {
        const data = await response.json()
        setCities(data.cities)
      }
    } catch (error) {
      console.error('Error fetching cities:', error)
    }
  }

  const handleQRCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!qrCode.trim()) {
      toast.error('Please enter a QR code')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/registrations/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ qrCode: qrCode.trim() }),
      })

      const data = await response.json()

      if (response.ok) {
        if (data.isRegistered) {
          toast.error('This product is already registered')
          setStep(3) // Show already registered message
        } else {
          setProduct(data.product)
          setStep(2)
          toast.success('Product found! Please fill in your details.')
        }
      } else {
        toast.error(data.message || 'Invalid QR code')
      }
    } catch (error) {
      console.error('Error verifying QR code:', error)
      toast.error('An error occurred while verifying the QR code')
    } finally {
      setLoading(false)
    }
  }

  const handleRegistrationSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/registrations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: product?.id,
          ...formData
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Warranty registration successful!')
        setStep(3)
      } else {
        toast.error(data.message || 'Registration failed')
      }
    } catch (error) {
      console.error('Error registering warranty:', error)
      toast.error('An error occurred during registration')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const resetForm = () => {
    setStep(1)
    setQrCode('')
    setProduct(null)
    setFormData({
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      cityId: '',
      invoiceNumber: '',
      invoiceDate: '',
      purchaseDate: '',
      customerAddress: '',
      notes: ''
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-500 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Home
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Warranty Registration</h1>
          <p className="mt-2 text-gray-600">
            Register your product warranty by scanning the QR code
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center">
            <div className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                1
              </div>
              <div className={`ml-2 text-sm ${
                step >= 1 ? 'text-blue-600' : 'text-gray-500'
              }`}>
                Scan QR Code
              </div>
            </div>
            <div className={`w-16 h-0.5 mx-4 ${
              step >= 2 ? 'bg-blue-600' : 'bg-gray-300'
            }`} />
            <div className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                2
              </div>
              <div className={`ml-2 text-sm ${
                step >= 2 ? 'text-blue-600' : 'text-gray-500'
              }`}>
                Fill Details
              </div>
            </div>
            <div className={`w-16 h-0.5 mx-4 ${
              step >= 3 ? 'bg-blue-600' : 'bg-gray-300'
            }`} />
            <div className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                3
              </div>
              <div className={`ml-2 text-sm ${
                step >= 3 ? 'text-blue-600' : 'text-gray-500'
              }`}>
                Complete
              </div>
            </div>
          </div>
        </div>

        {/* Step 1: QR Code Input */}
        {step === 1 && (
          <div className="bg-white shadow rounded-lg p-6">
            <div className="text-center mb-6">
              <QrCode className="mx-auto h-12 w-12 text-blue-600 mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Enter QR Code
              </h2>
              <p className="text-gray-600">
                Please enter the QR code from your product or scan it with your camera
              </p>
            </div>

            <form onSubmit={handleQRCodeSubmit} className="space-y-4">
              <div>
                <label htmlFor="qrCode" className="block text-sm font-medium text-gray-700 mb-2">
                  QR Code
                </label>
                <input
                  type="text"
                  id="qrCode"
                  value={qrCode}
                  onChange={(e) => setQrCode(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter QR code here..."
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  'Verify QR Code'
                )}
              </button>
            </form>
          </div>
        )}

        {/* Step 2: Registration Form */}
        {step === 2 && product && (
          <div className="bg-white shadow rounded-lg p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Product Information
              </h2>
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="font-medium text-gray-900">{product.name}</p>
                <p className="text-sm text-gray-600">SKU: {product.sku}</p>
                <p className="text-sm text-gray-600">
                  Warranty Period: {product.warrantyPeriod} months
                </p>
              </div>
            </div>

            <form onSubmit={handleRegistrationSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="inline h-4 w-4 mr-1" />
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="customerName"
                    name="customerName"
                    value={formData.customerName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="customerPhone" className="block text-sm font-medium text-gray-700 mb-2">
                    <Phone className="inline h-4 w-4 mr-1" />
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    id="customerPhone"
                    name="customerPhone"
                    value={formData.customerPhone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="customerEmail" className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="inline h-4 w-4 mr-1" />
                  Email Address
                </label>
                <input
                  type="email"
                  id="customerEmail"
                  name="customerEmail"
                  value={formData.customerEmail}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="cityId" className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="inline h-4 w-4 mr-1" />
                  City *
                </label>
                <select
                  id="cityId"
                  name="cityId"
                  value={formData.cityId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select a city</option>
                  {cities.map((city) => (
                    <option key={city.id} value={city.id}>
                      {city.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="invoiceNumber" className="block text-sm font-medium text-gray-700 mb-2">
                    <FileText className="inline h-4 w-4 mr-1" />
                    Invoice Number *
                  </label>
                  <input
                    type="text"
                    id="invoiceNumber"
                    name="invoiceNumber"
                    value={formData.invoiceNumber}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="invoiceDate" className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="inline h-4 w-4 mr-1" />
                    Invoice Date *
                  </label>
                  <input
                    type="date"
                    id="invoiceDate"
                    name="invoiceDate"
                    value={formData.invoiceDate}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="purchaseDate" className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  Purchase Date *
                </label>
                <input
                  type="date"
                  id="purchaseDate"
                  name="purchaseDate"
                  value={formData.purchaseDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="customerAddress" className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <textarea
                  id="customerAddress"
                  name="customerAddress"
                  value={formData.customerAddress}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mx-auto"></div>
                  ) : (
                    'Register Warranty'
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Step 3: Success/Already Registered */}
        {step === 3 && (
          <div className="bg-white shadow rounded-lg p-6 text-center">
            {product ? (
              <>
                <CheckCircle className="mx-auto h-12 w-12 text-green-600 mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Registration Successful!
                </h2>
                <p className="text-gray-600 mb-6">
                  Your warranty has been registered successfully. You will receive a confirmation message shortly.
                </p>
                <div className="bg-gray-50 p-4 rounded-md mb-6">
                  <p className="font-medium text-gray-900">{product.name}</p>
                  <p className="text-sm text-gray-600">SKU: {product.sku}</p>
                  <p className="text-sm text-gray-600">
                    Warranty Period: {product.warrantyPeriod} months
                  </p>
                </div>
              </>
            ) : (
              <>
                <AlertCircle className="mx-auto h-12 w-12 text-yellow-600 mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Product Already Registered
                </h2>
                <p className="text-gray-600 mb-6">
                  This product has already been registered for warranty.
                </p>
              </>
            )}
            
            <div className="flex space-x-4">
              <button
                onClick={resetForm}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Register Another Product
              </button>
              <button
                onClick={() => router.push('/')}
                className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Back to Home
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}