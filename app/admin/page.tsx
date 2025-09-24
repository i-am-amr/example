'use client'

import { useState, useEffect } from 'react'
import { 
  Package, 
  FileText, 
  Users, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  AlertCircle,
  XCircle
} from 'lucide-react'

interface DashboardStats {
  totalProducts: number
  totalRegistrations: number
  activeWarranties: number
  expiredWarranties: number
  pendingRegistrations: number
  verifiedRegistrations: number
  totalUsers: number
}

interface RecentRegistration {
  id: string
  customerName: string
  productName: string
  registrationDate: string
  status: string
  isVerified: boolean
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalRegistrations: 0,
    activeWarranties: 0,
    expiredWarranties: 0,
    pendingRegistrations: 0,
    verifiedRegistrations: 0,
    totalUsers: 0
  })
  const [recentRegistrations, setRecentRegistrations] = useState<RecentRegistration[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token')
      
      // Fetch registration stats
      const regStatsResponse = await fetch('/api/registrations/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (regStatsResponse.ok) {
        const regStats = await regStatsResponse.json()
        setStats(prev => ({
          ...prev,
          ...regStats.statistics
        }))
      }

      // Fetch product count
      const productsResponse = await fetch('/api/products?limit=1', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (productsResponse.ok) {
        const productsData = await productsResponse.json()
        setStats(prev => ({
          ...prev,
          totalProducts: productsData.pagination.total
        }))
      }

      // Fetch user count
      const usersResponse = await fetch('/api/users?limit=1', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (usersResponse.ok) {
        const usersData = await usersResponse.json()
        setStats(prev => ({
          ...prev,
          totalUsers: usersData.pagination.total
        }))
      }

      // Fetch recent registrations
      const recentResponse = await fetch('/api/registrations?limit=5', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (recentResponse.ok) {
        const recentData = await recentResponse.json()
        setRecentRegistrations(recentData.registrations)
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      name: 'Total Products',
      value: stats.totalProducts,
      icon: Package,
      color: 'bg-blue-500'
    },
    {
      name: 'Total Registrations',
      value: stats.totalRegistrations,
      icon: FileText,
      color: 'bg-green-500'
    },
    {
      name: 'Active Warranties',
      value: stats.activeWarranties,
      icon: CheckCircle,
      color: 'bg-emerald-500'
    },
    {
      name: 'Expired Warranties',
      value: stats.expiredWarranties,
      icon: XCircle,
      color: 'bg-red-500'
    },
    {
      name: 'Pending Verifications',
      value: stats.pendingRegistrations,
      icon: Clock,
      color: 'bg-yellow-500'
    },
    {
      name: 'Verified Registrations',
      value: stats.verifiedRegistrations,
      icon: CheckCircle,
      color: 'bg-indigo-500'
    },
    {
      name: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'bg-purple-500'
    },
    {
      name: 'Success Rate',
      value: stats.totalRegistrations > 0 
        ? Math.round((stats.verifiedRegistrations / stats.totalRegistrations) * 100)
        : 0,
      suffix: '%',
      icon: TrendingUp,
      color: 'bg-pink-500'
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Overview of your warranty management system
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`p-3 rounded-md ${stat.color}`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {stat.name}
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stat.value}{stat.suffix || ''}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Recent Registrations */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Recent Registrations
          </h3>
          {recentRegistrations.length > 0 ? (
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentRegistrations.map((registration) => (
                    <tr key={registration.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {registration.customerName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {registration.productName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(registration.registrationDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          registration.isVerified 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {registration.isVerified ? 'Verified' : 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-6">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No registrations</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating your first product.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}