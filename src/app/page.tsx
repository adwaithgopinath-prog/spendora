"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Step 3: Hardcoded user data
const user = {
  balance: 50000,
  safeToSpend: 12000,
  daysUntilSalary: 8
};

export default function Home() {
  const [purchaseAmount, setPurchaseAmount] = useState<string>("");
  const [verdict, setVerdict] = useState<{
    status: "YES" | "NO" | null;
    message: string;
    remaining: number | null;
  }>({
    status: null,
    message: "",
    remaining: null
  });

  const handleCheck = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(purchaseAmount.replace(/,/g, ""));
    
    if (isNaN(amount) || amount <= 0) {
      setVerdict({
        status: null,
        message: "Please enter a valid positive purchase amount.",
        remaining: null
      });
      return;
    }

    // Step 6: Core Logic
    if (amount <= user.safeToSpend) {
      setVerdict({
        status: "YES",
        message: "You can afford this purchase.",
        // Step 7: After purchase remaining calculation
        remaining: user.safeToSpend - amount
      });
    } else {
      setVerdict({
        status: "NO",
        message: "This exceeds your safe spending limit.",
        remaining: null
      });
    }
  };

  // Helper to format currency
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-6 md:p-12">
      <div className="w-full max-w-2xl flex flex-col gap-8">
        
        {/* Logo / Title */}
        <div className="text-center md:text-left flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-cyan-400 to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg">
              S
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 to-indigo-500 bg-clip-text text-transparent">
              Spendora
            </h1>
          </div>
          <span className="text-xs font-semibold text-slate-500 bg-slate-900 border border-slate-800 px-3 py-1 rounded-full uppercase tracking-wider">
            Safe Spending Engine
          </span>
        </div>

        {/* Step 4: Three Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Card 1: Current Balance */}
          <Card className="bg-slate-900/50 border-slate-800/80 backdrop-blur-md shadow-xl transition-all duration-300 hover:border-slate-700/80">
            <CardHeader className="pb-2">
              <CardDescription className="text-slate-400 text-xs font-medium uppercase tracking-wider">
                Current Balance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold text-cyan-400">
                {formatCurrency(user.balance)}
              </span>
            </CardContent>
          </Card>

          {/* Card 2: Safe To Spend */}
          <Card className="bg-slate-900/50 border-slate-800/80 backdrop-blur-md shadow-xl transition-all duration-300 hover:border-slate-700/80 ring-1 ring-cyan-500/20">
            <CardHeader className="pb-2">
              <CardDescription className="text-slate-400 text-xs font-medium uppercase tracking-wider">
                Safe To Spend
              </CardDescription>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold text-indigo-400">
                {formatCurrency(user.safeToSpend)}
              </span>
            </CardContent>
          </Card>

          {/* Card 3: Days Until Salary */}
          <Card className="bg-slate-900/50 border-slate-800/80 backdrop-blur-md shadow-xl transition-all duration-300 hover:border-slate-700/80">
            <CardHeader className="pb-2">
              <CardDescription className="text-slate-400 text-xs font-medium uppercase tracking-wider">
                Days Until Salary
              </CardDescription>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold text-amber-500">
                {user.daysUntilSalary}
              </span>
            </CardContent>
          </Card>
        </div>

        {/* Step 5: Purchase Input Form */}
        <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-md shadow-2xl p-6">
          <form onSubmit={handleCheck} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label htmlFor="purchase-amount" className="text-sm font-semibold text-slate-300">
                What do you want to buy?
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">₹</span>
                <input
                  id="purchase-amount"
                  type="text"
                  placeholder="Enter purchase amount (e.g., 5000)"
                  value={purchaseAmount}
                  onChange={(e) => setPurchaseAmount(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-850 rounded-lg py-3 pl-8 pr-4 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-all font-medium"
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold py-3 rounded-lg shadow-lg cursor-pointer transform active:scale-[0.99] transition-all"
            >
              Can I Afford It?
            </Button>
          </form>

          {/* Step 6 & 7: Verdict Output */}
          {verdict.status && (
            <div className="mt-8 border-t border-slate-800/60 pt-6 animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="flex items-start gap-4">
                <div className={`text-2xl font-black px-4 py-2 rounded-lg shadow-md ${
                  verdict.status === "YES" 
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                    : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                }`}>
                  {verdict.status}
                </div>
                <div className="flex flex-col justify-center">
                  <p className="text-base font-semibold text-slate-200">
                    {verdict.message}
                  </p>
                  
                  {/* Step 7: After purchase remaining */}
                  {verdict.status === "YES" && verdict.remaining !== null && (
                    <p className="text-sm text-slate-400 mt-1">
                      After purchase remaining: <span className="text-emerald-400 font-bold">{formatCurrency(verdict.remaining)}</span>
                    </p>
                  )}
                  {verdict.status === "NO" && (
                    <p className="text-sm text-slate-400 mt-1">
                      Deficit amount: <span className="text-rose-400 font-bold">{formatCurrency(parseFloat(purchaseAmount.replace(/,/g, "")) - user.safeToSpend)}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </main>
  );
}
