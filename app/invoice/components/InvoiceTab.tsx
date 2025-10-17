"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FaFileInvoiceDollar, FaPlus, FaEye, FaDownload, FaShare } from "react-icons/fa6";
import { Loader2, FileText, BarChart3 } from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";
import { motion } from "framer-motion";
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import CreateInvoiceModal from './CreateInvoiceModal';

interface Invoice {
  id: string;
  createdAt: string;
  recipient: string;
  email: string;
  status: string;
  totalAmount: number;
  currency: string;
  paymentLink?: { url: string } | null;
}

interface InvoiceTabProps {
  walletAddress?: string;
}

export default function InvoiceTab({ walletAddress }: InvoiceTabProps) {
  const { authenticated, user } = usePrivy();
  const merchantId = walletAddress || user?.wallet?.address;
  const isConnected = authenticated && !!merchantId;

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [activeTab, setActiveTab] = useState("All");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [innerTab, setInnerTab] = useState("history");
  const router = useRouter();

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'overdue': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'outstanding': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'draft': return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  // Fetch invoices from backend
  useEffect(() => {
    if (!isConnected || !merchantId) {
      setError("Please connect your wallet to view invoices.");
      setInvoices([]);
      return;
    }

    const fetchInvoices = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const statusFilter = activeTab === "All" ? "" : activeTab.toLowerCase();
        const res = await fetch(
          `/api/send-invoice/invoices?merchantId=${merchantId}&status=${statusFilter}&page=${page}&limit=10`,
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          }
        );

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Failed to fetch invoices");
        }

        const { invoices, totalPages } = await res.json();
        setInvoices(invoices);
        setTotalPages(totalPages);
      } catch (err: any) {
        setError(err.message || "Failed to fetch invoices");
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvoices();
  }, [merchantId, isConnected, activeTab, page]);

  // Handle actions
  const handleView = (invoiceId: string) => {
    router.push(`/invoice/${invoiceId}`);
  };

  const handleDownload = async (invoice: Invoice) => {
    try {
      const res = await fetch(`/api/send-invoice/invoices/${invoice.id}/pdf`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        throw new Error("Failed to generate PDF");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${invoice.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError("Failed to download invoice PDF");
    }
  };

  const handleShare = async (invoice: Invoice) => {
    if (invoice.paymentLink?.url) {
      try {
        await navigator.clipboard.writeText(invoice.paymentLink.url);
        alert("Payment link copied to clipboard!");
      } catch (err) {
        setError("Failed to copy payment link");
      }
    } else {
      setError("No payment link available for this invoice");
    }
  };

  const handleInvoiceCreated = () => {
    setIsCreateModalOpen(false);
    // Refresh invoices list
    if (merchantId && isConnected) {
      const fetchInvoices = async () => {
        try {
          const res = await fetch(
            `/api/send-invoice/invoices?merchantId=${merchantId}&status=${activeTab.toLowerCase()}&page=${page}&limit=10`,
            {
              method: "GET",
              headers: { "Content-Type": "application/json" },
            }
          );
          if (res.ok) {
            const { invoices, totalPages } = await res.json();
            setInvoices(invoices);
            setTotalPages(totalPages);
          }
        } catch (err) {
          console.error("Failed to refresh invoices:", err);
        }
      };
      fetchInvoices();
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {error && (
        <Alert className="mb-6 border-red-500/50 bg-red-500/10 rounded-xl">
          <AlertDescription className="text-red-400">{error}</AlertDescription>
        </Alert>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-slate-800/95 backdrop-blur-xl border border-slate-700/60 shadow-2xl !rounded-3xl overflow-hidden">
          <CardContent className="p-7">
            <Tabs value={innerTab} onValueChange={setInnerTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-slate-800/60 rounded-xl p-1 border border-slate-700/50">
                <TabsTrigger 
                  value="history" 
                  className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-600 data-[state=active]:!text-white data-[state=active]:shadow-lg transition-all duration-200"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  History
                </TabsTrigger>
                <TabsTrigger 
                  value="create" 
                  className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-violet-600 data-[state=active]:!text-white data-[state=active]:shadow-lg transition-all duration-200"
                >
                  <FaPlus className="w-4 h-4 mr-2" />
                  Create
                </TabsTrigger>
                <TabsTrigger 
                  value="stats" 
                  className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-600 data-[state=active]:to-teal-600 data-[state=active]:!text-white data-[state=active]:shadow-lg transition-all duration-200"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Stats
                </TabsTrigger>
              </TabsList>

              <TabsContent value="history" className="mt-6 space-y-6">
                {/* Status Filter */}
                <div className="flex flex-wrap gap-2">
                  {["All", "Draft", "Outstanding", "Paid", "Overdue"].map((tab) => (
                    <Button
                      key={tab}
                      variant={activeTab === tab ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setActiveTab(tab);
                        setPage(1);
                      }}
                      className={`transition-all duration-200 rounded-lg ${
                        activeTab === tab
                          ? "bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg border-0"
                          : "bg-slate-800/60 border-slate-600/60 text-slate-300 hover:bg-slate-700/70 hover:border-slate-500 hover:text-white"
                      }`}
                    >
                      {tab}
                    </Button>
                  ))}
                </div>

                {/* Invoice Table */}
                <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-700/60 hover:bg-slate-800/50">
                        <TableHead className="text-slate-300 font-semibold">ID</TableHead>
                        <TableHead className="text-slate-300 font-semibold">Client</TableHead>
                        <TableHead className="text-slate-300 font-semibold">Status</TableHead>
                        <TableHead className="text-slate-300 font-semibold">Amount</TableHead>
                        <TableHead className="text-slate-300 font-semibold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-12">
                            <Loader2 className="w-6 h-6 animate-spin text-blue-500 mx-auto" />
                            <p className="text-slate-400 text-sm mt-2">Loading invoices...</p>
                          </TableCell>
                        </TableRow>
                      ) : invoices.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-12">
                            <FaFileInvoiceDollar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                            <p className="text-slate-400 text-sm">No invoices found</p>
                            <p className="text-slate-500 text-xs mt-1">Create your first invoice to get started</p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        invoices.map((invoice) => (
                          <TableRow key={invoice.id} className="border-slate-700/60 hover:bg-slate-800/30 transition-colors">
                            <TableCell className="text-slate-300 font-mono text-sm">
                              #{invoice.id.slice(0, 8)}
                            </TableCell>
                            <TableCell className="text-slate-200">
                              {invoice.recipient}
                            </TableCell>
                            <TableCell>
                              <Badge className={`${getStatusColor(invoice.status)} font-medium`}>
                                {invoice.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-slate-200 font-semibold">
                              {invoice.totalAmount.toFixed(2)} {invoice.currency}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  onClick={() => handleView(invoice.id)}
                                  className="hover:bg-blue-500/20 hover:text-blue-400 transition-colors"
                                >
                                  <FaEye className="w-3.5 h-3.5" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  onClick={() => handleDownload(invoice)}
                                  className="hover:bg-emerald-500/20 hover:text-emerald-400 transition-colors"
                                >
                                  <FaDownload className="w-3.5 h-3.5" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  onClick={() => handleShare(invoice)}
                                  className="hover:bg-purple-500/20 hover:text-purple-400 transition-colors"
                                >
                                  <FaShare className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {invoices.length > 0 && totalPages > 1 && (
                  <div className="flex items-center justify-between pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                      disabled={page === 1}
                      className="bg-slate-800/60 border-slate-600/60 hover:bg-slate-700/70 disabled:opacity-50"
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-slate-400 font-medium">
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={page === totalPages}
                      className="bg-slate-800/60 border-slate-600/60 hover:bg-slate-700/70 disabled:opacity-50"
                    >
                      Next
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="create" className="mt-6">
                <div className="text-center py-12">
                  <div className="bg-gradient-to-br from-slate-800/60 to-slate-800/40 rounded-2xl p-10 border border-slate-700/50">
                    <div className="bg-gradient-to-br from-purple-500/20 to-blue-500/20 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-purple-500/30">
                      <FaFileInvoiceDollar className="w-10 h-10 text-purple-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3">Create New Invoice</h3>
                    <p className="text-slate-400 mb-8 max-w-md mx-auto">
                      Quickly create and send professional invoices to your clients with crypto payment options
                    </p>
                    <Button 
                      onClick={() => setIsCreateModalOpen(true)}
                      className="bg-gradient-to-r from-purple-600 via-purple-500 to-blue-600 hover:from-purple-700 hover:via-purple-600 hover:to-blue-700 text-white font-semibold py-6 px-8 rounded-xl shadow-xl shadow-purple-500/25 hover:shadow-2xl hover:shadow-purple-500/40 transition-all duration-300 transform hover:scale-105"
                      size="lg"
                    >
                      <FaPlus className="w-5 h-5 mr-2" />
                      Create Invoice
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="stats" className="mt-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-slate-800/60 to-slate-800/40 rounded-xl p-5 border border-slate-700/50 hover:border-slate-600/60 transition-all duration-200">
                    <h3 className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">Total Invoices</h3>
                    <p className="text-3xl font-bold text-white">{invoices.length}</p>
                  </div>
                  <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 rounded-xl p-5 border border-emerald-500/30 hover:border-emerald-500/50 transition-all duration-200">
                    <h3 className="text-emerald-400 text-xs font-medium uppercase tracking-wider mb-2">Paid</h3>
                    <p className="text-3xl font-bold text-emerald-400">
                      {invoices.filter(inv => inv.status.toLowerCase() === 'paid').length}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 rounded-xl p-5 border border-blue-500/30 hover:border-blue-500/50 transition-all duration-200">
                    <h3 className="text-blue-400 text-xs font-medium uppercase tracking-wider mb-2">Outstanding</h3>
                    <p className="text-3xl font-bold text-blue-400">
                      {invoices.filter(inv => inv.status.toLowerCase() === 'outstanding').length}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-red-500/10 to-red-500/5 rounded-xl p-5 border border-red-500/30 hover:border-red-500/50 transition-all duration-200">
                    <h3 className="text-red-400 text-xs font-medium uppercase tracking-wider mb-2">Overdue</h3>
                    <p className="text-3xl font-bold text-red-400">
                      {invoices.filter(inv => inv.status.toLowerCase() === 'overdue').length}
                    </p>
                  </div>
                </div>

                {/* Additional Stats */}
                <div className="mt-6 bg-gradient-to-br from-slate-800/60 to-slate-800/40 rounded-xl p-6 border border-slate-700/50">
                  <h3 className="text-white font-semibold mb-4">Total Revenue</h3>
                  <p className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                    ${invoices.reduce((sum, inv) => sum + (inv.status.toLowerCase() === 'paid' ? inv.totalAmount : 0), 0).toFixed(2)}
                  </p>
                  <p className="text-slate-400 text-sm mt-2">From paid invoices</p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>

      {/* Create Invoice Modal */}
      <CreateInvoiceModal 
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onInvoiceCreated={handleInvoiceCreated}
      />
    </div>
  );
}
