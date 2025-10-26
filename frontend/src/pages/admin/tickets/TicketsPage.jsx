import React, { useState, useEffect } from 'react';
import { ticketAPI } from '../../../services/apiService';

const TicketsPage = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [ticketsPerPage] = useState(10);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    const fetchTickets = async () => {
      setLoading(true);
      try {
        const response = await ticketAPI.getTickets({
          page: currentPage,
          limit: ticketsPerPage,
          search: searchTerm,
          status: filterStatus !== 'all' ? filterStatus : undefined,
          priority: filterPriority !== 'all' ? filterPriority : undefined,
          category: filterCategory !== 'all' ? filterCategory : undefined
        });
        setTickets(response.data.tickets || response.data || []);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching tickets:', error);
        setTickets([]);
        setLoading(false);
      }
    };
    fetchTickets();
  }, [currentPage, searchTerm, filterStatus, filterPriority, filterCategory]);

  const handleStatusChange = async (ticketId, newStatus) => {
    try {
      await ticketAPI.updateTicketStatus(ticketId, { status: newStatus });
      setTickets(tickets.map(ticket => 
        ticket._id === ticketId ? { ...ticket, status: newStatus } : ticket
      ));
    } catch (error) {
      console.error('Error updating ticket status:', error);
    }
  };

  const handlePriorityChange = async (ticketId, newPriority) => {
    try {
      await ticketAPI.updateTicket(ticketId, { priority: newPriority });
      setTickets(tickets.map(ticket => 
        ticket._id === ticketId ? { ...ticket, priority: newPriority } : ticket
      ));
    } catch (error) {
      console.error('Error updating ticket priority:', error);
    }
  };

  const handleAssignTicket = async (ticketId, assignedTo) => {
    try {
      await ticketAPI.updateTicket(ticketId, { assignedTo });
      setTickets(tickets.map(ticket => 
        ticket._id === ticketId ? { ...ticket, assignedTo } : ticket
      ));
    } catch (error) {
      console.error('Error assigning ticket:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'waiting_customer': return 'bg-orange-100 text-orange-800';
      case 'waiting_support': return 'bg-purple-100 text-purple-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'urgent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryName = (category) => {
    const categories = {
      'order_issue': 'Vấn đề đơn hàng',
      'payment_problem': 'Lỗi thanh toán',
      'shipping_delay': 'Chậm giao hàng',
      'product_question': 'Câu hỏi sản phẩm',
      'return_refund': 'Đổi trả',
      'account_issue': 'Vấn đề tài khoản',
      'technical_support': 'Hỗ trợ kỹ thuật',
      'complaint': 'Khiếu nại',
      'suggestion': 'Góp ý',
      'other': 'Khác'
    };
    return categories[category] || category;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="ml-4">Đang tải ticket...</p>
      </div>
    );
  }

  // Debug: Log current state
  console.log('🎫 TicketsPage - Loading:', loading, 'Tickets count:', tickets.length);

  return (
    <div className="space-y-6">

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tìm kiếm
            </label>
            <input
              type="text"
              placeholder="Tìm kiếm ticket..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Trạng thái
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Tất cả</option>
              <option value="open">Mở</option>
              <option value="in_progress">Đang xử lý</option>
              <option value="waiting_customer">Chờ khách hàng</option>
              <option value="waiting_support">Chờ hỗ trợ</option>
              <option value="resolved">Đã giải quyết</option>
              <option value="closed">Đã đóng</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Độ ưu tiên
            </label>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Tất cả</option>
              <option value="low">Thấp</option>
              <option value="medium">Trung bình</option>
              <option value="high">Cao</option>
              <option value="urgent">Khẩn cấp</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Danh mục
            </label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Tất cả</option>
              <option value="order_issue">Vấn đề đơn hàng</option>
              <option value="payment_problem">Lỗi thanh toán</option>
              <option value="shipping_delay">Chậm giao hàng</option>
              <option value="product_question">Câu hỏi sản phẩm</option>
              <option value="return_refund">Đổi trả</option>
              <option value="account_issue">Vấn đề tài khoản</option>
              <option value="technical_support">Hỗ trợ kỹ thuật</option>
              <option value="complaint">Khiếu nại</option>
              <option value="suggestion">Góp ý</option>
              <option value="other">Khác</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ticket
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Khách hàng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Độ ưu tiên
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Danh mục
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày tạo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tickets.length > 0 ? (
                tickets.map((ticket) => (
                <tr key={ticket._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {ticket.subject}
                      </div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {ticket.description}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {ticket.userId?.name || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {ticket.userId?.email || 'N/A'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={ticket.status}
                      onChange={(e) => handleStatusChange(ticket._id, e.target.value)}
                      className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(ticket.status)} border-0 focus:ring-2 focus:ring-blue-500`}
                    >
                      <option value="open">Mở</option>
                      <option value="in_progress">Đang xử lý</option>
                      <option value="waiting_customer">Chờ khách hàng</option>
                      <option value="waiting_support">Chờ hỗ trợ</option>
                      <option value="resolved">Đã giải quyết</option>
                      <option value="closed">Đã đóng</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={ticket.priority}
                      onChange={(e) => handlePriorityChange(ticket._id, e.target.value)}
                      className={`text-xs font-medium px-2 py-1 rounded-full ${getPriorityColor(ticket.priority)} border-0 focus:ring-2 focus:ring-blue-500`}
                    >
                      <option value="low">Thấp</option>
                      <option value="medium">Trung bình</option>
                      <option value="high">Cao</option>
                      <option value="urgent">Khẩn cấp</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">
                      {getCategoryName(ticket.category)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(ticket.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => {
                        setSelectedTicket(ticket);
                        setShowDetailModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      Xem chi tiết
                    </button>
                  </td>
                </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-lg font-medium text-gray-900 mb-2">Không có ticket nào</p>
                      <p className="text-sm text-gray-500">Chưa có ticket hỗ trợ nào</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Trước
            </button>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Sau
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Hiển thị <span className="font-medium">1</span> đến{' '}
                <span className="font-medium">{tickets.length}</span> trong tổng số{' '}
                <span className="font-medium">{tickets.length}</span> kết quả
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Trước
                </button>
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                >
                  Sau
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Ticket Detail Modal */}
      {showDetailModal && selectedTicket && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Chi tiết Ticket
                </h3>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tiêu đề</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedTicket.subject}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Mô tả</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedTicket.description}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Trạng thái</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedTicket.status}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Độ ưu tiên</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedTicket.priority}</p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Khách hàng</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedTicket.userId?.name} ({selectedTicket.userId?.email})
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Ngày tạo</label>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(selectedTicket.createdAt)}</p>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketsPage;
