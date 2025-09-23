"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FaFileInvoiceDollar, FaCirclePlus } from "react-icons/fa6";
import { usePrivy } from "@privy-io/react-auth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { stablecoins } from '@/data/stablecoins';

interface CreateInvoiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvoiceCreated: () => void;
}

function CreateInvoiceModal({ open, onOpenChange, onInvoiceCreated }: CreateInvoiceModalProps) {
  const { authenticated, user } = usePrivy();
  const walletAddress = user?.wallet?.address;
  const isConnected = authenticated && !!walletAddress;
  const merchantAddress = walletAddress;

  const router = useRouter();
  const [recipient, setRecipient] = useState("");
  const [email, setEmail] = useState("");
  const [senderId, setSenderId] = useState("");
  const [paymentCollection, setPaymentCollection] = useState("one-time");
  const [dueDate, setDueDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const stablecoinOptions = stablecoins;
  const [currency, setCurrency] = useState(stablecoinOptions[0]?.baseToken || "USDC");
  const [lineItems, setLineItems] = useState([{ description: "", amount: "" }]);
  const [status, setStatus] = useState<string | null>(null);
  const [paymentLink, setPaymentLink] = useState("");
  const [paymentLinks, setPaymentLinks] = useState<{ id: string; url: string; createdAt: string }[]>([]);

  const handleLineItemChange = (idx: number, field: string, value: string) => {
    setLineItems((prev) => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  const addLineItem = () => setLineItems([...lineItems, { description: "", amount: "" }]);

  // Fetch recent payment links
  useEffect(() => {
    const fetchPaymentLinks = async () => {
      if (!merchantAddress) return;
      
      try {
        const res = await fetch(`/api/payment-links?merchantId=${merchantAddress}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        
        if (res.ok) {
          const data = await res.json();
          const sortedLinks = data
            .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 3);
          setPaymentLinks(sortedLinks);
        }
      } catch (err) {
        console.error("Failed to fetch payment links:", err);
      }
    };
    
    if (open && merchantAddress) {
      fetchPaymentLinks();
    }
  }, [merchantAddress, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected || !merchantAddress) {
      setStatus("Please connect your wallet first");
      return;
    }

    setStatus("loading");
    try {
      const res = await fetch("/api/send-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchantId: merchantAddress,
          recipient,
          sender: senderId,
          email,
          paymentCollection,
          dueDate,
          currency,
          lineItems,
          paymentLink,
        }),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        setStatus(errorData.error || "Failed to create invoice");
        return;
      }
      
      const data = await res.json();
      setStatus("success");
      setTimeout(() => {
        onInvoiceCreated();
        resetForm();
      }, 1200);
    } catch (err: any) {
      setStatus(err.message || "Unknown error");
    }
  };

  const resetForm = () => {
    setRecipient("");
    setEmail("");
    setSenderId("");
    setPaymentCollection("one-time");
    setDueDate(new Date().toISOString().split("T")[0]);
    setCurrency(stablecoinOptions[0]?.baseToken || "USDC");
    setLineItems([{ description: "", amount: "" }]);
    setPaymentLink("");
    setStatus(null);
  };

  const totalAmount = lineItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900/90 border-slate-700 text-white !rounded-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg md:text-xl">
            <FaFileInvoiceDollar className="text-purple-400 w-5 h-5 md:w-6 h-6" />
            Create New Invoice
          </DialogTitle>
          <DialogDescription className="text-slate-400 text-sm text-left">
            Fill in the information below to create and send a professional invoice
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6 mt-4">
          {/* Client Information */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4 md:p-6">
              <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4 text-white flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                Client Information
              </h3>
              <div className="grid grid-cols-1 gap-3 md:gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="recipient" className="text-sm md:text-base">Recipient (Company or Name)</Label>
                  <Input
                    id="recipient"
                    placeholder="Enter client name or company"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    required
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="client@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sender Information */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4 md:p-6">
              <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4 text-white flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                Sender Information
              </h3>
              <div className="space-y-2">
                <Label htmlFor="sender" className="text-sm md:text-base">Business/Company/Individual Name</Label>
                <Input
                  id="sender"
                  placeholder="Enter your name"
                  value={senderId}
                  onChange={(e) => setSenderId(e.target.value)}
                  required
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
            </CardContent>
          </Card>

          {/* Payment Settings */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4 md:p-6">
              <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4 text-white flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                Payment Settings
              </h3>
              <div className="grid grid-cols-1 gap-3 md:gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="paymentCollection" className="text-sm md:text-base">Payment Collection</Label>
                  <Select value={paymentCollection} onValueChange={setPaymentCollection}>
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-9 md:h-10">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="one-time">One-time Payment</SelectItem>
                      <SelectItem value="recurring">Recurring Payments</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueDate" className="text-sm md:text-base">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    required
                    className="bg-slate-700 border-slate-600 text-white h-9 md:h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency" className="text-sm md:text-base">Payment Currency</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-9 md:h-10">
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {stablecoinOptions.map((coin, idx) => (
                        <SelectItem key={`${coin.baseToken}-${idx}`} value={coin.baseToken}>
                          {coin.baseToken} - {coin.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Link */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4 md:p-6">
              <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4 text-white flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                Payment Link
              </h3>
              <div className="space-y-2">
                <Label htmlFor="paymentLink" className="text-sm md:text-base">Select or Paste Payment Link</Label>
                <Select value={paymentLink} onValueChange={setPaymentLink}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white mb-2 h-9 md:h-10">
                    <SelectValue placeholder="Select a recent payment link" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentLinks.map((link) => (
                      <SelectItem key={link.id} value={link.url}>
                        {link.url.slice(0, 50)}... (Created: {new Date(link.createdAt).toLocaleDateString()})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  id="paymentLink"
                  placeholder="Or paste a payment link"
                  value={paymentLink}
                  onChange={(e) => setPaymentLink(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white h-9 md:h-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Invoice Items */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <h3 className="text-base md:text-lg font-semibold text-white flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  Invoice Items
                </h3>
                <Button
                  type="button"
                  onClick={addLineItem}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 h-8 md:h-9 px-3 md:px-4"
                  size="sm"
                >
                  <FaCirclePlus className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                  Add Item
                </Button>
              </div>
              
              <div className="space-y-2 md:space-y-3">
                {lineItems.map((item, idx) => (
                  <div key={idx} className="flex gap-2 md:gap-3 items-center">
                    <Input
                      placeholder="Item description (e.g., Website Development)"
                      value={item.description}
                      onChange={(e) => handleLineItemChange(idx, "description", e.target.value)}
                      required
                      className="bg-slate-700 border-slate-600 text-white flex-1 h-9 md:h-10 text-sm md:text-base"
                    />
                    <Input
                      placeholder="0.00"
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={item.amount}
                      onChange={(e) => handleLineItemChange(idx, "amount", e.target.value)}
                      required
                      className="bg-slate-700 border-slate-600 text-white w-20 md:w-32 h-9 md:h-10 text-sm md:text-base text-right"
                    />
                    {lineItems.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setLineItems(prev => prev.filter((_, i) => i !== idx))}
                        className="text-red-400 border-red-400 hover:bg-red-400/10 h-8 w-8 md:h-9 md:w-9 p-0"
                      >
                        ×
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              {/* Total Display */}
              {totalAmount > 0 && (
                <div className="flex justify-end mt-3 md:mt-4">
                  <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-lg p-3 md:p-4 border border-purple-500/20">
                    <div className="text-right">
                      <p className="text-xs md:text-sm text-slate-400 mb-1">Total Amount</p>
                      <p className="text-lg md:text-2xl font-bold text-white">
                        {totalAmount.toFixed(2)} {currency}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Status Messages */}
          {status === "success" && (
            <Alert className="border-green-500/50 bg-green-500/10">
              <AlertDescription className="text-green-400 text-sm">
                Invoice sent successfully! Redirecting...
              </AlertDescription>
            </Alert>
          )}

          {status && status !== "loading" && status !== "success" && (
            <Alert className="border-red-500/50 bg-red-500/10">
              <AlertDescription className="text-red-400 text-sm">
                {status}
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700 h-10 md:h-11"
              onClick={() => {
                resetForm();
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={status === "loading"}
              className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 h-10 md:h-11"
            >
              {status === "loading" ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Sending Invoice...
                </>
              ) : (
                <>
                  <FaFileInvoiceDollar className="w-4 h-4 mr-2" />
                  Send Invoice
                </>
              )}
            </Button>
          </div>

          <div className="text-center mt-3">
            <span className="text-xs text-blue-400">Recipient should check Junk Email if not received</span>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default CreateInvoiceModal;