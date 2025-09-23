"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FaFileInvoiceDollar, FaPlus, FaEye, FaDownload, FaShare } from "react-icons/fa6";
import { Loader2, FileText, BarChart3 } from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";
import { motion } from "framer-motion";
import Header from '../components/Header';
import { withDashboardLayout } from '../utils/withDashboardLayout';
import { Card, CardContent } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Alert, AlertDescription } from '../components/ui/alert';
import CreateInvoiceModal from './components/CreateInvoiceModal';

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

function InvoicePage() {
  const { authenticated, user } = usePrivy();
  const walletAddress = user?.wallet?.address;
  const isConnected = authenticated && !!walletAddress;
  const merchantId = walletAddress;

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [activeTab, setActiveTab] = useState("All");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const router = useRouter();

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid': return 'bg-emerald-500/20 text-emerald-400';
      case 'overdue': return 'bg-red-500/20 text-red-400';
      case 'outstanding': return 'bg-blue-500/20 text-blue-400';
      case 'draft': return 'bg-slate-500/20 text-slate-400';
      default: return 'bg-slate-500/20 text-slate-400';
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
    <div className="relative min-h-screen w-full">
      <Header />
      <div className="space-y-2 px-2 lg:px-[] max-w-6xl mx-auto py-8">
        {error && (
          <Alert className="mb-6 border-red-500/50 bg-red-500/10">
            <AlertDescription className="text-red-400">{error}</AlertDescription>
          </Alert>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="relative !border-0 bg-slate-900/90 text-white shadow-2xl md:w-[92%] mx-auto !rounded-3xl">
            <CardContent className="relative p-6">
            <Tabs defaultValue="history" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-slate-800/50 rounded-xl">
                <TabsTrigger value="history" className="rounded-xl">
                  <FileText className="w-4 h-4 mr-2" />
                  History
                </TabsTrigger>
                <TabsTrigger value="create" className="rounded-xl">
                  <FaPlus className="w-4 h-4 mr-2" />
                  Create
                </TabsTrigger>
                <TabsTrigger value="stats" className="rounded-xl">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Stats
                </TabsTrigger>
              </TabsList>

              <TabsContent value="history" className="mt-6">
                <div className="space-y-4">
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
                        className={`transition-all duration-200 ${
                          activeTab === tab
                            ? "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg transform scale-105"
                            : "bg-slate-800/50 border-slate-600 text-slate-300 hover:bg-slate-700/70 hover:border-slate-500 hover:text-white"
                        }`}
                      >
                        {tab}
                      </Button>
                    ))}
                  </div>
                  {/* Invoice Table */}
                  <div className="rounded-lg border border-slate-700 bg-slate-800/50">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-slate-700">
                          <TableHead className="text-slate-300">ID</TableHead>
                          <TableHead className="text-slate-300">Client</TableHead>
                          <TableHead className="text-slate-300">Status</TableHead>
                          <TableHead className="text-slate-300">Amount</TableHead>
                          <TableHead className="text-slate-300">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {invoices.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-slate-400">
                              No invoices found
                            </TableCell>
                          </TableRow>
                        ) : (
                          invoices.map((invoice) => (
                            <TableRow key={invoice.id} className="border-slate-700">
                              <TableCell className="text-slate-300">
                                #{invoice.id.slice(0, 6)}...
                              </TableCell>
                              <TableCell className="text-slate-300">
                                {invoice.recipient}
                              </TableCell>
                              <TableCell>
                                <Badge className={getStatusColor(invoice.status)}>
                                  {invoice.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-slate-300">
                                {invoice.totalAmount.toFixed(2)} {invoice.currency}
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  <Button size="sm" variant="ghost" onClick={() => handleView(invoice.id)}>
                                    <FaEye className="w-3 h-3" />
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => handleDownload(invoice)}>
                                    <FaDownload className="w-3 h-3" />
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => handleShare(invoice)}>
                                    <FaShare className="w-3 h-3" />
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
                    <div className="flex items-center justify-between">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                        disabled={page === 1}
                      >
                        Previous
                      </Button>
                      <span className="text-sm text-slate-400">
                        Page {page} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={page === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  )}

                  {/* Loading State */}
                  {isLoading && (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="create" className="mt-6">
                <div className="space-y-4 text-center py-12">
                  <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700">
                    <FaFileInvoiceDollar className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">Create New Invoice</h3>
                    <p className="text-slate-400 mb-6">Quickly create and send professional invoices to your clients</p>
                    <Button 
                      onClick={() => setIsCreateModalOpen(true)}
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                      size="lg"
                    >
                      <FaPlus className="w-4 h-4 mr-2" />
                      Create Invoice
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="stats" className="mt-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <h3 className="text-slate-300 text-sm">Total Invoices</h3>
                    <p className="text-2xl font-bold text-white">{invoices.length}</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <h3 className="text-slate-300 text-sm">Paid</h3>
                    <p className="text-2xl font-bold text-emerald-400">
                      {invoices.filter(inv => inv.status.toLowerCase() === 'paid').length}
                    </p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <h3 className="text-slate-300 text-sm">Outstanding</h3>
                    <p className="text-2xl font-bold text-blue-400">
                      {invoices.filter(inv => inv.status.toLowerCase() === 'outstanding').length}
                    </p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <h3 className="text-slate-300 text-sm">Overdue</h3>
                    <p className="text-2xl font-bold text-red-400">
                      {invoices.filter(inv => inv.status.toLowerCase() === 'overdue').length}
                    </p>
                  </div>
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
    </div>
  );
}

export default withDashboardLayout(InvoicePage);