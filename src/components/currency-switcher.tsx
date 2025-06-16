
"use client";

import * as React from "react";
import { useCurrency, type Currency } from "@/contexts/currency-context";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { DollarSign, Landmark } from "lucide-react"; // Using Landmark for LKR as an example

export function CurrencySwitcher() {
  const { selectedCurrency, setSelectedCurrency } = useCurrency();

  const handleCurrencyChange = (value: string) => {
    setSelectedCurrency(value as Currency);
  };

  return (
    <div className="flex items-center gap-2 w-full group-data-[collapsible=icon]:justify-center">
      <Label htmlFor="currency-select" className="text-xs text-sidebar-foreground/80 group-data-[collapsible=icon]:hidden">
        Currency:
      </Label>
      <Select value={selectedCurrency} onValueChange={handleCurrencyChange}>
        <SelectTrigger 
          id="currency-select" 
          className="h-8 text-xs w-auto min-w-[80px] bg-sidebar-accent/50 border-sidebar-border group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:aspect-square group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:min-w-0 [&>span]:group-data-[collapsible=icon]:hidden"
          aria-label="Select currency"
        >
          <SelectValue placeholder="Select currency" />
        </SelectTrigger>
        <SelectContent align="end" className="min-w-[80px]">
          <SelectItem value="usd">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" /> USD
            </div>
          </SelectItem>
          <SelectItem value="lkr">
            <div className="flex items-center gap-2">
              <Landmark className="h-4 w-4" /> LKR
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
