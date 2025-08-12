"use client"
import React, { useState, useEffect } from 'react';
import { supabase } from "../../../utils/supabaseClient";
import {
  FileText,
  BarChart2,
  PieChart,
  LineChart,
  Download,
  Printer,
  Filter,
  Calendar,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  Plus,
  Trash2,
  Share2,
  MoreVertical
} from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const ReportsManager = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedReports, setSelectedReports] = useState<any[]>([]);
  const [reportTypeFilter, setReportTypeFilter] = useState('all');
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [startDate, endDate] = dateRange;
  
  const itemsPerPage = 8;
  const reportTypes = [
    { id: 'sales', name: 'Sales', icon: <BarChart2 size={18} /> },
    { id: 'inventory', name: 'Inventory', icon: <PieChart size={18} /> },
    { id: 'user_activity', name: 'User Activity', icon: <LineChart size={18} /> },
    { id: 'financial', name: 'Financial', icon: <FileText size={18} /> }
  ];

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        let query = supabase
          .from('reports')
          .select('*')
          .order('created_at', { ascending: false });

        // Apply date range filter if dates are selected
        if (startDate && endDate) {
          query = query
            .gte('created_at', startDate.toISOString())
            .lte('created_at', endDate.toISOString());
        }

        const { data, error } = await query;

        if (error) throw error;
        setReports(data);
      } catch (error) {
        console.error('Error fetching reports:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [startDate, endDate]);

  const filteredReports = reports.filter(report => {
    const matchesSearch = 
      report.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = 
      reportTypeFilter === 'all' || 
      report.type === reportTypeFilter;

    return matchesSearch && matchesType;
  });

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredReports.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredReports.length / itemsPerPage);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const generateReport = async (type: string) => {
    setGeneratingReport(true);
    try {
      // Simulate report generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create a mock report (in a real app, this would call your API)
      const newReport = {
        id: Date.now().toString(),
        name: `${type} Report - ${new Date().toLocaleDateString()}`,
        type,
        description: `Automatically generated ${type} report`,
        created_at: new Date().toISOString(),
        download_url: '#',
        size: Math.floor(Math.random() * 5000) + 1000 // Random size between 1KB-5KB
      };

      // In a real app, you would save to database here
      // const { error } = await supabase.from('reports').insert(newReport);
      // if (error) throw error;

      setReports(prev => [newReport, ...prev]);
      setCurrentPage(1); // Reset to first page
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!confirm('Are you sure you want to delete this report?')) return;
    
    try {
      // In a real app, you would delete from database here
      // const { error } = await supabase.from('reports').delete().eq('id', reportId);
      // if (error) throw error;

      setReports(prev => prev.filter(report => report.id !== reportId));
      setSelectedReports(prev => prev.filter(id => id !== reportId));
    } catch (error) {
      console.error('Error deleting report:', error);
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedReports.length} reports?`)) return;
    
    try {
      // In a real app, you would delete from database here
      // for (const reportId of selectedReports) {
      //   await supabase.from('reports').delete().eq('id', reportId);
      // }

      setReports(prev => prev.filter(report => !selectedReports.includes(report.id)));
      setSelectedReports([]);
    } catch (error) {
      console.error('Error during bulk delete:', error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getReportIcon = (type: string) => {
    const reportType = reportTypes.find(rt => rt.id === type);
    return reportType ? reportType.icon : <FileText size={18} />;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-1 flex items-center">
              <BarChart2 className="text-[#e6d281] mr-2" size={24} />
              Reports Manager
            </h1>
            <p className="text-gray-600">Generate and manage system reports</p>
          </div>
          <div className="flex gap-3">
            <button 
              className="px-4 py-2 bg-[#e6d281] hover:bg-[#d4c070] text-gray-800 font-medium rounded-lg flex items-center"
              onClick={() => {
                const modal = document.getElementById('reportTypeModal') as HTMLDialogElement;
                if (modal) modal.showModal();
              }}
            >
              <Plus className="mr-2" size={18} />
              Generate Report
            </button>
          </div>
        </div>
      </div>

      {/* Report Type Modal */}
      <dialog id="reportTypeModal" className="modal">
        <div className="modal-box max-w-md">
          <form method="dialog">
            <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
          </form>
          <h3 className="font-bold text-lg mb-4">Generate New Report</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {reportTypes.map((type) => (
              <button
                key={type.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 flex flex-col items-center"
                onClick={() => {
                  const modal = document.getElementById('reportTypeModal') as HTMLDialogElement;
                  if (modal) modal.close();
                  generateReport(type.id);
                }}
                disabled={generatingReport}
              >
                <div className="text-[#e6d281] mb-2">
                  {type.icon}
                </div>
                <span className="font-medium">{type.name}</span>
              </button>
            ))}
          </div>
          <div className="modal-action">
            <form method="dialog">
              <button className="btn">Cancel</button>
            </form>
          </div>
        </div>
      </dialog>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="text-gray-400" size={16} />
            </div>
            <input
              type="text"
              placeholder="Search reports..."
              className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#e6d281] focus:border-[#e6d281]"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter className="text-gray-400" size={16} />
            </div>
            <select
              className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#e6d281] focus:border-[#e6d281] appearance-none"
              value={reportTypeFilter}
              onChange={(e) => {
                setReportTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">All Report Types</option>
              {reportTypes.map((type) => (
                <option key={type.id} value={type.id}>{type.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-3 text-gray-400" size={16} />
          </div>
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar className="text-gray-400" size={16} />
            </div>
            <DatePicker
              selectsRange={true}
              startDate={startDate}
              endDate={endDate}
              onChange={(update) => {
                setDateRange(update);
                setCurrentPage(1);
              }}
              placeholderText="Date range"
              className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#e6d281] focus:border-[#e6d281]"
              isClearable
            />
          </div>
          
          {/* Bulk Actions */}
          {selectedReports.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{selectedReports.length} selected</span>
              <button 
                className="px-3 py-1.5 bg-red-100 text-red-600 rounded-md text-sm font-medium flex items-center hover:bg-red-200"
                onClick={handleBulkDelete}
              >
                <Trash2 className="mr-1" size={14} />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Generating Report Indicator */}
      {generatingReport && (
        <div className="bg-white rounded-lg shadow-md p-4 mb-6 border border-[#e6d281]">
          <div className="flex items-center">
            <Loader2 className="animate-spin text-[#e6d281] mr-3" size={20} />
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-800">
                Generating report...
              </div>
              <div className="text-xs text-gray-500">
                This may take a few moments
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reports Content */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-pulse flex flex-col items-center">
              <FileText className="text-gray-300 mb-4" size={32} />
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="mx-auto text-gray-400 mb-4" size={40} />
            <h3 className="text-lg font-medium text-gray-900">No reports found</h3>
            <p className="mt-1 text-gray-500">
              {searchQuery ? 'Try a different search term' : 'Generate some reports or try different filters'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-[#e6d281] focus:ring-[#e6d281] border-gray-300 rounded"
                        checked={selectedReports.length === currentItems.length && currentItems.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedReports(currentItems.map(report => report.id));
                          } else {
                            setSelectedReports([]);
                          }
                        }}
                      />
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Report
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Generated
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Size
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentItems.map((report) => (
                    <tr 
                      key={report.id} 
                      className={selectedReports.includes(report.id) ? 'bg-[#e6d281]/10' : 'hover:bg-gray-50'}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-[#e6d281] focus:ring-[#e6d281] border-gray-300 rounded"
                          checked={selectedReports.includes(report.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedReports([...selectedReports, report.id]);
                            } else {
                              setSelectedReports(selectedReports.filter(id => id !== report.id));
                            }
                          }}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                            {getReportIcon(report.type)}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {report.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {report.description || 'No description'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 capitalize">
                          {report.type.replace('_', ' ')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(report.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatFileSize(report.size)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end items-center space-x-2">
                          <a
                            href={report.download_url}
                            className="text-gray-600 hover:text-[#e6d281] p-1"
                            download
                          >
                            <Download size={16} />
                          </a>
                          <button
                            className="text-gray-600 hover:text-gray-800 p-1"
                            onClick={() => window.print()}
                          >
                            <Printer size={16} />
                          </button>
                          <button
                            className="text-gray-600 hover:text-blue-500 p-1"
                            onClick={() => navigator.clipboard.writeText(report.download_url)}
                          >
                            <Share2 size={16} />
                          </button>
                          <button
                            className="text-gray-600 hover:text-red-500 p-1"
                            onClick={() => handleDeleteReport(report.id)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{' '}
                    <span className="font-medium">
                      {Math.min(indexOfLastItem, filteredReports.length)}
                    </span>{' '}
                    of <span className="font-medium">{filteredReports.length}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Previous</span>
                      <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === page
                            ? 'z-10 bg-[#e6d281] border-[#e6d281] text-gray-800'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Next</span>
                      <ChevronRight className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ReportsManager;