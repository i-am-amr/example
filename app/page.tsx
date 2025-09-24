import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Warranty Management System
          </h1>
          <p className="text-gray-600 mb-8">
            Complete warranty management with QR codes and WhatsApp integration
          </p>
          
          <div className="space-y-4">
            <Link
              href="/admin"
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors block text-center"
            >
              Admin Dashboard
            </Link>
            
            <Link
              href="/register"
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors block text-center"
            >
              Register Warranty
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}